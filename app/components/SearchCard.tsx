'use client';

import { useState } from 'react';

export type SearchOutput = {
  query: string;
  answer: string | null;
  results: { title: string; url: string; content: string }[];
};

export function SearchCard({ output }: { output: SearchOutput }) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? output.results : output.results.slice(0, 2);
  const hidden = output.results.length - 2;

  return (
    <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm space-y-3">
      <p className="font-semibold text-gray-700">Search: {output.query}</p>
      {output.answer && (
        <p className="text-gray-800 bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2">
          {output.answer}
        </p>
      )}
      <ul className="space-y-2">
        {visible.map((r, i) => {
          let domain = '';
          try { domain = new URL(r.url).hostname.replace('www.', ''); } catch {}
          return (
            <li key={i}>
              <div className="flex items-center flex-wrap gap-1.5">
                <a href={r.url} target="_blank" rel="noopener noreferrer"
                  className="font-medium text-blue-600 hover:underline">
                  {r.title}
                </a>
                {domain && (
                  <span className="inline-block bg-gray-100 text-gray-500 text-xs rounded-full px-2 py-0.5">
                    {domain}
                  </span>
                )}
              </div>
              <p className="text-gray-500 text-xs mt-0.5 line-clamp-2">{r.content}</p>
            </li>
          );
        })}
      </ul>
      {!expanded && hidden > 0 && (
        <button
          onClick={() => setExpanded(true)}
          className="text-xs text-blue-600 hover:underline"
        >
          Show {hidden} more result{hidden > 1 ? 's' : ''}
        </button>
      )}
    </div>
  );
}
