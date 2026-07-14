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
  description: 'Get the LIVE current weather for a city. Weather changes constantly — always call this tool for every weather query, even if you fetched the same city earlier in this conversation. Never reuse a previous result.',
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


export const getStockPrice = {
  description: 'Get the LIVE current stock price for a symbol. Stock prices change every second — always call this tool for every stock query, even if you fetched the same symbol earlier in this conversation. Never reuse a previous result.',
  inputSchema: z.object({
    symbol: z.string().describe('The stock ticker symbol, e.g. AAPL'),
  }),
  execute: async ({ symbol }: { symbol: string }) => {
    const key = process.env.ALPHA_VANTAGE_API_KEY;
    if (!key) throw new Error('ALPHA_VANTAGE_API_KEY is not set');

    const res = await fetch(
      `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${encodeURIComponent(symbol)}&apikey=${key}`,
    );

    if (!res.ok) throw new Error(`Alpha Vantage error: ${res.status}`);

    const data = await res.json();

    if (data['Error Message']) throw new Error(data['Error Message']);
    if (data['Note']) throw new Error('Alpha Vantage rate limit reached. Try again in a minute.');

    const q = data['Global Quote'];
    if (!q || !q['05. price']) throw new Error(`No data found for symbol "${symbol}"`);

    const change = parseFloat(q['09. change']);
    return {
      symbol: q['01. symbol'],
      price: parseFloat(q['05. price']),
      change,
      changePercent: q['10. change percent'],
      open: parseFloat(q['02. open']),
      high: parseFloat(q['03. high']),
      low: parseFloat(q['04. low']),
      volume: parseInt(q['06. volume'], 10),
      positive: change >= 0,
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
