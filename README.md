# FailureTrace

Local prototype for investigating software failures with evidence, hypotheses, root cause, and verification.

This is an early skeleton. Investigation logic is not implemented yet.

## Local setup

1. Open a terminal in the project root (`FailureTrace/`).
2. Create and activate a virtual environment:

```powershell
python -m venv .venv
.venv\Scripts\activate
```

3. Install dependencies:

```powershell
pip install -r requirements.txt
```

4. Copy `.env.example` to `.env` and add your OpenAI API key when you need it (not required for the health check):

```powershell
copy .env.example .env
```

5. Start the backend:

```powershell
uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000
```

6. Open:

- Health: http://127.0.0.1:8000/health
- App: http://127.0.0.1:8000/
