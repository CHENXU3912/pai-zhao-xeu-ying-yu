import type {
  AppMode,
  InputType,
  LearningCard,
  RecognitionCandidate,
  RecognitionResult
} from "@/types/domain";
import { assertLearningCard, assertRecognitionResult } from "@/lib/domain-guards";
import { cardPrompt, recognitionPrompt } from "./prompts";

type ChatMessageContent =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } };

type ChatCompletionResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
};

function stripJsonFence(text: string) {
  return text
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

function parseJsonOutput<T>(text: string): T {
  return JSON.parse(stripJsonFence(text)) as T;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readString(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return "";
}

function readNumber(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
    if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) {
      return Number(value);
    }
  }

  return undefined;
}

function normalizeCandidate(
  value: unknown,
  index: number,
  inputType: InputType
): RecognitionCandidate | null {
  if (!isRecord(value)) {
    return null;
  }

  const labelEn = readString(value, [
    "label_en",
    "phrase_en",
    "name_en",
    "english",
    "object_en",
    "action_en",
    "label",
    "name",
    "object",
    "action",
    "scene"
  ]);
  const labelZh =
    readString(value, [
      "label_zh",
      "meaning_zh",
      "name_zh",
      "chinese",
      "zh",
      "translation",
      "object_zh",
      "action_zh"
    ]) || labelEn;

  if (!labelEn || !labelZh) {
    return null;
  }

  const type = value.type;
  const candidateType =
    type === "object" || type === "action" || type === "scene"
      ? type
      : inputType === "video_frames"
        ? "action"
        : "object";
  const confidence = Math.max(
    0,
    Math.min(1, readNumber(value, ["confidence", "score", "probability"]) ?? 0.7)
  );
  const bbox = isRecord(value.bbox)
    ? {
        x: readNumber(value.bbox, ["x"]) ?? 0,
        y: readNumber(value.bbox, ["y"]) ?? 0,
        width: readNumber(value.bbox, ["width", "w"]) ?? 0,
        height: readNumber(value.bbox, ["height", "h"]) ?? 0
      }
    : null;

  return {
    candidate_id: readString(value, ["candidate_id", "id"]) || `c${index + 1}`,
    label_en: labelEn,
    label_zh: labelZh,
    type: candidateType,
    confidence,
    visual_reason:
      readString(value, ["visual_reason", "reason", "description"]) ||
      "Visible in the uploaded image.",
    bbox,
    recommended_learning_focus:
      readString(value, [
        "recommended_learning_focus",
        "learning_focus",
        "focus"
      ]) || `natural English use of "${labelEn}"`
  };
}

function extractCandidateList(value: unknown) {
  if (Array.isArray(value)) {
    return value;
  }

  if (!isRecord(value)) {
    return [];
  }

  for (const key of ["candidates", "items", "objects", "results"]) {
    const candidateValue = value[key];
    if (Array.isArray(candidateValue)) {
      return candidateValue;
    }
  }

  return [];
}

function normalizeRecognitionResult({
  raw,
  mode,
  inputType
}: {
  raw: unknown;
  mode: AppMode;
  inputType: InputType;
}) {
  const record = isRecord(raw) ? raw : {};
  const candidates = extractCandidateList(raw)
    .map((candidate, index) => normalizeCandidate(candidate, index, inputType))
    .filter((candidate): candidate is RecognitionCandidate => Boolean(candidate))
    .slice(0, 6);

  return assertRecognitionResult({
    session_id: readString(record, ["session_id"]) || crypto.randomUUID(),
    input_type: inputType,
    mode,
    summary:
      readString(record, ["summary", "description"]) ||
      "A visual input with learnable English expressions.",
    candidates
  });
}

function normalizeRelatedExpressions(value: unknown, phraseEn: string) {
  if (!Array.isArray(value)) {
    return [{ phrase_en: phraseEn, meaning_zh: "相关表达" }];
  }

  const normalized = value
    .map((item) => {
      if (!isRecord(item)) {
        return null;
      }

      const phrase = readString(item, ["phrase_en", "phrase", "expression", "word"]);
      const meaning = readString(item, ["meaning_zh", "meaning", "translation", "zh"]);

      if (!phrase || !meaning) {
        return null;
      }

      return { phrase_en: phrase, meaning_zh: meaning };
    })
    .filter((item): item is { phrase_en: string; meaning_zh: string } =>
      Boolean(item)
    );

  return normalized.length ? normalized : [{ phrase_en: phraseEn, meaning_zh: "相关表达" }];
}

function normalizeConfusables(value: unknown, phraseEn: string) {
  if (!Array.isArray(value)) {
    return [
      {
        word_a: phraseEn,
        word_b: "similar expression",
        difference_zh: "注意根据具体语境区分。"
      }
    ];
  }

  const normalized = value
    .map((item) => {
      if (!isRecord(item)) {
        return null;
      }

      const wordA = readString(item, ["word_a", "a", "phrase_a"]) || phraseEn;
      const wordB = readString(item, ["word_b", "b", "phrase_b", "similar_word"]);
      const difference = readString(item, [
        "difference_zh",
        "difference",
        "explanation"
      ]);

      if (!wordB || !difference) {
        return null;
      }

      return { word_a: wordA, word_b: wordB, difference_zh: difference };
    })
    .filter(
      (item): item is { word_a: string; word_b: string; difference_zh: string } =>
        Boolean(item)
    );

  return normalized.length
    ? normalized
    : [
        {
          word_a: phraseEn,
          word_b: "similar expression",
          difference_zh: "注意根据具体语境区分。"
        }
      ];
}

