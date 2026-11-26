import asyncio
import json
from dataclasses import dataclass
from typing import Any

from app.observability import RequestMetrics, log_event
from app.safety.injection import wrap_tool_data_block
from app.safety.validators import validate_tool_args
from app.tools.bank_client import BankClient, BankClientError
from app.tools.manifest import RESTRICTED_TOOLS, ToolManifestStore

MAX_OUTPUT_CHARS = 3500


@dataclass(frozen=True)
class ToolCallOutcome:
    tool_call_id: str
    tool_name: str
    ok: bool
    content_for_llm: str
    draft_action_id: str | None = None
    draft_action_type: str | None = None
    draft_summary: str | None = None


def _compact_payload(data: Any) -> Any:
    """Keep tool outputs compact (top-N lists, truncated strings) for LLM context."""
    if isinstance(data, list):
        if len(data) > 12:
            return data[:12] + [{"_truncated_remaining": len(data) - 12}]
        return [_compact_payload(item) for item in data]
    if isinstance(data, dict):
        compacted: dict[str, Any] = {}
        for k, v in data.items():
            if isinstance(v, list) and len(v) > 12:
                compacted[k] = v[:12]
                compacted[f"{k}_truncated"] = len(v) - 12
            elif isinstance(v, str) and len(v) > 400:
                compacted[k] = v[:400] + "..."
            else:
                compacted[k] = _compact_payload(v)
        return compacted
    return data


