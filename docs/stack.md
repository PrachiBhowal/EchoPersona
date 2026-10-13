# Stack Decisions

| Layer | Choice | Reason |
|---|---|---|
| **Backend** | Node.js + Express | Lightweight, fast to iterate, huge ecosystem; good fit for a thin API layer |
| **Embeddings** | OpenAI `text-embedding-3-small` | Best quality-to-cost ratio for short texts; isolated behind a single `embed()` function so it can be swapped for a local model (e.g. Ollama) later without touching the rest of the codebase |
| **LLM** | Claude — Haiku-class model | Low latency and cheap per-token cost; essential for a real-time autocomplete UX |
| **Vector search** | In-memory cosine similarity over a JSON file | Zero infra to set up for Week 1–4; a single module swap to pgvector in the scaling phase |
| **Extension** | Chrome Manifest V3, vanilla JS | MV3 is the current standard; vanilla JS avoids a build step while the extension is simple |
| **Gmail access** | Gmail API with OAuth 2.0, `gmail.readonly` scope only | Least-privilege — read-only access, no write or send permissions ever requested |
