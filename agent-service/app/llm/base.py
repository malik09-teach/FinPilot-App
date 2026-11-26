from abc import ABC, abstractmethod
from collections.abc import AsyncIterator
from dataclasses import dataclass, field
from typing import Any


@dataclass(frozen=True)
class ToolCallRequest:
    id: str
    name: str
    arguments_json: str


@dataclass(frozen=True)
class LLMUsage:
    prompt_tokens: int = 0
    completion_tokens: int = 0


@dataclass(frozen=True)
class LLMResponse:
    content: str
    tool_calls: list[ToolCallRequest] = field(default_factory=list)
    usage: LLMUsage = field(default_factory=LLMUsage)


@dataclass(frozen=True)
class LLMStreamChunk:
    token: str | None = None
    tool_calls: list[ToolCallRequest] | None = None
    usage: LLMUsage | None = None
    done: bool = False


class LLMClient(ABC):
    """Provider-agnostic async LLM interface."""

    @abstractmethod
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
        """Perform a non-streaming chat completion."""

    @abstractmethod
    def stream_chat(
        self,
        *,
        model: str,
        messages: list[dict[str, Any]],
        tools: list[dict[str, Any]] | None = None,
        temperature: float = 0.2,
        max_tokens: int = 1024,
    ) -> AsyncIterator[LLMStreamChunk]:
        """Stream chat completion chunks (tokens and/or tool calls)."""
