import { createAmazonBedrock } from '@ai-sdk/amazon-bedrock';
import {
  streamText,
  convertToModelMessages,
  stepCountIs,
  createUIMessageStream,
  createUIMessageStreamResponse,
  type UIMessage,
} from 'ai';
import { getWeather, webSearch, getCurrentDateTime, getStockPrice, getTimeZone } from './tools';
import { getModel, type ModelConfig, type SamplingParam, type SamplingSettings } from '@/lib/models';
import { TOOLS_ENABLED } from '@/lib/features';
import { GUARDRAIL_ENABLED, checkInput } from '@/lib/guardrail';
import type { GuardrailData } from '@/lib/guardrail-types';

export const maxDuration = 60;

// Credentials come from AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY (/ AWS_SESSION_TOKEN).
const bedrock = createAmazonBedrock({ region: process.env.AWS_REGION ?? 'ap-south-1' });

function buildSystemPrompt(now: Date) {
  const currentDate = now.toISOString().split('T')[0];

  if (!TOOLS_ENABLED) {
    return `You are AgentForge, a helpful assistant.

TODAY'S DATE: ${currentDate}

You have no access to the internet or live data. Answer from your own knowledge, and say so plainly when a question needs current information you may not have. Do not make up facts.`;
  }

  return `You are AgentForge, a helpful assistant with access to web search, weather, and other tools.

TODAY'S DATE: ${currentDate}
Always treat this as the current date. Never assume a different year or date.

RULES:
- When searching the web, always include the current year (${now.getFullYear()}) in your query to get recent results.
- Before calling webSearch, call getCurrentDateTime to confirm the exact date if precision matters.
- Do not make up information. If you cannot find it with the available tools, say so.
- Do not return search results from before ${now.getFullYear() - 1} unless the user specifically asks for historical data.
- Stock prices change every second. ALWAYS call getStockPrice for every stock-related question, even if the same symbol appeared earlier in this conversation. Never reuse a previous tool result for stock data.
- Weather changes constantly. ALWAYS call getWeather for every weather-related question, even if the same city appeared earlier in this conversation. Never reuse a previous tool result for weather data.`;
}

// Keep only params this model supports, clamped to its range.
function sanitizeSettings(model: ModelConfig, settings: SamplingSettings | undefined): SamplingSettings {
  const out: SamplingSettings = {};
  for (const [param, range] of Object.entries(model.params) as [SamplingParam, NonNullable<ModelConfig['params'][SamplingParam]>][]) {
    const value = settings?.[param];
    if (typeof value !== 'number' || Number.isNaN(value)) continue;
    out[param] = Math.min(range.max, Math.max(range.min, value));
  }
  // Backstop for the UI: keep only the first of any mutually exclusive params.
  const [, ...rest] = (model.exclusiveParams ?? []).filter((p) => out[p] !== undefined);
  for (const p of rest) delete out[p];
  return out;
}

function topKRequestFields(model: ModelConfig, topK: number | undefined) {
  if (topK == null) return undefined;
  if (model.topKField === 'nova') return { inferenceConfig: { topK } };
  if (model.topKField === 'anthropic') return { top_k: topK };
  return undefined;
}

const textOf = (m: UIMessage) =>
  m.parts.map((p) => (p.type === 'text' ? p.text : '')).join('');

const withText = (m: UIMessage, text: string): UIMessage => ({
  ...m,
  parts: [...m.parts.filter((p) => p.type !== 'text'), { type: 'text', text }],
});

const guardrailDataOf = (m: UIMessage) =>
  m.parts.find((p) => p.type === 'data-guardrail') as { data: GuardrailData } | undefined;

// The client resends the whole history every turn, but only the newest message is checked.
// Use the guardrail verdicts recorded on earlier replies so a blocked message never reaches
// the model later, and masked PII stays masked.
function sanitizeHistory(messages: UIMessage[]): UIMessage[] {
  const out: UIMessage[] = [];
  for (const m of messages) {
    const verdict = m.role === 'assistant' ? guardrailDataOf(m)?.data : undefined;
    const prev = out.at(-1);
    if (verdict && prev?.role === 'user') {
      if (verdict.action === 'blocked') {
        out.pop(); // drop the blocked question and the refusal
        continue;
      }
      out[out.length - 1] = withText(prev, verdict.maskedText);
    }
    out.push(m);
  }
  return out;
}

const errorMessage = (error: unknown) => (error instanceof Error ? error.message : String(error));

export async function POST(req: Request) {
  const { messages: incoming, modelKey, settings }: {
    messages: UIMessage[];
    modelKey?: string;
    settings?: SamplingSettings;
  } = await req.json();

  let messages = sanitizeHistory(incoming);

  // Input guardrail: check only the newest user message, before any model call.
  let verdict: GuardrailData | null = null;
  const last = messages.at(-1);
  if (GUARDRAIL_ENABLED && last?.role === 'user') {
    try {
      verdict = await checkInput(textOf(last));
    } catch (error) {
      // Fail closed: if the check itself fails (permissions, wrong ID), don't call the model.
      return new Response(`Guardrail check failed: ${errorMessage(error)}`, { status: 500 });
    }

    if (verdict?.action === 'blocked') {
      const data = verdict;
      return createUIMessageStreamResponse({
        stream: createUIMessageStream({
          execute: ({ writer }) => {
            writer.write({ type: 'start' });
            writer.write({ type: 'data-guardrail', data });
            writer.write({ type: 'finish' });
          },
        }),
      });
    }

    if (verdict?.action === 'masked') {
      messages = [...messages.slice(0, -1), withText(last, verdict.maskedText)];
    }
  }

  const model = getModel(modelKey);
  const { temperature, topP, topK } = sanitizeSettings(model, settings);
  const additionalModelRequestFields = topKRequestFields(model, topK);

  const result = streamText({
    model: bedrock(model.bedrockId),
    system: buildSystemPrompt(new Date()),
    temperature,
    topP,
    messages: await convertToModelMessages(messages),
    ...(TOOLS_ENABLED
      ? {
          tools: { webSearch, getWeather, getCurrentDateTime, getStockPrice, getTimeZone },
          stopWhen: stepCountIs(5),
        }
      : {}),
    ...(additionalModelRequestFields && {
      providerOptions: { bedrock: { additionalModelRequestFields } },
    }),
  });

  // Surface the real Bedrock error (e.g. an unsupported parameter) instead of a generic message.
  if (verdict?.action !== 'masked') {
    return result.toUIMessageStreamResponse({ onError: errorMessage });
  }

  // Masked: attach the verdict to the reply so the UI can show it and later turns reuse the masked text.
  const data = verdict;
  return createUIMessageStreamResponse({
    stream: createUIMessageStream({
      onError: errorMessage,
      execute: ({ writer }) => {
        writer.write({ type: 'start' });
        writer.write({ type: 'data-guardrail', data });
        writer.merge(result.toUIMessageStream({ sendStart: false, onError: errorMessage }));
      },
    }),
  });
}
