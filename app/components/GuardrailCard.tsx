import { ShieldAlert, ShieldCheck } from 'lucide-react';
import type { GuardrailData, GuardrailFinding } from '@/lib/guardrail-types';

const POLICY_LABELS: Record<GuardrailFinding['policy'], string> = {
  content: 'Content filter',
  topic: 'Denied topic',
  word: 'Word filter',
  pii: 'Sensitive info',
  regex: 'Sensitive info',
};

const pretty = (s: string) => s.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

export function GuardrailCard({ data }: { data: GuardrailData }) {
  const blocked = data.action === 'blocked';

  return (
    <div
      className={`rounded-xl border px-4 py-3 text-sm ${
        blocked ? 'bg-red-50 border-red-200 text-red-800' : 'bg-amber-50 border-amber-200 text-amber-800'
      }`}
    >
      <div className="flex items-center gap-2 font-semibold">
        {blocked ? <ShieldAlert className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
        {blocked ? 'Blocked by guardrail' : 'Sensitive info masked before sending to the model'}
      </div>

      {blocked && <p className="mt-1.5">{data.message}</p>}

      {data.findings.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {data.findings.map((f, i) => (
            <span
              key={i}
              className={`text-xs rounded-full px-2 py-0.5 border ${
                blocked ? 'bg-white border-red-200' : 'bg-white border-amber-200'
              }`}
            >
              {POLICY_LABELS[f.policy]}: {pretty(f.type)}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
