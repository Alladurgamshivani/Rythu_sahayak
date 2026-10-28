# RythuSahayak — రైతు సహాయక్

**Bilingual (English-first / Telugu) AI-assisted review of fictional agricultural assistance applications for government officers.**

> This is a hiring-assignment demo, not an official government service. All records and document statuses are fictional. The demo document checklist and comparison rules are illustrative, not official scheme eligibility rules.

## 1. Problem

Officers reviewing applications may need to scan application fields, look for missing documents, compare submitted values with verification data, and record a decision. This prototype provides a single work queue with rule-based checks and optional LLM explanations in English or Telugu.

## 2. Target user

A demo government officer reviewing already-submitted agricultural assistance applications. It is an officer-facing review workspace, not a farmer application portal.

## 3. Features

- Demo officer login using a signed, expiring JWT.
- Dashboard counts for total, pending, approved, rejected and returned applications.
- An attention queue that prioritizes known mismatches, then missing documents, then unknown verification.
- Search by application ID, applicant name, village or mandal; filter by status or attention.
- Application details, document checklist, land extent comparison and verification notes.
- Python-based checks for missing documents, inconsistencies and unavailable verification.
- English-first interface with an English / తెలుగు language switch. The selected language is remembered in the browser.
- Optional OpenAI-backed summary in the selected language. If no API key is configured or the provider fails, a rule-based fallback keeps the app usable.
- Structured analysis response and deterministic findings. The LLM cannot overwrite document findings, land mismatches, uncertainty or the suggested action.
- Officer-controlled approve, reject or return-for-correction action with a mandatory reason.
- Persistent decision history including action, old/new status, reason, officer username and timestamp.
- Pytest coverage for the key validation cases.

## 4. Product workflow

1. The officer logs in.
2. The dashboard shows counts and pending cases needing attention.
3. The officer opens an application and reviews its recorded fields and document checklist.
4. The backend runs deterministic checks. The optional LLM explains the findings in the selected language.
5. The officer chooses approve, reject or return for correction and supplies a reason.
6. FastAPI validates the request and stores the application status change and decision history in PostgreSQL (or SQLite for the quickest local start).

The AI never submits a decision. Its recommendation is advisory; the officer must make and record the actual decision.

## 5. Architecture

```text
React + Vite (English / Telugu UI)
        | HTTP + Bearer JWT
        v
FastAPI
  |-- Authentication / JWT
  |-- Dashboard and application APIs
  |-- Deterministic validation tools
  |-- Optional LLM explanation + fallback
  |-- Decision workflow and history
        |
        v
SQLAlchemy -> PostgreSQL (recommended) / SQLite (local quick start)
```

### Technology decisions

- **React + Vite:** small, fast frontend with reusable components.
- **FastAPI + Pydantic:** typed request/response validation and interactive API docs at `/docs`.
- **SQLAlchemy:** database models and session management.
- **PostgreSQL:** persistent relational store for the deployed/demo setup; SQLite is available for a no-database-install quick start.
- **JWT:** short-lived signed tokens for the demo officer. The single-account credential setup is intentionally limited to the assignment; a real service requires an identity provider, robust credential management, roles and additional security review.
- **Rule-based validation before LLM:** exact comparisons and document presence checks are deterministic and cheaper than asking a model to infer them.
- **LLM for explanation only:** an optional model writes a summary and reasons in the selected interface language. The application code preserves deterministic findings and suggested action.
- **Fallback:** the application remains testable without an API key and if the AI provider fails.

## 6. Project structure

```text
rythu-sahayak/
├── backend/
│   ├── app/
│   │   ├── services/analysis.py   # validation tools + AI/fallback workflow
│   │   ├── config.py              # environment settings
│   │   ├── database.py            # SQLAlchemy engine/session
│   │   ├── main.py                # FastAPI endpoints
│   │   ├── models.py              # Application and Decision tables
│   │   ├── schemas.py             # Pydantic request/response models
│   │   ├── security.py            # demo login and JWT verification
│   │   └── seed.py                # fictional seed records
│   ├── tests/test_analysis.py
│   ├── .env.example
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/            # login, dashboard and application detail UI
│   │   ├── services/api.js         # HTTP client and JWT header
│   │   ├── App.jsx
│   │   └── index.css
│   ├── .env.example
│   ├── package.json
│   └── vite.config.js
├── docker-compose.yml              # local PostgreSQL only
├── .gitignore
└── README.md
```

