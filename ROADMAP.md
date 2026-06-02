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

### Core Chat
- **Streaming chat UI** — token-by-token streaming via `useChat` (`@ai-sdk/react`)
- **Rich Markdown rendering** — headings, bold/italic, code blocks, tables, blockquotes via `react-markdown` + `remark-gfm`
- **Live status indicator** — shows active tool name ("Searching the web…") instead of a generic spinner

### Tool Calling
- **Multi-step tool execution** — model calls tools, receives results, and continues generating (up to 3 steps via `stopWhen: stepCountIs`)
- **`webSearch`** — live internet search via Tavily API with sourced results card
- **`getWeather`** — weather lookup with condition-aware gradient card (sunny, rain, snow, storm…)
- **`getNews`** — news headlines per topic

### Architecture
- **Per-tool UI cards** — each tool result renders as a dedicated typed component
- **Tool dispatcher pattern** — `ToolOutput.tsx` maps `toolName → card` in one place
- **Component-based layout** — `MessageBubble`, `StatusIndicator`, `ToolOutput` are independent and composable

---

## 📋 Planned

### 🛡️ Guardrails
Input and output safety controls that prevent misuse and enforce response quality.

- **Input validation** — detect and block prompt injection, jailbreak attempts, and off-topic requests before they reach the model
- **Output filtering** — post-process model responses to redact PII, flag unsafe content, or enforce tone
- **Topic scoping** — constrain the model to a defined domain (e.g. only answer finance questions)
- **Rate limiting** — per-user request throttling to prevent abuse

---

### 🧠 Memory
Giving the model awareness of past interactions and user context.

- **Short-term memory** — sliding window of recent messages with token-aware pruning
- **Long-term memory** — persist user preferences and key facts across sessions (vector store or KV)
- **Semantic retrieval** — embed and retrieve relevant past context at query time (RAG-lite)
- **Memory UI** — display what the model "remembers" about the user in a side panel

---

### 💾 Checkpoints
Save and restore conversation state at any point.

- **Conversation snapshots** — serialize full message history + tool results to persistent storage
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

- **Image upload** — attach images to messages via drag-and-drop or file picker
- **Vision tool** — model describes, analyzes, or answers questions about uploaded images
- **Screenshot Q&A** — paste a screenshot and ask the model to explain or act on it

---

### 📈 Observability & Tracing
Understand what the model is doing and why.

- **Request tracing** — log every LLM call with model, tokens, latency, and finish reason
- **Tool call audit trail** — timestamped record of every tool invoked and its result
- **Token usage dashboard** — track spend per session and across users
- **Error replay** — reproduce failed requests with the exact prompt and tool state

---

### ⚡ Performance & Cost
- **Prompt caching** — cache repeated system prompts and context prefixes (Anthropic / OpenAI)
- **Model switching** — toggle between models (GPT-4o-mini, GPT-4o, Claude) per conversation
- **Streaming abort** — cancel an in-flight generation without waiting for completion

---

## Contribution to the Portfolio

Each planned feature represents a distinct production concern in AI application development:

| Feature | What it demonstrates |
|---|---|
| Guardrails | Safety engineering and responsible AI |
| Memory | Stateful AI systems and vector search |
| Checkpoints | Persistence, serialization, state management |
| Approval Gates | Human-in-the-loop and agentic safety |
| Agent Loops | Autonomous multi-step reasoning |
| Structured Output | Type-safe AI and data extraction |
| Multi-modal | Vision models and file handling |
| Observability | Production monitoring and debugging |
| Performance | Cost optimization and latency tuning |
