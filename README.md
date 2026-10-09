# AgentForge - AI Chat

A streaming AI chat app built with **Next.js 14**, the **Vercel AI SDK v6**, and **Amazon Bedrock**. Model inference runs on Bedrock (Amazon Nova 2 Lite by default, with a switchable model list), every user message is screened by **Amazon Bedrock Guardrails** before it reaches the model, and the model can call tools — web search, live weather, stock prices, timezones — with each result rendered as a dedicated UI card.

---

## Features

### Model inference on Amazon Bedrock
- **Bedrock via the AI SDK** — `@ai-sdk/amazon-bedrock` calls the Bedrock Converse API; the rest of the app (`streamText`, `useChat`, tool calling) is provider-agnostic
- **Model switcher** — pick a model from a dropdown; the server only accepts keys from an allowlist in `lib/models.ts`, never raw model IDs
- **Sampling controls** — temperature, top P and top K sliders per model. Each can be switched off so the model's own default is used. Ranges and model quirks are defined per model (e.g. top K is sent in each model family's own request field; Claude Haiku 4.5 accepts temperature *or* top P, not both)
- **Conversation memory** — Bedrock is stateless; the full chat history is sent each turn and persisted in `localStorage`
- **Readable errors** — Bedrock errors (unsupported parameter, missing model access) are surfaced in the chat instead of a generic failure

### Input guardrails (Amazon Bedrock Guardrails)
- **Checked before the model runs** — the newest user message is sent to the `ApplyGuardrail` API; a blocked request never calls the model, so no model tokens are spent
- **Prompt-attack, content, topic, word and PII policies** — whatever is configured on the guardrail in the AWS console applies
- **Blocked vs. masked** — a blocked message gets a red "Blocked by guardrail" card naming the policy that fired; PII set to *Mask* is replaced with the anonymised text before the model sees it, with an amber notice
- **History-safe** — only the newest message is checked, and each reply records the verdict, so on later turns blocked messages are dropped from the history and masked text stays masked
- **Fails closed** — if the guardrail check itself fails (wrong ID, missing IAM permission), the model is not called

### Tool calling
- **Multi-step tools** — the model decides when to call tools, executes them server-side, and continues with a grounded answer (up to 5 steps)
- **Feature flag** — `lib/features.ts` turns all tools on or off without removing any code
- **Date-aware context** — today's date is injected into the system prompt; `getCurrentDateTime` is LLM-only context, never shown in the UI
- **Live status indicator** — shows which tool is running ("Searching the web…") instead of a generic spinner

### Chat experience
- **Streaming responses** with a Stop button that aborts generation
- **Rich Markdown** — headings, lists, code blocks, tables, blockquotes
- **Copy on hover** — Copy button appears under any message on hover, with a "Copied" confirmation
- **Suggested prompts** — general questions plus live-data prompts when tools are enabled
- **Clear chat** — shown only when there is a conversation
- **Scroll-to-bottom button** when scrolled up

### UI cards
- **WeatherCard**, **StockCard**, **TimeZoneCard**, **SearchCard** (collapsible, with source badges)
- **GuardrailCard** — blocked / masked verdict with the policies that fired

---

## Tools

| Tool | Description | API Required |
|---|---|---|
| `webSearch` | Searches the internet via Tavily for up-to-date information | Tavily API key |
| `getWeather` | Live weather from WeatherAPI.com — feels-like, humidity, wind, UV | WeatherAPI key |
| `getStockPrice` | Live stock quote from Alpha Vantage — price, change %, open/high/low | Alpha Vantage key |
| `getTimeZone` | Local time, date, and UTC offset for a city via Node's `Intl` API | — |
| `getCurrentDateTime` | Current ISO date/time as LLM context — **never rendered in the UI** | — |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router), hosted on Vercel |
| AI SDK | Vercel AI SDK v6 (`ai`, `@ai-sdk/react`, `@ai-sdk/amazon-bedrock`) |
| Model inference | Amazon Bedrock — Amazon Nova 2 Lite (default); Claude Haiku 4.5 entry ready in `lib/models.ts` (commented out) |
| Guardrails | Amazon Bedrock Guardrails via `@aws-sdk/client-bedrock-runtime` (`ApplyGuardrail`) |
| Web search | Tavily Search API |
| Weather / Stocks | WeatherAPI.com / Alpha Vantage |
| Persistence | Browser `localStorage` |
| Styling | Tailwind CSS v3 + `@tailwindcss/typography`, `lucide-react` icons |
| Markdown | `react-markdown` + `remark-gfm` |
| Validation | Zod |

---

## Architecture

```
Browser (useChat)
   │  messages + modelKey + sampling settings
   ▼
POST /api/chat  (Next.js route on Vercel)
   │
   ├─ 1. sanitizeHistory   drop previously blocked turns, keep masked text masked
   │
   ├─ 2. ApplyGuardrail    newest user message ──► Bedrock Guardrails
   │        ├─ blocked → stream a GuardrailCard, stop (no model call)
   │        └─ masked  → replace text with anonymised version
   │
   ├─ 3. streamText        Bedrock Converse ──► Nova 2 Lite / Claude Haiku 4.5
   │        └─ tool calls  Tavily / WeatherAPI / Alpha Vantage (when enabled)
   │
   ▼
UI message stream → MessageBubble renders text, tool cards, guardrail cards
```

