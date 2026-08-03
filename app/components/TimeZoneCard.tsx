export type TimeZoneOutput = {
  city: string;
  timezone: string;
  localTime: string;
  localDate: string;
  utcOffset: string;
  abbreviation: string;
};

export function TimeZoneCard({ output }: { output: TimeZoneOutput }) {
  return (
    <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl overflow-hidden w-64 shadow-md">
      <div className="px-5 pt-5 pb-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-indigo-200">
          {output.city}
        </p>
        <p className="text-5xl font-bold text-white leading-none mt-2">
          {output.localTime}
        </p>
        <p className="text-sm text-indigo-200 mt-2">{output.localDate}</p>
        <div className="flex items-center gap-2 mt-3">
          <span className="bg-white/20 text-white text-xs font-medium rounded-full px-2 py-0.5">
            {output.abbreviation}
          </span>
          <span className="text-indigo-200 text-xs">{output.utcOffset}</span>
        </div>
      </div>
    </div>
  );
}
