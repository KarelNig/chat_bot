# CloudMix - AI-Messenger with Multi-Agent System

Modern chat interface combining classic messenger capabilities (user-to-user direct messages, group chats) and an advanced AI assistant built on top of a multi-agent architecture.

---

## AI Component Architecture

The project implements a centralized hub of specialized AI agents running on the official LangChain (TypeScript) SDK and the Google Gemini model family. Instead of relying on multiple external paid APIs, distinct behavioral personas are simulated via dynamic injection of system instructions (System Prompts).

### Available AI Agents

- **General Assistant** - Balanced helper for general tasks and well-structured, comprehensive answers.
- **Code Optimizer** - Software auditor. Returns strictly optimized code inside Markdown blocks along with a brief architectural impact analysis.
- **Text Editor** - Professional copywriter and editor. Fixes grammatical and stylistic errors, adjusts tone of voice, and generates concise summaries.
- **Creative Bot** - Creative agent with non-linear thinking, adapted for brainstorming, ideation, and informal casual dialogue.
- **Data Analyst** - Strict logical agent formatting analytical outputs into highly structured Markdown tables and mathematical lists.

### Failover Routing

To prevent API disruption due to rate limits or quota errors (HTTP 429), the backend message handler utilizes a sequential cascading fallback mechanism. If the primary model fails, the system automatically and seamlessly shifts the execution load to backup pools in the following order: `gemini-2.5-flash`, then `gemini-3.1-flash-lite`, and finally `gemini-3.5-flash`.

### Monitoring and LLMOps

Integrated with the LangSmith industrial platform. All execution traces (including response generation and background automatic thread renaming based on the first user message) are intercepted at the framework level via environment variables, allowing real-time monitoring of token consumption, latency, and prompt performance.

---

## Tech Stack

| Layer           | Technology                                                                      |
| --------------- | ------------------------------------------------------------------------------- |
| Frontend        | Next.js 16 (App Router, Turbopack), TypeScript 5, Tailwind CSS v4, Lucide Icons |
| AI / Backend    | Next.js Route Handlers, LangChain Core, LangChain Google GenAI SDK              |
| Database / BaaS | Supabase (PostgreSQL, Storage, Auth)                                            |
| Monitoring      | LangSmith                                                                       |
| Animation       | Framer Motion v12                                                               |
| Testing         | Vitest v4, Testing Library                                                      |
| Linting         | ESLint 9 flat config, typescript-eslint strict + type-checked rules             |
| Git hooks       | Husky, lint-staged                                                              |

---

## Architecture

```
src/
├── app/
│   ├── page.tsx                    # Main layout — auth guard, sidebar + chat panel
│   ├── login/page.tsx
│   ├── register/page.tsx
│   └── api/
│       ├── chat/route.ts           # AI chat handler — agent routing + Gemini failover
│       └── generate-title/route.ts # Background thread title generation
│
├── components/
│   ├── chat/
│   │   ├── chat-window.tsx         # Active thread header + messages + input
│   │   ├── message-bubble.tsx      # Animated bubble with "via Agent" badge
│   │   ├── message-input.tsx       # Textarea + AI agent selector (AI threads only)
│   │   ├── messages-area.tsx       # Scrollable list
│   │   └── typing-indicator.tsx
│   ├── sidebar/
│   │   ├── sidebar.tsx
│   │   ├── thread-item.tsx
│   │   └── user-search.tsx
│   └── modals/
│       ├── chat-info-modal.tsx
│       ├── self-profile-modal.tsx
│       └── create-group-modal.tsx
│
├── hooks/
│   └── use-chat.ts                 # Thread/message state, Supabase sync, bot scheduling
│
├── lib/
│   ├── ai-bot.ts                   # Client-side fetch wrapper for /api/chat
│   ├── gemini.ts                   # LangChain ChatGoogleGenerativeAI failover loop
│   ├── persona-cache.ts            # localStorage cache for agent role badges
│   ├── supabase.ts                 # Client init + isSupabaseConfigured flag
│   ├── supabase-api.ts             # Typed data-access layer
│   └── utils.ts
│
└── types/
    ├── ai-model.ts                 # AiModelId union, AiModelConfig, getModelConfig
    ├── chat.ts                     # Message, ChatThread types
    ├── database.ts                 # Supabase schema types
    └── profile.ts
```

---

## Key Design Decisions

**Agent selector visibility** - The AI agent hub button is rendered exclusively when the active thread is of type `ai`. It is completely absent from peer-to-peer and group message threads, keeping the input bar clean for human conversations.

**Agent persona persistence** - After a bot response is saved to Supabase, the agent role identifier is stored in `localStorage` keyed by message ID. On page reload, `fetchMessages` enriches each returned message with the cached role, restoring the "via Agent" badge without requiring a database schema change.

**Gemini failover** - `src/lib/gemini.ts` instantiates a fresh `ChatGoogleGenerativeAI` instance per model in the priority array and calls `model.invoke()`. LangSmith intercepts every `invoke` call automatically via the `LANGCHAIN_TRACING_V2` environment variable.

**`isSupabaseConfigured` flag** - Every Supabase call is gated behind this boolean. When credentials are absent the app runs entirely on in-memory mock data, making local development possible without a live database.

---

## Getting Started

1. Install project dependencies:

   ```bash
   npm install
   ```

2. Start the development server:

   ```bash
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Available Scripts

| Script                  | Description                         |
| ----------------------- | ----------------------------------- |
| `npm run dev`           | Development server (Turbopack)      |
| `npm run build`         | Production build + TypeScript check |
| `npm run start`         | Serve the production build locally  |
| `npm run lint`          | ESLint strict + type-checked rules  |
| `npm run type-check`    | `tsc --noEmit`                      |
| `npm test`              | Vitest single run                   |
| `npm run test:watch`    | Vitest watch mode                   |
| `npm run test:coverage` | Coverage report                     |
