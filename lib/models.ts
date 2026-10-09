// Model registry shared by the client (picker + sliders) and the API route.
// The client only ever sends a model `key`; the Bedrock ID stays server-side in effect,
// because the route resolves it from this allowlist.

export type SamplingParam = 'temperature' | 'topP' | 'topK';

export type ParamRange = { min: number; max: number; step: number; default: number };

export type ModelConfig = {
  key: string;
  label: string;
  bedrockId: string;
  // How top-K reaches the model. Converse's standard inferenceConfig has no topK,
  // so each model family takes it in additionalModelRequestFields in its own shape.
  topKField: 'nova' | 'anthropic' | null;
  // Params the model refuses to receive together; only one of them may be set.
  exclusiveParams?: SamplingParam[];
  params: Partial<Record<SamplingParam, ParamRange>>;
};

export const MODELS: ModelConfig[] = [
  {
    key: 'nova-2-lite',
    label: 'Amazon Nova 2 Lite',
    bedrockId: 'global.amazon.nova-2-lite-v1:0',
    topKField: 'nova',
    params: {
      temperature: { min: 0, max: 1, step: 0.05, default: 0.7 },
      topP: { min: 0, max: 1, step: 0.05, default: 0.9 },
      topK: { min: 1, max: 128, step: 1, default: 50 },
    },
  },
  /* {
    key: 'claude-haiku-4.5',
    label: 'Claude Haiku 4.5',
    bedrockId: 'global.anthropic.claude-haiku-4-5-20251001-v1:0',
    topKField: 'anthropic',
    // Haiku 4.5 rejects a request that sets both temperature and topP.
    exclusiveParams: ['temperature', 'topP'],
    params: {
      temperature: { min: 0, max: 1, step: 0.05, default: 1 },
      topP: { min: 0, max: 1, step: 0.05, default: 0.99 },
      topK: { min: 1, max: 500, step: 1, default: 50 },
    },
  }, */
];

export const DEFAULT_MODEL_KEY = MODELS[0].key;

export function getModel(key: string | undefined): ModelConfig {
  return MODELS.find((m) => m.key === key) ?? MODELS[0];
}

// A param that is absent (undefined) is not sent, so the model uses its own default.
export type SamplingSettings = Partial<Record<SamplingParam, number>>;
