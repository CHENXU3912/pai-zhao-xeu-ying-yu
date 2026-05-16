"use client";

import type { RecognitionCandidate } from "@/types/domain";

type Props = {
  candidates: RecognitionCandidate[];
  selectedId?: string;
  onSelect: (candidate: RecognitionCandidate) => void;
};

export function CandidateList({ candidates, selectedId, onSelect }: Props) {
  if (candidates.length === 0) {
    return <div className="empty-state">拍照或上传视频后，这里会显示可学习的候选词。</div>;
  }

  return (
    <div className="candidate-list">
      {candidates.map((candidate) => (
        <button
          className={
            candidate.candidate_id === selectedId ? "candidate active" : "candidate"
          }
          key={candidate.candidate_id}
          onClick={() => onSelect(candidate)}
          type="button"
        >
          <span className="candidate-main">
            <strong>{candidate.label_en}</strong>
            <span className="badge">{Math.round(candidate.confidence * 100)}%</span>
          </span>
          <span className="subtle">
            {candidate.label_zh} · {candidate.recommended_learning_focus}
          </span>
        </button>
      ))}
    </div>
  );
}
