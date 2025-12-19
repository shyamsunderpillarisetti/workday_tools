import math
from dataclasses import dataclass
from pathlib import Path
from typing import List, Tuple

from google import genai

from settings import (
    GOOGLE_API_KEY,
    RAG_CHUNK_OVERLAP,
    RAG_CHUNK_SIZE,
    RAG_DOCS_DIR,
)


@dataclass
class Chunk:
    id: str
    text: str
    source: str
    start: int
    end: int
    embedding: np.ndarray


class LocalInMemoryRetriever:
    """Simple in-memory retriever with Gemini embeddings."""

    def __init__(self, docs_dir: Path | str):
        self.docs_dir = Path(docs_dir)
        self.client = genai.Client(api_key=GOOGLE_API_KEY)
        self.chunks: List[Chunk] = []

    def load(self) -> None:
        if not self.docs_dir.exists():
            return
        files = list(self.docs_dir.glob("**/*"))
        text_files = [f for f in files if f.suffix.lower() in {".txt", ".md"} and f.is_file()]
        for path in text_files:
            content = path.read_text(encoding="utf-8", errors="ignore")
            for idx, (start, end, text) in enumerate(self._chunk_text_words(content)):
                emb = self._embed(text)
                chunk_id = f"{path.stem}-{idx}"
                self.chunks.append(
                    Chunk(
                        id=chunk_id,
                        text=text,
                        source=str(path),
                        start=start,
                        end=end,
                        embedding=emb,
                    )
                )

    def _chunk_text_words(self, text: str) -> List[Tuple[int, int, str]]:
        words = text.split()
        size = max(RAG_CHUNK_SIZE, 1)
        overlap = max(min(RAG_CHUNK_OVERLAP, size - 1), 0)
        chunks = []
        i = 0
        while i < len(words):
            window = words[i : i + size]
            chunk_text = " ".join(window)
            chunks.append((i, i + len(window), chunk_text))
            if i + size >= len(words):
                break
            i += size - overlap
        return chunks

    def _embed(self, text: str) -> list[float]:
        res = self.client.models.embed_content(
            model="text-embedding-004",
            content=text,
        )
        return list(res.embeddings[0].values)

    def retrieve(self, query: str, top_k: int = 5) -> List[Chunk]:
        if not self.chunks:
            return []
        query_emb = self._embed(query)
        scored = sorted(
            ((self._cosine_similarity(query_emb, c.embedding), c) for c in self.chunks),
            key=lambda x: x[0],
            reverse=True,
        )
        return [c for _, c in scored[:top_k]]

    @staticmethod
    def _cosine_similarity(a: List[float], b: List[float]) -> float:
        if not a or not b or len(a) != len(b):
            return 0.0
        dot = sum(x * y for x, y in zip(a, b))
        norm_a = math.sqrt(sum(x * x for x in a)) or 1e-8
        norm_b = math.sqrt(sum(y * y for y in b)) or 1e-8
        return float(dot / (norm_a * norm_b))
