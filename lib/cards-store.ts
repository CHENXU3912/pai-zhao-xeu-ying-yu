import type {
  AppMode,
  LearningCard,
  RecognitionCandidate,
  RecognitionResult,
  SourceType,
  StoredLearningCard
} from "@/types/domain";
import {
  deleteLocalLearningCard,
  getLocalLearningCard,
  getLocalRecognitionCandidate,
  listLocalLearningCards,
  saveLocalLearningCard,
  saveLocalRecognitionSession
} from "@/lib/local-store";
import { saveSourceAsset } from "@/lib/media-assets";
import { canUseLocalStoreFallback } from "@/lib/env";
import { getSupabaseAdmin } from "@/lib/supabase/server";

type LearningCardRow = {
  id: string;
  anon_user_id: string;
  mode: AppMode;
  source_type: SourceType;
  source_asset_url: string | null;
  phrase_en: string;
  meaning_zh: string;
  part_of_speech: string | null;
  ipa: string | null;
  example_en: string;
  example_zh: string;
  related_expressions: unknown;
  confusables: unknown;
  usage_scenarios: unknown;
  natural_sentence_patterns?: unknown;
  raw_ai_result: unknown;
  created_at: string;
  updated_at?: string;
};

type RecognitionSessionRow = {
  id: string;
  anon_user_id: string;
  mode: AppMode;
  input_type: string;
  status: string;
  candidates: RecognitionCandidate[];
  selected_candidate_id: string | null;
  error_message: string | null;
  created_at: string;
};

function assertLocalStoreFallback(action: string) {
  if (!canUseLocalStoreFallback()) {
    throw new Error(
      `Supabase is required to ${action} in production. Check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.`
    );
  }
}

function toStoredCard(row: LearningCardRow): StoredLearningCard {
  return {
    id: row.id,
    anon_user_id: row.anon_user_id,
    mode: row.mode,
    source_type: row.source_type,
    source_asset_url: row.source_asset_url,
    candidate_id:
      typeof row.raw_ai_result === "object" &&
      row.raw_ai_result !== null &&
      "candidate_id" in row.raw_ai_result
        ? String(row.raw_ai_result.candidate_id)
        : row.id,
    phrase_en: row.phrase_en,
    meaning_zh: row.meaning_zh,
    part_of_speech: row.part_of_speech ?? "",
    ipa: row.ipa ?? "",
    example_en: row.example_en,
    example_zh: row.example_zh,
    related_expressions: Array.isArray(row.related_expressions)
      ? row.related_expressions
      : [],
    confusables: Array.isArray(row.confusables) ? row.confusables : [],
    usage_scenarios: Array.isArray(row.usage_scenarios)
      ? row.usage_scenarios
      : [],
    natural_sentence_patterns: Array.isArray(row.natural_sentence_patterns)
      ? row.natural_sentence_patterns
      : [],
    is_mock:
      typeof row.raw_ai_result === "object" &&
      row.raw_ai_result !== null &&
      "is_mock" in row.raw_ai_result
        ? Boolean(row.raw_ai_result.is_mock)
        : undefined,
    raw_ai_result: row.raw_ai_result,
    created_at: row.created_at,
    updated_at: row.updated_at
  } as StoredLearningCard;
}

export async function saveRecognitionSession(
  anonUserId: string,
  result: RecognitionResult
) {
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    assertLocalStoreFallback("save recognition sessions");
    return saveLocalRecognitionSession(result);
  }

  const { error } = await supabase.from("recognition_sessions").insert({
    id: result.session_id,
    anon_user_id: anonUserId,
    mode: result.mode,
    input_type: result.input_type,
    status: "completed",
    candidates: result.candidates
  });

  if (error) {
    assertLocalStoreFallback("save recognition sessions");
    console.warn(`Supabase recognition save failed, using local store: ${error.message}`);
    return saveLocalRecognitionSession(result);
  }

  return result.session_id;
}

export async function getRecognitionCandidate({
  anonUserId,
  sessionId,
  candidateId
}: {
  anonUserId: string;
  sessionId: string;
  candidateId: string;
}) {
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    assertLocalStoreFallback("read recognition sessions");
    return getLocalRecognitionCandidate({ sessionId, candidateId });
  }

  const { data, error } = await supabase
    .from("recognition_sessions")
    .select("*")
    .eq("id", sessionId)
    .eq("anon_user_id", anonUserId)
    .single<RecognitionSessionRow>();

  if (error || !data) {
    assertLocalStoreFallback("read recognition sessions");
    console.warn(
      `Supabase recognition lookup failed, using local store: ${
        error?.message ?? "not found"
      }`
    );
    return getLocalRecognitionCandidate({ sessionId, candidateId });
  }

  return data.candidates.find(
    (candidate) => candidate.candidate_id === candidateId
  );
}

