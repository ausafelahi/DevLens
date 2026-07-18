# DevLens AI — Phase 0

Foundation: auth, DB, GitHub import, AI provider abstraction (interfaces only — no
embedding/chat logic yet, that's Phase 1).

## Setup

1. `npm install`
2. Copy `.env.example` → `.env.local`, fill in:
   - Clerk keys (clerk.com — free tier)
   - `DATABASE_URL` from Neon or Supabase (enable the `vector` extension after creating the DB:
     `CREATE EXTENSION IF NOT EXISTS vector;`)
   - `GITHUB_TOKEN` — a GitHub personal access token (repo:read scope is enough for public repos)
   - Leave `HUGGINGFACE_API_KEY` / `OPENROUTER_API_KEY` blank for now — Phase 1 uses them
3. `npm run db:push` — creates the `repositories`, `chunks`, `chat_messages` tables
4. `npm run dev`

## What Phase 0 proves

- A signed-in user can POST a GitHub URL to `/api/repos` and it gets stored with metadata
- `GET /api/repos` lists their imported repos
- The AI provider interfaces exist and compile, but have no wired UI yet

## What's deliberately NOT here yet

- No file chunking/embedding (Phase 1)
- No chat UI (Phase 1)
- No background job wiring for indexing (Phase 1 — needed once repos are non-trivial size)

## Architecture

See `devlens-ai-architecture.md` (shared separately) for the full layer/module
reference. Rule to keep in mind while building: `app/` and `components/` never
import from `infrastructure/` directly — always through `modules/`.
