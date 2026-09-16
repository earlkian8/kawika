# Setup Guide

This guide walks you through running Kawika locally for development.

Kawika has two parts:

- **`client/`** — the React + TypeScript web app (Vite)
- **`server/`** — the Python API (FastAPI)

---

## 1. Prerequisites

| Tool    | Version | Check with         |
| ------- | ------- | ------------------ |
| Git     | any     | `git --version`    |
| Node.js | 20+     | `node -v`          |
| npm     | 10+     | `npm -v`           |
| Python  | 3.12+   | `python3 --version`|

> On Ubuntu/Debian you may also need the venv module: `sudo apt install python3-venv`

## 2. Clone the Repository

```bash
git clone <repo-url> kawika
cd kawika
```

## 3. Frontend (`client/`)

```bash
cd client
npm install
npm run dev
```

Open **http://localhost:5173** in your browser. Changes to files in `client/src/` reload automatically.

### Other client commands

```bash
npm run lint      # Check code style
npm run build     # Type-check and create a production build in client/dist
npm run preview   # Serve the production build locally
```

## 4. Backend (`server/`)

### Create and activate a virtual environment

**Linux / macOS**

```bash
cd server
python3 -m venv .venv
source .venv/bin/activate
```

**Windows (PowerShell)**

```powershell
cd server
py -m venv .venv
.venv\Scripts\Activate.ps1
```

You should see `(.venv)` at the start of your terminal prompt.

### Install dependencies

```bash
pip install -r requirements.txt
```

### Run the API

```bash
fastapi dev main.py
```

- API: **http://localhost:8000**
- Health check: **http://localhost:8000/api/health**
- Interactive docs (Swagger UI): **http://localhost:8000/docs**

### Adding a new Python package

```bash
pip install <package>
pip freeze > requirements.txt   # or add the package to requirements.txt by hand
```

## 5. Environment Variables

Secrets and machine-specific settings go in a `.env` file, which is git-ignored. Never commit real credentials.

Copy the example file to get started:

```bash
cp server/.env.example server/.env
```

```bash
# server/.env
APP_ENV=development
# Comma-separated list of frontend origins allowed to call the API
CLIENT_ORIGINS=http://localhost:5173
```

For the client, Vite only exposes variables prefixed with `VITE_`:

```bash
# client/.env (example)
VITE_API_URL=http://localhost:8000
```

## 6. Running Both Together

Use two terminals:

| Terminal | Directory | Command                                   |
| -------- | --------- | ----------------------------------------- |
| 1        | `client/` | `npm run dev`                             |
| 2        | `server/` | `source .venv/bin/activate && fastapi dev main.py` |

## Troubleshooting

| Problem | Fix |
| ------- | --- |
| `python3 -m venv` fails with "ensurepip is not available" | Install `python3-venv` (`sudo apt install python3-venv`) |
| `fastapi: command not found` | Activate the virtual environment first, then reinstall with `pip install -r requirements.txt` |
| PowerShell blocks `Activate.ps1` | Run `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` once |
| Port 5173 or 8000 already in use | Stop the other process, or run `npm run dev -- --port 3000` / `fastapi dev main.py --port 8001` |
| Browser shows CORS errors when calling the API | Add your frontend's URL to `CLIENT_ORIGINS` in `server/.env` and restart the API |
| `npm install` errors after switching Node versions | Delete `client/node_modules` and run `npm install` again |
