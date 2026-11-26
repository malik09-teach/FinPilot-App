from fastapi import APIRouter, Request

router = APIRouter(tags=["health"])


@router.get("/health")
async def health(request: Request) -> dict[str, object]:
    """Liveness/readiness endpoint; exposes no secrets or model names."""
    manifest_count = len(request.app.state.manifest.all_tools())
    return {
        "status": "ok",
        "service": "finpilot-agent-service",
        "toolsLoaded": manifest_count,
    }
