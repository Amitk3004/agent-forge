export type StockOutput = {
  symbol: string;
  price: number;
  change: number;
  changePercent: string;
  open: number;
  high: number;
  low: number;
  volume: number;
  positive: boolean;
};

export function StockCard({ output }: { output: StockOutput }) {
  const changeColor = output.positive ? 'text-emerald-600' : 'text-red-500';
  const changeBg = output.positive ? 'bg-emerald-50' : 'bg-red-50';
  const arrow = output.positive ? '↑' : '↓';

  return (
    <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 w-64 shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-widest text-gray-400 bg-gray-100 rounded-full px-2 py-0.5">
          {output.symbol}
        </span>
        <span className={`text-xs font-semibold rounded-full px-2 py-0.5 ${changeBg} ${changeColor}`}>
          {arrow} {output.changePercent}
        </span>
      </div>

      <div className="flex items-end gap-2">
        <span className="text-4xl font-bold text-gray-900 leading-none">
          ${output.price.toFixed(2)}
        </span>
        <span className={`text-sm font-medium mb-0.5 ${changeColor}`}>
          {output.positive ? '+' : ''}{output.change.toFixed(2)}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-1 pt-1 border-t border-gray-100 text-xs text-gray-500">
        <div className="flex flex-col gap-0.5">
          <span className="uppercase tracking-wide text-gray-400">Open</span>
          <span className="font-medium text-gray-700">${output.open.toFixed(2)}</span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="uppercase tracking-wide text-gray-400">High</span>
          <span className="font-medium text-gray-700">${output.high.toFixed(2)}</span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="uppercase tracking-wide text-gray-400">Low</span>
          <span className="font-medium text-gray-700">${output.low.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}
