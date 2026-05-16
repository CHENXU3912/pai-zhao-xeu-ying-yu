"use client";

const STORAGE_KEY = "photo-english-anon-user-id";

export function getOrCreateAnonUserId() {
  const existing = window.localStorage.getItem(STORAGE_KEY);

  if (existing) {
    return existing;
  }

  const id = crypto.randomUUID();
  window.localStorage.setItem(STORAGE_KEY, id);
  return id;
}

export function clearAnonUserId() {
  window.localStorage.removeItem(STORAGE_KEY);
}
