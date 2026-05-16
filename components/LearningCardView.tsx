"use client";

import type { LearningCard, StoredLearningCard } from "@/types/domain";
import { SpeakButton } from "./SpeakButton";

type Props = {
  card: LearningCard | StoredLearningCard;
  actions?: React.ReactNode;
  compact?: boolean;
  imageUrl?: string | null;
};

export function LearningCardView({ card, actions, compact = false, imageUrl }: Props) {
  return (
    <article className={compact ? "card learning-card sticker-card" : "card learning-card"}>
      <div className="sticker-top">
        {imageUrl ? (
          <div className="sticker-photo">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img alt="词卡照片锚点" src={imageUrl} />
          </div>
        ) : (
          <div className="sticker-mark">{card.phrase_en.slice(0, 1).toUpperCase()}</div>
        )}

        <div className="word-head">
          <div>
            <span className="eyebrow">Word sticker</span>
            {card.is_mock ? <span className="badge mock-badge">模拟内容</span> : null}
            <h2>{card.phrase_en}</h2>
            <div className="ipa">
              {card.ipa} · {card.part_of_speech}
            </div>
          </div>
          <SpeakButton text={card.phrase_en} />
        </div>
      </div>

      <div className="meaning-strip">
        <strong>{card.meaning_zh}</strong>
        <span>{card.usage_scenarios.slice(0, 3).join(" · ")}</span>
      </div>

      <div className="sentence-box">
        <h3>真实例句</h3>
        <p className="example-en">{card.example_en}</p>
        <p>{card.example_zh}</p>
      </div>

      <div className="card-grid">
        <div className="info-box">
          <h3>顺口说法</h3>
          <ul>
            {card.natural_sentence_patterns.slice(0, compact ? 3 : 6).map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
        <div className="info-box">
          <h3>相关表达</h3>
          <ul>
            {card.related_expressions.slice(0, compact ? 3 : 5).map((item) => (
              <li key={item.phrase_en}>
                {item.phrase_en}：{item.meaning_zh}
              </li>
            ))}
          </ul>
        </div>
        {!compact ? (
          <div className="info-box">
            <h3>易混词</h3>
            <ul>
              {card.confusables.map((item) => (
                <li key={`${item.word_a}-${item.word_b}`}>
                  {item.word_a} / {item.word_b}：{item.difference_zh}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>

      {compact ? (
        <details className="more-detail">
          <summary>易混词和更多说明</summary>
          <ul>
            {card.confusables.map((item) => (
              <li key={`${item.word_a}-${item.word_b}`}>
                {item.word_a} / {item.word_b}：{item.difference_zh}
              </li>
            ))}
          </ul>
        </details>
      ) : null}

      {actions ? (
        <div className="button-row" style={{ marginTop: 14 }}>
          {actions}
        </div>
      ) : null}
    </article>
  );
}
