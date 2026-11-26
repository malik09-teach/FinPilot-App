class AgentError(Exception):
    """Base typed error with a user-safe message."""

    code: str = "AGENT_ERROR"
    user_message: str = "Something went wrong while processing your request. Please try again."

    def __init__(self, user_message: str | None = None, *, code: str | None = None) -> None:
        if user_message:
            self.user_message = user_message
        if code:
            self.code = code
        super().__init__(self.user_message)


class RateLimitedError(AgentError):
    code = "RATE_LIMITED"
    user_message = "FinPilot AI is busy right now. Please try again in a few seconds."


class TimeoutBudgetError(AgentError):
    code = "TIMEOUT"
    user_message = "The request took too long to complete. Please try a shorter question."


class StepLimitError(AgentError):
    code = "STEP_LIMIT"
    user_message = "I reached the maximum number of tool steps for this request."


class TokenBudgetError(AgentError):
    code = "TOKEN_BUDGET"
    user_message = "This request exceeded the token budget. Please start a new message."
