import re

_PATTERNS: list[tuple[re.Pattern[str], str]] = [
    # Bearer / JWT tokens
    (re.compile(r"Bearer\s+[A-Za-z0-9\-._~+/]+=*", re.IGNORECASE), "Bearer [REDACTED]"),
    (re.compile(r"\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b"), "[JWT_REDACTED]"),
    # API keys (Groq gsk_*, generic sk_*)
    (re.compile(r"\b(?:gsk|sk)_[A-Za-z0-9]{12,}\b"), "[API_KEY_REDACTED]"),
    # Pakistani IBAN (PK + 2 digits + 4 chars + 16 digits)
    (re.compile(r"\bPK\d{2}[A-Z]{4}\d{16}\b", re.IGNORECASE), "PK**REDACTED****"),
    # 16-digit card numbers (with optional spaces or dashes)
    (re.compile(r"\b(?:\d{4}[-\s]?){3}\d{4}\b"), "****-****-****-[REDACTED]"),
    # Explicit PIN / CVV mentions with 3-6 digits
    (re.compile(r"(?i)\b(pin|cvv|cvc|otp)\s*(?:is|=|:)?\s*\d{3,6}\b"), r"\1=[REDACTED]"),
]


def redact_secrets(text: str) -> str:
    """Mask PINs, card numbers, CVVs, IBANs, and bearer/API tokens."""
    if not text:
        return text
    result = text
    for pattern, replacement in _PATTERNS:
        result = pattern.sub(replacement, result)
    return result
