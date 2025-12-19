import os
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).parent

# Path to documents for RAG; default to shared data folder
RAG_DOCS_DIR = Path(os.getenv("RAG_DOCS_DIR", r"C:\GitHub\data\ask_hr_rag_docs"))

# Model settings
RAG_MODEL = os.getenv("RAG_MODEL", "gemini-2.0-flash-exp")
RAG_TOP_K = int(os.getenv("RAG_TOP_K", "5"))
RAG_CHUNK_SIZE = int(os.getenv("RAG_CHUNK_SIZE", "800"))
RAG_CHUNK_OVERLAP = int(os.getenv("RAG_CHUNK_OVERLAP", "200"))

# API key
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
if not GOOGLE_API_KEY:
    raise ValueError("GOOGLE_API_KEY is required for embeddings and generation.")
