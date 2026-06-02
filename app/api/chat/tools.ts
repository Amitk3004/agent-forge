import { z } from 'zod';

export const webSearch = {
  description:
    'Search the internet for current information, news, and articles on any topic. Use this before answering questions that may require up-to-date knowledge.',
  inputSchema: z.object({
    query: z.string().describe('The search query'),
  }),
  execute: async ({ query }: { query: string }) => {
    const res = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: process.env.TAVILY_API_KEY,
        query,
        max_results: 5,
        include_answer: true,
      }),
    });

    if (!res.ok) throw new Error(`Tavily error: ${res.status}`);

    const data = await res.json();
    return {
      query,
      answer: data.answer ?? null,
      results: (data.results as Array<{ title: string; url: string; content: string }>).map(
        ({ title, url, content }) => ({ title, url, content }),
      ),
    };
  },
};

export const getWeather = {
  description: 'Get the current weather for a city',
  inputSchema: z.object({
    city: z.string().describe('The city name'),
  }),
  execute: async ({ city }: { city: string }) => {
    // Replace with a real weather API call
    return { city, temperature: 24, unit: 'celsius', condition: 'Sunny' };
  },
};

export const getNews = {
  description: 'Get the latest news headlines for a topic',
  inputSchema: z.object({
    topic: z.string().describe('The topic to search news for'),
  }),
  execute: async ({ topic }: { topic: string }) => {
    // Replace with a real news API call
    return {
      topic,
      articles: [
        { title: `Breaking: Major development in ${topic}`, source: 'Reuters' },
        { title: `${topic} update: What you need to know`, source: 'BBC' },
        { title: `Experts weigh in on latest ${topic} news`, source: 'AP News' },
      ],
    };
  },
};

export const getCurrentDateTime = {
  description: 'Get the current date and time',
  inputSchema: z.object({}),
  execute: async () => {
    const now = new Date();
    return {
      date: now.toLocaleDateString(),
      time: now.toLocaleTimeString(),
    };
  }
}
