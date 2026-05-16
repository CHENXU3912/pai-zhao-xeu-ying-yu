import type {
  AppMode,
  InputType,
  LearningCard,
  RecognitionCandidate,
  RecognitionResult
} from "@/types/domain";
import { assertLearningCard, assertRecognitionResult } from "@/lib/domain-guards";
import { cardPrompt, recognitionPrompt } from "./prompts";
import { cardJsonSchema, recognitionJsonSchema } from "./schemas";

type ResponseOutputItem = {
  type?: string;
  content?: Array<{
    type?: string;
    text?: string;
  }>;
};

type OpenAIResponse = {
  output_text?: string;
  output?: ResponseOutputItem[];
};

function extractOutputText(payload: OpenAIResponse) {
  if (typeof payload.output_text === "string") {
    return payload.output_text;
  }

  const text = payload.output
    ?.flatMap((item) => item.content ?? [])
    .map((content) => content.text)
    .filter(Boolean)
    .join("");

  if (!text) {
    throw new Error("OpenAI response did not include output text");
  }

  return text;
}

async function createStructuredResponse<T>({
  system,
  userContent,
  schema,
  schemaName
}: {
  system: string;
  userContent: Array<Record<string, string>>;
  schema: object;
  schemaName: string;
}): Promise<T> {
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
      input: [
        {
          role: "system",
          content: [{ type: "input_text", text: system }]
        },
        {
          role: "user",
          content: userContent
        }
      ],
      text: {
        format: {
          type: "json_schema",
          name: schemaName,
          schema,
          strict: true
        }
      }
    })
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`OpenAI request failed: ${response.status} ${detail}`);
  }

  const payload = (await response.json()) as OpenAIResponse;
  return JSON.parse(extractOutputText(payload)) as T;
}

export async function recognizeWithOpenAI({
  mode,
  inputType,
  imageDataUrls
}: {
  mode: AppMode;
  inputType: InputType;
  imageDataUrls: string[];
}): Promise<RecognitionResult> {
  const content: Array<Record<string, string>> = [
    {
      type: "input_text",
      text: `Analyze this ${inputType} input and return JSON for mode: ${mode}.`
    },
    ...imageDataUrls.map((imageUrl) => ({
      type: "input_image",
      image_url: imageUrl
    }))
  ];

  const result = await createStructuredResponse<RecognitionResult>({
    system: recognitionPrompt(mode, inputType),
    userContent: content,
    schema: recognitionJsonSchema,
    schemaName: "recognition_result"
  });

  return assertRecognitionResult({
    ...result,
    session_id: result.session_id || crypto.randomUUID(),
    mode,
    input_type: inputType
  });
}

export async function generateCardWithOpenAI({
  mode,
  candidate
}: {
  mode: AppMode;
  candidate: RecognitionCandidate;
}): Promise<LearningCard> {
  const result = await createStructuredResponse<LearningCard>({
    system: cardPrompt(mode, candidate),
    userContent: [
      {
        type: "input_text",
        text: JSON.stringify(candidate)
      }
    ],
    schema: cardJsonSchema,
    schemaName: "learning_card"
  });

  return assertLearningCard({
    ...result,
    candidate_id: candidate.candidate_id
  });
}
