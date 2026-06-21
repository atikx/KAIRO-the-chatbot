export interface Source {
  id: string;
  url: string;
  title: string;
  chunks: number;
  addedAt: string;
  status: "indexed" | "processing" | "error";
  favicon: string;
}

// Sample data — replace with real API calls when server supports listing sources
export const sampleSources: Source[] = [
  {
    id: "src-001",
    url: "https://nextjs.org/docs/app/building-your-application/routing",
    title: "Next.js App Router Docs",
    chunks: 142,
    addedAt: "2026-03-17T08:21:00Z",
    status: "indexed",
    favicon: "📄",
  },
  {
    id: "src-002",
    url: "https://go.dev/doc/effective_go",
    title: "Effective Go",
    chunks: 98,
    addedAt: "2026-03-16T14:05:00Z",
    status: "indexed",
    favicon: "🐹",
  },
  {
    id: "src-003",
    url: "https://platform.openai.com/docs/guides/embeddings",
    title: "OpenAI Embeddings Guide",
    chunks: 63,
    addedAt: "2026-03-15T10:44:00Z",
    status: "indexed",
    favicon: "🤖",
  },
  {
    id: "src-004",
    url: "https://www.sqlite.org/vectorio.html",
    title: "SQLite Vector I/O",
    chunks: 31,
    addedAt: "2026-03-14T19:30:00Z",
    status: "indexed",
    favicon: "🗄️",
  },
  {
    id: "src-005",
    url: "https://github.com/gorilla/mux",
    title: "Gorilla Mux README",
    chunks: 22,
    addedAt: "2026-03-13T09:15:00Z",
    status: "indexed",
    favicon: "🦍",
  },
];
