"""
App Repair Platform - FastAPI Backend
Deployed on Railway | AI via GitHub Models Marketplace
"""

import os
import hmac
import hashlib
import json
import asyncio
from typing import Optional, List, Dict, Any
from datetime import datetime

from fastapi import FastAPI, Request, HTTPException, BackgroundTasks, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import httpx
import uvicorn

# ─── App Setup ───────────────────────────────────────────────────────────────

app = FastAPI(
    title="App Repair Platform API",
    description="AI-powered bug detection & auto-repair using GitHub Models",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Restrict to your GitHub Pages URL in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Config ──────────────────────────────────────────────────────────────────

GITHUB_TOKEN = os.environ.get("GITHUB_TOKEN", "")
GITHUB_WEBHOOK_SECRET = os.environ.get("GITHUB_WEBHOOK_SECRET", "")
GITHUB_MODELS_ENDPOINT = "https://models.inference.ai.azure.com"

# GitHub Models - free tier models available via GitHub Marketplace
AI_MODELS = {
    "gpt4o": "gpt-4o",                          # ChatGPT / OpenAI via GitHub
    "deepseek": "DeepSeek-R1",                   # DeepSeek via GitHub
    "llama": "Meta-Llama-3.3-70B-Instruct",      # Ollama-compatible open model
}

# In-memory store (replace with Railway Postgres in production)
repair_history: List[Dict] = []
active_jobs: Dict[str, Dict] = {}

# ─── Models ──────────────────────────────────────────────────────────────────

class RepairRequest(BaseModel):
    repo_owner: str
    repo_name: str
    issue_number: Optional[int] = None
    error_description: str
    file_path: Optional[str] = None
    code_snippet: Optional[str] = None
    model: str = "gpt4o"  # gpt4o | deepseek | llama

class RepairJob(BaseModel):
    job_id: str
    status: str  # queued | analyzing | patching | validating | done | failed
    repo: str
    created_at: str
    result: Optional[Dict] = None

# ─── GitHub Models AI Client ─────────────────────────────────────────────────

async def call_github_model(model_key: str, messages: List[Dict], temperature: float = 0.2) -> str:
    """Call GitHub Models Marketplace API (OpenAI-compatible)."""
    model_name = AI_MODELS.get(model_key, AI_MODELS["gpt4o"])
    headers = {
        "Authorization": f"Bearer {GITHUB_TOKEN}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": model_name,
        "messages": messages,
        "temperature": temperature,
        "max_tokens": 4096,
    }
    async with httpx.AsyncClient(timeout=60.0) as client:
        resp = await client.post(
            f"{GITHUB_MODELS_ENDPOINT}/chat/completions",
            headers=headers,
            json=payload,
        )
        resp.raise_for_status()
        data = resp.json()
        return data["choices"][0]["message"]["content"]

# ─── Repair Engine ───────────────────────────────────────────────────────────

DIAGNOSIS_PROMPT = """You are an expert software engineer specializing in debugging and automated program repair.

Analyze the following bug report and provide:
1. ROOT CAUSE: What is causing this bug?
2. SEVERITY: critical | high | medium | low
3. CATEGORY: logic_error | null_reference | type_error | syntax | performance | security | other
4. CONFIDENCE: 0-100% how confident you are in your diagnosis
5. SUGGESTED_FIX: Brief description of the fix

Bug Report:
{error_description}

File: {file_path}
Code:
```
{code_snippet}
```

Respond in JSON format only."""

PATCH_PROMPT = """You are an expert software engineer. Generate a minimal, production-ready code fix.

Bug Analysis:
{diagnosis}

Original Code:
```
{code_snippet}
```

Requirements:
- Fix ONLY the bug, don't refactor unnecessarily
- Preserve existing code style
- Add a brief comment explaining the fix
- Return ONLY the fixed code block, no explanation

Fixed code:"""

async def analyze_and_repair(job_id: str, request: RepairRequest):
    """Core repair pipeline: diagnose → patch → explain."""
    job = active_jobs[job_id]

    try:
        # Step 1: Diagnosis
        job["status"] = "analyzing"
        diag_prompt = DIAGNOSIS_PROMPT.format(
            error_description=request.error_description,
            file_path=request.file_path or "unknown",
            code_snippet=request.code_snippet or "not provided",
        )
        diagnosis_raw = await call_github_model(
            request.model,
            [{"role": "user", "content": diag_prompt}],
        )
        try:
            diagnosis = json.loads(diagnosis_raw)
        except json.JSONDecodeError:
            diagnosis = {"ROOT CAUSE": diagnosis_raw, "SEVERITY": "unknown", "CONFIDENCE": 50}

        # Step 2: Generate Patch
        job["status"] = "patching"
        patch = None
        pr_url = None

        if request.code_snippet:
            patch_prompt = PATCH_PROMPT.format(
                diagnosis=json.dumps(diagnosis, indent=2),
                code_snippet=request.code_snippet,
            )
            patch = await call_github_model(
                request.model,
                [{"role": "user", "content": patch_prompt}],
                temperature=0.1,
            )

            # Step 3: Create PR if we have repo info and a patch
            job["status"] = "validating"
            if request.repo_owner and request.repo_name and patch and GITHUB_TOKEN:
                pr_url = await create_repair_pr(
                    owner=request.repo_owner,
                    repo=request.repo_name,
                    file_path=request.file_path or "REPAIR.md",
                    patch=patch,
                    diagnosis=diagnosis,
                    issue_number=request.issue_number,
                )

        # Done
        job["status"] = "done"
        job["result"] = {
            "diagnosis": diagnosis,
            "patch": patch,
            "pr_url": pr_url,
            "model_used": AI_MODELS.get(request.model, request.model),
            "completed_at": datetime.utcnow().isoformat(),
        }
        repair_history.append({**job, "repo": f"{request.repo_owner}/{request.repo_name}"})

    except Exception as e:
        job["status"] = "failed"
        job["result"] = {"error": str(e)}

async def create_repair_pr(
    owner: str, repo: str, file_path: str,
    patch: str, diagnosis: dict, issue_number: Optional[int]
) -> Optional[str]:
    """Create a GitHub PR with the AI-generated fix."""
    headers = {
        "Authorization": f"token {GITHUB_TOKEN}",
        "Accept": "application/vnd.github+json",
    }
    branch_name = f"fix/ai-repair-{datetime.utcnow().strftime('%Y%m%d-%H%M%S')}"
    base_url = f"https://api.github.com/repos/{owner}/{repo}"

    async with httpx.AsyncClient(timeout=30.0) as client:
        # Get default branch SHA
        r = await client.get(f"{base_url}/git/refs/heads/main", headers=headers)
        if r.status_code != 200:
            r = await client.get(f"{base_url}/git/refs/heads/master", headers=headers)
        if r.status_code != 200:
            return None
        sha = r.json()["object"]["sha"]

        # Create branch
        await client.post(f"{base_url}/git/refs", headers=headers, json={
            "ref": f"refs/heads/{branch_name}",
            "sha": sha,
        })

        # Commit patch
        import base64
        content_b64 = base64.b64encode(patch.encode()).decode()
        await client.put(f"{base_url}/contents/{file_path}", headers=headers, json={
            "message": f"fix: AI-generated repair [{diagnosis.get('CATEGORY', 'bug')}]",
            "content": content_b64,
            "branch": branch_name,
        })

        # Create PR
        body = f"""## 🤖 AI-Generated Fix

**Root Cause:** {diagnosis.get('ROOT CAUSE', 'See analysis')}
**Severity:** `{diagnosis.get('SEVERITY', 'unknown')}`
**Confidence:** {diagnosis.get('CONFIDENCE', '?')}%
**Category:** `{diagnosis.get('CATEGORY', 'unknown')}`

### Suggested Fix
{diagnosis.get('SUGGESTED_FIX', 'See patch')}

---
*Generated by App Repair Platform using {diagnosis.get('model', 'AI')}*
{f'Closes #{issue_number}' if issue_number else ''}
"""
        pr_resp = await client.post(f"{base_url}/pulls", headers=headers, json={
            "title": f"fix: AI repair - {diagnosis.get('CATEGORY', 'bug')} [{diagnosis.get('SEVERITY', '')}]",
            "body": body,
            "head": branch_name,
            "base": "main",
            "draft": False,
        })
        if pr_resp.status_code == 201:
            return pr_resp.json()["html_url"]
    return None

# ─── Routes ──────────────────────────────────────────────────────────────────

@app.get("/")
async def root():
    return {"status": "online", "service": "App Repair Platform", "version": "1.0.0"}

@app.get("/health")
async def health():
    return {"status": "healthy", "models": list(AI_MODELS.keys()), "timestamp": datetime.utcnow().isoformat()}

@app.post("/repair", response_model=RepairJob)
async def start_repair(request: RepairRequest, background_tasks: BackgroundTasks):
    """Kick off an AI repair job."""
    import uuid
    job_id = str(uuid.uuid4())[:8]
    job = {
        "job_id": job_id,
        "status": "queued",
        "repo": f"{request.repo_owner}/{request.repo_name}",
        "created_at": datetime.utcnow().isoformat(),
        "result": None,
    }
    active_jobs[job_id] = job
    background_tasks.add_task(analyze_and_repair, job_id, request)
    return job

@app.get("/repair/{job_id}")
async def get_repair_status(job_id: str):
    """Poll repair job status."""
    if job_id not in active_jobs:
        raise HTTPException(404, "Job not found")
    return active_jobs[job_id]

@app.get("/history")
async def get_history(limit: int = 50):
    """Get repair history."""
    return {"repairs": repair_history[-limit:], "total": len(repair_history)}

@app.get("/stats")
async def get_stats():
    """Platform statistics."""
    done = [j for j in repair_history if j.get("status") == "done"]
    failed = [j for j in repair_history if j.get("status") == "failed"]
    with_pr = [j for j in done if j.get("result", {}).get("pr_url")]
    return {
        "total_repairs": len(repair_history),
        "successful": len(done),
        "failed": len(failed),
        "prs_created": len(with_pr),
        "success_rate": round(len(done) / max(len(repair_history), 1) * 100, 1),
        "active_jobs": len([j for j in active_jobs.values() if j["status"] not in ("done", "failed")]),
    }

@app.get("/models")
async def list_models():
    """Available AI models."""
    return {
        "models": [
            {"id": "gpt4o", "name": "ChatGPT (GPT-4o)", "provider": "OpenAI via GitHub", "tier": "free"},
            {"id": "deepseek", "name": "DeepSeek-R1", "provider": "DeepSeek via GitHub", "tier": "free"},
            {"id": "llama", "name": "Llama 3.3 70B", "provider": "Meta via GitHub (Ollama-compatible)", "tier": "free"},
        ]
    }

# ─── GitHub Webhook Handler ───────────────────────────────────────────────────

def verify_webhook_signature(payload: bytes, signature: str, secret: str) -> bool:
    expected = "sha256=" + hmac.new(secret.encode(), payload, hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, signature)

@app.post("/webhook/github")
async def github_webhook(
    request: Request,
    background_tasks: BackgroundTasks,
    x_github_event: str = Header(None),
    x_hub_signature_256: str = Header(None),
):
    """Receive GitHub webhook events and auto-trigger repairs."""
    body = await request.body()

    # Verify signature if secret is configured
    if GITHUB_WEBHOOK_SECRET and x_hub_signature_256:
        if not verify_webhook_signature(body, x_hub_signature_256, GITHUB_WEBHOOK_SECRET):
            raise HTTPException(401, "Invalid webhook signature")

    payload = json.loads(body)
    repo = payload.get("repository", {})

    if x_github_event == "issues":
        action = payload.get("action")
        if action in ("opened", "reopened"):
            issue = payload.get("issue", {})
            # Auto-trigger repair for bug-labeled issues
            labels = [l["name"].lower() for l in issue.get("labels", [])]
            if "bug" in labels or "repair" in labels:
                repair_req = RepairRequest(
                    repo_owner=repo.get("owner", {}).get("login", ""),
                    repo_name=repo.get("name", ""),
                    issue_number=issue.get("number"),
                    error_description=f"{issue.get('title', '')}\n\n{issue.get('body', '')}",
                    model="gpt4o",
                )
                import uuid
                job_id = str(uuid.uuid4())[:8]
                active_jobs[job_id] = {
                    "job_id": job_id, "status": "queued",
                    "repo": f"{repair_req.repo_owner}/{repair_req.repo_name}",
                    "created_at": datetime.utcnow().isoformat(), "result": None,
                    "triggered_by": f"issue #{issue.get('number')}",
                }
                background_tasks.add_task(analyze_and_repair, job_id, repair_req)
                return {"message": f"Repair job {job_id} queued for issue #{issue.get('number')}"}

    return {"message": "Event received", "event": x_github_event}

# ─── Entry Point ─────────────────────────────────────────────────────────────

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=int(os.environ.get("PORT", 8000)), reload=False)
