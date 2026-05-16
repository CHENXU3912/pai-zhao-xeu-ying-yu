import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api";
import { fileToDataUrl } from "@/lib/files";
import { recognizeVisualInput } from "@/lib/ai/provider";
import { saveRecognitionSession } from "@/lib/cards-store";
import {
  assertAnonUserId,
  ensureFile,
  ensureImageFile,
  parseAppMode
} from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const anonUserId = assertAnonUserId(formData.get("anonUserId"));
    const mode = parseAppMode(formData.get("mode"));
    const image = ensureFile(formData.get("image"), "image");
    ensureImageFile(image);

    const result = await recognizeVisualInput({
      mode,
      inputType: "image",
      imageDataUrls: [await fileToDataUrl(image)]
    });

    await saveRecognitionSession(anonUserId, result);

    return NextResponse.json(result);
  } catch (error) {
    return jsonError(error);
  }
}
