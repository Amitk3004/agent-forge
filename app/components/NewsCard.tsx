export type NewsOutput = {
  topic: string;
  articles: { title: string; source: string }[];
};

export function NewsCard({ output }: { output: NewsOutput }) {
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm space-y-2">
      <p className="font-semibold text-gray-700">Top news: {output.topic}</p>
      <ul className="space-y-1">
        {output.articles.map((a, i) => (
          <li key={i} className="text-gray-600">
            <span className="font-medium text-gray-800">{a.source}</span> — {a.title}
          </li>
        ))}
      </ul>
    </div>
  );
}
