from collections.abc import AsyncIterator

from fastapi import APIRouter, Depends, Request
from fastapi.responses import StreamingResponse

from app.core.orchestrator import AgentOrchestrator
from app.security import ChatRequest, verify_service_token

router = APIRouter(prefix="/v1", tags=["chat"])


@router.post("/chat")
async def chat_stream(
    body: ChatRequest,
    request: Request,
    _service_token: str = Depends(verify_service_token),
) -> StreamingResponse:
    orchestrator: AgentOrchestrator = request.app.state.orchestrator

    async def event_generator() -> AsyncIterator[str]:
        async for ev in orchestrator.stream_chat(body):
            yield ev.encode()

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
