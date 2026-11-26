# FinPilot AI Agent Service (Python / FastAPI)

Stateless, Groq-powered multi-agent orchestrator for FinPilot.

## Setup

```bash
python -m venv .venv
# Windows:
.venv\Scripts\activate
# Linux/macOS:
source .venv/bin/activate

pip install -r requirements-dev.txt
cp .env.example .env
```

## Run

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

## Checks

```bash
ruff check app tests
mypy app
pytest
```
