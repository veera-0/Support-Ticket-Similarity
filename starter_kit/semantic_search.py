# pip install sentence-transformers numpy
import numpy as np
from sentence_transformers import SentenceTransformer

class SemanticSearch:
    def __init__(self, model_name="all-MiniLM-L6-v2"):
        self.model = SentenceTransformer(model_name)
        self.docs = []
        self.vectors = None  # shape: (n_docs, 384)

    def index_documents(self, docs):
        """docs: list of dicts, each with at least a 'text' key."""
        self.docs = docs
        self.vectors = self.model.encode(
            [d["text"] for d in docs],
            normalize_embeddings=True,   # unit-length vectors
            batch_size=32,
            show_progress_bar=True,
        )
        return self

    def search(self, query, top_k=5):
        q = self.model.encode(query, normalize_embeddings=True)
        scores = self.vectors @ q        # dot product = cosine similarity
        top = np.argsort(-scores)[:top_k]
        return [{**self.docs[i], "score": float(scores[i])} for i in top]

    def save(self, path="index.npz"):
        np.savez(path, vectors=self.vectors)

    def load(self, docs, path="index.npz"):
        self.docs = docs
        self.vectors = np.load(path)["vectors"]
        return self


# Usage
docs = [
    {"id": 1, "title": "Economy Delivery", "text": "Our budget shipping option takes 5-7 business days."},
    {"id": 2, "title": "Returns", "text": "You can send an item back within 30 days for a refund."},
    {"id": 3, "title": "Password Reset", "text": "Use the forgot password link to regain account access."},
]


engine = SemanticSearch().index_documents(docs)
for r in engine.search("cheap shipping option", top_k=2):
    print(f"{r['score']:.2f}  {r['title']}")