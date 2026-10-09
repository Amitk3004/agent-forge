# AgentForge — Feature Roadmap

A living document tracking implemented and planned AI application patterns.  
The goal: demonstrate a production-grade agentic AI system covering the full spectrum — from basic streaming to safety, memory, and human oversight.

---

## Legend

| Symbol | Status |
|---|---|
| ✅ | Implemented |
| 🚧 | In progress |
| 📋 | Planned |

---

## ✅ Implemented

### Model Inference — Amazon Bedrock
- **Bedrock as the model provider** — migrated from OpenAI to `@ai-sdk/amazon-bedrock` (Converse API) in `ap-south-1`; Amazon Nova 2 Lite via the `global.` cross-region inference profile
- **Model allowlist** — `lib/models.ts` holds Bedrock IDs, per-model sampling ranges and quirks; the client sends only a model key
- **Model switcher** — dropdown in the settings bar; Claude Haiku 4.5 entry tested and kept (commented out)
- **Sampling controls** — temperature / top P / top K sliders with an on/off toggle per param (off = model default); top K sent in each family's own `additionalModelRequestFields` shape; mutually exclusive params enforced in UI and server
- **Conversation memory** — full history sent each turn (Bedrock is stateless), persisted in `localStorage`
- **Readable Bedrock errors** — real error messages surfaced in the chat
- **Tools feature flag** — `TOOLS_ENABLED` in `lib/features.ts` switches all tools off/on without deleting code

### Input Guardrails — Amazon Bedrock Guardrails
- **Pre-model input check** — newest user message screened with `ApplyGuardrail`; blocked requests never reach the model
- **Blocked / masked verdicts** — `GuardrailCard` shows the policies that fired; PII in *Mask* mode is anonymised before the model call
- **History sanitizing** — verdicts are recorded on each reply so later turns drop blocked messages and keep masked text masked
- **Fail closed** — a failing guardrail check stops the request
- **Tuning finding** — prompt-attack strength *High* blocks benign meta-prompts (MEDIUM confidence); *Low* blocks only HIGH-confidence attacks

### Core Chat
- **Streaming chat UI** — token-by-token streaming via `useChat` (`@ai-sdk/react`)
- **Rich Markdown rendering** — headings, bold/italic, code blocks, tables, blockquotes via `react-markdown` + `remark-gfm`
- **Live status indicator** — shows active tool name ("Searching the web…", "Fetching stock data…") instead of a generic spinner
- **Conversation persistence** — chat history saved to `localStorage` and restored on page refresh with no hydration flicker
- **Clear chat** — one-click reset that wipes both the UI and localStorage; button shown only when there is a conversation
- **Branded header** — AgentForge logo, subtitle, and clear chat button with tooltip
- **Guided empty state** — general-question prompts plus live-data prompts (when tools are on), shown only after localStorage check to prevent flicker
- **Scroll-to-bottom button** — centered floating `↓` button appears when scrolled up; auto-hides at bottom
- **Copy on hover** — Copy action with icon + label appears below any message (user or assistant) on hover, with a green "Copied" confirmation

### Tool Calling
- **Multi-step tool execution** — model calls tools, receives results, and continues generating (up to 5 steps via `stopWhen: stepCountIs`)
- **Date-aware context** — today's date injected into system prompt; `getCurrentDateTime` provides exact timestamp as LLM-only context
- **Always-fresh tool calls** — `getWeather`, `getStockPrice`, and `getTimeZone` are prompted to never reuse a cached result from earlier in the conversation
- **`webSearch`** — live internet search via Tavily API
- **`getWeather`** — live weather from WeatherAPI.com with condition-aware gradient card; shows feels-like, humidity, wind speed/direction, UV index
- **`getStockPrice`** — live stock quote from Alpha Vantage — price, change %, open/high/low stats row
- **`getTimeZone`** — local time, date, and UTC offset for a city via Node's `Intl` API; 32-city lookup map, no API key needed
- **`getCurrentDateTime`** — returns ISO date/time as LLM context only, never shown in UI