export async function saveLearningCard({
  anonUserId,
  mode,
  sourceType,
  card,
  sourceAssetDataUrl
}: {
  anonUserId: string;
  mode: AppMode;
  sourceType: SourceType;
  card: LearningCard;
  sourceAssetDataUrl?: string;
}) {
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    assertLocalStoreFallback("save learning cards");
    const now = new Date().toISOString();
    const stored: StoredLearningCard = {
      ...card,
      id: crypto.randomUUID(),
      anon_user_id: anonUserId,
      mode,
      source_type: sourceType,
      source_asset_url: await saveSourceAsset({
        anonUserId,
        sourceType,
        sourceAssetDataUrl
      }),
      raw_ai_result: card,
      created_at: now,
      updated_at: now
    };
    return saveLocalLearningCard(stored);
  }

  const sourceAssetUrl = await saveSourceAsset({
    anonUserId,
    sourceType,
    sourceAssetDataUrl
  });

  const { data, error } = await supabase
    .from("learning_cards")
    .insert({
      anon_user_id: anonUserId,
      mode,
      source_type: sourceType,
      source_asset_url: sourceAssetUrl,
      phrase_en: card.phrase_en,
      meaning_zh: card.meaning_zh,
      part_of_speech: card.part_of_speech,
      ipa: card.ipa,
      example_en: card.example_en,
      example_zh: card.example_zh,
      related_expressions: card.related_expressions,
      confusables: card.confusables,
      usage_scenarios: card.usage_scenarios,
      natural_sentence_patterns: card.natural_sentence_patterns,
      raw_ai_result: card
    })
    .select("*")
    .single<LearningCardRow>();

  if (error || !data) {
    assertLocalStoreFallback("save learning cards");
    console.warn(
      `Supabase card save failed, using local store: ${
        error?.message ?? "missing saved row"
      }`
    );
    const now = new Date().toISOString();
    return saveLocalLearningCard({
      ...card,
      id: crypto.randomUUID(),
      anon_user_id: anonUserId,
      mode,
      source_type: sourceType,
      source_asset_url: sourceAssetUrl,
      raw_ai_result: card,
      created_at: now,
      updated_at: now
    });
  }

  return toStoredCard(data);
}

export async function listLearningCards({
  anonUserId,
  mode,
  query
}: {
  anonUserId: string;
  mode?: AppMode;
  query?: string;
}) {
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    assertLocalStoreFallback("list learning cards");
    return listLocalLearningCards({ anonUserId, mode, query });
  }

  let request = supabase
    .from("learning_cards")
    .select("*")
    .eq("anon_user_id", anonUserId)
    .order("created_at", { ascending: false });

  if (mode) {
    request = request.eq("mode", mode);
  }

  if (query) {
    request = request.or(`phrase_en.ilike.%${query}%,meaning_zh.ilike.%${query}%`);
  }

  const { data, error } = await request.returns<LearningCardRow[]>();

  if (error) {
    assertLocalStoreFallback("list learning cards");
    console.warn(`Supabase card list failed, using local store: ${error.message}`);
    return listLocalLearningCards({ anonUserId, mode, query });
  }

  return (data ?? []).map(toStoredCard);
}

export async function getLearningCard({
  anonUserId,
  id
}: {
  anonUserId: string;
  id: string;
}) {
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    assertLocalStoreFallback("read learning cards");
    return getLocalLearningCard({ anonUserId, id });
  }

  const { data, error } = await supabase
    .from("learning_cards")
    .select("*")
    .eq("id", id)
    .eq("anon_user_id", anonUserId)
    .single<LearningCardRow>();

  if (error || !data) {
    assertLocalStoreFallback("read learning cards");
    console.warn(
      `Supabase card lookup failed, using local store: ${error?.message ?? "not found"}`
    );
    return getLocalLearningCard({ anonUserId, id });
  }

  return toStoredCard(data);
}

export async function deleteLearningCard({
  anonUserId,
  id
}: {
  anonUserId: string;
  id: string;
}) {
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    assertLocalStoreFallback("delete learning cards");
    return deleteLocalLearningCard({ anonUserId, id });
  }

  const { error } = await supabase
    .from("learning_cards")
    .delete()
    .eq("id", id)
    .eq("anon_user_id", anonUserId);

  if (error) {
    assertLocalStoreFallback("delete learning cards");
    console.warn(`Supabase card delete failed, using local store: ${error.message}`);
    return deleteLocalLearningCard({ anonUserId, id });
  }
}
