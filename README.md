# EchoPersona

> A Chrome extension that suggests Gmail autocomplete text in the user's own writing style, learned from their sent emails.

---

## Status

**Week 1 — setup and Gmail access. Work in progress.**

---

## Problem

Gmail's Smart Compose is generic — it has no idea how *you* write. EchoPersona retrieves your most similar past sent emails and uses them as style examples, so every suggestion sounds like you.

---

## How It Works (Planned)

1. Fetch sent mail via Gmail API (read-only)
2. Clean and embed each email
3. On typing, retrieve the 3–5 most similar past emails
4. Send them plus the partial text to an LLM for a short continuation
5. Show as ghost text — press **Tab** to accept

---

## Architecture

> Diagram to come (Week 8)

---

## Stack

See [docs/stack.md](docs/stack.md) for the locked stack decisions and rationale.

---

## Setup

```bash
cd backend
cp ../.env.example .env      # then fill in your keys
npm install
npm run dev
```

---

## Privacy

> Placeholder — scopes requested, what is stored locally, and what is sent to the LLM will be documented here before any public release.

---

## Roadmap

- [x] **Week 1** — Setup + Gmail access
- [ ] **Week 2** — Clean the data
- [ ] **Week 3** — Embeddings + retrieval
- [ ] **Week 4** — LLM suggestion engine
- [ ] **Week 5** — Backend + extension start
- [ ] **Week 6** — Ghost text
- [ ] **Week 7** — Stabilize
- [ ] **Week 8** — Polish + ship
