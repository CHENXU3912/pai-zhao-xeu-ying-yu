import type { SourceType } from "@/types/domain";
import { canUseLocalStoreFallback } from "@/lib/env";
import { getSupabaseAdmin } from "@/lib/supabase/server";

type ParsedDataUrl = {
  mimeType: string;
  extension: string;
  buffer: Buffer;
};

const MAX_SOURCE_ASSET_BYTES = 6 * 1024 * 1024;
const MEDIA_BUCKET = process.env.SUPABASE_MEDIA_BUCKET ?? "learning-card-media";

function parseImageDataUrl(dataUrl: string): ParsedDataUrl {
  const match = /^data:(image\/(?:jpeg|jpg|png|webp));base64,([a-z0-9+/=\s]+)$/i.exec(
    dataUrl
  );

  if (!match) {
    throw new Error("sourceAssetDataUrl must be a base64 image data URL");
  }

  const mimeType = match[1].toLowerCase().replace("image/jpg", "image/jpeg");
  const buffer = Buffer.from(match[2].replace(/\s/g, ""), "base64");

  if (buffer.byteLength > MAX_SOURCE_ASSET_BYTES) {
    throw new Error("Source image must be smaller than 6MB");
  }

  return {
    mimeType,
    extension: mimeType.split("/")[1] === "jpeg" ? "jpg" : mimeType.split("/")[1],
    buffer
  };
}

export async function saveSourceAsset({
  anonUserId,
  sourceType,
  sourceAssetDataUrl
}: {
  anonUserId: string;
  sourceType: SourceType;
  sourceAssetDataUrl?: string;
}) {
  if (!sourceAssetDataUrl) {
    return null;
  }

  const parsed = parseImageDataUrl(sourceAssetDataUrl);
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    if (!canUseLocalStoreFallback()) {
      throw new Error("Supabase Storage is required to save source images in production.");
    }

    return sourceAssetDataUrl;
  }

  const storagePath = `${anonUserId}/${Date.now()}-${crypto.randomUUID()}.${
    parsed.extension
  }`;
  const { error: uploadError } = await supabase.storage
    .from(MEDIA_BUCKET)
    .upload(storagePath, parsed.buffer, {
      contentType: parsed.mimeType,
      upsert: false
    });

  if (uploadError) {
    if (!canUseLocalStoreFallback()) {
      throw new Error(`Failed to upload source image: ${uploadError.message}`);
    }

    console.warn(
      `Supabase source image upload failed, using local data URL: ${uploadError.message}`
    );
    return sourceAssetDataUrl;
  }

  const { error: insertError } = await supabase.from("media_assets").insert({
    anon_user_id: anonUserId,
    source_type: sourceType === "video" ? "video_frame" : "image",
    storage_path: storagePath,
    mime_type: parsed.mimeType,
    size_bytes: parsed.buffer.byteLength
  });

  if (insertError) {
    console.warn(
      `Supabase source image metadata save failed: ${insertError.message}`
    );
  }

  return supabase.storage.from(MEDIA_BUCKET).getPublicUrl(storagePath).data.publicUrl;
}
