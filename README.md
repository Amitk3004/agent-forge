# AgentForge - AI Chat

A streaming AI chat interface built with the **Vercel AI SDK v6**, **Next.js 14**, and **Tailwind CSS**. The model can search the web, fetch live weather, look up stock prices, and check timezones — each result rendered as a dedicated UI card directly in the chat. Conversation history persists across page refreshes.

---

## Features

### Chat experience
- **Streaming chat** — responses stream token-by-token using `useChat` from `@ai-sdk/react`
- **Conversation persistence** — chat history saved to `localStorage` and restored on refresh with no flicker
- **Branded header** — AgentForge logo, subtitle, and a clear chat button with tooltip
- **Clear chat** — one-click reset that wipes both the UI and localStorage
- **Guided empty state** — prompt chips covering all four tools shown only after localStorage is checked; no flicker
- **Scroll-to-bottom button** — centered floating `↓` button appears when scrolled up; auto-hides at bottom
- **Copy to clipboard** — hover any assistant message to reveal a one-click copy button with ✓ confirmation

### Tool calling
- **Tool calling** — the model autonomously decides when to call tools, executes them server-side, and continues with a grounded response (up to 5 steps via `stopWhen: stepCountIs(5)`)
- **Date-aware context** — today's date is injected into the system prompt; `getCurrentDateTime` provides exact timestamp as LLM context only, never shown in UI
- **Live status indicator** — shows which tool is running ("Searching the web…", "Fetching weather…") instead of a generic spinner
- **Always-fresh data** — `getWeather`, `getStockPrice`, and `getTimeZone` are instructed to always re-call the tool, never reuse a cached result from earlier in the conversation

### UI cards
- **Rich message rendering** — AI responses support full Markdown: headings, bold/italic, lists, code blocks, blockquotes, tables
- **WeatherCard** — live conditions with gradient theme, plus feels-like, humidity, wind speed/direction, and UV index
- **StockCard** — live price, change amount and %, open/high/low stats row
- **TimeZoneCard** — local time, date, timezone abbreviation and UTC offset; no API key needed
- **SearchCard** — Tavily results with domain source badges; shows 2 results by default with "Show X more" expand
- **Source attribution** — domain badge (e.g. `reuters.com`) on every search result link

### Architecture
- **Extensible** — adding a new tool requires one tools file entry, one card component, and one `case` in the dispatcher
- **Context-only tools** — tools that should never show UI (like `getCurrentDateTime`) return `null` in `ToolOutput.tsx`; result still reaches the LLM

---

## Tools

| Tool | Description | API Required |
|---|---|---|
| `webSearch` | Searches the internet via Tavily for up-to-date information | Tavily API key |
| `getWeather` | Fetches live weather from WeatherAPI.com; normalises ~70 condition strings to 12 card themes; returns feels-like, humidity, wind, UV | WeatherAPI key |
| `getStockPrice` | Fetches live stock quote from Alpha Vantage — price, change %, open/high/low | Alpha Vantage key |
| `getTimeZone` | Returns local time, date, and UTC offset for a city using Node's `Intl` API — 32-city lookup map | — |
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
| Stocks | Alpha Vantage |
| Persistence | Browser `localStorage` |
| Styling | Tailwind CSS v3 + `@tailwindcss/typography` |
| Markdown | `react-markdown` + `remark-gfm` |
| Validation | Zod |

---

## Project Structure

```
app/
├── page.tsx                    # Chat shell — persistence, scroll, clear chat
├── layout.tsx                  # Root layout
├── globals.css                 # Tailwind base styles
├── components/
│   ├── Header.tsx              # Branded header with clear chat button + tooltip
│   ├── MessageBubble.tsx       # Renders a single message (text + tool parts)
│   ├── StatusIndicator.tsx     # Live "Thinking / Searching…" indicator
│   ├── ToolOutput.tsx          # Dispatcher: toolName → card component
│   ├── WeatherCard.tsx         # Weather card with conditions + stats grid
│   ├── StockCard.tsx           # Stock price card with change indicator
│   ├── TimeZoneCard.tsx        # Timezone card — local time, date, UTC offset
│   ├── SearchCard.tsx          # Collapsible search results with source badges
│   └── SuggestedPrompts.tsx    # Empty-state prompt chips (shown after hydration)
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
ALPHA_VANTAGE_API_KEY=...
```

- **OpenAI key** — [platform.openai.com](https://platform.openai.com/api-keys)
- **Tavily key** — [app.tavily.com](https://app.tavily.com) (free tier available)
- **WeatherAPI key** — [weatherapi.com](https://www.weatherapi.com) (free tier available)
- **Alpha Vantage key** — [alphavantage.co](https://www.alphavantage.co/support/#api-key) (free tier: 25 req/day)

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