### UI Cards
- **WeatherCard** — condition-aware gradient with emoji icon + stats grid (feels-like, humidity, wind, UV)
- **StockCard** — price, green/red change indicator with ↑↓ arrows, open/high/low stats
- **TimeZoneCard** — indigo/purple gradient with local time, date, timezone abbreviation and UTC offset
- **SearchCard** — Tavily results with domain source badges; collapsible (shows 2 by default, expand to see all)
- **GuardrailCard** — red (blocked) / amber (masked) verdict with policy chips

### Streaming & Controls
- **Streaming abort** — Send button swaps to red Stop button during generation; calls `useChat.stop()` which aborts the fetch and closes the server stream cleanly

### Architecture
- **Per-tool UI cards** — each tool result renders as a dedicated typed component
- **Tool dispatcher pattern** — `ToolOutput.tsx` maps `toolName → card` in one place
- **Context-only tool pattern** — tools that inform the LLM but return `null` in UI (e.g. `getCurrentDateTime`)
- **Component-based layout** — `Header`, `MessageBubble`, `StatusIndicator`, `ToolOutput`, `SuggestedPrompts` are independent and composable

---

## 📋 Planned

### 🔜 Next up: RAG on Bedrock Knowledge Bases
The Knowledge Base is already created in AWS; the app side is next.

- **`searchKnowledgeBase` tool** — call the Knowledge Base `Retrieve` API (`@aws-sdk/client-bedrock-agent-runtime`) and return chunks with source metadata
- **Routing** — the model chooses between its own knowledge, `searchKnowledgeBase` (your documents) and `webSearch` (current events) via tool selection and system-prompt rules
- **Citations** — `DocSourcesCard` reusing `SourceBadge`, with sources cited in the answer
- **Document upload** — presigned S3 upload → `StartIngestionJob` → ingestion status in the UI
- **IAM** — add `bedrock:Retrieve` (and S3 / ingestion permissions for upload)

---

### 🔜 Near-term additions
Low-effort, high-impact features that fit naturally into the current architecture.

- **Error card component** — replace the bare red `<p>` on tool failures with a styled error card consistent with the rest of the UI
- **Currency converter tool** — convert between currencies using a free exchange rate API (no key needed); `CurrencyCard` component
- **Calculator tool** — evaluate math expressions server-side using `mathjs`; zero API cost
- **Keyboard shortcuts** — `Cmd+Enter` to send, `Esc` to cancel streaming; small UX gain for power users
- **Message timestamps** — subtle timestamp on each message bubble, visible on hover
- **Conversation export** — download chat as Markdown or JSON; pure client-side, no backend needed

---

### 🛡️ Guardrails
Input and output safety controls that prevent misuse and enforce response quality.

- ✅ **Input validation** — Bedrock Guardrails `ApplyGuardrail` on every user message (see Implemented)
- **Output filtering** — attach the guardrail to the model call (`providerOptions.bedrock.guardrailConfig`) or run `ApplyGuardrail` with `source: 'OUTPUT'` on responses
- **Contextual grounding check** — once RAG lands, flag answers not supported by retrieved documents
- **Topic scoping** — denied topics configured on the guardrail (e.g. personalised investment advice)
- **Rate limiting** — per-user request throttling (e.g. Upstash Ratelimit) before any public deploy

---

### 🧠 Memory
Giving the model awareness of past interactions and user context.

- **Short-term memory** — sliding window of recent messages with token-aware pruning *(full history is sent today)*
- **Long-term memory** — persist user preferences and key facts across sessions (DynamoDB / Postgres, or a per-user Knowledge Base namespace)
- **Memory UI** — display what the model "remembers" about the user in a side panel

---

### 💾 Checkpoints
Save and restore conversation state at any point.

