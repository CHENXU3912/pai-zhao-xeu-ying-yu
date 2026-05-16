"use client";

import type { AppMode } from "@/types/domain";

type Props = {
  value: AppMode;
  onChange: (mode: AppMode) => void;
};

export function ModeToggle({ value, onChange }: Props) {
  return (
    <div className="segmented" role="tablist" aria-label="学习模式">
      <button
        className={value === "life_english" ? "active" : ""}
        onClick={() => onChange("life_english")}
        type="button"
      >
        生活英语
      </button>
      <button
        className={value === "sports_action" ? "active" : ""}
        onClick={() => onChange("sports_action")}
        type="button"
      >
        体育动作
      </button>
    </div>
  );
}
