# RythuSahayak language fix and deployment guide

This source update is intended to fix language mixing in the existing demo and provide reliable error messages. It does not claim that the live Render deployment has already been updated; you must push these files and redeploy both services.

## Files changed

1. `frontend/src/i18n.js` — common error text, translated status/actions.
2. `frontend/src/services/api.js` — stable API error codes, prevents a production build from silently falling back to `localhost:8000`, and passes the chosen language to localized API endpoints.
3. `frontend/src/components/Login.jsx` — translates the visible title/brand, shows friendly localized errors, and removes the on-page demo-credentials panel.
4. `frontend/src/App.jsx` — localized API error messages, language-aware data refresh, and localized brand labels.
5. `frontend/src/components/ApplicationDetails.jsx` — fetches detail data in the selected language, translates API errors, and formats dates according to the selected language.
6. `backend/app/main.py` — returns findings and notes in the requested language, and transliterates the fixed fictional sample names/places for the English view.
7. `README.md` — removes stale guidance about showing credentials on the login screen and documents the image-upload limitation.

## Important notes about localized data

- Interface labels, status flags, fixed sample notes, fixed checklist findings and fallback AI analysis are language-aware.
- Names and place names are proper nouns. This version transliterates the eight known fictional seeded records for the English display and retains the original Telugu spelling in Telugu mode. If you replace the demo records with real or new records, add properly reviewed localized display values instead of automatically translating names.
- The officer's manually entered decision reason and username are data supplied by a user, not interface labels. A reason saved in English will remain English in history unless you add a separate translation feature. Never silently rewrite an officer's original audit reason.
- This project currently has no uploaded-document image feature. The document checklist is stored as booleans. See the image guidance below.

## Local test

From the repository root, use two terminals.

Terminal 1 — backend:

```powershell
cd backend
py -3.12 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
Copy-Item .env.example .env
python -m uvicorn app.main:app --reload --port 8000
```

If `.venv` already exists, activate it and skip the create step. Set a local `JWT_SECRET` in `backend/.env`. The `.env` file must not be committed.

Terminal 2 — frontend:

```powershell
cd frontend
npm install
Copy-Item .env.example .env
npm run dev
```

Open `http://localhost:5173`. The example frontend `.env` should contain:

```dotenv
VITE_API_BASE_URL=http://localhost:8000
```

Local demo login (unless changed in `backend/.env`):

- Username: `demo_officer`
- Password: `ChangeThisDemoPassword123!`

## Render deployment

### Backend Web Service

- Root Directory: `backend`
- Build Command: `pip install -r requirements.txt`
- Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- Environment variables:
  - `FRONTEND_ORIGIN=https://rythu-sahayak-1.onrender.com`
  - `DEMO_USERNAME=demo_officer`
  - `DEMO_PASSWORD=ChangeThisDemoPassword123!` (change it if you want; then document the actual working value in README)
  - `JWT_SECRET=<long-random-secret>`
  - `DATABASE_URL=<persistent PostgreSQL URL>` for persistent decisions and records
  - `OPENAI_API_KEY` and `OPENAI_MODEL` only if using the optional LLM

Use the exact frontend origin shown in your Render dashboard if it has changed. Avoid leaving the development-only JWT secret in deployment. Prefer Render PostgreSQL or other persistent database storage: local SQLite on an ephemeral service disk can lose updates on redeploy/restart.

### Frontend Static Site

- Root Directory: `frontend`
- Build Command: `npm install && npm run build`
- Publish Directory: `dist`
- Environment variable:
  - `VITE_API_BASE_URL=https://rythu-sahayak.onrender.com`

Set the exact backend URL shown in Render, without a trailing slash. Save the environment variable and trigger a **new deploy** because Vite injects `VITE_` variables during the build. Deploy the backend changes as well as the frontend changes.

## Manual test cases

Run these after redeploy, using an incognito/private browser session:

| # | Test | Expected result |
|---|---|---|
| 1 | Open the page with no language saved | English login appears by default. |
| 2 | Select Telugu on login | All fixed login labels, heading, helper text, and notices use Telugu. Language choice is remembered. |
| 3 | Select English on login | Login labels and notices use English. No Telugu error text is shown by the application UI. |
| 4 | Submit wrong credentials | A friendly error appears in the currently selected language; no raw API/stack trace appears. |
| 5 | Temporarily stop the local backend, then submit login | A friendly service-unavailable message appears in the selected language, not a technical “check API” message. Restart the backend afterward. |
| 6 | Login with the configured demo credentials | Dashboard opens. Credentials are not printed on the login screen. |
| 7 | Toggle English/Telugu on dashboard | Dashboard headings, metrics, table labels, flags, statuses, name/place display values and notes update to the selected language. |
| 8 | Search in English for `Ramesh` or `Patancheru` | Matching fictional sample records are found. |
| 9 | Toggle language with a record open | Detail labels, notes, document checklist, findings, action labels, and dates update to the selected language. Run AI analysis again after changing the language. |
| 10 | Run analysis in English and Telugu | Summary/reasons/fixed findings are returned in the selected language; source badge identifies LLM or rule-based fallback. |
| 11 | Save a decision with a reason of fewer than five characters | The decision is rejected with a translated validation message. |
| 12 | Save a valid decision | Confirmation appears, status changes, and history is recorded. The reason shown in history stays exactly as the officer entered it. |
| 13 | Try to make a second decision on a completed application | Friendly conflict message appears in the selected language. |
| 14 | Reload and sign in again | Data persists only if a persistent database is configured; verify approval/history after reload. |
| 15 | Test Render `/api/health` and `/docs` | Health endpoint responds and API docs load. Then test actual login; health alone does not guarantee login works. |
| 16 | Check browser console/network tab | API calls go to the deployed backend URL, not `localhost:8000`; no CORS or failed fetch errors. |

## Image and document files

A local disk path is not published just because the project is deployed. For a static logo or illustration, commit it under `frontend/public/` and refer to it as `/filename.png`. For application document uploads, this codebase needs a real authenticated upload endpoint plus persistent object storage, and the database must store the resulting file key/URL. It currently provides a checklist only; no document image upload/viewer is implemented.