- **Named conversation sessions** — save a conversation with a title and switch between multiple sessions *(localStorage persistence is already in place as the foundation)*
- **Resume from checkpoint** — reload a past conversation and continue where it left off
- **Branch conversations** — fork from any checkpoint and explore alternative paths
- **Checkpoint timeline UI** — visual history of saved states the user can jump to

---

### 🔐 Approval Gates (Human-in-the-Loop)
Require explicit human confirmation before the model takes sensitive actions.

- **Tool approval prompts** — before executing `webSearch` or any write operation, surface a confirmation card in the UI
- **Approval/deny UI** — user clicks Approve or Deny; model receives the decision and continues or aborts
- **Audit log** — record every approved/denied gate with timestamp and reason
- **Conditional gates** — only require approval for high-risk tool calls (configurable per tool)

---

### 🔁 Agent Loops
Autonomous multi-step reasoning where the model plans and executes sequences of actions.

- **ReAct-style loop** — model reasons, acts (calls tools), observes results, and reasons again
- **Task decomposition** — break a complex user goal into subtasks and execute them in order
- **Loop visualizer** — show each reasoning step and tool call in an expandable timeline
- **Abort / pause controls** — user can interrupt a running agent mid-loop

---

### 📊 Structured Output
Model returns typed, schema-validated JSON instead of free text for specific use cases.

- **Schema-bound responses** — use `generateObject` / `streamObject` with Zod schemas
- **Data cards** — render structured output (tables, charts, stats) rather than prose
- **Form auto-fill** — model extracts structured fields from unstructured user input

---

### 🖼️ Multi-modal Input
Allow users to send images alongside text.

- **Image upload** — attach images to messages via drag-and-drop or file picker (Nova and Claude on Bedrock accept image input)
- **Vision tool** — model describes, analyzes, or answers questions about uploaded images
- **Screenshot Q&A** — paste a screenshot and ask the model to explain or act on it

---

### 📈 Observability & Tracing
Understand what the model is doing and why.

- **Request tracing** — log every LLM call with model, tokens, latency, and finish reason (AI SDK telemetry → CloudWatch or Langfuse; Bedrock model invocation logging)
- **Per-reply stats** — model, sampling settings, latency and token counts shown under each answer
- **Guardrail audit log** — record every blocked / masked verdict with the policies that fired
- **Tool call audit trail** — timestamped record of every tool invoked and its result
- **Token usage dashboard** — track spend per session and across users
- **Error replay** — reproduce failed requests with the exact prompt and tool state

---

### ⚡ Performance & Cost
- ✅ **Model switching** — Bedrock model dropdown (see Implemented)
- **Side-by-side model comparison** — send one prompt to two model/settings combinations and compare answers, latency and tokens
- **Prompt caching** — Bedrock prompt caching for the system prompt and tool definitions (move the date out of the cached prefix)
- **Token-aware context pruning** — automatically trim old messages when context window approaches limit

---

### 🚀 Deployment (Vercel + AWS)
- **Vercel OIDC → AWS IAM role** — short-lived credentials instead of long-lived access keys in production
- **Least-privilege IAM** — scope `Resource` to the specific model, inference profile, guardrail and Knowledge Base ARNs
- **Pinned guardrail version** — use a numbered version (not `DRAFT`) in production
- **Auth** — sign-in (e.g. Auth.js) as the foundation for per-user rate limits, memory and documents

---

## Contribution to the Portfolio

Each planned feature represents a distinct production concern in AI application development:

| Feature | What it demonstrates |
|---|---|
| Bedrock inference | Cloud model hosting, multi-model abstraction, sampling parameters |
| Guardrails | Safety engineering and responsible AI |
| RAG | Retrieval over private documents with managed vector search |
| Memory | Stateful AI systems and vector search |
| Checkpoints | Persistence, serialization, state management |
| Approval Gates | Human-in-the-loop and agentic safety |
| Agent Loops | Autonomous multi-step reasoning |
| Structured Output | Type-safe AI and data extraction |
| Multi-modal | Vision models and file handling |
| Observability | Production monitoring and debugging |
| Performance | Cost optimization and latency tuning |
