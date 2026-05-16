import type { AppMode, InputType, RecognitionCandidate } from "@/types/domain";

export function getModeInstruction(mode: AppMode) {
  if (mode === "sports_action") {
    return [
      "Focus on sports actions, training equipment, PE classroom language, and coaching expressions.",
      "Prefer natural verb phrases for actions, for example 'do a squat', 'shoot a basketball', or 'stretch your hamstrings'.",
      "When multiple expressions are possible, choose the one most likely to be used by coaches, athletes, or PE teachers."
    ].join(" ");
  }

  return [
    "Focus on everyday objects, actions, and scenes that an English learner would encounter in real life.",
    "Prefer natural everyday English over literal dictionary labels.",
    "When a phrase is more common than a single noun, return the phrase."
  ].join(" ");
}

export function recognitionPrompt(mode: AppMode, inputType: InputType) {
  return [
    "You are an English learning assistant with strong visual understanding.",
    "Identify visible objects, actions, or scenes, but optimize the result for learning real English.",
    getModeInstruction(mode),
    inputType === "video_frames"
      ? "The images are frames from one short video. Infer the likely action sequence from all frames together."
      : "The image is one user-captured photo.",
    "Return 3 to 6 useful learning candidates when possible.",
    "Use Chinese only for Chinese explanation fields."
  ].join(" ");
}

export function cardPrompt(mode: AppMode, candidate: RecognitionCandidate) {
  return [
    "Create one English learning card for the selected visual candidate.",
    getModeInstruction(mode),
    `Selected candidate: ${candidate.label_en} (${candidate.label_zh}).`,
    `Visual reason: ${candidate.visual_reason}`,
    "Make the English example natural and concrete.",
    "The card must teach how this word or phrase is actually used, not just define it.",
    "Use Chinese only for Chinese explanation fields."
  ].join(" ");
}
