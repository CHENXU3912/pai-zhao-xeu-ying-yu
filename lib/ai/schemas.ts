export const recognitionJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["session_id", "input_type", "mode", "summary", "candidates"],
  properties: {
    session_id: { type: "string" },
    input_type: { type: "string", enum: ["image", "video_frames"] },
    mode: { type: "string", enum: ["life_english", "sports_action"] },
    summary: { type: "string" },
    candidates: {
      type: "array",
      minItems: 1,
      maxItems: 6,
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "candidate_id",
          "label_en",
          "label_zh",
          "type",
          "confidence",
          "visual_reason",
          "bbox",
          "recommended_learning_focus"
        ],
        properties: {
          candidate_id: { type: "string" },
          label_en: { type: "string" },
          label_zh: { type: "string" },
          type: { type: "string", enum: ["object", "action", "scene"] },
          confidence: { type: "number", minimum: 0, maximum: 1 },
          visual_reason: { type: "string" },
          bbox: {
            anyOf: [
              {
                type: "object",
                additionalProperties: false,
                required: ["x", "y", "width", "height"],
                properties: {
                  x: { type: "number" },
                  y: { type: "number" },
                  width: { type: "number" },
                  height: { type: "number" }
                }
              },
              { type: "null" }
            ]
          },
          recommended_learning_focus: { type: "string" }
        }
      }
    }
  }
};

export const cardJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "candidate_id",
    "phrase_en",
    "meaning_zh",
    "part_of_speech",
    "ipa",
    "example_en",
    "example_zh",
    "related_expressions",
    "confusables",
    "usage_scenarios",
    "natural_sentence_patterns"
  ],
  properties: {
    candidate_id: { type: "string" },
    phrase_en: { type: "string" },
    meaning_zh: { type: "string" },
    part_of_speech: { type: "string" },
    ipa: { type: "string" },
    example_en: { type: "string" },
    example_zh: { type: "string" },
    related_expressions: {
      type: "array",
      minItems: 1,
      maxItems: 5,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["phrase_en", "meaning_zh"],
        properties: {
          phrase_en: { type: "string" },
          meaning_zh: { type: "string" }
        }
      }
    },
    confusables: {
      type: "array",
      minItems: 1,
      maxItems: 4,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["word_a", "word_b", "difference_zh"],
        properties: {
          word_a: { type: "string" },
          word_b: { type: "string" },
          difference_zh: { type: "string" }
        }
      }
    },
    usage_scenarios: {
      type: "array",
      minItems: 1,
      maxItems: 6,
      items: { type: "string" }
    },
    natural_sentence_patterns: {
      type: "array",
      minItems: 1,
      maxItems: 6,
      items: { type: "string" }
    }
  }
};
