import { NextResponse } from "next/server";
import {
  canUseLocalStoreFallback,
  hasOpenAICompatibleEnv,
  hasOpenAIEnv,
  hasSupabaseEnv
} from "@/lib/env";

export const runtime = "nodejs";

function envState(name: string) {
  const value = process.env[name];
  return {
    present: Boolean(value),
    length: value?.length ?? 0,
    hasWhitespace: value ? /\s/.test(value) : false
  };
}

export async function GET() {
  return NextResponse.json({
    runtime: "nodejs",
    vercel: process.env.VERCEL === "1",
    nodeEnv: process.env.NODE_ENV,
    canUseLocalStoreFallback: canUseLocalStoreFallback(),
    hasSupabaseEnv: hasSupabaseEnv(),
    hasOpenAIEnv: hasOpenAIEnv(),
    hasOpenAICompatibleEnv: hasOpenAICompatibleEnv(),
    variables: {
      SUPABASE_URL: envState("SUPABASE_URL"),
      SUPABASE_SERVICE_ROLE_KEY: envState("SUPABASE_SERVICE_ROLE_KEY"),
      SUPABASE_MEDIA_BUCKET: envState("SUPABASE_MEDIA_BUCKET"),
      AI_PROVIDER: envState("AI_PROVIDER"),
      AI_BASE_URL: envState("AI_BASE_URL"),
      AI_API_KEY: envState("AI_API_KEY"),
      AI_MODEL: envState("AI_MODEL")
    }
  });
}
