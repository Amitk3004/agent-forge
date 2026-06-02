export type WeatherOutput = { city: string; temperature: number; unit: string; condition: string };

const WEATHER_CONFIG: Record<string, { icon: string; gradient: string; textColor: string; subColor: string }> = {
  sunny:       { icon: '☀️',  gradient: 'from-amber-400 to-orange-400', textColor: 'text-amber-900',  subColor: 'text-amber-800' },
  cloudy:      { icon: '☁️',  gradient: 'from-slate-400 to-gray-500',   textColor: 'text-slate-100',  subColor: 'text-slate-200' },
  rain:        { icon: '🌧️', gradient: 'from-blue-500 to-indigo-600',  textColor: 'text-blue-50',    subColor: 'text-blue-100'  },
  rainy:       { icon: '🌧️', gradient: 'from-blue-500 to-indigo-600',  textColor: 'text-blue-50',    subColor: 'text-blue-100'  },
  clear:       { icon: '🌤️', gradient: 'from-sky-400 to-blue-500',     textColor: 'text-sky-50',     subColor: 'text-sky-100'   },
  'clear sky': { icon: '🌤️', gradient: 'from-sky-400 to-blue-500',     textColor: 'text-sky-50',     subColor: 'text-sky-100'   },
  snow:        { icon: '❄️',  gradient: 'from-sky-200 to-blue-300',    textColor: 'text-blue-900',   subColor: 'text-blue-800'  },
  snowy:       { icon: '❄️',  gradient: 'from-sky-200 to-blue-300',    textColor: 'text-blue-900',   subColor: 'text-blue-800'  },
  thunder:     { icon: '⛈️', gradient: 'from-gray-700 to-slate-800',   textColor: 'text-yellow-300', subColor: 'text-gray-300'  },
  storm:       { icon: '⛈️', gradient: 'from-gray-700 to-slate-800',   textColor: 'text-yellow-300', subColor: 'text-gray-300'  },
  fog:         { icon: '🌫️', gradient: 'from-gray-300 to-gray-400',    textColor: 'text-gray-800',   subColor: 'text-gray-700'  },
  windy:       { icon: '💨',  gradient: 'from-teal-400 to-cyan-500',    textColor: 'text-teal-50',    subColor: 'text-teal-100'  },
};

const DEFAULT = { icon: '🌡️', gradient: 'from-blue-400 to-blue-600', textColor: 'text-blue-50', subColor: 'text-blue-100' };

export function WeatherCard({ output }: { output: WeatherOutput }) {
  const config = WEATHER_CONFIG[output.condition.toLowerCase()] ?? DEFAULT;
  const unit = output.unit === 'celsius' ? 'C' : 'F';

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
          {output.condition}
        </p>
      </div>
    </div>
  );
}
