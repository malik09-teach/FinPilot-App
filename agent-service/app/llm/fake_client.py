import json
from collections.abc import AsyncIterator
from typing import Any

from app.llm.base import LLMClient, LLMResponse, LLMStreamChunk, LLMUsage


class FakeLLMClient(LLMClient):
    """Deterministic fake LLM client for tests and offline/no-key execution."""

    def __init__(self, scripted_responses: list[LLMResponse] | None = None) -> None:
        self._scripted: list[LLMResponse] = list(scripted_responses or [])
        self.calls: list[dict[str, Any]] = []

    def queue(self, response: LLMResponse) -> None:
        self._scripted.append(response)

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
        self.calls.append(
            {
                "model": model,
                "messages": messages,
                "tools": tools,
                "response_format": response_format,
            }
        )
        if self._scripted:
            return self._scripted.pop(0)

        last_user = ""
        for msg in reversed(messages):
            if msg.get("role") == "user":
                last_user = str(msg.get("content", ""))
                break

        if response_format and response_format.get("type") == "json_object":
            return LLMResponse(
                content=json.dumps(
                    {
                        "specialist": "financial_analyst",
                        "confidence": 0.9,
                        "reason": "Default fake router classification",
                    }
                ),
                usage=LLMUsage(prompt_tokens=20, completion_tokens=15),
            )

        return LLMResponse(
            content=f"[FinPilot Offline/Test Mode] Received: {last_user[:120]}",
            tool_calls=[],
            usage=LLMUsage(prompt_tokens=25, completion_tokens=18),
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
        resp = await self.chat(
            model=model,
            messages=messages,
            tools=tools,
            temperature=temperature,
            max_tokens=max_tokens,
        )
        if resp.tool_calls:
            yield LLMStreamChunk(tool_calls=resp.tool_calls, usage=resp.usage, done=True)
            return

        words = resp.content.split(" ")
        for idx, word in enumerate(words):
            piece = word if idx == 0 else f" {word}"
            yield LLMStreamChunk(token=piece)
        yield LLMStreamChunk(usage=resp.usage, done=True)
