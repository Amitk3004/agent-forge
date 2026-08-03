export type WeatherOutput = {
  city: string;
  temperature: number;
  feelsLike?: number;
  unit: string;
  condition: string;
  description?: string;
  humidity?: number;
  windKph?: number;
  windDir?: string;
  uvIndex?: number;
};

const WEATHER_CONFIG: Record<string, { icon: string; gradient: string; textColor: string; subColor: string; statsBg: string }> = {
  sunny:       { icon: '☀️',  gradient: 'from-amber-400 to-orange-400', textColor: 'text-amber-900',  subColor: 'text-amber-800',  statsBg: 'bg-black/10' },
  cloudy:      { icon: '☁️',  gradient: 'from-slate-400 to-gray-500',   textColor: 'text-slate-100',  subColor: 'text-slate-200',  statsBg: 'bg-black/10' },
  rain:        { icon: '🌧️', gradient: 'from-blue-500 to-indigo-600',  textColor: 'text-blue-50',    subColor: 'text-blue-100',   statsBg: 'bg-black/10' },
  rainy:       { icon: '🌧️', gradient: 'from-blue-500 to-indigo-600',  textColor: 'text-blue-50',    subColor: 'text-blue-100',   statsBg: 'bg-black/10' },
  clear:       { icon: '🌤️', gradient: 'from-sky-400 to-blue-500',     textColor: 'text-sky-50',     subColor: 'text-sky-100',    statsBg: 'bg-black/10' },
  'clear sky': { icon: '🌤️', gradient: 'from-sky-400 to-blue-500',     textColor: 'text-sky-50',     subColor: 'text-sky-100',    statsBg: 'bg-black/10' },
  snow:        { icon: '❄️',  gradient: 'from-sky-200 to-blue-300',    textColor: 'text-blue-900',   subColor: 'text-blue-800',   statsBg: 'bg-black/10' },
  snowy:       { icon: '❄️',  gradient: 'from-sky-200 to-blue-300',    textColor: 'text-blue-900',   subColor: 'text-blue-800',   statsBg: 'bg-black/10' },
  thunder:     { icon: '⛈️', gradient: 'from-gray-700 to-slate-800',   textColor: 'text-yellow-300', subColor: 'text-gray-300',   statsBg: 'bg-white/10' },
  storm:       { icon: '⛈️', gradient: 'from-gray-700 to-slate-800',   textColor: 'text-yellow-300', subColor: 'text-gray-300',   statsBg: 'bg-white/10' },
  fog:         { icon: '🌫️', gradient: 'from-gray-300 to-gray-400',    textColor: 'text-gray-800',   subColor: 'text-gray-700',   statsBg: 'bg-black/10' },
  windy:       { icon: '💨',  gradient: 'from-teal-400 to-cyan-500',    textColor: 'text-teal-50',    subColor: 'text-teal-100',   statsBg: 'bg-black/10' },
};

const DEFAULT = { icon: '🌡️', gradient: 'from-blue-400 to-blue-600', textColor: 'text-blue-50', subColor: 'text-blue-100', statsBg: 'bg-black/10' };

export function WeatherCard({ output }: { output: WeatherOutput }) {
  const config = WEATHER_CONFIG[output.condition.toLowerCase()] ?? DEFAULT;
  const unit = output.unit === 'celsius' ? 'C' : 'F';

  const stats = [
    output.feelsLike !== undefined && { label: 'Feels like', value: `${output.feelsLike}°${unit}` },
    output.humidity !== undefined  && { label: 'Humidity',   value: `${output.humidity}%` },
    output.windKph  !== undefined  && { label: 'Wind',       value: `${output.windKph} km/h ${output.windDir ?? ''}`.trim() },
    output.uvIndex  !== undefined  && { label: 'UV Index',   value: String(output.uvIndex) },
  ].filter(Boolean) as { label: string; value: string }[];

  return (
    <div className={`bg-gradient-to-br ${config.gradient} rounded-2xl overflow-hidden w-64 shadow-md`}>
      <div className="px-5 pt-5 pb-4">
        <p className={`text-xs font-semibold uppercase tracking-widest ${config.subColor}`}>
          {output.city}
        </p>
        <div className="flex items-center justify-between mt-2">
          <div>
            <span className={`text-6xl font-bold ${config.textColor} leading-none`}>
              {output.temperature}°
            </span>
            <span className={`text-2xl font-semibold ${config.subColor} ml-1`}>{unit}</span>
          </div>
          <span className="text-6xl leading-none select-none" role="img" aria-label={output.condition}>
            {config.icon}
          </span>
        </div>
        <p className={`mt-3 text-sm font-medium capitalize ${config.subColor}`}>
          {output.description ?? output.condition}
        </p>
      </div>

      {stats.length > 0 && (
        <div className={`${config.statsBg} grid grid-cols-2 gap-px`}>
          {stats.map(({ label, value }) => (
            <div key={label} className="px-4 py-2.5">
              <p className={`text-xs ${config.subColor} opacity-80`}>{label}</p>
              <p className={`text-sm font-semibold ${config.textColor}`}>{value}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