class ToolExecutor:
    """Executes allowlisted tools with per-request READ caching, parallel READs, and safety wrapping."""

    def __init__(
        self,
        *,
        bank_client: BankClient,
        manifest: ToolManifestStore,
        per_tool_timeout_seconds: float = 10.0,
    ) -> None:
        self._bank_client = bank_client
        self._manifest = manifest
        self._per_tool_timeout = per_tool_timeout_seconds

    async def execute_batch(
        self,
        *,
        calls: list[tuple[str, str, str]],  # (tool_call_id, tool_name, arguments_json)
        allowlist: frozenset[str],
        context_token: str,
        request_id: str,
        cache: dict[str, dict[str, Any]],
        metrics: RequestMetrics,
    ) -> list[ToolCallOutcome]:
        """Run independent READ calls in parallel; run DRAFT calls sequentially."""
        read_tasks: list[tuple[int, str, str, dict[str, Any]]] = []
        draft_tasks: list[tuple[int, str, str, dict[str, Any]]] = []
        outcomes: dict[int, ToolCallOutcome] = {}

        for idx, (call_id, name, raw_args) in enumerate(calls):
            if name in RESTRICTED_TOOLS or name not in allowlist:
                outcomes[idx] = ToolCallOutcome(
                    tool_call_id=call_id,
                    tool_name=name,
                    ok=False,
                    content_for_llm=wrap_tool_data_block(
                        name, {"error": f"Tool '{name}' is not permitted for this specialist."}
                    ),
                )
                continue

            tool_def = self._manifest.get(name)
            if not tool_def:
                outcomes[idx] = ToolCallOutcome(
                    tool_call_id=call_id,
                    tool_name=name,
                    ok=False,
                    content_for_llm=wrap_tool_data_block(
                        name, {"error": f"Tool '{name}' is not registered."}
                    ),
                )
                continue

            try:
                parsed = json.loads(raw_args) if raw_args else {}
                if not isinstance(parsed, dict):
                    raise ValueError("Arguments must be a JSON object")
            except Exception:
                outcomes[idx] = ToolCallOutcome(
                    tool_call_id=call_id,
                    tool_name=name,
                    ok=False,
                    content_for_llm=wrap_tool_data_block(
                        name, {"error": "Invalid JSON arguments for tool."}
                    ),
                )
                continue

            valid, err = validate_tool_args(name, parsed)
            if not valid:
                outcomes[idx] = ToolCallOutcome(
                    tool_call_id=call_id,
                    tool_name=name,
                    ok=False,
                    content_for_llm=wrap_tool_data_block(name, {"error": err}),
                )
                continue

            if tool_def.risk == "READ":
                read_tasks.append((idx, call_id, name, parsed))
            else:
                draft_tasks.append((idx, call_id, name, parsed))

        if read_tasks:
            read_results = await asyncio.gather(
                *[
                    self._run_single(
                        call_id=call_id,
                        name=name,
                        args=args,
                        is_read=True,
                        context_token=context_token,
                        request_id=request_id,
                        cache=cache,
                        metrics=metrics,
                    )
                    for _, call_id, name, args in read_tasks
                ]
            )
            for (idx, _, _, _), res in zip(read_tasks, read_results, strict=True):
                outcomes[idx] = res

        for idx, call_id, name, args in draft_tasks:
            outcomes[idx] = await self._run_single(
                call_id=call_id,
                name=name,
                args=args,
                is_read=False,
                context_token=context_token,
                request_id=request_id,
                cache=cache,
                metrics=metrics,
            )

        return [outcomes[i] for i in range(len(calls))]

    async def _run_single(
        self,
        *,
        call_id: str,
        name: str,
        args: dict[str, Any],
        is_read: bool,
        context_token: str,
        request_id: str,
        cache: dict[str, dict[str, Any]],
        metrics: RequestMetrics,
    ) -> ToolCallOutcome:
        cache_key = f"{name}:{json.dumps(args, sort_keys=True)}"
        if is_read and cache_key in cache:
            metrics.cache_hits += 1
            cached = cache[cache_key]
            return self._format_outcome(call_id, name, cached)

        metrics.tool_calls += 1
        try:
            res = await asyncio.wait_for(
                self._bank_client.invoke_tool(
                    tool_name=name,
                    args=args,
                    context_token=context_token,
                    request_id=request_id,
                ),
                timeout=self._per_tool_timeout,
            )
            if is_read:
                cache[cache_key] = res
            log_event("tool_invoked", request_id, tool=name, ok=True)
            return self._format_outcome(call_id, name, res)
        except TimeoutError:
            log_event("tool_timeout", request_id, tool=name)
            return ToolCallOutcome(
                tool_call_id=call_id,
                tool_name=name,
                ok=False,
                content_for_llm=wrap_tool_data_block(
                    name, {"error": f"Tool {name} timed out."}
                ),
            )
        except BankClientError as exc:
            log_event("tool_error", request_id, tool=name, status=exc.status_code)
            return ToolCallOutcome(
                tool_call_id=call_id,
                tool_name=name,
                ok=False,
                content_for_llm=wrap_tool_data_block(name, {"error": str(exc)}),
            )

    def _format_outcome(
        self, call_id: str, name: str, raw: dict[str, Any]
    ) -> ToolCallOutcome:
        data = raw.get("data", raw)
        compact = _compact_payload(data)
        wrapped = wrap_tool_data_block(name, compact)
        if len(wrapped) > MAX_OUTPUT_CHARS:
            wrapped = wrapped[:MAX_OUTPUT_CHARS] + "\n...[TRUNCATED]\n</UNTRUSTED_TOOL_DATA>"

        action_id: str | None = None
        action_type: str | None = None
        summary: str | None = None
        draft_meta = raw.get("action")
        if isinstance(draft_meta, dict):
            action_id = str(draft_meta.get("id")) if draft_meta.get("id") else None
            action_type = (
                str(draft_meta.get("actionType")) if draft_meta.get("actionType") else None
            )
            summary = str(draft_meta.get("summary")) if draft_meta.get("summary") else None

        return ToolCallOutcome(
            tool_call_id=call_id,
            tool_name=name,
            ok=True,
            content_for_llm=wrapped,
            draft_action_id=action_id,
            draft_action_type=action_type,
            draft_summary=summary,
        )
