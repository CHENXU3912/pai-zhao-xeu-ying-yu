import { NextResponse } from "next/server";
import type { RecognitionCandidate } from "@/types/domain";
import { jsonError } from "@/lib/api";
import { generateLearningCard } from "@/lib/ai/provider";
import { getRecognitionCandidate } from "@/lib/cards-store";
import { assertRecognitionCandidate } from "@/lib/domain-guards";
import { assertAnonUserId, parseAppMode } from "@/lib/validation";

export const runtime = "nodejs";

function isCandidate(value: unknown): value is RecognitionCandidate {
  try {
    assertRecognitionCandidate(value);
    return true;
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const anonUserId = assertAnonUserId(body.anonUserId);
    const mode = parseAppMode(body.mode);
    const sessionId = String(body.sessionId ?? "");
    const candidateId = String(body.candidateId ?? "");

    if (!sessionId || !candidateId) {
      throw new Error("sessionId and candidateId are required");
    }

    const candidate =
      (await getRecognitionCandidate({ anonUserId, sessionId, candidateId })) ??
      (isCandidate(body.candidate) ? body.candidate : undefined);

    if (!candidate) {
      throw new Error("Candidate not found");
    }

    const card = await generateLearningCard({ mode, candidate });
    return NextResponse.json(card);
  } catch (error) {
    return jsonError(error);
  }
}
