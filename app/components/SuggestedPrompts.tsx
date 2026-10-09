import { TOOLS_ENABLED } from '@/lib/features';

const GENERAL_PROMPTS = [
  "Explain how a transformer model works",
  "Write a haiku about the monsoon",
  "What's the difference between TCP and UDP?",
  "Give me 5 names for a coffee shop",
  "Summarize the plot of Hamlet in 3 lines",
  "How do I reverse a linked list?",
  "Explain compound interest simply",
  "Suggest a 3-day itinerary for Jaipur",
];

const TOOL_PROMPTS = [
  "What's the weather in Tokyo?",
  "Search for the latest AI news",
  "What's Apple's stock price?",
  "What time is it in London?",
  "Search for top programming languages in 2026",
  "What's Tesla's stock price?",
  "What time is it in Dubai?",
  "Weather in New York",
];

const SECTIONS = [
  { title: 'General questions', prompts: GENERAL_PROMPTS },
  ...(TOOLS_ENABLED ? [{ title: 'Live data & web search', prompts: TOOL_PROMPTS }] : []),
];

export function SuggestedPrompts({
  onSelect,
  disabled,
}: {
  onSelect: (prompt: string) => void;
  disabled: boolean;
}) {
  return (
    <div className="flex flex-col items-center mt-8 gap-6 px-4">
      <div className="text-center">
        <h2 className="text-lg font-semibold text-gray-700">What can I help you with?</h2>
        <p className="text-sm text-gray-400 mt-1">Try one of these or type your own below</p>
      </div>
      {SECTIONS.map(({ title, prompts }) => (
        <div key={title} className="w-full max-w-lg">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">{title}</p>
          <div className="grid grid-cols-2 gap-2">
            {prompts.map((prompt) => (
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
      ))}
    </div>
  );
}
