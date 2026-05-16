import type {
  AppMode,
  InputType,
  LearningCard,
  RecognitionCandidate,
  RecognitionResult
} from "@/types/domain";
import { getAIProvider, hasOpenAICompatibleEnv, hasOpenAIEnv } from "@/lib/env";
import { mockCard, mockRecognize } from "./mock-provider";
import {
  generateCardWithOpenAICompatible,
  recognizeWithOpenAICompatible
} from "./openai-compatible-provider";
import { generateCardWithOpenAI, recognizeWithOpenAI } from "./openai-provider";

export async function recognizeVisualInput({
  mode,
  inputType,
  imageDataUrls
}: {
  mode: AppMode;
  inputType: InputType;
  imageDataUrls: string[];
}): Promise<RecognitionResult> {
  const provider = getAIProvider();

  if (provider !== "openai" && hasOpenAICompatibleEnv()) {
    try {
      return await recognizeWithOpenAICompatible({ mode, inputType, imageDataUrls });
    } catch (error) {
      console.error(error);
      return mockRecognize(mode, inputType);
    }
  }

  if (!hasOpenAIEnv()) {
    return mockRecognize(mode, inputType);
  }

  try {
    return await recognizeWithOpenAI({ mode, inputType, imageDataUrls });
  } catch (error) {
    console.error(error);
    return mockRecognize(mode, inputType);
  }
}

export async function generateLearningCard({
  mode,
  candidate
}: {
  mode: AppMode;
  candidate: RecognitionCandidate;
}): Promise<LearningCard> {
  const provider = getAIProvider();

  if (provider !== "openai" && hasOpenAICompatibleEnv()) {
    try {
      return await generateCardWithOpenAICompatible({ mode, candidate });
    } catch (error) {
      console.error(error);
      return mockCard(mode, candidate);
    }
  }

  if (!hasOpenAIEnv()) {
    return mockCard(mode, candidate);
  }

  try {
    return await generateCardWithOpenAI({ mode, candidate });
  } catch (error) {
    console.error(error);
    return mockCard(mode, candidate);
  }
}
