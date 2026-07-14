const PROMPTS = [
  "What's the weather in Tokyo?",
  "Search for the latest AI news",
  "What's Apple's stock price?",
  "Weather in New York",
  "Search for top programming languages in 2026",
  "What's Tesla's stock price?",
];

export function SuggestedPrompts({
  onSelect,
  disabled,
}: {
  onSelect: (prompt: string) => void;
  disabled: boolean;
}) {
  return (
    <div className="flex flex-col items-center mt-16 gap-6 px-4">
      <div className="text-center">
        <h2 className="text-lg font-semibold text-gray-700">What can I help you with?</h2>
        <p className="text-sm text-gray-400 mt-1">Try one of these or type your own below</p>
      </div>
      <div className="grid grid-cols-2 gap-2 w-full max-w-lg">
        {PROMPTS.map((prompt) => (
          <button
            key={prompt}
            onClick={() => onSelect(prompt)}
            disabled={disabled}
            className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-600 text-left
              hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700
              disabled:opacity-40 disabled:cursor-not-allowed
              transition-colors duration-150"
          >
            {prompt}
          </button>
        ))}
      </div>
    </div>
  );
}
