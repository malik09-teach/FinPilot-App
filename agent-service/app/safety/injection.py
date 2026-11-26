import json
import re
from typing import Any

_INJECTION_PATTERNS: list[re.Pattern[str]] = [
    re.compile(r"(?i)ignore\s+(?:all\s+)?(?:previous|prior|above)\s+instructions?"),
    re.compile(r"(?i)disregard\s+(?:all\s+)?(?:previous|prior|system)\s+instructions?"),
    re.compile(r"(?i)you\s+are\s+now\s+(?:a|an|in)\s+.*"),
    re.compile(r"(?i)system\s*:\s*"),
    re.compile(r"(?i)assistant\s*:\s*"),
    re.compile(r"(?i)call\s+tool\s+`?[a-z_]+`?"),
    re.compile(r"(?i)execute_approved_transfer|freeze_card"),
    re.compile(r"<\s*/?\s*(?:system|instruction|tool_call|prompt)\s*>", re.IGNORECASE),
]


def sanitize_untrusted_text(text: str) -> str:
    """Neutralize instruction-like text in untrusted merchant names, memos, or notes."""
    cleaned = text
    for pattern in _INJECTION_PATTERNS:
        cleaned = pattern.sub("[FILTERED_TEXT]", cleaned)
    return cleaned


def sanitize_data_structure(value: Any) -> Any:
    """Recursively sanitize strings inside tool results before passing to LLM."""
    if isinstance(value, str):
        return sanitize_untrusted_text(value)
    if isinstance(value, list):
        return [sanitize_data_structure(item) for item in value]
    if isinstance(value, dict):
        return {str(k): sanitize_data_structure(v) for k, v in value.items()}
    return value


def wrap_tool_data_block(tool_name: str, data: Any) -> str:
    """Wrap sanitized tool output in a strict untrusted-data delimiter block."""
    sanitized = sanitize_data_structure(data)
    serialized = json.dumps(sanitized, ensure_ascii=False, default=str)
    return (
        f"<UNTRUSTED_TOOL_DATA tool=\"{tool_name}\">\n"
        f"{serialized}\n"
        f"</UNTRUSTED_TOOL_DATA>"
    )
