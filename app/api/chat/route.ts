import { openai } from '@ai-sdk/openai';
import { streamText, convertToModelMessages, stepCountIs } from 'ai';
import { getWeather, webSearch, getCurrentDateTime } from './tools';

export async function POST(req: Request) {
  const { messages } = await req.json();

  const now = new Date();
  const currentDate = now.toISOString().split('T')[0]; // "2026-06-03"

  const result = streamText({
    model: openai('gpt-4o-mini'),
    system: `You are AgentForge, a helpful assistant with access to web search, weather, and other tools.

TODAY'S DATE: ${currentDate}
Always treat this as the current date. Never assume a different year or date.

RULES:
- When searching the web, always include the current year (${now.getFullYear()}) in your query to get recent results.
- Before calling webSearch, call getCurrentDateTime to confirm the exact date if precision matters.
- Do not make up information. If you cannot find it with the available tools, say so.
- Do not return search results from before ${now.getFullYear() - 1} unless the user specifically asks for historical data.`,
    temperature: 0.1,
    messages: await convertToModelMessages(messages),
    tools: { webSearch, getWeather, getCurrentDateTime },
    stopWhen: stepCountIs(5),
  });

  return result.toUIMessageStreamResponse();
}
