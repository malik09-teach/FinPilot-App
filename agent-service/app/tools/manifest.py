from dataclasses import dataclass
from typing import Any, Literal

ToolRisk = Literal["READ", "DRAFT"]

# Restricted tools that must NEVER be exposed to the LLM or invoked by Python
RESTRICTED_TOOLS: frozenset[str] = frozenset({"execute_approved_transfer", "freeze_card"})


@dataclass(frozen=True)
class ManifestTool:
    name: str
    description: str
    parameters: dict[str, Any]
    risk: ToolRisk

    def to_groq_tool(self) -> dict[str, Any]:
        """Build an OpenAI/Groq-compatible tool definition from the backend manifest."""
        return {
            "type": "function",
            "function": {
                "name": self.name,
                "description": self.description,
                "parameters": self.parameters,
            },
        }


class ToolManifestStore:
    """In-memory manifest loaded from backend /internal/ai/tools at startup."""

    def __init__(self, raw_tools: list[dict[str, Any]] | None = None) -> None:
        self._tools: dict[str, ManifestTool] = {}
        if raw_tools:
            self.load_from_raw(raw_tools)

    def load_from_raw(self, raw_tools: list[dict[str, Any]]) -> None:
        parsed: dict[str, ManifestTool] = {}
        for item in raw_tools:
            name = str(item.get("name", "")).strip()
            risk = str(item.get("risk", "")).upper()
            if not name or name in RESTRICTED_TOOLS or risk not in ("READ", "DRAFT"):
                continue

            params = item.get("parameters")
            if not isinstance(params, dict):
                params = {"type": "object", "properties": {}}
            # Strip any accidental user_id/userId property as defense-in-depth
            props = params.get("properties")
            if isinstance(props, dict):
                clean_props = {
                    k: v for k, v in props.items() if k not in ("user_id", "userId")
                }
                params = {**params, "properties": clean_props}

            parsed[name] = ManifestTool(
                name=name,
                description=str(item.get("description", "")),
                parameters=params,
                risk="READ" if risk == "READ" else "DRAFT",
            )
        self._tools = parsed

    def get(self, name: str) -> ManifestTool | None:
        return self._tools.get(name)

    def all_tools(self) -> list[ManifestTool]:
        return list(self._tools.values())

    def groq_tools_for_allowlist(self, allowlist: frozenset[str]) -> list[dict[str, Any]]:
        return [
            tool.to_groq_tool()
            for name, tool in self._tools.items()
            if name in allowlist
        ]
