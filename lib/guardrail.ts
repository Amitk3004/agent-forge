import {
  ApplyGuardrailCommand,
  BedrockRuntimeClient,
  type GuardrailAssessment,
} from '@aws-sdk/client-bedrock-runtime';
import type { GuardrailData, GuardrailFinding } from './guardrail-types';

const guardrailId = process.env.BEDROCK_GUARDRAIL_ID;
const guardrailVersion = process.env.BEDROCK_GUARDRAIL_VERSION;

// Both env vars must be set; otherwise input checks are skipped.
export const GUARDRAIL_ENABLED = Boolean(guardrailId && guardrailVersion);

// Picks up AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY from the environment, like the model call.
const client = new BedrockRuntimeClient({ region: process.env.AWS_REGION ?? 'ap-south-1' });

function collectFindings(assessments: GuardrailAssessment[] = []): GuardrailFinding[] {
  const findings: GuardrailFinding[] = [];
  const push = (policy: GuardrailFinding['policy'], type: string | undefined, action: string | undefined) => {
    if (action === 'BLOCKED' || action === 'ANONYMIZED') findings.push({ policy, type: type ?? 'UNKNOWN', action });
  };

  for (const a of assessments) {
    a.contentPolicy?.filters?.forEach((f) => push('content', f.type, f.action));
    a.topicPolicy?.topics?.forEach((t) => push('topic', t.name, t.action));
    a.wordPolicy?.customWords?.forEach((w) => push('word', w.match, w.action));
    a.wordPolicy?.managedWordLists?.forEach((w) => push('word', w.type, w.action));
    a.sensitiveInformationPolicy?.piiEntities?.forEach((p) => push('pii', p.type, p.action));
    a.sensitiveInformationPolicy?.regexes?.forEach((r) => push('regex', r.name, r.action));
  }
  return findings;
}

// Checks one user message against the guardrail. Returns null when the message passes.
export async function checkInput(text: string): Promise<GuardrailData | null> {
  const res = await client.send(
    new ApplyGuardrailCommand({
      guardrailIdentifier: guardrailId,
      guardrailVersion,
      source: 'INPUT',
      content: [{ text: { text } }],
    }),
  );

  if (res.action !== 'GUARDRAIL_INTERVENED') return null;

  const findings = collectFindings(res.assessments);
  const output = res.outputs?.map((o) => o.text ?? '').join('') ?? '';

  // If every finding is a PII mask, the guardrail rewrote the text instead of blocking it.
  const onlyMasked = findings.length > 0 && findings.every((f) => f.action === 'ANONYMIZED');
  if (onlyMasked) return { action: 'masked', maskedText: output, findings };

  return { action: 'blocked', message: output || 'This request was blocked by a guardrail.', findings };
}
