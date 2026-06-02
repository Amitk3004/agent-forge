export type SearchOutput = {
  query: string;
  answer: string | null;
  results: { title: string; url: string; content: string }[];
};

export function SearchCard({ output }: { output: SearchOutput }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm space-y-3">
      <p className="font-semibold text-gray-700">Search: {output.query}</p>
      {output.answer && (
        <p className="text-gray-800 bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2">
          {output.answer}
        </p>
      )}
      <ul className="space-y-2">
        {output.results.map((r, i) => (
          <li key={i}>
            <a href={r.url} target="_blank" rel="noopener noreferrer"
              className="font-medium text-blue-600 hover:underline">
              {r.title}
            </a>
            <p className="text-gray-500 text-xs mt-0.5 line-clamp-2">{r.content}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
