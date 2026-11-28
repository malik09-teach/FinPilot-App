from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.api.chat import router as chat_router
from app.api.health import router as health_router
from app.api.market import router as market_router
from app.config import Settings, get_settings
from app.core.limits import ConcurrencyLimiter
from app.core.orchestrator import AgentOrchestrator
from app.llm.base import LLMClient
from app.llm.fake_client import FakeLLMClient
from app.llm.groq_client import GroqLLMClient
from app.observability import configure_logging, log_event
from app.tools.bank_client import BankClient, BankClientError
from app.tools.executor import ToolExecutor
from app.tools.manifest import ToolManifestStore


def build_llm_client(settings: Settings) -> LLMClient:
    if settings.groq_api_key.strip():
        return GroqLLMClient(
            api_key=settings.groq_api_key.strip(),
            timeout_seconds=settings.groq_timeout_seconds,
            max_retries=settings.groq_max_retries,
        )
    return FakeLLMClient()


def create_app(
    *,
    settings: Settings | None = None,
    llm_client: LLMClient | None = None,
    bank_client: BankClient | None = None,
    manifest_store: ToolManifestStore | None = None,
) -> FastAPI:
    cfg = settings or get_settings()
    configure_logging(cfg.log_level)

    @asynccontextmanager
    async def lifespan(app: FastAPI) -> AsyncIterator[None]:
        b_client = bank_client or BankClient(
            base_url=cfg.backend_base_url,
            service_token=cfg.agent_service_token,
            timeout_seconds=cfg.per_tool_timeout_seconds,
        )
        m_store = manifest_store or ToolManifestStore()
        if not m_store.all_tools():
            try:
                raw_tools = await b_client.fetch_tool_manifest()
                m_store.load_from_raw(raw_tools)
                log_event("manifest_loaded", "startup", count=len(m_store.all_tools()))
            except BankClientError as exc:
                log_event("manifest_load_deferred", "startup", reason=str(exc))

        llm = llm_client or build_llm_client(cfg)
        executor = ToolExecutor(
            bank_client=b_client,
            manifest=m_store,
            per_tool_timeout_seconds=cfg.per_tool_timeout_seconds,
        )
        limiter = ConcurrencyLimiter(
            max_global=cfg.max_concurrent_global,
            max_per_user=cfg.max_concurrent_per_user,
        )
        app.state.settings = cfg
        app.state.bank_client = b_client
        app.state.manifest = m_store
        app.state.orchestrator = AgentOrchestrator(
            llm=llm,
            manifest=m_store,
            executor=executor,
            settings=cfg,
            limiter=limiter,
        )
        try:
            yield
        finally:
            await b_client.close()

    app = FastAPI(title="FinPilot AI Agent Service", version="1.0.0", lifespan=lifespan)
    app.include_router(health_router)
    app.include_router(chat_router)
    app.include_router(market_router)
    return app


app = create_app()
