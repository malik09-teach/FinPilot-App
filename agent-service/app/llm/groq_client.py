from collections.abc import AsyncIterator
from typing import Any

from groq import AsyncGroq

from app.llm.base import LLMClient, LLMResponse, LLMStreamChunk, LLMUsage, ToolCallRequest
from app.llm.retry import with_retry


class GroqLLMClient(LLMClient):
    """Official Groq async SDK implementation."""

    def __init__(
        self,
        *,
        api_key: str,
        timeout_seconds: float = 30.0,
        max_retries: int = 3,
    ) -> None:
        self._client = AsyncGroq(api_key=api_key, timeout=timeout_seconds, max_retries=0)
        self._max_retries = max_retries

    async def chat(
        self,
        *,
        model: str,
        messages: list[dict[str, Any]],
        tools: list[dict[str, Any]] | None = None,
        response_format: dict[str, str] | None = None,
        temperature: float = 0.2,
        max_tokens: int = 1024,
    ) -> LLMResponse:
        async def _call() -> Any:
            kwargs: dict[str, Any] = {
                "model": model,
                "messages": messages,
                "temperature": temperature,
                "max_tokens": max_tokens,
            }
            if tools:
                kwargs["tools"] = tools
                kwargs["tool_choice"] = "auto"
            if response_format:
                kwargs["response_format"] = response_format
            return await self._client.chat.completions.create(**kwargs)

        resp = await with_retry(_call, max_retries=self._max_retries)
        choice = resp.choices[0].message
        tool_calls: list[ToolCallRequest] = []
        if getattr(choice, "tool_calls", None):
            for tc in choice.tool_calls:
                tool_calls.append(
                    ToolCallRequest(
                        id=tc.id,
                        name=tc.function.name,
                        arguments_json=tc.function.arguments or "{}",
                    )
                )

        usage_obj = getattr(resp, "usage", None)
        usage = LLMUsage(
            prompt_tokens=getattr(usage_obj, "prompt_tokens", 0) or 0,
            completion_tokens=getattr(usage_obj, "completion_tokens", 0) or 0,
        )
        return LLMResponse(
            content=choice.content or "",
            tool_calls=tool_calls,
            usage=usage,
        )

    async def stream_chat(
        self,
        *,
        model: str,
        messages: list[dict[str, Any]],
        tools: list[dict[str, Any]] | None = None,
        temperature: float = 0.2,
        max_tokens: int = 1024,
    ) -> AsyncIterator[LLMStreamChunk]:
        async def _open_stream() -> Any:
            kwargs: dict[str, Any] = {
                "model": model,
                "messages": messages,
                "temperature": temperature,
                "max_tokens": max_tokens,
                "stream": True,
            }
            if tools:
                kwargs["tools"] = tools
                kwargs["tool_choice"] = "auto"
            return await self._client.chat.completions.create(**kwargs)

        stream = await with_retry(_open_stream, max_retries=self._max_retries)

        pending_tools: dict[int, dict[str, str]] = {}
        final_usage: LLMUsage | None = None

        async for chunk in stream:
            if getattr(chunk, "x_groq", None) and getattr(chunk.x_groq, "usage", None):
                u = chunk.x_groq.usage
                final_usage = LLMUsage(
                    prompt_tokens=getattr(u, "prompt_tokens", 0) or 0,
                    completion_tokens=getattr(u, "completion_tokens", 0) or 0,
                )
            elif getattr(chunk, "usage", None):
                u = chunk.usage
                final_usage = LLMUsage(
                    prompt_tokens=getattr(u, "prompt_tokens", 0) or 0,
                    completion_tokens=getattr(u, "completion_tokens", 0) or 0,
                )

            if not chunk.choices:
                continue
            delta = chunk.choices[0].delta

            if getattr(delta, "content", None):
                yield LLMStreamChunk(token=delta.content)

            if getattr(delta, "tool_calls", None):
                for tc in delta.tool_calls:
                    idx = tc.index if tc.index is not None else 0
                    entry = pending_tools.setdefault(idx, {"id": "", "name": "", "arguments": ""})
                    if tc.id:
                        entry["id"] = tc.id
                    if tc.function and tc.function.name:
                        entry["name"] += tc.function.name
                    if tc.function and tc.function.arguments:
                        entry["arguments"] += tc.function.arguments

        assembled: list[ToolCallRequest] | None = None
        if pending_tools:
            assembled = [
                ToolCallRequest(
                    id=v["id"] or f"tc_{idx}",
                    name=v["name"],
                    arguments_json=v["arguments"] or "{}",
                )
                for idx, v in sorted(pending_tools.items())
            ]
        yield LLMStreamChunk(tool_calls=assembled, usage=final_usage, done=True)
