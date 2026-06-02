import { type UIMessage, isToolUIPart, getToolName } from 'ai';

const TOOL_LABELS: Record<string, string> = {
  webSearch: 'Searching the web',
  getWeather: 'Fetching weather',
  getNews: 'Fetching news',
};

export function StatusIndicator({ messages, status }: { messages: UIMessage[]; status: string }) {
  if (status !== 'streaming' && status !== 'submitted') return null;

  const lastMsg = messages.at(-1);
  const activeTool =
    lastMsg?.role === 'assistant'
      ? lastMsg.parts.findLast(
          (p) => isToolUIPart(p) && (p.state === 'input-streaming' || p.state === 'input-available'),
        )
      : undefined;

  const label =
    activeTool && isToolUIPart(activeTool)
      ? (TOOL_LABELS[getToolName(activeTool)] ?? `Running ${getToolName(activeTool)}`)
      : 'Thinking';

  return (
    <div className="flex justify-start">
      <div className="bg-white border border-gray-200 px-4 py-2 rounded-2xl rounded-bl-sm text-sm text-gray-500 flex items-center gap-2">
        <span className="inline-flex gap-1">
          <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0ms]" />
          <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]" />
          <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]" />
        </span>
        {label}…
      </div>
    </div>
  );
}
