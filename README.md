# 🛠️ App Repair Platform

> AI-powered platform that automatically detects, diagnoses, and repairs bugs in your apps using GitHub Models (GPT-4o, DeepSeek-R1, Llama 3.3).

[![Deploy Frontend](https://img.shields.io/badge/Frontend-GitHub%20Pages-blue)](https://eugenemcmillian24-debug.github.io/app-repair-platform/)
[![Deploy Backend](https://img.shields.io/badge/Backend-Railway-purple)](https://railway.app)

---

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│                    App Repair Platform                    │
├──────────────┬───────────────────────────────────────────┤
│   Frontend   │  React + Vite + Tailwind → GitHub Pages   │
│   Backend    │  FastAPI (Python) → Railway               │
│   AI Models  │  GitHub Models Marketplace (free tier)    │
│              │  ├── GPT-4o (OpenAI)                      │
│              │  ├── DeepSeek-R1                           │
│              │  └── Llama 3.3 70B (Ollama-compatible)    │
│   GitHub     │  Webhooks · PRs · Issues integration      │
└──────────────┴───────────────────────────────────────────┘
```

## Features

- **🔍 AI Diagnosis** — Root cause analysis with severity, category, and confidence score
- **🩹 Auto-Patch** — Generates minimal, production-ready code fixes
- **🔀 GitHub PRs** — Auto-creates pull requests with AI-generated fixes and explanations
- **🪝 Webhooks** — Auto-triggers repair when a `bug`-labeled issue is opened
- **📊 Dashboard** — Repair history, success rate, PR tracking
- **🤖 3 AI Models** — Switch between GPT-4o, DeepSeek-R1, and Llama via GitHub Models (all free tier)

---

## Quickstart

### 1. Backend (Railway)

1. Go to [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub Repo**
2. Select `eugenemcmillian24-debug/app-repair-platform`
3. Set root directory to `/backend`
4. Add environment variables:

| Variable | Value |
|---|---|
| `GITHUB_TOKEN` | Your GitHub Personal Access Token (with `repo` scope) |
| `GITHUB_WEBHOOK_SECRET` | Random string for webhook verification |
| `PORT` | Set automatically by Railway |

5. Deploy — Railway auto-detects `railway.json`

### 2. Frontend (GitHub Pages)

1. Go to **Settings → Pages** in this repo
2. Set **Source** to **GitHub Actions**
3. Add repo secret `VITE_API_URL` = your Railway backend URL (e.g. `https://app-repair.up.railway.app`)
4. Push to `main` → auto-deploys via `.github/workflows/deploy-frontend.yml`

### 3. GitHub Webhook (Auto-Repair on Issues)

1. Go to your target repo → **Settings → Webhooks → Add webhook**
2. Payload URL: `https://your-railway-url/webhook/github`
3. Content type: `application/json`
4. Secret: same as `GITHUB_WEBHOOK_SECRET`
5. Events: select **Issues**
6. Any issue labeled `bug` will auto-trigger a repair job!

---

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Backend status + available models |
| `GET` | `/models` | List AI models |
| `POST` | `/repair` | Start repair job |
| `GET` | `/repair/{job_id}` | Poll job status |
| `GET` | `/history` | Repair history |
| `GET` | `/stats` | Platform statistics |
| `POST` | `/webhook/github` | GitHub webhook receiver |

### POST /repair

```json
{
  "repo_owner": "your-username",
  "repo_name": "my-app",
  "issue_number": 42,
  "error_description": "NullPointerException on line 87 when user logs out",
  "file_path": "src/auth/logout.js",
  "code_snippet": "function logout(user) {\n  user.session.destroy();\n}",
  "model": "gpt4o"
}
```

Models: `gpt4o` | `deepseek` | `llama`

---

## GitHub Models Setup

Get free access to GPT-4o, DeepSeek, and Llama via GitHub:

1. Visit [github.com/marketplace/models](https://github.com/marketplace/models)
2. Generate a GitHub PAT with `models:read` permission
3. Set it as `GITHUB_TOKEN` in Railway

All models are free on the GitHub Models free tier (rate limits apply).

---

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS |
| Backend | FastAPI, Python 3.11, httpx |
| AI | GitHub Models API (OpenAI-compatible endpoint) |
| Deploy FE | GitHub Actions → GitHub Pages |
| Deploy BE | Railway (auto-deploy from `main`) |
| Integration | GitHub Webhooks, GitHub REST API |

---

MIT License
