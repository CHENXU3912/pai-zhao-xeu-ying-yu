import { NextResponse } from "next/server";
import type { SourceType } from "@/types/domain";
import { jsonError } from "@/lib/api";
import { listLearningCards, saveLearningCard } from "@/lib/cards-store";
import { assertAnonUserId, parseAppMode } from "@/lib/validation";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const anonUserId = assertAnonUserId(url.searchParams.get("anonUserId"));
    const modeParam = url.searchParams.get("mode");
    const mode =
      modeParam === "life_english" || modeParam === "sports_action"
        ? modeParam
        : undefined;
    const query = url.searchParams.get("query")?.trim() || undefined;

    const cards = await listLearningCards({ anonUserId, mode, query });
    return NextResponse.json({ cards });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const anonUserId = assertAnonUserId(body.anonUserId);
    const mode = parseAppMode(body.mode);
    const sourceType = (body.sourceType === "video" ? "video" : "image") as SourceType;
    const card = body.card;

    if (typeof card !== "object" || card === null) {
      throw new Error("card is required");
    }

    const saved = await saveLearningCard({
      anonUserId,
      mode,
      sourceType,
      card: card as Parameters<typeof saveLearningCard>[0]["card"]
    });

    return NextResponse.json(saved);
  } catch (error) {
    return jsonError(error);
  }
}
