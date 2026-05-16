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
          content: `${system}\nReturn valid JSON only. Do not wrap it in Markdown.`
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

  const result = await chatJson<RecognitionResult>({
    system: recognitionPrompt(mode, inputType),
    content: [
      { type: "text", text: prompt },
      ...imageDataUrls.map((imageUrl) => ({
        type: "image_url" as const,
        image_url: { url: imageUrl }
      }))
    ]
  });

  return assertRecognitionResult({
    ...result,
    session_id: result.session_id || crypto.randomUUID(),
    input_type: inputType,
    mode
  });
}

export async function generateCardWithOpenAICompatible({
  mode,
  candidate
}: {
  mode: AppMode;
  candidate: RecognitionCandidate;
}): Promise<LearningCard> {
  const result = await chatJson<LearningCard>({
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

  return assertLearningCard({
    ...result,
    candidate_id: candidate.candidate_id
  });
}
