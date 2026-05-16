import type {
  AppMode,
  InputType,
  LearningCard,
  RecognitionCandidate,
  RecognitionResult
} from "@/types/domain";

function lifeCandidates(): RecognitionCandidate[] {
  return [
    {
      candidate_id: "c1",
      label_en: "water bottle",
      label_zh: "水瓶",
      type: "object",
      confidence: 0.86,
      visual_reason: "A portable bottle is a common object in user photos.",
      bbox: null,
      recommended_learning_focus: "everyday object name and common verbs"
    },
    {
      candidate_id: "c2",
      label_en: "desk lamp",
      label_zh: "台灯",
      type: "object",
      confidence: 0.72,
      visual_reason: "The scene may include a small lamp on a desk.",
      bbox: null,
      recommended_learning_focus: "home and study vocabulary"
    },
    {
      candidate_id: "c3",
      label_en: "study desk",
      label_zh: "书桌",
      type: "scene",
      confidence: 0.68,
      visual_reason: "The setup resembles a place for studying or working.",
      bbox: null,
      recommended_learning_focus: "room and study scene expressions"
    }
  ];
}

function sportsCandidates(): RecognitionCandidate[] {
  return [
    {
      candidate_id: "c1",
      label_en: "do a squat",
      label_zh: "做深蹲",
      type: "action",
      confidence: 0.84,
      visual_reason: "The body position suggests a lower-body training movement.",
      bbox: null,
      recommended_learning_focus: "natural coaching verb phrase"
    },
    {
      candidate_id: "c2",
      label_en: "stretch your hamstrings",
      label_zh: "拉伸腘绳肌",
      type: "action",
      confidence: 0.71,
      visual_reason: "The posture may involve a leg stretch.",
      bbox: null,
      recommended_learning_focus: "sports instruction phrase"
    },
    {
      candidate_id: "c3",
      label_en: "training cone",
      label_zh: "训练标志桶",
      type: "object",
      confidence: 0.65,
      visual_reason: "Training scenes often contain cones or markers.",
      bbox: null,
      recommended_learning_focus: "PE equipment vocabulary"
    }
  ];
}

export function mockRecognize(mode: AppMode, inputType: InputType): RecognitionResult {
  return {
    session_id: crypto.randomUUID(),
    input_type: inputType,
    mode,
    summary:
      mode === "sports_action"
        ? "A sports or training scene with learnable action phrases."
        : "An everyday scene with objects suitable for English learning.",
    candidates: mode === "sports_action" ? sportsCandidates() : lifeCandidates(),
    is_mock: true
  };
}

export function mockCard(mode: AppMode, candidate: RecognitionCandidate): LearningCard {
  if (mode === "sports_action" || candidate.type === "action") {
    return {
      candidate_id: candidate.candidate_id,
      phrase_en: candidate.label_en,
      meaning_zh: candidate.label_zh,
      part_of_speech: "verb phrase",
      ipa: "/duː ə skwɑːt/",
      example_en: "Keep your back straight when you do a squat.",
      example_zh: "做深蹲时保持背部挺直。",
      related_expressions: [
        { phrase_en: "bend your knees", meaning_zh: "弯曲膝盖" },
        { phrase_en: "keep your balance", meaning_zh: "保持平衡" },
        { phrase_en: "lower your hips", meaning_zh: "降低髋部" }
      ],
      confusables: [
        {
          word_a: "do a squat",
          word_b: "squat down",
          difference_zh:
            "do a squat 强调完成一个训练动作；squat down 更像日常动作，表示蹲下来。"
        }
      ],
      usage_scenarios: [
        "PE class",
        "strength training",
        "coaching instructions"
      ],
      natural_sentence_patterns: [
        "Do ten squats.",
        "Keep your knees in line with your toes.",
        "Lower your hips and stand back up."
      ],
      is_mock: true
    };
  }

  return {
    candidate_id: candidate.candidate_id,
    phrase_en: candidate.label_en,
    meaning_zh: candidate.label_zh,
    part_of_speech: "noun",
    ipa: "/ˈwɔːtər ˌbɑːtl/",
    example_en: "I always carry a water bottle to class.",
    example_zh: "我总是带一个水瓶去上课。",
    related_expressions: [
      { phrase_en: "fill up a bottle", meaning_zh: "把瓶子装满" },
      { phrase_en: "take a sip", meaning_zh: "喝一小口" },
      { phrase_en: "stay hydrated", meaning_zh: "保持水分充足" }
    ],
    confusables: [
      {
        word_a: "water bottle",
        word_b: "bottle of water",
        difference_zh:
          "water bottle 通常指可重复使用的水瓶；bottle of water 通常指一瓶水。"
      }
    ],
    usage_scenarios: ["school", "gym", "daily routine"],
    natural_sentence_patterns: [
      "Can I refill my water bottle?",
      "I left my water bottle on the desk.",
      "Bring a water bottle to practice."
    ],
    is_mock: true
  };
}
