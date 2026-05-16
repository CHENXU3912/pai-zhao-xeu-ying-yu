import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api";
import { fileToDataUrl } from "@/lib/files";
import { recognizeVisualInput } from "@/lib/ai/provider";
import { saveRecognitionSession } from "@/lib/cards-store";
import {
  assertAnonUserId,
  ensureImageFile,
  parseAppMode
} from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const anonUserId = assertAnonUserId(formData.get("anonUserId"));
    const mode = parseAppMode(formData.get("mode"));
    const frames = formData
      .getAll("frames")
      .filter((frame): frame is File => frame instanceof File);

    if (frames.length < 1 || frames.length > 5) {
      throw new Error("Upload 1 to 5 video frames");
    }

    for (const frame of frames) {
      ensureImageFile(frame);
    }

    const result = await recognizeVisualInput({
      mode,
      inputType: "video_frames",
      imageDataUrls: await Promise.all(frames.map(fileToDataUrl))
    });

    await saveRecognitionSession(anonUserId, result);

    return NextResponse.json(result);
  } catch (error) {
    return jsonError(error);
  }
}
