'use client';

import { useState } from 'react';
import { MODELS, getModel, type SamplingParam, type SamplingSettings } from '@/lib/models';

const PARAM_LABELS: Record<SamplingParam, { label: string; hint: string }> = {
  temperature: { label: 'Temperature', hint: 'Higher = more random, lower = more focused' },
  topP: { label: 'Top P', hint: 'Sample only from the smallest token set whose probability sums to P' },
  topK: { label: 'Top K', hint: 'Sample only from the K most likely tokens' },
};

export function SettingsPanel({
  modelKey,
  settings,
  onModelChange,
  onSettingsChange,
  disabled,
}: {
  modelKey: string;
  settings: SamplingSettings;
  onModelChange: (key: string) => void;
  onSettingsChange: (settings: SamplingSettings) => void;
  disabled: boolean;
}) {
  const [open, setOpen] = useState(false);
  const model = getModel(modelKey);

  const setParam = (param: SamplingParam, value: number | undefined) => {
    const next = { ...settings };
    if (value === undefined) delete next[param];
    else next[param] = value;
    // Turning on one of a mutually exclusive pair turns the others off.
    if (value !== undefined && model.exclusiveParams?.includes(param)) {
      for (const other of model.exclusiveParams) if (other !== param) delete next[other];
    }
    onSettingsChange(next);
  };

  const summary = (Object.keys(model.params) as SamplingParam[])
    .map((p) => `${PARAM_LABELS[p].label} ${settings[p] ?? 'default'}`)
    .join(' · ');

  return (
    <div className="border-b border-gray-100 bg-gray-50 px-4 py-2 shrink-0 text-xs">
      <div className="flex items-center gap-2">
        <select
          value={modelKey}
          onChange={(e) => onModelChange(e.target.value)}
          disabled={disabled}
          className="border border-gray-300 rounded-md px-2 py-1 bg-white text-gray-700 disabled:opacity-50"
        >
          {MODELS.map((m) => (
            <option key={m.key} value={m.key}>{m.label}</option>
          ))}
        </select>
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex-1 text-left text-gray-500 hover:text-gray-700 truncate"
          title="Sampling settings"
        >
          {open ? '▾' : '▸'} {summary}
        </button>
      </div>

      {open && (
        <div className="mt-3 space-y-3 pb-1">
          {(Object.entries(model.params) as [SamplingParam, NonNullable<typeof model.params[SamplingParam]>][]).map(
            ([param, range]) => {
              const enabled = settings[param] !== undefined;
              const value = settings[param] ?? range.default;
              return (
                <div key={param}>
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-1.5 font-medium text-gray-700">
                      <input
                        type="checkbox"
                        checked={enabled}
                        disabled={disabled}
                        onChange={(e) => setParam(param, e.target.checked ? range.default : undefined)}
                      />
                      {PARAM_LABELS[param].label}
                    </label>
                    <span className="font-mono text-gray-600">{enabled ? value : 'model default'}</span>
                  </div>
                  <input
                    type="range"
                    min={range.min}
                    max={range.max}
                    step={range.step}
                    value={value}
                    disabled={disabled || !enabled}
                    onChange={(e) => setParam(param, Number(e.target.value))}
                    className="w-full accent-blue-600 disabled:opacity-40"
                  />
                  <p className="text-gray-400">{PARAM_LABELS[param].hint}</p>
                </div>
              );
            },
          )}
          {model.exclusiveParams && (
            <p className="text-amber-600">
              {model.label} accepts only one of {model.exclusiveParams.map((p) => PARAM_LABELS[p].label).join(' / ')} at a time.
            </p>
          )}
          <button
            onClick={() => onSettingsChange({})}
            disabled={disabled}
            className="text-blue-600 hover:underline disabled:opacity-50"
          >
            Reset all to model defaults
          </button>
        </div>
      )}
    </div>
  );
}
