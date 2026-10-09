// Shared AWS settings for the Bedrock model client and the Guardrails client.
//
// Vercel reserves AWS_REGION / AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY / AWS_SESSION_TOKEN
// (its functions run on AWS and set them to Vercel's own values), so we read BEDROCK_* names.
// AWS_REGION is deliberately never read: on Vercel it points at Vercel's region, not ours.

export const awsRegion = process.env.BEDROCK_REGION ?? 'ap-south-1';

const accessKeyId = process.env.BEDROCK_ACCESS_KEY_ID;
const secretAccessKey = process.env.BEDROCK_SECRET_ACCESS_KEY;

// Explicit keys when BEDROCK_* are set (Vercel); otherwise undefined, and each SDK falls back
// to its default lookup — e.g. AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY in .env.local.
export const awsCredentials =
  accessKeyId && secretAccessKey ? { accessKeyId, secretAccessKey } : undefined;
