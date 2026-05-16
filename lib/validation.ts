import type { AppMode } from "@/types/domain";

export function isAppMode(value: unknown): value is AppMode {
  return value === "life_english" || value === "sports_action";
}

export function parseAppMode(value: unknown): AppMode {
  if (isAppMode(value)) {
    return value;
  }

  return "life_english";
}

export function assertAnonUserId(value: unknown) {
  if (typeof value !== "string" || value.length < 8 || value.length > 80) {
    throw new Error("Invalid anonUserId");
  }

  return value;
}

export function ensureFile(file: unknown, fieldName: string): File {
  if (!(file instanceof File)) {
    throw new Error(`Missing ${fieldName}`);
  }

  return file;
}

export function ensureImageFile(file: File) {
  if (!file.type.startsWith("image/")) {
    throw new Error("Only image files are supported");
  }

  if (file.size > 6 * 1024 * 1024) {
    throw new Error("Image must be smaller than 6MB");
  }
}