function normalizeStringArray(value: unknown, fallback: string[]) {
  if (!Array.isArray(value)) {
    return fallback;
  }

  const normalized = value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean);

  return normalized.length ? normalized : fallback;
}

function normalizeLearningCard(raw: unknown, candidate: RecognitionCandidate) {
  const record = isRecord(raw) ? raw : {};
  const phraseEn =
    readString(record, ["phrase_en", "label_en", "word", "phrase"]) ||
    candidate.label_en;
  const meaningZh =
    readString(record, ["meaning_zh", "label_zh", "meaning", "translation"]) ||
    candidate.label_zh;

  return assertLearningCard({
    candidate_id: candidate.candidate_id,
    phrase_en: phraseEn,
    meaning_zh: meaningZh,
    part_of_speech: readString(record, ["part_of_speech", "pos"]) || "phrase",
    ipa: readString(record, ["ipa", "phonetic"]) || "/-/",
    example_en:
      readString(record, ["example_en", "example_sentence", "sentence_en"]) ||
      `I can see a ${phraseEn}.`,
    example_zh:
      readString(record, ["example_zh", "sentence_zh"]) ||
      `我能看到${meaningZh}。`,
    related_expressions: normalizeRelatedExpressions(
      record.related_expressions,
      phraseEn
    ),
    confusables: normalizeConfusables(record.confusables, phraseEn),
    usage_scenarios: normalizeStringArray(record.usage_scenarios, [
      "daily life"
    ]),
    natural_sentence_patterns: normalizeStringArray(
      record.natural_sentence_patterns,
      [`Use "${phraseEn}" in a natural sentence.`]
    )
  });
}

function getCompatibleConfig() {
  const baseUrl = process.env.AI_BASE_URL;
  const apiKey = process.env.AI_API_KEY;
  const model = process.env.AI_MODEL;

  if (!baseUrl || !apiKey || !model) {
    throw new Error("AI_BASE_URL, AI_API_KEY and AI_MODEL are required");
  }

  return {
    baseUrl: baseUrl.replace(/\/$/, ""),
    apiKey,
    model
  };
}

async function chatJson<T>({
  system,
  content
}: {
  system: string;
  content: ChatMessageContent[];
}) {
  const { baseUrl, apiKey, model } = getCompatibleConfig();
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: "system",
          content: [
            system,
            "Return valid JSON only. Do not wrap it in Markdown.",
            "Use the exact requested keys. Do not rename fields."
          ].join("\n")
        },
        {
          role: "user",
          content
        }
      ],
      temperature: 0.2
    })
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Compatible AI request failed: ${response.status} ${detail}`);
  }

  const payload = (await response.json()) as ChatCompletionResponse;
  const text = payload.choices?.[0]?.message?.content;

  if (!text) {
    throw new Error("Compatible AI response did not include message content");
  }

  return parseJsonOutput<T>(text);
}

export async function recognizeWithOpenAICompatible({
  mode,
  inputType,
  imageDataUrls
}: {
  mode: AppMode;
  inputType: InputType;
  imageDataUrls: string[];
}): Promise<RecognitionResult> {
  const prompt = [
    `Analyze this ${inputType} input and return JSON for mode: ${mode}.`,
    "Use exactly this JSON shape:",
    JSON.stringify({
      session_id: "string",
      input_type: inputType,
      mode,
      summary: "A short English description of the scene.",
      candidates: [
        {
          candidate_id: "c1",
          label_en: "foam roller",
          label_zh: "泡沫轴",
          type: "object",
          confidence: 0.82,
          visual_reason: "Why this candidate is visible.",
          bbox: null,
          recommended_learning_focus: "common fitness equipment name"
        }
      ]
    })
  ].join("\n");

  const result = await chatJson<unknown>({
    system: recognitionPrompt(mode, inputType),
    content: [
      { type: "text", text: prompt },
      ...imageDataUrls.map((imageUrl) => ({
        type: "image_url" as const,
        image_url: { url: imageUrl }
      }))
    ]
  });

  return normalizeRecognitionResult({ raw: result, mode, inputType });
}

export async function generateCardWithOpenAICompatible({
  mode,
  candidate
}: {
  mode: AppMode;
  candidate: RecognitionCandidate;
}): Promise<LearningCard> {
  const result = await chatJson<unknown>({
    system: cardPrompt(mode, candidate),
    content: [
      {
        type: "text",
        text: [
          "Create one learning card for this candidate.",
          JSON.stringify(candidate),
          "Use exactly this JSON shape:",
          JSON.stringify({
            candidate_id: candidate.candidate_id,
            phrase_en: candidate.label_en,
            meaning_zh: candidate.label_zh,
            part_of_speech: "noun",
            ipa: "/example/",
            example_en: "A natural sentence.",
            example_zh: "中文翻译。",
            related_expressions: [
              { phrase_en: "related phrase", meaning_zh: "中文意思" }
            ],
            confusables: [
              {
                word_a: candidate.label_en,
                word_b: "similar word",
                difference_zh: "中文辨析。"
              }
            ],
            usage_scenarios: ["school", "daily life"],
            natural_sentence_patterns: ["Use it in a natural sentence."]
          })
        ].join("\n")
      }
    ]
  });

  return normalizeLearningCard(result, candidate);
}
