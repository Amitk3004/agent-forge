// Shared between the API route and the UI (kept free of AWS SDK imports so the client bundle stays small).

export type GuardrailFinding = {
  policy: 'content' | 'topic' | 'word' | 'pii' | 'regex';
  type: string; // e.g. PROMPT_ATTACK, HATE, a denied-topic name, EMAIL, PROFANITY
  action: 'BLOCKED' | 'ANONYMIZED';
};

// Sent to the client as a `data-guardrail` part on the assistant reply.
// It also lets the route clean up history on later turns (see sanitizeHistory in route.ts).
export type GuardrailData =
  | { action: 'blocked'; message: string; findings: GuardrailFinding[] }
  | { action: 'masked'; maskedText: string; findings: GuardrailFinding[] };
