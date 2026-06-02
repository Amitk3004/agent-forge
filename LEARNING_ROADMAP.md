# AgentForge — Personal Learning Roadmap
### Frontend Lead → AI Engineer Transition

> This is a personal study guide tied directly to the AgentForge project.
> Every concept has a matching thing to build here — no abstract learning without shipping.
> Work through phases in order. Each phase builds on the previous one.

---

## How to Use This Document

- **Read the concept** — understand the why before the how
- **Build it in AgentForge** — every phase has a concrete task in this codebase
- **Check the exit criteria** — only move on when you can answer the questions confidently
- Each phase has an estimated duration assuming ~1–2 focused hours per day

---

## External Dependencies — Full Roadmap View

Most of this roadmap runs on the **Vercel AI SDK alone**. Only 3 external services are needed across all 9 phases, and every one has a free tier.

| Service | Used In | Why SDK Can't Do It | Free Tier |
|---|---|---|---|
| **Upstash Vector** | Phase 2 — RAG & Memory | SDK generates embeddings but has no vector storage or similarity search | ✅ 10k vectors free |
| **Upstash Redis** | Phase 3.4 — Rate Limiting | SDK has no concept of users, quotas, or request counting | ✅ 10k commands/day free |
| **Langfuse** | Phase 6.2 — Observability | SDK emits telemetry events but has no dashboard to visualise them | ✅ Generous free tier |

> **OpenAI Fine-tuning API** (Phase 6.4) is listed as conceptual-only — you learn the trade-offs and run one example, but it is not a required implementation and costs money per training run.

Everything else — streaming, tool calling, approval gates, checkpoints, guardrails, evals, multi-modal, structured output, agent loops — is **100% Vercel AI SDK + plain TypeScript/React**. No external service, no additional account.

Each phase below is annotated with `🔒 SDK only` or `🔧 Needs: [service]` so you always know what you're signing up for before you start.

---

## Your Starting Advantage

You are not starting from zero. As a Frontend Lead you already have:

- ✅ TypeScript — the primary language for the Vercel AI SDK
- ✅ React — `useChat` is just a hook, UI composition is your strength
- ✅ Async patterns — streaming, promises, event handling
- ✅ Component architecture — tool cards, message bubbles are natural to you
- ✅ UX instincts — knowing how AI responses should *feel* to a user

The gaps are in **AI-specific concepts**, not in engineering ability.

---

---

# PHASE 0 — How LLMs Actually Work
### Duration: 1 week | No code required | 🔒 SDK only

Before writing a single line, you need the right mental model. Most "AI engineers" skip this and end up treating the model as a black box they can't reason about.

---

### What to Learn

**Tokens, not words**
- LLMs don't read words — they read *tokens* (roughly 0.75 words each)
- "context window" = the maximum tokens the model can see at once
- GPT-4o: 128k tokens. Claude: 200k tokens. This determines what fits in memory.
- Why it matters: every architectural decision (RAG, summarisation, pruning) is ultimately about fitting within this window

**How generation works**
- The model predicts the *next most likely token* given everything before it
- It doesn't "know" things — it predicts plausible continuations based on training
- Temperature = how random the sampling is (0 = deterministic, 1 = creative, >1 = chaotic)
- This is why the same prompt gives different answers — it's probabilistic by design

**The chat format**
- LLMs are just text-in, text-out. The "chat" format is a convention:
  `[system prompt] → [user turn] → [assistant turn] → [user turn] → ...`
- The entire conversation history is sent on every request — there is no "memory" at the API level
- This is why token count grows with every message

**What a system prompt actually is**
- The first message the model reads, written by you (not the user)
- Sets persona, constraints, output format, tools available
- The most powerful lever you have before writing any code

**Tool calling under the hood**
- The model doesn't "call" anything — it outputs structured JSON describing a function call
- The SDK intercepts that JSON, runs your `execute` function, and feeds the result back
- The model then reads the result and generates the next response
- This is already working in AgentForge — now you understand why

---

### Concepts to Know by Name

| Term | One-line definition |
|---|---|
| Token | The atomic unit of text an LLM processes |
| Context window | Maximum tokens the model can see in one call |
| Temperature | Controls randomness of output sampling |
| System prompt | Developer-controlled instructions prepended to every conversation |
| Completion | A single model response (one full generation) |
| Hallucination | Model generates plausible-sounding but false information |
| Grounding | Giving the model factual context so it doesn't hallucinate |
| Latency vs throughput | Time to first token vs total tokens per second |

---

### Exit Criteria
- Can you explain why a conversation gets "dumber" as it gets longer?
- Can you explain why the same question gets different answers?
- Can you explain what happens between "user types a message" and "first token appears on screen"?

---

---

# PHASE 1 — Core Application Layer
### Duration: 6–8 weeks | You are here | 🔒 SDK only

This is what you are building right now in AgentForge. Complete the full implementation before moving on.

---

### 1.1 Streaming

**Concept:**
Streaming is not a nice-to-have — it is the foundation of a usable AI interface. Without streaming, users wait 10+ seconds for a response. With it, they see output in <500ms.

The SDK handles streaming with `streamText` on the server and `useChat` (which uses `ReadableStream` under the hood) on the client. The stream carries *chunks* — partial tokens — not full sentences.

**What to understand:**
- `toUIMessageStreamResponse()` — converts the server-side stream into the UI message format the client expects
- `status` in `useChat` — `'submitted'` (request sent) → `'streaming'` (tokens arriving) → `'idle'` (complete)
- Why the client re-renders on every chunk (and why this is intentional)

**AgentForge task:** ✅ Already implemented. Review `route.ts` and `useChat` in `page.tsx` until you can explain the full data flow from button click to rendered token.

---

### 1.2 Tool Calling

**Concept:**
Tools are how you connect the model to the real world. The model cannot access the internet, check the time, or read a database — but it can *request* that your code does it.

The pattern:
1. You define tools with a name, description, input schema (Zod), and execute function
2. The model reads the tool descriptions in the system context
3. When appropriate, it outputs a structured tool call instead of text
4. Your execute function runs
5. The result is injected back and the model continues

**Critical insight:** The model chooses *when* to call a tool based purely on the description you write. A vague description = wrong tool use. A precise description = reliable behaviour.

