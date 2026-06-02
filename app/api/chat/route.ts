import { openai } from '@ai-sdk/openai';
import { streamText, convertToModelMessages, stepCountIs } from 'ai';
import { getWeather, webSearch, getCurrentDateTime } from './tools';

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = streamText({
    model: openai('gpt-4o-mini'),
    system: `You are a helpful assistant that can answer questions and perform tasks using the provided tools.
    Use the tools when appropriate, and always try to provide a helpful and informative response to the user.
    If you don't know the answer to a question, use the web search tool to find the information online. Always try to use the tools to get accurate and up-to-date information.
    Before searching the web, always run the current date and time tool to get the current date and time. This will help you determine if the information you find is recent enough to be relevant.
    DO NOT make up information. If you don't know the answer and can't find it using the tools, say you don't know.
    Provide some suggested question to user in case user is asking a question that is not related to stock analysis or the provided tools.`,
    temperature: 0.1,
    messages: await convertToModelMessages(messages),
    tools: { webSearch, getWeather, getCurrentDateTime },
    stopWhen: stepCountIs(3),
  });

  return result.toUIMessageStreamResponse();
}
