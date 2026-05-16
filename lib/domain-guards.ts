import type {
  AppMode,
  CandidateType,
  InputType,
  LearningCard,
  RecognitionCandidate,
  RecognitionResult
} from "@/types/domain";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isAppModeValue(value: unknown): value is AppMode {
  return value === "life_english" || value === "sports_action";
}

function isInputTypeValue(value: unknown): value is InputType {
  return value === "image" || value === "video_frames";
}

function isCandidateTypeValue(value: unknown): value is CandidateType {
  return value === "object" || value === "action" || value === "scene";
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(isString);
}

function isRecognitionCandidate(value: unknown): value is RecognitionCandidate {
  if (!isRecord(value)) {
    return false;
  }

  const bbox = value.bbox;
  const validBox =
    bbox === null ||
    (isRecord(bbox) &&
      isNumber(bbox.x) &&
      isNumber(bbox.y) &&
      isNumber(bbox.width) &&
      isNumber(bbox.height));

  return (
    isString(value.candidate_id) &&
    isString(value.label_en) &&
    isString(value.label_zh) &&
    isCandidateTypeValue(value.type) &&
    isNumber(value.confidence) &&
    value.confidence >= 0 &&
    value.confidence <= 1 &&
    isString(value.visual_reason) &&
    validBox &&
    isString(value.recommended_learning_focus)
  );
}

export function assertRecognitionCandidate(value: unknown): RecognitionCandidate {
  if (!isRecognitionCandidate(value)) {
    throw new Error("Recognition candidate has invalid shape");
  }

  return value;
}

function isRelatedExpression(value: unknown) {
  return (
    isRecord(value) &&
    isString(value.phrase_en) &&
    isString(value.meaning_zh)
  );
}

function isConfusable(value: unknown) {
  return (
    isRecord(value) &&
    isString(value.word_a) &&
    isString(value.word_b) &&
    isString(value.difference_zh)
  );
}

export function assertRecognitionResult(value: unknown): RecognitionResult {
  if (!isRecord(value)) {
    throw new Error("Recognition result must be an object");
  }

  if (
    !isString(value.session_id) ||
    !isInputTypeValue(value.input_type) ||
    !isAppModeValue(value.mode) ||
    !isString(value.summary) ||
    !Array.isArray(value.candidates) ||
    value.candidates.length < 1 ||
    !value.candidates.every(isRecognitionCandidate)
  ) {
    throw new Error("Recognition result has invalid shape");
  }

  return value as RecognitionResult;
}

export function assertLearningCard(value: unknown): LearningCard {
  if (!isRecord(value)) {
    throw new Error("Learning card must be an object");
  }

  if (
    !isString(value.candidate_id) ||
    !isString(value.phrase_en) ||
    !isString(value.meaning_zh) ||
    !isString(value.part_of_speech) ||
    !isString(value.ipa) ||
    !isString(value.example_en) ||
    !isString(value.example_zh) ||
    !Array.isArray(value.related_expressions) ||
    !value.related_expressions.every(isRelatedExpression) ||
    !Array.isArray(value.confusables) ||
    !value.confusables.every(isConfusable) ||
    !isStringArray(value.usage_scenarios) ||
    !isStringArray(value.natural_sentence_patterns)
  ) {
    throw new Error("Learning card has invalid shape");
  }

  return value as LearningCard;
}