**What to understand deeply:**
- `inputSchema` with Zod — why runtime validation matters (model can output malformed JSON)
- `stopWhen: stepCountIs(n)` — each "step" is one LLM call. Tool call + final response = 2 steps minimum
- `convertToModelMessages` — why UI messages need converting (they carry rendering metadata the model doesn't need)

**AgentForge task:** ✅ Already implemented. Now go further:
- Deliberately write a bad tool description and observe how the model misuses it
- Deliberately write a good one and compare the difference
- Add a `console.log` in an `execute` function to verify it actually runs server-side

---

### 1.3 Prompt Engineering Basics

**Concept:**
The system prompt is your primary control surface. Most AI application bugs are prompt bugs, not code bugs.

**Patterns to learn and apply:**

*Role + Context*
```
You are AgentForge, an AI assistant with access to web search and weather tools.
Always use webSearch before answering questions about current events.
```

*Output format constraints*
```
When presenting search results, always cite the source URL.
Respond in the same language the user writes in.
```

*Chain-of-thought (CoT)*
```
Before answering, briefly reason through what tools (if any) you need.
```

*Few-shot examples* — show the model 2–3 examples of ideal input/output pairs in the system prompt for tasks where format matters.

**AgentForge task:**
- Add a `system` parameter to `streamText` in `route.ts`
- Experiment: instruct the model to always use `webSearch` for current events
- Experiment: instruct it to respond in bullet points — observe how reliably it follows
- Experiment: remove the tool descriptions and watch the model stop using them

---

### 1.4 Short-Term Memory (Context Management)

**Concept:**
By default `useChat` sends the entire conversation on every request. After 30+ messages this becomes expensive (token cost) and slow (more input = slower output). You need to prune intelligently — not just truncate.

The SDK exports `pruneMessages` which removes oldest messages while:
- Always keeping the system prompt
- Keeping tool call / tool result pairs intact (never split them)
- Respecting a token budget you set

**AgentForge task:**
- Import and apply `pruneMessages` in `route.ts` before passing messages to `streamText`
- Set a budget of 4000 tokens for context
- Observe in a long conversation that early messages disappear but the conversation stays coherent

---

### 1.5 Approval Gates (Human-in-the-Loop)

**Concept:**
For any tool that takes a consequential action (sends an email, writes a file, charges a card), you need the user to confirm before execution. This is not just UX — it is a safety requirement for agentic systems.

The SDK has this built in via `state: 'approval-requested'` on tool parts. You can mark any tool as requiring approval by returning a special response from its configuration.

**AgentForge task — Core:**
- Mark `webSearch` as requiring approval (it makes an external API call — costs money)
- Render an Approve / Deny card in `MessageBubble` when `part.state === 'approval-requested'`
- Call `addToolApprovalResponse` from `useChat` on button click
- Observe the model resuming or aborting based on the decision

**AgentForge task — Conditional gates:**
Not every tool needs approval — requiring it for `getWeather` would be annoying; requiring it for a `sendEmail` tool is essential.
- Add a `requiresApproval: boolean` flag to each tool definition in `tools.ts`
- In `route.ts`, only configure approval for tools where the flag is `true`
- Test: `webSearch` triggers approval, `getWeather` does not

**AgentForge task — Audit log:**
Every approved or denied gate should be recorded with a timestamp, the tool name, the input arguments, and the user's decision. This is non-negotiable in any real agentic system.
- Create `app/lib/auditLog.ts` that appends entries to an in-memory log (swap for a DB in production)
- Call it in the Approve and Deny handlers with `{ timestamp, toolName, input, decision: 'approved' | 'denied' }`
- Add an audit panel to the UI (collapsible sidebar or modal) that lists every gate decision in the session

---

### 1.6 Checkpoints

**Concept:**
A conversation is state. If the user refreshes the page, closes the tab, or the server restarts, that state is gone by default. Checkpoints are how you persist and restore it.

This is not just convenience — in an agentic system running a 10-minute task, losing state halfway is a serious failure mode.

The mechanics are straightforward: `UIMessage[]` is a plain JSON-serialisable array. You can save it anywhere (localStorage for a demo, a database for production) and reload it via `useChat`'s `initialMessages` option.

**What to understand:**
- `initialMessages` prop on `useChat` — seeds the conversation with pre-loaded messages
- Tool result parts are included in the serialised state — so a restored conversation shows previous tool cards correctly
- Branch = copy the array at a given index, start a new session with that subset

**AgentForge task — Snapshots + Resume:**
- After every AI response (`status` transitions from `'streaming'` to `'idle'`), save `messages` to `localStorage` under a session key
- On page load, check localStorage for a saved session and pass it to `useChat` via `initialMessages`
- Add a "New conversation" button that clears localStorage and resets the session

**AgentForge task — Branch:**
- Add a "Fork from here" button on each assistant message
- On click, copy all messages up to and including that message, save as a new session key, and navigate to it
- The user now has two independent conversations diverging from that point

**AgentForge task — Timeline UI:**
- List all saved sessions (checkpoint keys from localStorage) in a side panel
- Show timestamp, message count, and the first user message as a preview
- Clicking a session restores it as the active conversation

---

### Phase 1 Exit Criteria
- Can you trace exactly what happens between `sendMessage` and the first token on screen?
- Can you explain why a tool stops being called when you change its description?
- Can you explain the cost implication of a 100-message conversation?
- Does the approval gate fire for `webSearch` but not `getWeather`?
- Is every gate decision recorded in the audit log?
- Can you close the tab, reopen it, and resume a conversation exactly where you left off?

---

---

# PHASE 2 — RAG & The Data Layer
### Duration: 6–8 weeks | 🔧 Needs: Upstash Vector (or any vector DB — free tier sufficient)

RAG (Retrieval-Augmented Generation) is in nearly every enterprise AI job description. It solves the model's biggest limitation: it only knows what it was trained on.

---

### 2.1 Embeddings — What They Are

**Concept:**
An embedding is a list of numbers (a vector) that represents the *meaning* of a piece of text in multi-dimensional space. Text with similar meaning has vectors that are close together.

```
"The cat sat on the mat"  → [0.2, -0.8, 0.4, 0.1, ...]  (1536 numbers)
"A feline rested on a rug" → [0.21, -0.79, 0.38, 0.12, ...] (very similar)
"Stock market crashes"    → [-0.3, 0.5, -0.2, 0.9, ...]  (very different)
```

**Why this matters:**
- You can search by *meaning* not just keywords
- "What's the weather like?" and "Is it raining?" will return the same documents
- This is the core of long-term memory, RAG, and semantic search

**The SDK:**
```ts
import { embed, embedMany } from 'ai';
import { openai } from '@ai-sdk/openai';

const { embedding } = await embed({
  model: openai.embedding('text-embedding-3-small'),
  value: 'The cat sat on the mat',
});
// embedding is a number[]
```

**AgentForge task:**
- Write a script that embeds 10 sentences and logs the vectors
- Implement cosine similarity manually (`cosineSimilarity` is exported from `ai`)
- Verify that semantically similar sentences score higher than unrelated ones

---

### 2.2 Vector Databases
> 🔧 **First external service in the roadmap.** Sign up for [Upstash Vector](https://upstash.com/vector) — free tier covers everything you need here.

**Concept:**
A vector database stores embeddings and lets you query for the *nearest neighbours* — the stored vectors most similar to a query vector. This is fast even with millions of records.

You need this for:
- Long-term memory (store past conversations, retrieve relevant ones)
- RAG (store documents, retrieve relevant chunks)
- Semantic search

**Options to know:**
| Database | Best for |
|---|---|
| Upstash Vector | Free tier, serverless, pairs perfectly with Next.js/Vercel |
| Pinecone | Industry standard, generous free tier |
| pgvector | If you already have a Postgres DB |
| Weaviate | Open source, self-hostable |

**AgentForge task:**
- Set up a free Upstash Vector index
- Write a `storeMemory(text: string)` utility that embeds text and upserts into the index
- Write a `retrieveMemory(query: string)` utility that embeds the query and fetches top 3 matches
- Test: store 20 facts, query for a related concept, verify relevant facts are returned

---

### 2.3 RAG Pipeline

**Concept:**
RAG = Retrieval-Augmented Generation. The pattern:

```
User query
    │
    ▼
Embed the query
    │
    ▼
Search vector DB for top-K relevant chunks
    │
    ▼
Inject chunks into system prompt as context
    │
    ▼
Model generates answer grounded in retrieved context
    │
    ▼
Model cites sources (if instructed)
```

**Chunking strategy** (the part people get wrong):
- You can't embed a whole document — too many tokens, meaning gets diluted
- Split documents into chunks of ~500 tokens with ~50 token overlap
- Overlap ensures a sentence split across chunk boundary isn't lost
- Bad chunking = bad retrieval = bad answers regardless of model quality

**AgentForge task:**
- Add a `knowledgeBase` tool to `tools.ts` that accepts a query, searches the vector DB, and returns the top 3 chunks
- Upload a text document (e.g. a product FAQ), chunk it, embed each chunk, store in the vector DB
- Ask AgentForge a question that can only be answered from that document
- Observe the model using the retrieved context to answer accurately

---

### 2.4 RAG Failure Modes

This is what separates engineers who understand RAG from those who just implemented it.

| Problem | Cause | Fix |
|---|---|---|
| Model ignores retrieved context | Context injected too late in prompt | Move context before user message in system prompt |
| Wrong chunks retrieved | Chunk size too large, meaning diluted | Reduce chunk size, increase overlap |
| Model still hallucinations | Retrieved context is irrelevant to query | Add a relevance score threshold — discard low-score chunks |
| Retrieval misses obvious answer | Keyword mismatch (user says "price", doc says "cost") | Hybrid search: combine vector + keyword (BM25) |
| Slow responses | Embedding the query on every request adds latency | Cache frequently queried embeddings |

**AgentForge task:**
- Deliberately trigger each failure mode
- Fix at least the first three

---

### 2.5 Memory UI

**Concept:**
The model doesn't inherently show the user what it "knows" about them. A memory UI makes this visible — building user trust and demonstrating the feature is actually working.

**AgentForge task:**
- Add a collapsible "Memory" panel in the sidebar
- Display the top 5 stored facts retrieved from the vector DB for the current session
- Each fact should show its source (which past message it came from) and a relevance score
- Add a "Forget this" button per fact that deletes it from the vector DB
- This turns an invisible backend feature into something a portfolio reviewer can actually see and interact with

---

### Phase 2 Exit Criteria
- Can you explain what a vector is to a non-technical person?
- Can you explain why chunk size matters?
- Does AgentForge have a working RAG pipeline using a real document?
- Can you name three ways RAG retrieval fails and how to fix them?
- Is the Memory panel visible in the UI and showing real retrieved facts?

---

---

# PHASE 3 — Safety & Guardrails
### Duration: 3–4 weeks | 🔒 SDK only (except 3.4) | 🔧 3.4 Needs: Upstash Redis (free tier sufficient)

Safety is not a checkbox. It is an engineering discipline. This phase gives you the vocabulary and implementation patterns to speak credibly about responsible AI.

---

### 3.1 Input Guardrails

**Concept:**
Before the user's message reaches the main model, run it through a fast classifier that decides whether to allow, modify, or reject it.

Patterns:

*Pre-flight LLM call* — use a small fast model (GPT-4o-mini or Haiku) with a strict classification prompt:
```
Classify this message as one of: [SAFE, PROMPT_INJECTION, OFF_TOPIC, JAILBREAK]
Message: {userMessage}
Return only the classification label.
```

*Rule-based checks* — regex or keyword matching for obvious patterns before hitting the LLM at all.

*Input schema validation* — if you expect structured input (e.g. a form), validate with Zod before sending to the model.

**AgentForge task:**
- Add a `classifyInput` function in a new `app/lib/guardrails.ts` file
- Call it in `route.ts` before `streamText`
- If classification is not SAFE, return a `Response` with a rejection message before the model is called
- Test with: a normal question, a prompt injection attempt, an off-topic message

---

### 3.2 Output Guardrails

**Concept:**
Even safe inputs can produce unsafe outputs. Post-process the stream to catch and handle these.

The SDK's `experimental_transform` lets you intercept the stream:
```ts
streamText({
  model: ...,
  experimental_transform: smoothStream(), // built-in example
})
```

You can write a custom transform that inspects each chunk for patterns you want to block or modify.

**What to implement:**
- PII redaction — replace patterns matching email/phone/SSN with `[REDACTED]`
- Profanity / toxic content detection — flag and replace
- Confidence indicator — if the model says "I think" or "I'm not sure", surface that in the UI

**AgentForge task:**
- Write a stream transform that redacts email addresses from the output
- Test: ask the model to make up an email address and verify it's redacted before reaching the UI

---

### 3.3 Topic Scoping

**Concept:**
Constrain what the model will discuss. Useful for building domain-specific assistants (legal, medical, customer support).

Two approaches:
1. **System prompt constraint** — "Only answer questions about X. For anything else, politely decline."
2. **Classifier gate** — classify the topic before sending to the main model, reject off-topic at the route level

The system prompt approach is simpler but LLMs can be talked out of it. The classifier gate is robust.

**AgentForge task:**
- Add a mode to AgentForge where it only answers questions about technology
- Implement via both approaches and compare how easily each can be bypassed

---

### 3.4 Rate Limiting
> 🔧 **Second external service.** Sign up for [Upstash Redis](https://upstash.com/redis) — free tier (10k commands/day) is more than enough for development and portfolio demos.

**Concept:**
Rate limiting is not an AI concept — it is infrastructure. But every production AI app needs it because LLM API calls are expensive, and without limits a single user (or a bot) can burn through your entire API budget in minutes.

The standard stack for Next.js: **Upstash Redis** + a sliding window counter in the API route.

```ts
// Conceptual pattern in route.ts
const identifier = req.headers.get('x-forwarded-for') ?? 'anonymous';
const { success } = await ratelimit.limit(identifier);
if (!success) {
  return new Response('Rate limit exceeded', { status: 429 });
}
```

**AgentForge task:**
- Sign up for a free Upstash Redis account
- Install `@upstash/ratelimit` and `@upstash/redis`
- Add a rate limiter to `route.ts`: max 10 requests per user per minute
- Return a `429` response with a clear message when the limit is hit
- Display the rate limit error gracefully in the chat UI (not a raw error)
- Test by sending 11 messages quickly and observing the rejection

---

### 3.5 Abort and Streaming Cancel

**Concept:**
A long-running stream or agent loop needs to be cancellable. The user might realise the model is going down the wrong path and want to stop it immediately rather than waiting for it to finish.

Two layers:
- **Client:** `stop()` from `useChat` sends an abort signal and halts the UI stream
- **Server:** The `abortSignal` passed into `streamText` propagates cancellation to the OpenAI API call itself — stopping token generation and saving you the cost of unused tokens

**AgentForge task:**
- Add a "Stop" button that appears in the UI whenever `isLoading` is true
- Wire it to `stop()` from `useChat`
- Pass `abortSignal` through to `streamText` in `route.ts`
- Test: start a long response, hit Stop, verify the stream halts immediately and the API call is cancelled (check terminal logs — the `onFinish` callback should show `finishReason: 'abort'`)

---

### Phase 3 Exit Criteria
- Can AgentForge reject a prompt injection attempt before it reaches the main model?
- Can you explain the difference between input and output guardrails?
- Can you explain why system prompt constraints alone are insufficient for safety-critical applications?
- Does the rate limiter return a `429` after 10 requests per minute?
- Does the Stop button cancel both the UI stream and the upstream API call?

---

---

# PHASE 4 — Evaluation (Evals)
### Duration: 4 weeks | Most overlooked, most important | 🔒 SDK only

**This is the phase that turns you from someone who builds AI features into someone who can maintain and improve them.** Without evals, you have no idea if a prompt change made things better or worse.

---

### 4.1 Why Evals Exist

A traditional app has unit tests. You change a function, run the tests, see if it broke.

AI apps have a different problem: the output is probabilistic. You can't write `expect(response).toBe("Paris")` because the model might say "Paris, France" or "The capital is Paris" — both correct, neither matching.

Evals are the AI equivalent of a test suite. They measure *quality* not exact match.

---

### 4.2 Types of Evals

**Exact match** — only for structured output (use `generateObject` with Zod, assert the schema is valid)

**LLM-as-judge** — use a second LLM call to score the response:
```
You are an evaluator. Score this response on a scale of 1-5 for:
- Accuracy (does it answer the question correctly?)
- Groundedness (is every claim supported by the provided context?)
- Conciseness (is it appropriately brief?)

Question: {question}
Context: {context}
Response: {response}

Return JSON: { accuracy: number, groundedness: number, conciseness: number }
```

**Reference-based** — compare the response to a known-good "golden" answer using similarity scoring

**Task completion** — did the model use the right tool? Did it call it with the right parameters?

---

### 4.3 What to Evaluate in AgentForge

| Behaviour | How to evaluate |
|---|---|
| Model uses `webSearch` for current events | Check if tool call exists in the response parts |
| Search results are relevant | LLM-as-judge: score retrieved chunks against the query |
| Final answer is grounded in search results | LLM-as-judge: check every claim appears in retrieved context |
| Weather card renders correct condition | Exact match on the `condition` field |
| Approval gate triggers for sensitive tools | Check `state === 'approval-requested'` in tool parts |

**AgentForge task:**
- Create `app/evals/` directory
- Write an eval script for: "does the model use webSearch for current events questions?"
- Run it against 10 test questions, measure the pass rate
- Change the system prompt and re-run — observe if pass rate improves

---

### 4.4 Regression Testing

Once you have evals, run them before every significant prompt or tool change. If the score drops, revert or fix before merging.

This is exactly what production AI teams do. Having this in your portfolio is a strong differentiator.

**AgentForge task:**
- Add an `npm run eval` script to `package.json`
- Document your baseline scores in a `evals/BASELINE.md` file

---

### Phase 4 Exit Criteria
- Can you explain why `expect(response).toBe(...)` doesn't work for AI?
- Do you have a working eval suite in AgentForge with measurable scores?
- Can you explain what "groundedness" means and how to measure it?

---

---

# PHASE 5 — Python Literacy & Ecosystem Familiarity
### Duration: 3–4 weeks | Reading, not building | 🔒 No tools required

You do not need to become a Python engineer. You need to be able to read Python AI code, understand what it does, and translate concepts back to TypeScript.

---

### 5.1 Python Basics for AI Context

Focus only on what appears in AI code:

```python
# Data structures you'll see
messages = [{"role": "user", "content": "Hello"}]
result = {"text": "Hi", "tokens": 42}

# List comprehensions (everywhere in AI code)
chunks = [doc[i:i+500] for i in range(0, len(doc), 500)]

# Async (Python AI code is often async)
async def get_response():
    response = await client.chat.completions.create(...)
    return response

# Type hints (readable, similar to TypeScript)
def embed(text: str) -> list[float]:
    ...
```

**Resource:** Python for JavaScript developers — focus on syntax translation, not Python ecosystem.

---

### 5.2 LangChain — Concepts, Not Code

You need to understand LangChain's mental model because:
- Most AI job descriptions mention it
- Most AI blog posts and papers use it for examples
- You'll work with Python teams who use it

**Core concepts to understand:**

| LangChain concept | Vercel AI SDK equivalent |
|---|---|
| `ChatOpenAI` | `openai('gpt-4o')` |
| `LLMChain` | `streamText` with a prompt template |
| `Tool` | Tool with `inputSchema` + `execute` |
| `AgentExecutor` | `streamText` with `stopWhen: stepCountIs(n)` |
| `VectorStore` | Upstash / Pinecone client |
| `RetrievalQA` | Your RAG tool in `tools.ts` |
| LCEL (`|` operator) | Chained `streamText` calls |

**What to do:** Read the LangChain "Build a RAG app" tutorial (Python). Don't code along — just read and mentally map each step to what you built in AgentForge Phase 2.

---

### 5.3 LangGraph — Concepts Only

LangGraph is for complex multi-agent orchestration where each step is a node in a directed graph with conditional edges.

**Mental model:**
```
State object flows through nodes.
Each node is a function (LLM call, tool call, human input).
Edges are conditional — based on state, go to node A or node B.
Cycles are allowed — the graph can loop.
```

This maps to: `stopWhen` + `onStepFinish` in the Vercel AI SDK for simple cases, but LangGraph handles arbitrary state machines that the SDK doesn't support natively.

**What to do:** Watch the LangGraph "Agent as graph" introductory video. Read the state machine docs. You don't need to build anything in LangGraph yet.

---

### Phase 5 Exit Criteria
- Can you read a LangChain Python RAG tutorial and explain each step?
- Can you map LangChain's `AgentExecutor` to what you built in AgentForge?
- Can you explain when you would choose LangGraph over the Vercel AI SDK?

---

---

# PHASE 6 — Observability & Production
### Duration: 4–6 weeks | 🔒 SDK only (except 6.2) | 🔧 6.2 Needs: Langfuse account (free tier sufficient)

This is what separates a developer who shipped an AI demo from an engineer who runs AI in production.

---

### 6.1 What to Observe

Every `streamText` call should log:

| Signal | Why |
|---|---|
| Model used | Different models have different costs and capabilities |
| Prompt tokens | Input cost |
| Completion tokens | Output cost |
| Total latency | User experience |
| Time to first token (TTFT) | Perceived responsiveness |
| Finish reason | `stop` = normal, `length` = truncated, `tool-calls` = tool invoked |
| Tool calls made | Which tools, which arguments |
| Step count | How many LLM calls the request required |

The SDK's `onFinish` and `onStepFinish` callbacks provide all of this.

**AgentForge task:**
- Add a `logRequest` function called in `onFinish` that writes a structured log to the console
- Format: `{ model, promptTokens, completionTokens, latencyMs, toolsUsed[], finishReason }`
- Make it visible in the terminal while running `npm run dev`

---

### 6.2 Integrate Langfuse
> 🔧 **Third (and last) external service.** Sign up for [Langfuse Cloud](https://langfuse.com) — free tier is generous. Alternatively self-host with Docker if you prefer no third-party dependency.

Langfuse is an open-source LLM observability platform. It gives you a dashboard to see every request, every tool call, latency distribution, and token spend over time. Free tier is generous.

The Vercel AI SDK has a native Langfuse integration via `telemetry`:

```ts
streamText({
  model: ...,
  experimental_telemetry: {
    isEnabled: true,
    metadata: { userId: '...', sessionId: '...' },
  },
})
```

**AgentForge task:**
- Set up a free Langfuse account
- Integrate the SDK telemetry
- Send 20 messages and review the Langfuse dashboard
- Identify: which tool is called most? what is the average latency? what is the p95 latency?

---

### 6.3 Cost Optimisation

**Prompt caching:**
OpenAI and Anthropic both support caching repeated prompt prefixes. If your system prompt is 1000 tokens and you send 1000 requests, without caching that's 1,000,000 tokens billed. With caching, it's billed once.

```ts
streamText({
  model: openai('gpt-4o-mini'),
  providerOptions: {
    openai: { parallelToolCalls: false }
  }
})
```

**Model routing:**
Use a cheap fast model (GPT-4o-mini, Claude Haiku) for simple queries and classification. Only escalate to an expensive model (GPT-4o, Claude Opus) when the task requires it.

**AgentForge task:**
- Add a `selectModel(messages)` function that returns `gpt-4o-mini` by default but `gpt-4o` if the conversation is complex (heuristic: > 5 messages OR contains code)
- Measure the cost difference over 50 test queries

---

### 6.4 Fine-Tuning Awareness (Conceptual)
> ⚠️ **Not implemented in AgentForge.** This section is read-only interview prep. Fine-tuning via the OpenAI API costs money per training run and does not belong in a portfolio demo. Understand the concepts — you do not need to ship it.

You probably won't fine-tune a model for AgentForge, but you must be able to explain the trade-offs in an interview.

**The three approaches:**

| Approach | When to use | Cost |
|---|---|---|
| **Prompting** | Behaviour change that fits in a system prompt | Free |
| **RAG** | Access to external/recent knowledge | Storage + retrieval cost |
| **Fine-tuning** | Consistent style/format/domain that RAG can't provide, or cost reduction via smaller model | Training cost + complexity |

**Fine-tuning is not magic.** It teaches the model *how to respond*, not *what to know*. If you need current knowledge, use RAG. If you need a specific response format consistently applied, fine-tuning might help. Most applications never need it.

**Resource:** Read OpenAI's fine-tuning guide (the conceptual sections). Run one fine-tune job on a small dataset just to say you've done it — the experience is more valuable than the result.

---

### Phase 6 Exit Criteria
- Does AgentForge log structured request metadata on every call?
- Is Langfuse integrated and showing a real dashboard?
- Can you explain prompt caching to a non-technical stakeholder?
- Can you explain when to choose prompting vs RAG vs fine-tuning?

---

---

# PHASE 7 — Multi-modal Input
### Duration: 2–3 weeks | 🔒 SDK only

Multi-modal means the model can process more than text — specifically images. This unlocks a whole category of use cases: analysing screenshots, reading diagrams, describing uploaded photos, answering questions about visual content.

The Vercel AI SDK supports image parts in messages natively via `FileUIPart`. No extra library required.

---

### 7.1 How Vision Works

The model doesn't "see" in the human sense — it processes images as high-dimensional embeddings and reasons about their content the same way it reasons about text. The key difference is the input contains both a text prompt and an image encoded as base64 or a URL.

**What to understand:**
- Not all models support vision — GPT-4o does, GPT-4o-mini does, GPT-3.5 does not
- Image tokens are expensive — a 1024×1024 image can cost 800+ tokens
- The model reads the *whole image* — there is no cropping or region-of-interest at the API level
- Quality vs detail: OpenAI lets you pass `detail: 'low'` (fewer tokens) or `detail: 'high'` (more accurate)

---

### 7.2 Image Upload

**Concept:**
The SDK exports `convertFileListToFileUIParts` which converts a browser `FileList` (from `<input type="file">`) directly into the `FileUIPart[]` format that `sendMessage` accepts.

```ts
import { convertFileListToFileUIParts } from 'ai';

const fileParts = await convertFileListToFileUIParts(fileInputRef.current.files);
sendMessage({ text: input, files: fileParts });
```

**AgentForge task:**
- Add a paperclip / image button next to the chat input
- On click, open a file picker filtered to `image/*`
- Convert the selected file using `convertFileListToFileUIParts`
- Pass the file parts to `sendMessage` alongside the text
- Display an image thumbnail preview inside the user's message bubble before the message sends
- Handle the case where the selected model doesn't support vision (show a helpful error)

---

### 7.3 Vision Tool

**Concept:**
Rather than always sending images to the main model, you can create a dedicated `analyseImage` tool. The main model decides when visual analysis is needed and delegates — keeping the main conversation cheap and only invoking vision when relevant.

**AgentForge task:**
- Add an `analyseImage` tool to `tools.ts` that accepts a `base64Image` string and a `question` string
- Inside `execute`, call `generateText` with the image and question (this is a second LLM call)
- Return a structured description: `{ description, objects[], text[], confidence }`
- Add a renderer in `ToolOutput.tsx` for the `analyseImage` result
- Test: upload a screenshot of a website and ask "What is this page about?"

---

### 7.4 Screenshot Q&A

**Concept:**
The most practical vision use case for a developer portfolio: paste a screenshot and ask the model to explain it, find bugs in it, or extract data from it.

**AgentForge task:**
- Add paste support (`onPaste` event on the chat input) that detects `image/*` clipboard items
- Convert the pasted image to a `FileUIPart` and attach it to the next message
- Add an example prompt: "Here's a screenshot of an error — what's wrong?"
- Test with: a screenshot of a UI bug, a photo of a whiteboard diagram, a picture of a table of data

---

### Phase 7 Exit Criteria
- Can a user attach an image and get a meaningful response about it?
- Does the image thumbnail appear in the message bubble before sending?
- Does the `analyseImage` tool produce a structured result card?
- Does paste-to-chat work for images from the clipboard?

---

---

# PHASE 8 — Advanced Agents
### Duration: Ongoing | 🔒 SDK only

This phase has no end date. Advanced agentic patterns are still evolving rapidly — this is the frontier.

---

### 8.1 Structured Output as a Foundation

Before building complex agents, master `generateObject`. Complex agents need to pass structured state between steps — free text doesn't compose.

```ts
import { generateObject } from 'ai';
import { z } from 'zod';

const plan = await generateObject({
  model: openai('gpt-4o'),
  schema: z.object({
    steps: z.array(z.object({
      action: z.enum(['search', 'summarise', 'respond']),
      query: z.string(),
      reasoning: z.string(),
    })),
  }),
  prompt: 'Plan how to answer: ' + userQuery,
});
// plan.object.steps is fully typed
```

**AgentForge task — Plan mode:**
- Add a "plan mode" where the model first generates a typed plan as structured output, then executes each step
- Render the plan as an expandable list in the UI before the first tool call fires

**AgentForge task — Data cards:**
Structured output isn't only for internal agent state — use it to render rich UI cards from model responses.
- Add a `/compare` command: user types `/compare iPhone 15 vs Samsung S24`
- Use `generateObject` with a schema like `{ items: [{ name, pros[], cons[], price }] }`
- Render the result as a side-by-side comparison card component (not prose)
- This demonstrates that AI responses don't have to be text — they can be typed data that drives UI

**AgentForge task — Form auto-fill:**
Extract structured fields from unstructured natural language input.
- Add a demo form (name, email, company, message)
- Add an "Auto-fill with AI" button that takes the user's last message and calls `generateObject` to extract matching fields
- Pre-populate the form with the extracted values, let the user confirm before submitting
- This pattern is used in CRM tools, onboarding flows, and support ticket systems

---

### 8.2 Supervisor → Worker Pattern

The most common multi-agent architecture:

```
User message
     │
     ▼
Supervisor agent
  - Analyses the task
  - Decides which specialist to invoke
     │
  ┌──┴──────────────┐
  ▼                 ▼
Search agent    Analysis agent
(uses webSearch)  (processes results)
     │                 │
     └────────┬────────┘
              ▼
     Supervisor synthesises
              │
              ▼
        Final response
```

Each agent is a separate `streamText` or `generateText` call. The supervisor orchestrates via structured output.

**AgentForge task:**
- Implement a two-agent system: a `searchAgent` that retrieves and a `synthesisAgent` that writes
- The supervisor decides which to call and passes structured handoff data

---

### 8.3 Long-Running Agents with Resumability

**Concept:**
An agent that runs for minutes (not seconds) needs to be resumable — if the user closes the tab or the server restarts, the work should continue.

The SDK exports `resumeStream` in `useChat` for reconnecting to an in-flight stream.

For true persistence you need:
- Store the message state in a database after each step
- On reconnect, load the state and resume from the last checkpoint
- This combines Phase 2 (storage), Phase 1 (checkpoints), and Phase 8 (agents)

**AgentForge task:**
- Store agent step state in localStorage after each `onStepFinish`
- On page reload, detect in-progress agents and offer to resume
- This is the Checkpoints feature from the roadmap, applied to agents

---

### 8.4 Staying Current

The AI engineering field moves faster than any other. What to follow:

| Source | What it covers |
|---|---|
| Vercel AI SDK changelog | New SDK features — check monthly |
| Simon Willison's blog (simonwillison.net) | Practical LLM engineering — weekly |
| Latent Space podcast | AI engineering trends — bi-weekly |
| LangChain blog | Agent patterns, even if you use different tools |
| Anthropic / OpenAI release notes | New model capabilities that change what's possible |

---

---

# PHASE 9 — AI-Driven Dashboard (New Project)
### Duration: 8–10 weeks | 🔒 Mostly SDK | 🔧 Neon DB optional for real data

> **This is a separate project from AgentForge.** Start a fresh Next.js repo.
> Everything you built in Phases 0–8 feeds directly into this — it is not repetition, it is application.
> Where AgentForge demonstrates breadth of AI patterns, this project demonstrates depth of product thinking.

---

## Why This Project Is More Powerful as a Portfolio Piece

AgentForge shows you know AI. This project shows you know how to build **products with AI**.

The distinction a hiring manager sees:

| AgentForge | AI-Driven Dashboard |
|---|---|
| Chat is the UI | Dashboard is the UI, AI is the input layer |
| AI results appear inside the conversation | AI results mutate live UI components |
| Demonstrates AI pattern knowledge | Demonstrates AI + product architecture |
| Visitor reads outputs | Visitor *uses* the product |
| Every AI demo looks like this | Very few portfolios have this |

A visitor landing on this project can interact with a live dashboard, type natural language commands, and watch charts and tables respond in real-time. That is demonstrably more impressive than a chat window.

---

## What You Are Building

A **business intelligence dashboard** controlled entirely through natural language.

The user never touches a filter dropdown or a date picker. Instead they type:

> *"Show me monthly revenue for Q1 2024 as a bar chart"*
> *"Compare this quarter to last quarter side by side"*
> *"Highlight the weeks where revenue dropped more than 15%"*
> *"Add a KPI card showing total customers acquired this month"*
> *"Remove the funnel chart and replace it with a conversion table"*

The AI interprets each command, generates a typed action, and the dashboard updates instantly. The conversation is a side panel — not the main event.

---

## New Tech Stack (on top of what you already know)

| Layer | Technology | Why |
|---|---|---|
| UI Components | **shadcn/ui** | Professional, accessible, copy-paste components — the industry standard for Next.js apps |
| Charts | **Recharts** | React-native, fully typed, free — composable chart primitives |
| State Management | **Zustand** | Minimal global state store — the AI writes to it, dashboard components read from it |
| Data | **Mock JSON → Neon DB** | Start with realistic hardcoded data, migrate to serverless Postgres when ready |
| AI SDK | Vercel AI SDK (same) | `generateObject` is the core primitive for this entire project |

> Everything else — Next.js, TypeScript, Tailwind, Zod — you already know from AgentForge.

---

## Architecture Blueprint

This is the most important section. Understand this before writing a single line of code.

```
User types natural language command
          │
          ▼
┌─────────────────────────┐
│   AI Command Interpreter │  ← generateObject({ schema: DashboardAction })
│   (route.ts)            │
└─────────────────────────┘
          │
          ▼  returns typed action e.g.:
          { type: 'ADD_WIDGET', widget: { kind: 'bar-chart', ... } }
          │
          ▼
┌─────────────────────────┐
│   Action Dispatcher     │  ← switch(action.type) → calls Zustand store method
│   (lib/dispatch.ts)     │
└─────────────────────────┘
          │
          ▼
┌─────────────────────────┐
│   Dashboard State Store │  ← Zustand: widgets[], filters, activeView, layout
│   (store/dashboard.ts)  │
└─────────────────────────┘
          │
          ▼  React re-renders
┌─────────────────────────┐
│   Dashboard Components  │  ← WidgetGrid, ChartWidget, KPICard, DataTable
│   (components/)         │
└─────────────────────────┘
```

**The AI never directly renders anything.** It produces a typed action. The action dispatcher updates state. React handles the rest. This separation is what makes the system maintainable, testable, and extensible.

---

## The DashboardAction Schema — The Heart of the Project

This Zod schema is what you pass to `generateObject`. Every possible thing the AI can do to the dashboard is listed here. This is your "command vocabulary".

```ts
import { z } from 'zod';

const WidgetKindSchema = z.enum([
  'bar-chart', 'line-chart', 'pie-chart', 'area-chart',
  'kpi-card', 'data-table', 'funnel-chart', 'heatmap',
]);

const DashboardActionSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('ADD_WIDGET'),
    widget: z.object({
      id: z.string(),
      kind: WidgetKindSchema,
      title: z.string(),
      dataKey: z.string().describe('Which dataset to visualise'),
      config: z.record(z.unknown()).optional(),
    }),
  }),
  z.object({
    type: z.literal('REMOVE_WIDGET'),
    widgetId: z.string(),
  }),
  z.object({
    type: z.literal('UPDATE_WIDGET'),
    widgetId: z.string(),
    changes: z.record(z.unknown()),
  }),
  z.object({
    type: z.literal('UPDATE_FILTERS'),
    filters: z.object({
      dateRange: z.object({ from: z.string(), to: z.string() }).optional(),
      segment: z.string().optional(),
      metric: z.string().optional(),
    }),
  }),
  z.object({
    type: z.literal('SWITCH_VIEW'),
    view: z.enum(['overview', 'revenue', 'customers', 'funnel']),
  }),
  z.object({
    type: z.literal('HIGHLIGHT_DATA'),
    widgetId: z.string(),
    condition: z.string().describe('e.g. "revenue < 10000" or "week = week-3"'),
  }),
  z.object({
    type: z.literal('RESET_DASHBOARD'),
  }),
  z.object({
    type: z.literal('EXPLAIN'),
    widgetId: z.string(),
    question: z.string(),
  }),
]);
```

This schema is the contract between what the user says and what the dashboard does. Every new capability you add to the dashboard is one more `z.object` here.

---

## 9.1 — Project Setup & Mock Data
### Duration: 1 week

**Project setup:**
- `npx create-next-app@latest ai-dashboard` (new repo, not AgentForge)
- Install: `shadcn/ui`, `recharts`, `zustand`, `ai`, `@ai-sdk/openai`, `zod`
- Set up Tailwind + shadcn/ui component library
- Create the base layout: sidebar (command input + history) + main area (widget grid)

**Mock dataset — make it realistic:**

Design a fake SaaS metrics dataset. Realistic data makes the portfolio demo credible.

```ts
// lib/data/metrics.ts
export const revenueByMonth = [
  { month: 'Jan', revenue: 42000, target: 40000 },
  { month: 'Feb', revenue: 38500, target: 42000 }, // missed target — interesting anomaly
  { month: 'Mar', revenue: 51000, target: 44000 },
  // ...12 months
];

export const customersBySegment = [
  { segment: 'Enterprise', count: 142, arpu: 1200 },
  { segment: 'SMB', count: 891, arpu: 180 },
  { segment: 'Startup', count: 2103, arpu: 45 },
];

export const conversionFunnel = [
  { stage: 'Visitors', count: 48000 },
  { stage: 'Signups', count: 3200 },
  { stage: 'Trial', count: 1100 },
  { stage: 'Paid', count: 312 },
];
```

**Why this matters:** Every command the AI responds to will reference one of these datasets by `dataKey`. Good mock data = compelling demo.

---

## 9.2 — Dashboard UI Layer
### Duration: 1.5 weeks

Build the visual shell before connecting AI. The dashboard must look and work correctly with hardcoded props before the AI touches it.

**Widget system:**

Each widget is a self-contained React component that accepts a typed config and a data key:

```ts
// components/widgets/BarChartWidget.tsx
type Props = {
  title: string;
  dataKey: keyof typeof DATA_REGISTRY;
  config?: { xAxis: string; yAxis: string; color?: string };
};
```

A `DATA_REGISTRY` maps data keys to actual datasets:
```ts
const DATA_REGISTRY = {
  'revenue-by-month': revenueByMonth,
  'customers-by-segment': customersBySegment,
  'conversion-funnel': conversionFunnel,
};
```

**Components to build:**
- `WidgetGrid` — CSS Grid layout that renders widgets from state
- `BarChartWidget` — Recharts `<BarChart>` with title and config
- `LineChartWidget` — Recharts `<LineChart>`
- `KPICard` — Large number + label + delta indicator (up/down vs previous period)
- `DataTableWidget` — shadcn/ui `<Table>` with sorting
- `FunnelWidget` — conversion funnel visualisation

**Key rule:** At this point, none of these components know about AI. They are pure UI — data in, visual out. This is your frontend lead expertise applied directly.

---

## 9.3 — Zustand State Store
### Duration: 3–4 days

The dashboard state is a single Zustand store. The AI writes to it. The components read from it. Nothing else connects them.

```ts
// store/dashboard.ts
import { create } from 'zustand';

type Widget = {
  id: string;
  kind: WidgetKind;
  title: string;
  dataKey: string;
  config?: Record<string, unknown>;
  highlighted?: boolean;
};

type DashboardStore = {
  widgets: Widget[];
  filters: FilterState;
  activeView: ViewName;
  commandHistory: string[];
  // Actions
  addWidget: (widget: Widget) => void;
  removeWidget: (id: string) => void;
  updateWidget: (id: string, changes: Partial<Widget>) => void;
  updateFilters: (filters: Partial<FilterState>) => void;
  switchView: (view: ViewName) => void;
  resetDashboard: () => void;
  pushCommand: (command: string) => void;
};
```

**Why Zustand and not React context:**
- AI response comes back in an API route handler — Zustand can be read/written from anywhere
- No prop drilling — any widget subscribes to exactly the slice it needs
- Built-in `persist` middleware for localStorage persistence (checkpoints for free)
- Devtools support — you can inspect state changes in the browser

---

## 9.4 — AI Command Interpreter
### Duration: 1 week

This is where AgentForge knowledge pays off. The route handler takes a natural language command, interprets it into a `DashboardAction`, and returns it.

```ts
// app/api/command/route.ts
import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { DashboardActionSchema } from '@/lib/schemas';

export async function POST(req: Request) {
  const { command, currentState } = await req.json();

  const { object } = await generateObject({
    model: openai('gpt-4o'),
    schema: DashboardActionSchema,
    system: `
      You control a business intelligence dashboard.
      Current widgets on screen: ${JSON.stringify(currentState.widgets.map(w => ({ id: w.id, kind: w.kind, title: w.title })))}
      Available data keys: revenue-by-month, customers-by-segment, conversion-funnel, weekly-active-users
      Available views: overview, revenue, customers, funnel

      Convert the user's command into exactly one dashboard action.
      For ADD_WIDGET, generate a unique id using a slug of the title.
      For UPDATE_WIDGET or REMOVE_WIDGET, match against the current widget ids above.
    `,
    prompt: command,
  });

  return Response.json(object);
}
```

**Critical design decisions:**
- Pass `currentState` to the system prompt so the model knows what widgets exist (needed for UPDATE/REMOVE)
- Use `gpt-4o` not `gpt-4o-mini` here — schema adherence matters more than cost for this call
- The route returns the action object, not a stream — the client dispatches it synchronously

---

## 9.5 — Action Dispatcher
### Duration: 3–4 days

The dispatcher sits between the API response and the Zustand store. It receives a `DashboardAction` and calls the right store method.

```ts
// lib/dispatch.ts
import { useDashboardStore } from '@/store/dashboard';
import type { DashboardAction } from '@/lib/schemas';

export function dispatchDashboardAction(action: DashboardAction) {
  const store = useDashboardStore.getState();

  switch (action.type) {
    case 'ADD_WIDGET':
      store.addWidget(action.widget);
      break;
    case 'REMOVE_WIDGET':
      store.removeWidget(action.widgetId);
      break;
    case 'UPDATE_WIDGET':
      store.updateWidget(action.widgetId, action.changes);
      break;
    case 'UPDATE_FILTERS':
      store.updateFilters(action.filters);
      break;
    case 'SWITCH_VIEW':
      store.switchView(action.view);
      break;
    case 'HIGHLIGHT_DATA':
      store.updateWidget(action.widgetId, { highlighted: true, highlightCondition: action.condition });
      break;
    case 'RESET_DASHBOARD':
      store.resetDashboard();
      break;
    case 'EXPLAIN':
      // Triggers a streaming text response in the side panel
      break;
  }
}
```

**Why a separate dispatcher and not calling store directly from the component:**
- The dispatcher is testable — pass in an action, assert the store changed
- Adding a new action type = one new `case` here, nothing else changes
- Logging and undo/redo hooks go here, not scattered across components

---

## 9.6 — Command Input + Response UI
### Duration: 3–4 days

The command panel is a minimal input — not a full chat UI. Think of it like a command palette (⌘K).

**Components:**
- `CommandInput` — single line input with Enter to submit, loading state while AI processes
- `CommandHistory` — list of previous commands, click to re-run
- `ActionFeedback` — shows what the AI did: "Added bar chart: Monthly Revenue"
- `ExplainPanel` — for `EXPLAIN` actions, streams a text response using `streamText` (familiar from AgentForge)

**UX behaviour:**
- Command submitted → loading spinner on the relevant widget area (not a global spinner)
- Action dispatched → widget animates in (CSS transition)
- Error → show which part of the command failed and suggest corrections
- Ambiguous command → AI asks a clarifying question before acting

---

## 9.7 — Proactive AI Insights
### Duration: 1 week

This is what elevates the project from "AI as a tool" to "AI as a collaborator". The AI doesn't just respond to commands — it notices things and tells the user.

**Pattern:** After data loads (or on a timer), run a background analysis:

```ts
// On dashboard load
const { object: insights } = await generateObject({
  model: openai('gpt-4o-mini'),
  schema: z.object({
    insights: z.array(z.object({
      severity: z.enum(['info', 'warning', 'critical']),
      widgetId: z.string().optional(),
      message: z.string(),
      suggestedAction: z.string().optional(),
    })),
  }),
  system: 'You are a data analyst. Identify anomalies, trends, and opportunities in this dashboard data.',
  prompt: JSON.stringify(allDashboardData),
});
```

**What the AI might surface:**
- "Revenue missed target in February — down 8.3%. This coincides with a 40% drop in trial conversions."
- "Enterprise segment ARPU grew 12% MoM — consider increasing focus here."
- "Conversion from Trial → Paid is 28% — industry average is 15–20%. Highlight this as a strength."

**UI:** An insight banner at the top of each widget with a dismiss button. Critical insights appear in red. The suggested action is clickable — it runs the command automatically.

This feature demonstrates that you understand AI as a proactive system, not just a reactive one. Very few portfolio projects include this.

---

## 9.8 — Undo / Redo + Command History
### Duration: 3–4 days

Every dashboard action is reversible. This is not an AI feature — it is a product quality signal.

**Zustand middleware approach:**

```ts
// store/dashboard.ts — add temporal middleware
import { temporal } from 'zundo';

const useDashboardStore = create(
  temporal(
    (set) => ({ /* store */ }),
    { limit: 20 } // keep last 20 states
  )
);
```

`zundo` wraps Zustand and gives you `undo()`, `redo()`, and `pastStates[]` for free.

**UI:**
- Keyboard shortcuts: `⌘Z` to undo, `⌘⇧Z` to redo
- Visual timeline: a horizontal scrubber showing the last 20 states — drag to jump to any point
- Each history entry shows the command that caused it

**Why this matters for the portfolio:** Undo/redo on an AI-driven interface is a hard problem and a real product requirement. Having it shows you think like a product engineer, not just a feature builder.

---

## 9.9 — Real Data Option (Optional)
### Duration: 1 week if included | 🔧 Needs: Neon DB (free tier)

The mock data is sufficient for a portfolio demo. But if you want to connect real queryable data:

**Stack:** Neon (serverless Postgres, free tier) + Drizzle ORM (TypeScript-native)

**Pattern:** The AI generates a filter/query configuration, not raw SQL:

```ts
// The AI never writes SQL. It writes a typed query config.
const QueryConfigSchema = z.object({
  table: z.enum(['revenue', 'customers', 'events']),
  dateRange: z.object({ from: z.string(), to: z.string() }),
  groupBy: z.enum(['day', 'week', 'month']).optional(),
  filters: z.record(z.string()).optional(),
});
// Your code translates config → SQL. AI never touches the database directly.
```

This pattern is important: **never let the AI generate raw SQL** — let it generate a typed query description that your code translates safely. This prevents injection and keeps the AI's role bounded.

---

## 9.10 — Accessibility, Performance & Polish
### Duration: 1 week

This is where your frontend lead background becomes the differentiator. Most AI projects have no polish. Yours will.

**Accessibility:**
- All widgets have `aria-label` describing their content
- Command input has keyboard navigation and screen reader announcements for state changes
- Colour is not the only indicator — anomaly highlights use both colour and a pattern/icon

**Performance:**
- Widgets use `React.memo` — only re-render when their specific slice of state changes
- Charts use `useMemo` for data transformations — expensive calculations don't repeat on unrelated re-renders
- AI command calls are debounced — rapid typing doesn't fire multiple API calls
- Dashboard state is persisted to localStorage via Zustand `persist` — reload = instant restore

**Polish:**
- Widget drag-and-drop reordering (dnd-kit — 3KB, zero dependencies)
- Smooth animations when widgets are added/removed (`framer-motion` or pure CSS transitions)
- Responsive layout — dashboard works on tablet, command panel collapses to a floating button on mobile
- Dark mode support via Tailwind `dark:` classes and shadcn/ui theming

---

## What This Project Demonstrates to a Hiring Manager

| Skill Signal | Where It Shows |
|---|---|
| **AI as a system component** | Structured output driving state, not just generating text |
| **Product architecture** | Clean separation: AI → dispatcher → state → UI |
| **State management** | Zustand with undo/redo, persistence, devtools |
| **Data visualisation** | Multiple chart types, responsive, accessible |
| **TypeScript discipline** | End-to-end type safety from Zod schema to component props |
| **UI lead expertise** | Polish, accessibility, animations, responsive layout |
| **Proactive AI thinking** | Insights engine surfaces anomalies without being asked |
| **Safety patterns** | AI generates typed config, never raw SQL or direct DOM mutation |
| **Performance** | Memoisation, debouncing, lazy loading, persist |

This is not a chatbot. This is a **product** that uses AI as one of its layers — which is exactly what most companies actually need to hire for.

---

## Phase 9 Exit Criteria
- Can a user describe a chart in plain English and see it appear on the dashboard?
- Can a user say "remove the funnel chart" and have it disappear?
- Does ⌘Z undo the last AI action and restore the previous state?
- Does the insights engine surface at least one anomaly on load without prompting?
- Does the dashboard reload exactly as the user left it after a page refresh?
- Is every widget keyboard accessible and screen-reader labelled?
- Can you explain to an interviewer why the AI generates an action object and not a component directly?

---

---

| Phase | Topic | Duration | Project | External? |
|---|---|---|---|---|
| 0 | How LLMs work | 1 week | AgentForge | 🔒 None |
| 1 | Core application layer | 6–8 weeks | AgentForge | 🔒 None |
| 2 | RAG & data layer | 6–8 weeks | AgentForge | 🔧 Upstash Vector |
| 3 | Safety & guardrails | 3–4 weeks | AgentForge | 🔧 Upstash Redis (3.4 only) |
| 4 | Evals | 4 weeks | AgentForge | 🔒 None |
| 5 | Python & ecosystem literacy | 3–4 weeks | AgentForge | 🔒 None |
| 6 | Observability & production | 4–6 weeks | AgentForge | 🔧 Langfuse (6.2 only) |
| 7 | Multi-modal input | 2–3 weeks | AgentForge | 🔒 None |
| 8 | Advanced agents | Ongoing | AgentForge | 🔒 None |
| **9** | **AI-Driven Dashboard** | **8–10 weeks** | **New project** | 🔧 Neon DB (optional) |

**Total: ~13–15 months** of consistent part-time effort.

---

# What "AI Engineer" Looks Like on the Other Side

After completing this roadmap you will be able to:

- Build and ship any AI-powered feature a product team asks for
- Reason about model trade-offs (cost, capability, latency)
- Measure and improve AI quality with evals — not just vibes
- Design agentic systems with safety, observability, and human oversight
- Read Python AI code and translate it to TypeScript
- Speak credibly about LangChain/LangGraph without having to use them daily
- Debug AI failures methodically rather than just re-prompting and hoping

That is a credible, hireable AI Engineer at a product company. It is not an ML researcher or a model trainer — but that is a different career path that requires a different foundation entirely.

---

## Your Two-Project Portfolio

By the end of this roadmap you will have two distinct projects to show:

| Project | What it proves |
|---|---|
| **AgentForge** | You understand every layer of AI application development — streaming, tool calling, RAG, guardrails, memory, evals, multi-modal, agents |
| **AI-Driven Dashboard** | You can architect AI as a component inside a real product — state management, data visualisation, proactive insights, undo/redo, accessibility |

Together they cover the full range of what an AI Application Engineer does at a product company. Neither one alone tells the complete story. Both together make a very strong case.

---

*Last updated: based on Vercel AI SDK v6, GPT-4o-mini, Tavily Search. Revisit tool choices every 6 months — this field moves fast.*
