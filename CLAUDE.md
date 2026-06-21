# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Kairo is a self-contained RAG (Retrieval-Augmented Generation) system with an admin dashboard. It lets you ingest URLs and documents into a SQLite vector store, then query it via an LLM. The Go server also statically serves the Next.js SPA.

## Commands

### Client (Next.js — run from `client/`)
```bash
npm run dev        # Dev server on :3000
npm run build      # Static export to ./out/
npm run lint       # ESLint
```

### Server (Go — run from `server/`)
```bash
go build -o server .   # Compile binary
go run .               # Run without building
```

### Docker (run from repo root)`
```bash
docker-compose up      # Starts Go server + Redis, mounts SQLite db/
```

Environment variables:
- `API_KEY` — OpenRouter API key (required for embeddings + LLM)
- `ADMIN_KEY` — Admin auth header value
- `NEXT_PUBLIC_SERVER_URL` — Set in `client/.env.local` (default: `http://localhost:4242`)

## Architecture

### Request Flow

**RAG Query** (`POST /resolveQuery`):
1. Client sends question + chatId
2. Server fetches **all** chunks from SQLite and decodes embeddings from JSON BLOBs
3. Cosine similarity computed **in-memory** in Go to find top-K chunks
4. Top chunks passed as context to OpenRouter LLM
5. LLM response returned with answer

**Admin Ingest** (`POST /admin/embeddings/url` or `/admin/embeddings/text`):
1. URL → GoQuery scrapes HTML; file text sent directly from client (PDFs/Word/Excel parsed **in the browser** via pdfjs-dist/mammoth/xlsx)
2. Text split into chunks, each embedded via `text-embedding-3-large`
3. Chunks upserted into SQLite with `(source, chunk_index)` uniqueness constraint

### Key Design Decisions

- **In-memory vector search**: No vector DB. All chunks loaded from SQLite per query, similarity computed in Go. Does not scale beyond small knowledge bases.
- **Static SPA serving**: Go server serves `client/out/` as a static fallback. `next.config.ts` uses `output: "export"` with `trailingSlash: true`.
- **Single admin key auth**: No user system. `x-admin-key` header checked by `AdminAuth` middleware on all `/admin/*` routes. Key passed as URL query param on the frontend.
- **Chat not persisted**: Messages stored in Zustand only (lost on refresh). Previous messages are sent to LLM for context but not saved to DB.

### Directory Structure

| Path | Purpose |
|------|---------|
| `client/app/` | Next.js App Router pages |
| `client/app/admin/` | Admin panel pages (dashboard, ingest, chat, sources) |
| `client/app/lib/` | Axios API client + request/response types |
| `client/app/store/` | Zustand chat store |
| `client/app/context/` | QueryProvider, ThemeContext, ToastContext |
| `server/agent/` | OpenRouter API integration (embeddings + LLM calls) |
| `server/services/` | Business logic (EmbeddingsService, AdminService) |
| `server/controllers/` | HTTP handlers |
| `server/db/` | SQLite init + schema |
| `server/utils/` | Web scraping, cosine similarity, embedding encode/decode |
| `server/customMiddlewares/` | AdminAuth, CORS, logging |
| `server/structs/` | Shared data models |

### API Routes

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | `/resolveQuery` | None | RAG query |
| GET | `/health` | None | Health check |
| POST | `/admin/embeddings/url` | Admin key | Ingest URL |
| POST | `/admin/embeddings/text` | Admin key | Ingest raw text |
| GET | `/admin/data` | Admin key | List sources |
| DELETE | `/admin/source` | Admin key | Remove source |

### SQLite Schema

```sql
CREATE TABLE chunks (
  id          TEXT PRIMARY KEY,
  content     TEXT,
  embedding   BLOB,  -- JSON-encoded float32 slice (1536 dims)
  source      TEXT,
  chunk_index INTEGER,
  created_at  TIMESTAMP,
  UNIQUE(source, chunk_index)
);
```
