export function Header({
  onClear,
  disabled,
  showClear,
}: {
  onClear: () => void;
  disabled: boolean;
  showClear: boolean;
}) {
  return (
    <header className="bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between shrink-0">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center text-white text-sm font-bold shadow-sm">
          ⚡
        </div>
        <div>
          <p className="text-sm font-bold text-gray-900 leading-none">AgentForge</p>
          <p className="text-xs text-gray-400 mt-0.5">AI Assistant</p>
        </div>
      </div>
      {showClear && (
      <div className="relative group">
        <button
          onClick={onClear}
          disabled={disabled}
          className="flex items-center gap-1.5 text-xs text-red-500 bg-red-50 hover:bg-red-100 border border-red-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors px-3 py-1.5 rounded-lg font-medium"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
            <path d="M10 11v6M14 11v6" />
            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
          </svg>
          Clear
        </button>
        <div className="absolute right-0 top-full mt-1.5 px-2 py-1 bg-gray-800 text-white text-xs rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          Clear chat
        </div>
      </div>
      )}
    </header>
  );
}
