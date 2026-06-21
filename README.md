# Kairo

A self-contained RAG (Retrieval-Augmented Generation) system with an admin dashboard. Ingest URLs and documents into a SQLite vector store, then query it via an LLM. The Go server statically serves the Next.js SPA.

## Stack

| Layer | Tech |
|---|---|
| Backend | Go 1.25, Gorilla Mux, Chi middleware |
| Frontend | Next.js 16, React 19, Zustand, TanStack Query |
| Database | SQLite (via `go-sqlite3`) |
| Cache | Redis |
| Embeddings / LLM | OpenRouter (`text-embedding-3-large`) |
| Web scraping | GoQuery |
| Doc parsing | pdfjs-dist, mammoth, xlsx (browser-side) |

## How It Works

**RAG Query** (`POST /resolveQuery`):
1. Client sends a question + chat ID
2. Server loads all chunks from SQLite and decodes their embeddings
3. Cosine similarity computed in-memory to find top-K chunks
4. Top chunks passed as context to the LLM via OpenRouter
5. LLM response returned to client

**Admin Ingest** (`POST /admin/embeddings/url` or `/admin/embeddings/text`):
1. URLs are scraped via GoQuery; PDFs/Word/Excel files are parsed in the browser
2. Text is split into chunks and embedded via `text-embedding-3-large`
3. Chunks are upserted into SQLite with a `(source, chunk_index)` uniqueness constraint

> Chat history is stored in Zustand only — it is not persisted to the database.

## API Routes

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/resolveQuery` | None | RAG query |
| GET | `/health` | None | Health check |
| POST | `/admin/embeddings/url` | Admin key | Ingest a URL |
| POST | `/admin/embeddings/text` | Admin key | Ingest raw text / file |
| GET | `/admin/data` | Admin key | List all sources |
| DELETE | `/admin/source` | Admin key | Remove a source |

## Environment Variables

| Variable | Description |
|---|---|
| `API_KEY` | OpenRouter API key (required for embeddings + LLM) |
| `ADMIN_KEY` | Value expected in the `x-admin-key` header |
| `REDIS_ADDR` | Redis address (default: `localhost:6379`) |
| `NEXT_PUBLIC_SERVER_URL` | Set in `client/.env.local` (default: `http://localhost:4242`) |

## Running

### Docker (recommended)

```bash
# Copy and edit the sample compose file with your keys
cp docker-compose.yml.sample docker-compose.yml

docker-compose up
```

The server is available at `http://localhost:4242`.

### Manual

**Server** (Go):
```bash
cd server
go run .
```

**Client** (Next.js — dev mode):
```bash
cd client
npm install
npm run dev        # http://localhost:3000
```

**Client** (static build, served by Go):
```bash
cd client
npm run build      # exports to client/out/
# Copy out/ to server/out/ or adjust outDir in server/main.go
```

## Project Structure

```
kairo/
├── client/
│   ├── app/
│   │   ├── admin/          # Admin panel pages (dashboard, ingest, chat, sources)
│   │   ├── lib/            # Axios API client + types
│   │   ├── store/          # Zustand chat store
│   │   └── context/        # QueryProvider, ThemeContext, ToastContext
│   └── public/
├── server/
│   ├── agent/              # OpenRouter API integration
│   ├── controllers/        # HTTP handlers
│   ├── services/           # Business logic
│   ├── db/                 # SQLite init + schema
│   ├── utils/              # Web scraping, cosine similarity, embedding encode/decode
│   ├── customMiddlewares/  # AdminAuth, CORS, logging
│   ├── structs/            # Shared data models
│   └── main.go
└── docker-compose.yml
```

## SQLite Schema

```sql
CREATE TABLE chunks (
  id          TEXT PRIMARY KEY,
  content     TEXT,
  embedding   BLOB,       -- JSON-encoded float32 slice (1536 dims)
  source      TEXT,
  chunk_index INTEGER,
  created_at  TIMESTAMP,
  UNIQUE(source, chunk_index)
);
```
# KAIRO-the-chatbot
