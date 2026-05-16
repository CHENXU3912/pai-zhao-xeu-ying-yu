import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api";
import { deleteLearningCard, getLearningCard } from "@/lib/cards-store";
import { assertAnonUserId } from "@/lib/validation";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const url = new URL(request.url);
    const anonUserId = assertAnonUserId(url.searchParams.get("anonUserId"));
    const card = await getLearningCard({ anonUserId, id });

    if (!card) {
      return NextResponse.json({ error: "Card not found" }, { status: 404 });
    }

    return NextResponse.json(card);
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const url = new URL(request.url);
    const anonUserId = assertAnonUserId(url.searchParams.get("anonUserId"));
    await deleteLearningCard({ anonUserId, id });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
