import os
import ssl
from pathlib import Path
from typing import Any, Dict, List

import httpx
import urllib3
from fastapi import FastAPI, HTTPException, Request, status
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from google import genai
from httpx._transports.default import HTTPTransport
from pydantic import BaseModel
from settings import (
    GOOGLE_API_KEY,
    RAG_DOCS_DIR,
    RAG_MODEL,
    RAG_TOP_K,
)
from retriever import LocalInMemoryRetriever

BASE_DIR = Path(__file__).parent
templates = Jinja2Templates(directory=str(BASE_DIR / "templates"))

app = FastAPI()

retriever: LocalInMemoryRetriever | None = None
rag_client: genai.Client | None = None


class RagRequest(BaseModel):
    query: str
    top_k: int | None = None


# Optional TLS verification bypass (opt-in; prefer setting CA bundle instead)
if os.getenv("RAG_DISABLE_SSL_VERIFY", os.getenv("ASKHR_DISABLE_SSL_VERIFY", "false")).lower() in (
    "1",
    "true",
    "yes",
):
    _ssl_ctx = ssl.create_default_context()
    _ssl_ctx.check_hostname = False
    _ssl_ctx.verify_mode = ssl.CERT_NONE
    ssl._create_default_https_context = lambda: _ssl_ctx  # type: ignore

    urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
    os.environ["REQUESTS_CA_BUNDLE"] = ""
    os.environ["CURL_CA_BUNDLE"] = ""
    os.environ["SSL_NO_VERIFY"] = "1"

    _orig_httpx_init = HTTPTransport.__init__

    def _patched_httpx_init(self, *args, **kwargs):
        kwargs["verify"] = False
        return _orig_httpx_init(self, *args, **kwargs)

    HTTPTransport.__init__ = _patched_httpx_init  # type: ignore


@app.get("/", response_class=HTMLResponse)
async def index(request: Request):
    """Simple web form for RAG queries."""
    return templates.TemplateResponse("index.html", {"request": request})


@app.on_event("startup")
async def startup_event():
    global retriever, rag_client
    rag_client = genai.Client(api_key=GOOGLE_API_KEY)
    retriever = LocalInMemoryRetriever(RAG_DOCS_DIR)
    retriever.load()


@app.post("/ask_hr_rag")
async def ask_hr_rag(body: RagRequest) -> Dict[str, Any]:
    if not retriever or not rag_client:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Retriever not initialized")

    query = (body.query or "").strip()
    if not query:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Query is required")

    top_k = body.top_k or RAG_TOP_K
    chunks = retriever.retrieve(query, top_k=top_k)
    context = "\n\n".join([f"[{c.source}] {c.text}" for c in chunks])

    try:
        resp = rag_client.models.generate_content(
            model=RAG_MODEL,
            contents=[f"CONTEXT:\n{context}\n\nQUESTION:\n{query}"],
        )
        answer = getattr(resp, "text", None) or ""
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Generation failed: {e}")

    return {
        "query": query,
        "top_k": top_k,
        "hits": [
            {"id": c.id, "source": c.source, "start": c.start, "end": c.end, "text": c.text}
            for c in chunks
        ],
        "response": answer,
    }


@app.get("/health")
async def health() -> Dict[str, str]:
    return {"status": "ok", "docs_dir": str(RAG_DOCS_DIR), "chunks": len(retriever.chunks) if retriever else 0}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("server:app", host="127.0.0.1", port=5100, reload=False)
