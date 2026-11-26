# FinPilot AI Agent Architecture

## Overview

FinPilot uses a **two-service architecture** where the TypeScript/Express backend remains the single source of truth for the banking core, authentication, tool schemas, human-in-the-loop (`AgentAction`/`AgentApproval`), PIN verification, double-entry ledger, and audit logging. The Python FastAPI service (`agent-service/`) is stateless and handles intent routing, Groq LLM calls, tool-call orchestration, and SSE streaming.

```
Mobile (AiWorkspaceModal)
  │  POST /api/ai/chat/stream (Bearer JWT)
  ▼
TypeScript Backend (python-gateway.service.ts)
  │  1. Persists USER AgentMessage
  │  2. Mints short-lived HMAC X-Agent-Context token (TTL 120s)
  │  3. Relays SSE from Python POST /v1/chat (X-Service-Token)
  │  4. Falls back to legacy AgentOrchestrator on outage/timeout
  ▼
Python Agent Service (agent-service/)
  │  1. Fast-path rules / Groq router -> 1 of 6 specialists
  │  2. Groq streaming + tool calls (max 6 steps)
  │  3. Calls Backend POST /internal/ai/tools/:name/invoke
  ▼
TypeScript Backend (/internal/ai/*)
  │  1. Verifies X-Service-Token + X-Agent-Context (extracts userId)
  │  2. Rejects RESTRICTED tools
  │  3. Validates args with Zod 4 & executes registry tool
  │  4. For DRAFT tools: creates AgentAction (AWAITING_APPROVAL) + AgentApproval
  ▼
Mobile ApprovalCard -> POST /api/ai/actions/:id/approve (with PIN) -> Banking Core
```

## Security Model

- **Two-layer internal auth (`/internal/ai/*`)**:
  1. `X-Service-Token`: constant-time comparison (`crypto.timingSafeEqual` / `hmac.compare_digest`).
  2. `X-Agent-Context`: HMAC-SHA256 signed token bound to `userId`, `sessionId`, `requestId`, and `exp` (120s TTL).
- **Network isolation**: `/internal/ai/*` is for backend <-> `agent-service` communication only (Docker internal network or `127.0.0.1`). The mobile app never calls `agent-service` or `/internal/ai/*`.
- **Production auth**: `x-demo-user-id` fallback is disabled when `NODE_ENV=production`.
- **Prompt-injection defense**: Tool outputs are sanitized and wrapped in `<UNTRUSTED_TOOL_DATA>` blocks.
- **Redaction**: PINs, CVVs, 16-digit card numbers, IBANs, Bearer/JWT tokens, and API keys are masked before logging or prompting.

## Backend <-> Python Contract

### `POST /v1/chat` (Python)
Headers: `X-Service-Token`
Body:
```json
{
  "session_id": "...",
  "request_id": "...",
  "message": "...",
  "history": [{"role": "USER", "content": "..."}],
  "running_summary": null,
  "context_token": "<hmac-token>",
  "user_id_hint": "usr_temoor_01"
}
```
Response (`text/event-stream` SSE events):
- `token`: `{"text": "..."}`
- `tool_start`: `{"tool": "get_account_balance", "label": "Checking account balance..."}`
- `tool_end`: `{"tool": "get_account_balance", "ok": true}`
- `draft_created`: `{"actionId": "...", "actionType": "TRANSFER", "summary": "..."}`
- `error`: `{"code": "...", "message": "..."}`
- `done`: `{"requestId": "...", "sessionId": "...", "specialist": "...", "usage": {...}, "latencyMs": 123}`

### Internal Backend Routes (`/internal/ai/*`)
- `GET /internal/ai/tools` — returns JSON-Schema manifest (generated via Zod 4 `z.toJSONSchema`) for `READ` and `DRAFT` tools only.
- `POST /internal/ai/tools/:name/invoke` — validates `args` with Zod, executes tool for `ctx.userId`, and persists `AgentAction` + `AgentApproval` for `DRAFT` tools.

## Tool Registry & Risk Levels

| Tool | Risk | Notes |
| --- | --- | --- |
| `get_account_balance` | `READ` | Current & available balance |
| `get_transactions` | `READ` | Recent/filtered transactions |
| `get_spending_analytics` | `READ` | Income vs expense breakdown |
| `get_income_summary` | `READ` | Recent credits |
| `get_expense_summary` | `READ` | Debits by category |
| `get_budget_progress` | `READ` | Active budget & categories |
| `get_savings_goals` | `READ` | Active savings goals |
| `get_recurring_transactions` | `READ` | Subscriptions & bills |
| `get_beneficiaries` | `READ` | Saved payees |
| `get_fraud_risk_assessment` | `READ` | Deterministic fraud scoring |
| `create_transfer_draft` | `DRAFT` | Validates limits; creates `TRANSFER` action (PIN required) |
| `create_savings_goal_draft` | `DRAFT` | Creates `CREATE_SAVING_GOAL` action |
| `create_budget_draft` | `DRAFT` | Creates `CREATE_BUDGET` action |
| `create_freeze_card_draft` | `DRAFT` | Creates `FREEZE_CARD` action (PIN required) |
| `execute_approved_transfer` | `RESTRICTED` | **Never** in manifest; only `/api/ai/actions/:id/approve` executes |
| `freeze_card` | `RESTRICTED` | **Never** in manifest; only `/api/ai/actions/:id/approve` executes |

## Environment Variables

See `.env.example`, `backend/.env.example`, and `agent-service/.env.example`.

## Switching `AI_ENGINE`

Set `AI_ENGINE=python` (default, uses Groq via `agent-service`) or `AI_ENGINE=legacy` (uses the original TypeScript keyword `AgentOrchestrator`).

## Adding a New Tool or Specialist

1. **Tool**: Add the tool with a Zod schema to `toolRegistry` in `backend/src/ai/tools/registry.ts` (mark as `READ` or `DRAFT`). Python loads it automatically from `/internal/ai/tools` at startup.
2. **Specialist**: Add a prompt in `agent-service/app/prompts/<name>.md`, subclass `BaseSpecialistAgent` in `agent-service/app/agents/<name>.py` with an `allowed_tools` set, and register it in `agent-service/app/core/orchestrator.py` and `router.py`.

## Running Locally

```bash
# 1. Backend
cd backend && npm install && npx prisma db push && npm run seed && npm run dev

# 2. Python Agent Service
cd agent-service && .venv\Scripts\activate && uvicorn app.main:app --port 8000

# 3. Mobile
cd mobile && npm install && npx expo start
```
