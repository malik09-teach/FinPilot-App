from typing import Any

import httpx


class BankClientError(Exception):
    """Raised when the backend internal API returns an error or is unreachable."""

    def __init__(self, message: str, status_code: int = 502) -> None:
        super().__init__(message)
        self.status_code = status_code


class BankClient:
    """Async httpx client for TypeScript backend /internal/ai/* endpoints."""

    def __init__(
        self,
        *,
        base_url: str,
        service_token: str,
        timeout_seconds: float = 10.0,
        client: httpx.AsyncClient | None = None,
    ) -> None:
        self._base_url = base_url.rstrip("/")
        self._service_token = service_token
        self._owns_client = client is None
        self._client = client or httpx.AsyncClient(
            base_url=self._base_url,
            timeout=timeout_seconds,
        )

    async def close(self) -> None:
        if self._owns_client:
            await self._client.aclose()

    async def fetch_tool_manifest(self) -> list[dict[str, Any]]:
        try:
            resp = await self._client.get(
                "/internal/ai/tools",
                headers={"X-Service-Token": self._service_token},
            )
            resp.raise_for_status()
            payload = resp.json()
            tools = payload.get("tools", [])
            if not isinstance(tools, list):
                raise BankClientError("Invalid tool manifest format from backend")
            return [t for t in tools if isinstance(t, dict)]
        except httpx.HTTPStatusError as exc:
            raise BankClientError(
                f"Backend manifest error: {exc.response.status_code}",
                status_code=exc.response.status_code,
            ) from exc
        except httpx.HTTPError as exc:
            raise BankClientError(f"Backend unreachable: {exc}") from exc

    async def invoke_tool(
        self,
        *,
        tool_name: str,
        args: dict[str, Any],
        context_token: str,
        request_id: str,
    ) -> dict[str, Any]:
        try:
            resp = await self._client.post(
                f"/internal/ai/tools/{tool_name}/invoke",
                headers={
                    "X-Service-Token": self._service_token,
                    "X-Agent-Context": context_token,
                    "X-Request-Id": request_id,
                },
                json={"args": args},
            )
            data = resp.json() if resp.content else {}
            if resp.status_code >= 400:
                err_msg = data.get("error") or f"Tool {tool_name} failed ({resp.status_code})"
                raise BankClientError(str(err_msg), status_code=resp.status_code)
            if not isinstance(data, dict):
                raise BankClientError("Invalid tool response from backend")
            return data
        except BankClientError:
            raise
        except httpx.HTTPError as exc:
            raise BankClientError(f"Tool {tool_name} request failed: {exc}") from exc
