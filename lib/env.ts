export function getRequiredEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export function hasSupabaseEnv() {
  return Boolean(
    process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

export function hasOpenAIEnv() {
  return Boolean(process.env.OPENAI_API_KEY);
}

export function getAIProvider() {
  return process.env.AI_PROVIDER ?? "openai";
}

export function hasOpenAICompatibleEnv() {
  return Boolean(process.env.AI_BASE_URL && process.env.AI_API_KEY && process.env.AI_MODEL);
}
