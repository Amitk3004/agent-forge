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

// Maps WeatherAPI's ~70 condition texts down to the 12 keys WeatherCard understands
function normalizeCondition(raw: string): string {
  const t = raw.toLowerCase();
  if (t.includes('thunder') || t.includes('lightning'))      return 'thunder';
  if (t.includes('sleet') || t.includes('freezing'))         return 'snow';
  if (t.includes('snow') || t.includes('blizzard') || t.includes('ice')) return 'snow';
  if (t.includes('fog') || t.includes('mist') || t.includes('haze'))     return 'fog';
  if (t.includes('rain') || t.includes('drizzle') || t.includes('shower')) return 'rain';
  if (t.includes('storm') || t.includes('squall'))           return 'storm';
  if (t.includes('wind') || t.includes('gale'))              return 'windy';
  if (t.includes('overcast') || t.includes('cloudy'))        return 'cloudy';
  if (t.includes('partly') || t.includes('patchy'))          return 'cloudy';
  if (t.includes('sunny') || t.includes('clear'))            return 'sunny';
  return 'clear';
}

export const getWeather = {
  description: 'Get the current weather for a city',
  inputSchema: z.object({
    city: z.string().describe('The city name'),
  }),
  execute: async ({ city }: { city: string }) => {
    const key = process.env.WEATHER_API_KEY;
    if (!key) throw new Error('WEATHER_API_KEY is not set');

    const res = await fetch(
      `https://api.weatherapi.com/v1/current.json?key=${key}&q=${encodeURIComponent(city)}&aqi=no`,
    );

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message ?? `WeatherAPI error: ${res.status}`);
    }

    const data = await res.json();
    const raw: string = data.current?.condition?.text ?? 'Clear';

    return {
      city: data.location?.name ?? city,
      temperature: Math.round(data.current.temp_c),
      unit: 'celsius',
      condition: normalizeCondition(raw),
      description: raw,
    };
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
  description: 'Get the current date and time in ISO format. Call this before any webSearch so queries include the correct date context.',
  inputSchema: z.object({}),
  execute: async () => {
    const now = new Date();
    return {
      iso: now.toISOString(),
      date: now.toISOString().split('T')[0],          // "2026-06-03"
      time: now.toTimeString().split(' ')[0],          // "14:32:01"
      year: now.getFullYear(),
      month: now.getMonth() + 1,
      day: now.getDate(),
    };
  },
};
