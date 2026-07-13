# Setup Guide

Step-by-step instructions for setting up this project locally from scratch.

## Prerequisites

- Node.js installed
- A [Railway](https://railway.app) account (for PostgreSQL hosting)
- An [Anthropic](https://console.anthropic.com) API key

## Phase 1: Project Skeleton

### Initialize the project

```bash
npx create-react-router@latest ai-app-builder
```

> **Why not `npx remix@next new`?** Remix v2 was upstreamed into React Router. Remix v3 (currently in beta) is an entirely different framework that no longer uses React. React Router v7 is the continuation of Remix v2, which is what we want.

### Set up the database

1. Create a PostgreSQL instance in Railway
2. Copy the `DATABASE_PUBLIC_URL` from the Railway dashboard (use the public URL for local development; switch to the private `DATABASE_URL` when deploying to Railway)

### Install and configure Prisma

```bash
npm install prisma @prisma/client
npx prisma init
```

This creates `prisma/schema.prisma` and a `.env` file.

Add your connection string to `.env`:

```
DATABASE_URL="your DATABASE_PUBLIC_URL from Railway"
```

> **Important:** Make sure `.env` is in your `.gitignore` — it contains your database credentials.

Add the App model to `prisma/schema.prisma`:

```prisma
model App {
  id                String   @id @default(cuid())
  name              String
  description       String
  background        String
  workflow          String
  guardrails        String
  referenceMaterial String?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}
```

Run the migration and generate the client:

```bash
npx prisma migrate dev --name init
npx prisma generate
npm install @prisma/adapter-pg
```

> **Note:** Prisma 7.x changed two things from older versions. First, the generated client outputs to `./generated/prisma` instead of `@prisma/client`. Second, it requires an explicit database adapter instead of reading `DATABASE_URL` automatically.

### Create the core files

- `app/lib/db.server.ts` — Prisma singleton (the `.server` suffix ensures this never gets bundled into client code)
- `app/routes/build.tsx` — builder page (placeholder for now)
- `app/routes/app.$appId.tsx` — player page with a loader that fetches the app config by ID
- `app/routes/api.apps.ts` — API route for creating app records (POST)
- Update `app/routes.ts` to register all routes

### Verify

1. Start the dev server: `npm run dev`
2. Confirm `/build` renders
3. Create a test app via curl:

```bash
curl -X POST http://localhost:5173/api/apps \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test App",
    "description": "A friendly test app",
    "background": "You are a helpful assistant.",
    "workflow": "Greet the user and ask how you can help.",
    "guardrails": "Keep responses appropriate for students."
  }'
```

4. Visit `http://localhost:5173/app/RETURNED_ID` — you should see the raw app data

## Phase 2: Builder Flow

### Set up the Anthropic SDK

```bash
npm install @anthropic-ai/sdk
```

Add to `.env`:

```
ANTHROPIC_API_KEY="your-key-here"
```

### Create the generation endpoint

- `app/routes/api.generate.ts` — takes a natural language description, sends it to Claude with a meta-prompt, returns structured JSON with `name`, `background`, `workflow`, and `guardrails` fields
- Update `app/routes.ts` to include the new route

> **The meta-prompt is the most important piece of the project.** It instructs Claude to decompose an educator's description into structured fields, including default student safety guardrails. The quality of every generated app depends on this prompt.

### Update the builder UI

Update `app/routes/build.tsx` to handle three states:

1. **Describe** — text area where the educator types what they want
2. **Edit** — collapsible sections showing the generated Background, Workflow, Guardrails, and an optional Reference Material field
3. **Share** — displays the shareable URL with copy and preview buttons

### Verify

1. Navigate to `/build`
2. Type a description and click "Generate App"
3. Review the generated fields, edit if needed
4. Click "Save & Get Link"
5. Confirm the shareable URL loads the app data

## Phase 3: Chat Player

### Create the chat endpoint

- `app/routes/api.chat.ts` — loads the app config from the database, assembles the system prompt from Background + Workflow + Guardrails + Reference Material, proxies the conversation to Claude, and returns the response
- Update `app/routes.ts` to include the new route

### Update the player page

Replace `app/routes/app.$appId.tsx` with a full chat interface:

- Message list with user/assistant bubbles
- Text input fixed to the bottom
- Conversation history maintained in React state (ephemeral — resets on page refresh)
- Auto-scroll to latest message
- Loading indicator while waiting for a response

### Verify

Visit a shareable link and have a conversation. The AI should behave according to the configured prompt.

## Phase 4: Polish

### Render markdown in chat responses

```bash
npm install react-markdown
```

Use `<ReactMarkdown>` in the message content component so bold, lists, and headers render properly instead of showing raw markdown syntax.

### Additional improvements

- Shared CSS with CSS variables for consistent styling
- Collapsible sections in the prompt editor
- Loading/generating transition state in the builder
- Preview button opens in a new tab
- Copy-to-clipboard for shareable links
- Empty state in the chat player
- Mobile-friendly input area