# AgentForge - AI Chat

A streaming AI chat interface built with the **Vercel AI SDK v6**, **Next.js 14**, and **Tailwind CSS**. Demonstrates real-time tool calling — the model can search the web, fetch weather, and retrieve news headlines, with each result rendered as a dedicated UI card directly in the chat.

---

## Features

- **Streaming chat** — responses stream token-by-token using `useChat` from `@ai-sdk/react`
- **Tool calling** — the model autonomously decides when to call tools, executes them server-side, and continues with a grounded response (up to 5 steps via `stopWhen: stepCountIs(5)`)
- **Date-aware context** — today's date is injected into the system prompt and a hidden `getCurrentDateTime` tool lets the model confirm the exact timestamp before searching; the result is used as LLM context only and never shown in the UI
- **Live status indicator** — shows which tool is running ("Searching the web…", "Fetching weather…") instead of a generic spinner
- **Rich message rendering** — AI responses support full Markdown: headings, bold/italic, lists, code blocks, blockquotes, tables
- **Per-tool UI cards** — each tool result gets its own styled card component
- **Extensible architecture** — adding a new tool requires one tools file entry, one card component, and one `case` in the dispatcher

---

## Tools

| Tool | Description | API Required |
|---|---|---|
| `webSearch` | Searches the internet via Tavily for up-to-date information | Tavily API key |
| `getWeather` | Fetches live weather from WeatherAPI.com; normalises ~70 condition strings to 12 card themes | WeatherAPI key |
| `getCurrentDateTime` | Returns the current ISO date/time as LLM context — **never rendered in the UI** | — |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| AI SDK | Vercel AI SDK v6 (`ai`, `@ai-sdk/react`, `@ai-sdk/openai`) |
| Model | OpenAI `gpt-4o-mini` |
| Web Search | Tavily Search API |
| Weather | WeatherAPI.com |
| Styling | Tailwind CSS v3 + `@tailwindcss/typography` |
| Markdown | `react-markdown` + `remark-gfm` |
| Validation | Zod |

---

## Project Structure

```
app/
├── page.tsx                    # Chat shell — input, message list, status
├── layout.tsx                  # Root layout
├── globals.css                 # Tailwind base styles
├── components/
│   ├── MessageBubble.tsx       # Renders a single message (text + tool parts)
│   ├── StatusIndicator.tsx     # Live "Thinking / Searching…" indicator
│   ├── ToolOutput.tsx          # Dispatcher: toolName → card component
│   ├── WeatherCard.tsx         # Weather result card + gradient theming
│   └── SearchCard.tsx          # Web search results card
└── api/
    └── chat/
        ├── route.ts            # POST handler — streamText + tool registration
        └── tools.ts            # Tool definitions (schema + execute)
```

---

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Set environment variables

Create a `.env.local` file in the project root:

```env
OPENAI_API_KEY=sk-...
TAVILY_API_KEY=tvly-...
WEATHER_API_KEY=...
```

- **OpenAI key** — [platform.openai.com](https://platform.openai.com/api-keys)
- **Tavily key** — [app.tavily.com](https://app.tavily.com) (free tier available)
- **WeatherAPI key** — [weatherapi.com](https://www.weatherapi.com) (free tier available)

### 3. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Adding a New Tool

**1. Define the tool in** `app/api/chat/tools.ts`:

```ts
export const myTool = {
  description: 'What this tool does',
  inputSchema: z.object({ param: z.string() }),
  execute: async ({ param }) => {
    // call an API, return structured data
    return { param, result: '...' };
  },
};
```

**2. Register it in** `app/api/chat/route.ts`:

```ts
import { myTool } from './tools';

tools: { webSearch, getWeather, myTool },
```

**3. Create a card in** `app/components/MyToolCard.tsx` and add a `case` in `ToolOutput.tsx`:

```ts
case 'myTool': return <MyToolCard output={part.output as MyToolOutput} />;
```

The status indicator, streaming, and error handling are all automatic.

> **Context-only tools** — if a tool should inform the LLM but never show output to the user (like `getCurrentDateTime`), return `null` in its `ToolOutput.tsx` case. The result is still passed to the model as part of the conversation history.

---

## How Tool Calling Works

```
User message
     │
     ▼
streamText (gpt-4o-mini)
     │  decides to call a tool
     ▼
execute() runs server-side   ◄─── Tavily / weather API / etc.
     │  result injected into context
     ▼
streamText continues (step 2)
     │  generates grounded final answer
     ▼
UIMessageStreamResponse → useChat → MessageBubble renders parts
```

Each message from `useChat` is a `UIMessage` whose `parts` array contains interleaved `text` and `dynamic-tool` entries. `MessageBubble` iterates over parts and renders each type — plain text through the Markdown renderer, tool results through the appropriate card component.
