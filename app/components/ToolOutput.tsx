import { type DynamicToolUIPart, type UITools, type ToolUIPart, getToolName } from 'ai';
import { WeatherCard, type WeatherOutput } from './WeatherCard';
import { SearchCard, type SearchOutput } from './SearchCard';

export function ToolOutput({ part }: { part: ToolUIPart<UITools> | DynamicToolUIPart }) {
  const toolName = getToolName(part);

  if (part.state === 'output-error') {
    return <p className="text-xs text-red-500 px-1">{toolName} failed: {part.errorText}</p>;
  }

  if (part.state === 'output-available') {
    switch (toolName) {
      case 'getWeather':        return <WeatherCard output={part.output as WeatherOutput} />;
      case 'webSearch':         return <SearchCard output={part.output as SearchOutput} />;
      case 'getCurrentDateTime': return null;
      default:
        return (
          <pre className="bg-gray-100 rounded-xl px-4 py-3 text-xs overflow-auto">
            {JSON.stringify(part.output, null, 2)}
          </pre>
        );
    }
  }

  return null;
}