## 7. Requirements

- Python 3.11 or later (Python 3.12 recommended for the role's stack)
- Node.js 20 or later and npm
- Git
- Optional: Docker Desktop / Docker Engine for local PostgreSQL
- Optional: an OpenAI API key for live LLM summaries; fallback works without it

## 8. Run locally — quickest path with SQLite

### Backend

From the repository root:

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate       # Windows: .venv\Scripts\activate
pip install -r requirements.txt
Copy-Item .env.example .env
```

Edit `backend/.env` and set a `JWT_SECRET` to a long random value. The default database URL uses a local SQLite file and requires no database server. Change `DEMO_PASSWORD` to your own demo password.

Start the API:

```bash
uvicorn app.main:app --reload --port 8000
```

Open `http://localhost:8000/api/health` and `http://localhost:8000/docs`.

### Frontend (second terminal)

```bash
cd frontend
npm install
Copy-Item .env.example .env
npm run dev
```

Open `http://localhost:5173`.

### Local demo credentials

The `.env.example` starts with `demo_officer` and `ChangeThisDemoPassword123!` for local demonstration only. The login page intentionally does not display credentials; keep the current working demo credentials in this README for the reviewer, or replace them with the values configured in your hosting environment. Always set `JWT_SECRET` to a long, random value. Never commit a real `.env` file or an API key.


## 8.1 Login troubleshooting (important)

The default local demo credentials are:

- Username: `demo_officer`
- Password: `officer123`

The UI opens in English by default and provides a `English` / `తెలుగు` language switch on the login page and dashboard. The AI analysis endpoint follows the selected language. The password is case-sensitive and includes the final exclamation mark. If the browser shows `Invalid username or password` while the backend log records `POST /api/auth/login 401`, the frontend is reaching the API; the backend is rejecting the values. Check that `backend/.env` has `DEMO_USERNAME=demo_officer` and `DEMO_PASSWORD=ChangeThisDemoPassword123!`, with no surrounding quotes or extra spaces, then restart Uvicorn. If you intentionally changed either value, use the changed credentials. Never paste your `JWT_SECRET` or API keys into chat or commit `.env` to Git.

## 9. Run locally with PostgreSQL

From the repository root, start PostgreSQL:

```bash
docker compose up -d db
```

Edit `backend/.env` and set:

```env
DATABASE_URL=postgresql+psycopg://rythu_user:rythu_local_password@localhost:5432/rythu_sahayak
```

Run the backend and frontend commands above. The sample data is inserted idempotently at startup; the app does not reinsert duplicate application IDs.

To stop the database without deleting its data:

```bash
docker compose stop db
```

To remove the container and database volume (this deletes local database data):

```bash
docker compose down -v
```

## 10. Configure optional LLM analysis

Set these variables in `backend/.env`:

```env
OPENAI_API_KEY=your_api_key_here
OPENAI_MODEL=gpt-4o-mini
```

Restart FastAPI. When an API key is missing, the app deliberately labels its result `rule_based_fallback`. When the provider is configured and works, the analysis source is `openai`. The analysis endpoint accepts `?language=en` or `?language=te`; the frontend sends the selected language automatically. The exact model name must be available to the API account. The key is server-side only and must never be added to frontend variables or committed to Git.

The language model is used to explain facts, not to validate them or commit decisions. Provider failures fall back to deterministic analysis. The demo does not claim official policy eligibility, does not use real citizen data, and does not independently verify source documents.

## 11. API endpoints

| Method | Endpoint | Auth | Purpose |
|---|---|---:|---|
| GET | `/api/health` | No | Health check |
| POST | `/api/auth/login` | No | Obtain JWT using configured demo credentials |
| GET | `/api/auth/me` | Yes | Current demo officer |
| GET | `/api/dashboard` | Yes | Counts + priority queue |
| GET | `/api/applications` | Yes | Search/filter applications |
| GET | `/api/applications/{id}` | Yes | Application detail |
| POST | `/api/applications/{id}/analyze` | Yes | Deterministic checks + optional LLM explanation |
| POST | `/api/applications/{id}/decision` | Yes | Save an officer decision and reason |
| GET | `/api/applications/{id}/history` | Yes | Decision audit history |

Interactive API documentation: `http://localhost:8000/docs`.

## 12. Run tests

From the `backend` directory with the virtual environment active:

```bash
pytest -q
```

Tests cover present/missing/unknown document status, land mismatches, unavailable verification, recommendation logic and fallback source tagging.

## 13. Deployment checklist

Deploy the frontend and API separately, and use a hosted PostgreSQL service for persistence.

### Backend hosting (for example, Render)

- Root directory: `backend`
- Build command: `pip install -r requirements.txt`
- Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- Configure `DATABASE_URL` with the provider's PostgreSQL URL; use SQLAlchemy's `postgresql+psycopg://` driver form when needed.
- Set `DEMO_USERNAME`, `DEMO_PASSWORD`, `JWT_SECRET`, `TOKEN_EXPIRE_MINUTES`, `FRONTEND_ORIGIN`, and optionally `OPENAI_API_KEY` / `OPENAI_MODEL` as environment variables.
- Set a long, random JWT secret and a non-default password.

### Frontend hosting (for example, Vercel)

- Root directory: `frontend`
- Build command: `npm run build`
- Output directory: `dist`
- Set `VITE_API_BASE_URL` to the deployed backend URL, without a trailing slash.

After deployment, open the public frontend in a private browser session and test login, list/search/filter, analysis, all three decisions, history and persistence after a page reload. Check the browser console and backend logs. Confirm the backend CORS setting exactly matches the deployed frontend origin.

### Images and uploaded application documents

This version currently stores document checklist flags (`present` / `missing` / `unknown`); it does not implement a file-upload endpoint or display uploaded document images. A file that exists only on a developer's computer is not available to the deployed Render service. For static app images, add files to `frontend/public/` and reference them with a root-relative URL such as `/logo.png`. For applicant document uploads, implement an authenticated backend upload route and store files in persistent object storage (for example, S3-compatible storage or Cloudinary), saving the returned file URL/key in the database. Do not depend on a local path or the Render service's temporary filesystem for uploaded documents.

## 14. Security, privacy and limitations

- All seed records are fictional. Do not add real names, Aadhaar numbers, bank account details or real citizen documents.
- The demo login uses one configured account; it is not production-grade identity management. Use an identity provider and a role model in a real government application.
- JWT is validated on protected routes; the demo does not include refresh tokens, rate limiting, MFA or a full user directory.
- The current workflow permits an authenticated officer to choose any of the three actions for a pending case, because the officer is the decision-maker. Reasons are mandatory, but the backend does not certify legal eligibility.
- A real system would need verified policy sources, document authenticity checks, privacy/security review, retention policies, monitoring, stronger audit controls, accessibility testing and human/legal review.
- Priority is a deterministic triage signal, not a legal ranking or a claim of eligibility.
- Fallback analysis is not generative AI; the UI explicitly identifies the source.

## 15. Suggested 2-minute walkthrough

1. Log in using the demo credentials you configured.
2. Point out the dashboard and the attention queue.
3. Open `RB-1002` and show the missing bank-proof flag.
4. Run AI analysis and explain the fallback/LLM source badge.
5. Open `RB-1003` and show the land mismatch; explain that it is flagged for verification, not called fraud.
6. Return `RB-1002` for correction with a reason.
7. Show the updated count and decision history.
8. End by explaining that Python runs exact checks, the model only explains findings, and the officer makes the final recorded decision.