No separate backend is needed: the Next.js route handler is the server, and Bedrock and Guardrails are managed AWS services.

---

## Project Structure

```
lib/
├── models.ts                   # Model allowlist: Bedrock IDs, sampling ranges, top-K field
├── features.ts                 # TOOLS_ENABLED flag
├── guardrail.ts                # ApplyGuardrail call + verdict parsing (server only)
└── guardrail-types.ts          # Verdict types shared by route and UI
app/
├── page.tsx                    # Chat shell — persistence, model/settings state, scroll
├── components/
│   ├── Header.tsx              # Branded header; clear button when chat is non-empty
│   ├── SettingsPanel.tsx       # Model dropdown + temperature / top P / top K sliders
│   ├── MessageBubble.tsx       # Text, tool and guardrail parts; hover Copy action
│   ├── GuardrailCard.tsx       # Blocked / masked verdict card
│   ├── StatusIndicator.tsx     # Live "Thinking / Searching…" indicator
│   ├── ToolOutput.tsx          # Dispatcher: toolName → card component
│   ├── WeatherCard.tsx, StockCard.tsx, TimeZoneCard.tsx, SearchCard.tsx
│   └── SuggestedPrompts.tsx    # Empty-state prompt chips
└── api/chat/
    ├── route.ts                # Guardrail check → streamText on Bedrock
    └── tools.ts                # Tool definitions (schema + execute)
```

---

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Set up AWS

All in the **same region** (this project uses `ap-south-1`):

1. **Model access** — in the Bedrock console, enable access to Amazon Nova 2 Lite (and Claude Haiku 4.5 if you want it; Anthropic models need a one-time use-case form).
2. **IAM user for local development** — create a dedicated IAM user, create an access key with the *Local code* use case, and attach a policy like:

   ```json
   {
     "Version": "2012-10-17",
     "Statement": [{
       "Effect": "Allow",
       "Action": [
         "bedrock:InvokeModel",
         "bedrock:InvokeModelWithResponseStream",
         "bedrock:ApplyGuardrail"
       ],
       "Resource": "*"
     }]
   }
   ```

3. **Guardrail** — Bedrock → Guardrails → *Create guardrail*. Recommended starting point:
   - **Prompt attacks: Low.** *High* also blocks harmless prompts like "Repeat this back exactly…", which get a MEDIUM-confidence attack rating.
   - Content filters (hate, insults, sexual, violence, misconduct), optional denied topics, profanity filter, PII *Block* or *Mask*.
   - Create a **version** and note the guardrail **ID** (e.g. `a1b2c3d4e5f6`) and **version** (e.g. `1`; `DRAFT` uses the working draft while tuning).

### 3. Set environment variables

Copy `.env.example` to `.env.local` and fill in:

```env
# Amazon Bedrock
AWS_REGION=ap-south-1
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...

# Bedrock Guardrails (input checks are skipped if either is unset)
BEDROCK_GUARDRAIL_ID=...
BEDROCK_GUARDRAIL_VERSION=1

# Tools
TAVILY_API_KEY=tvly-...
WEATHER_API_KEY=...
ALPHA_VANTAGE_API_KEY=...
```

- **Tavily** — [app.tavily.com](https://app.tavily.com) (free tier)
- **WeatherAPI** — [weatherapi.com](https://www.weatherapi.com) (free tier)
- **Alpha Vantage** — [alphavantage.co](https://www.alphavantage.co/support/#api-key) (free tier: 25 req/day)

### 4. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Restart the dev server after changing `.env.local`.

---

## Adding a Model

Add an entry to `MODELS` in `lib/models.ts` — it appears in the dropdown automatically:

```ts
{
  key: 'claude-haiku-4.5',
  label: 'Claude Haiku 4.5',
  bedrockId: 'global.anthropic.claude-haiku-4-5-20251001-v1:0', // copy from the Bedrock console
  topKField: 'anthropic',                   // 'nova' | 'anthropic' | null
  exclusiveParams: ['temperature', 'topP'], // params the model refuses together
  params: {
    temperature: { min: 0, max: 1, step: 0.05, default: 1 },
    topP: { min: 0, max: 1, step: 0.05, default: 0.99 },
    topK: { min: 1, max: 500, step: 1, default: 50 },
  },
},
```

Use the cross-region inference profile ID (`global.` / `apac.` prefix) from the Bedrock console if the plain model ID fails with *"on-demand throughput isn't supported"*.

---

## Adding a Tool

1. Define it in `app/api/chat/tools.ts` (description, Zod `inputSchema`, `execute`).
2. Register it in the `tools` object in `app/api/chat/route.ts`.
3. Create a card in `app/components/` and add a `case` in `ToolOutput.tsx`.

Return `null` from its `ToolOutput.tsx` case for context-only tools (like `getCurrentDateTime`) — the result still reaches the model.
