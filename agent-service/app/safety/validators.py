from typing import Any

SINGLE_TX_LIMIT_PKR = 100_000.0
DAILY_TX_LIMIT_PKR = 200_000.0
MAX_SANE_GOAL_PKR = 100_000_000.0


def validate_tool_args(tool_name: str, args: dict[str, Any]) -> tuple[bool, str | None]:
    """Pre-check financial sanity constraints before invoking backend tools.

    Backend remains the authoritative enforcer.
    """
    if "user_id" in args or "userId" in args:
        return False, "Tool arguments must not specify a user identifier."

    if tool_name == "create_transfer_draft":
        amount = args.get("amount")
        if not isinstance(amount, (int, float)) or amount <= 0:
            return False, "Transfer amount must be a positive number in PKR."
        if amount > SINGLE_TX_LIMIT_PKR:
            return (
                False,
                f"Amount PKR {amount:,.0f} exceeds the single-transaction limit of "
                f"PKR {SINGLE_TX_LIMIT_PKR:,.0f}.",
            )
        recipient_name = args.get("recipientName")
        recipient_account = args.get("recipientAccount")
        if not isinstance(recipient_name, str) or not recipient_name.strip():
            return False, "Recipient name is required."
        if not isinstance(recipient_account, str) or not recipient_account.strip():
            return False, "Recipient account number is required."

    elif tool_name == "create_savings_goal_draft":
        target = args.get("targetAmount")
        months = args.get("durationMonths")
        if not isinstance(target, (int, float)) or target <= 0 or target > MAX_SANE_GOAL_PKR:
            return False, "Savings target amount must be a positive PKR amount."
        if not isinstance(months, (int, float)) or months < 1 or months > 600:
            return False, "Duration must be between 1 and 600 months."

    elif tool_name == "create_budget_draft":
        limit = args.get("totalLimit")
        if not isinstance(limit, (int, float)) or limit <= 0 or limit > MAX_SANE_GOAL_PKR:
            return False, "Budget totalLimit must be a positive PKR amount."

    return True, None
