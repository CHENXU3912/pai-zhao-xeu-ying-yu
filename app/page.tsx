"use client";

import { useEffect, useMemo, useState } from "react";
import { AppNav } from "@/components/AppNav";
import { CandidateList } from "@/components/CandidateList";
import { LearningCardView } from "@/components/LearningCardView";
import { ModeToggle } from "@/components/ModeToggle";
import { getOrCreateAnonUserId } from "@/lib/client/anon-user";
import type {
  AppMode,
  LearningCard,
  RecognitionCandidate,
  RecognitionResult,
  SourceType,
  StoredLearningCard
} from "@/types/domain";

async function compressImage(file: File) {
  const bitmap = await createImageBitmap(file);
  const maxSide = 1400;
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");

  if (!context) {
    return file;
  }

  context.drawImage(bitmap, 0, 0, width, height);

  return new Promise<File>((resolve) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          resolve(file);
          return;
        }

        resolve(
          new File([blob], file.name.replace(/\.\w+$/, ".jpg"), {
            type: "image/jpeg"
          })
        );
      },
      "image/jpeg",
      0.86
    );
  });
}

async function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("素材读取失败"));
    reader.readAsDataURL(file);
  });
}

async function extractVideoFrames(file: File, count = 4) {
  const video = document.createElement("video");
  const objectUrl = URL.createObjectURL(file);
  video.src = objectUrl;
  video.muted = true;
  video.playsInline = true;
  video.preload = "metadata";

  try {
    await new Promise<void>((resolve, reject) => {
      video.onloadedmetadata = () => resolve();
      video.onerror = () => reject(new Error("视频读取失败"));
    });

    const duration = Math.min(video.duration || 3, 5);
    const times = Array.from({ length: count }, (_, index) => {
      const ratio = count === 1 ? 0.5 : index / (count - 1);
      return Math.max(0.05, Math.min(duration - 0.05, ratio * duration));
    });

    const canvas = document.createElement("canvas");
    const width = Math.min(video.videoWidth || 720, 960);
    const height = Math.round(
      width * ((video.videoHeight || 720) / (video.videoWidth || 720))
    );
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");

    if (!context) {
      throw new Error("无法创建视频帧画布");
    }

    const frames: File[] = [];

    for (const [index, time] of times.entries()) {
      video.currentTime = time;
      await new Promise<void>((resolve) => {
        video.onseeked = () => resolve();
      });

      context.drawImage(video, 0, 0, width, height);
      const frame = await new Promise<File>((resolve, reject) => {
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("视频抽帧失败"));
              return;
            }

            resolve(
              new File([blob], `frame-${index + 1}.jpg`, {
                type: "image/jpeg"
              })
            );
          },
          "image/jpeg",
          0.82
        );
      });
      frames.push(frame);
    }

    return frames;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export default function HomePage() {
  const [anonUserId, setAnonUserId] = useState("");
  const [mode, setMode] = useState<AppMode>("life_english");
  const [sourceType, setSourceType] = useState<SourceType>("image");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [sourceAssetDataUrl, setSourceAssetDataUrl] = useState<string | null>(null);
  const [recognition, setRecognition] = useState<RecognitionResult | null>(null);
  const [selectedCandidate, setSelectedCandidate] =
    useState<RecognitionCandidate | null>(null);
  const [card, setCard] = useState<LearningCard | null>(null);
  const [savedCard, setSavedCard] = useState<StoredLearningCard | null>(null);
  const [status, setStatus] = useState("拍一个东西，生成第一张英语贴纸。");
  const [error, setError] = useState("");

  useEffect(() => {
    setAnonUserId(getOrCreateAnonUserId());
  }, []);

  const canGenerate = useMemo(
    () => Boolean(recognition && selectedCandidate),
    [recognition, selectedCandidate]
  );

  async function recognizeImage(file: File) {
    setError("");
    setStatus("正在识别照片里的可学习对象...");
    setRecognition(null);
    setSelectedCandidate(null);
    setCard(null);
    setSavedCard(null);
    setSourceType("image");
    const compressedImage = await compressImage(file);
    setPreviewUrl(URL.createObjectURL(compressedImage));
    setSourceAssetDataUrl(await readFileAsDataUrl(compressedImage));

    const formData = new FormData();
    formData.append("anonUserId", anonUserId);
    formData.append("mode", mode);
    formData.append("image", compressedImage);

    const response = await fetch("/api/recognize/image", {
      method: "POST",
      body: formData
    });

    if (!response.ok) {
      throw new Error((await response.json()).error ?? "图片识别失败");
    }

    const result = (await response.json()) as RecognitionResult;
    setRecognition(result);
    setSelectedCandidate(result.candidates[0] ?? null);
    setStatus(
      result.is_mock
        ? "当前是模拟识别结果：配置真实 AI 后会返回照片里的真实物品。"
        : result.candidates.length
        ? "选一个最想学的词，生成贴纸卡。"
        : "没有识别到候选项，换个光线更好的照片试试。"
    );
  }

  async function recognizeVideo(file: File) {
    setError("");
    setStatus("正在从短视频里抽取动作关键帧...");
    setRecognition(null);
    setSelectedCandidate(null);
    setCard(null);
    setSavedCard(null);
    setSourceType("video");
    setSourceAssetDataUrl(null);

    const frames = await extractVideoFrames(file);
    setPreviewUrl(URL.createObjectURL(frames[0]));
    setSourceAssetDataUrl(await readFileAsDataUrl(frames[0]));
    setStatus("正在推断动作表达...");

    const formData = new FormData();
    formData.append("anonUserId", anonUserId);
    formData.append("mode", mode);
    frames.forEach((frame) => formData.append("frames", frame));

    const response = await fetch("/api/recognize/video-frames", {
      method: "POST",
      body: formData
    });

    if (!response.ok) {
      throw new Error((await response.json()).error ?? "视频识别失败");
    }

    const result = (await response.json()) as RecognitionResult;
    setRecognition(result);
    setSelectedCandidate(result.candidates[0] ?? null);
    if (result.is_mock) {
      setStatus("当前是模拟识别结果：配置真实 AI 后会返回视频里的真实动作。");
      return;
    }
    setStatus("选一个动作表达，生成可以收藏的英语贴纸。");
  }

  async function generateCard() {
    if (!recognition || !selectedCandidate) {
      return;
    }

    setError("");
    setStatus("正在把它变成英语贴纸...");
    setCard(null);
    setSavedCard(null);

    const response = await fetch("/api/cards/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        anonUserId,
        mode,
        sessionId: recognition.session_id,
        candidateId: selectedCandidate.candidate_id,
        candidate: selectedCandidate
      })
    });

    if (!response.ok) {
      throw new Error((await response.json()).error ?? "卡片生成失败");
    }

    const nextCard = (await response.json()) as LearningCard;
    setCard(nextCard);
    if (nextCard.is_mock) {
      setStatus("当前是模拟词卡：配置真实 AI 后会生成和识别结果匹配的真实内容。");
      return;
    }
    setStatus("贴纸已生成。可以播放发音，也可以放进词库。");
  }

  async function saveCard() {
    if (!card) {
      return;
    }

    setError("");
    setStatus("正在放进词库...");

    const response = await fetch("/api/cards", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        anonUserId,
        mode,
        sourceType,
        card,
        sourceAssetDataUrl
      })
    });

    if (!response.ok) {
      throw new Error((await response.json()).error ?? "收藏失败");
    }

    setSavedCard((await response.json()) as StoredLearningCard);
    setStatus("已放进你的词库。");
  }

  async function runTask(task: () => Promise<void>) {
    try {
      await task();
    } catch (taskError) {
      setError(taskError instanceof Error ? taskError.message : "操作失败");
      setStatus("");
    }
  }

  return (
    <main className="app-shell">
      <AppNav />
      <div className="capture-layout">
        <section className="camera-stage">
          <div className="stage-copy">
            <span className="eyebrow">Snap · Learn · Save</span>
            <h1>把眼前的东西变成英语词卡</h1>
            <p>
              拍一个物品，或上传一段短动作视频。系统会识别候选词，再生成带发音、例句和真实用法的轻量贴纸卡。
            </p>
          </div>

          <ModeToggle value={mode} onChange={setMode} />

          <div className="capture-card">
            <div className="photo-frame">
              {previewUrl ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img alt="素材预览" src={previewUrl} />
                  {selectedCandidate ? (
                    <div className="floating-label">
                      {selectedCandidate.label_en}
                      <span>{selectedCandidate.label_zh}</span>
                    </div>
                  ) : null}
                </>
              ) : (
                <div className="photo-placeholder">
                  <strong>拍照识词</strong>
                  <span>照片会成为这张词卡的记忆锚点</span>
                </div>
              )}
            </div>

            <div className="upload-actions">
              <label className="capture-button primary-capture">
                拍照 / 上传图片
                <input
                  accept="image/*"
                  capture="environment"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) {
                      void runTask(() => recognizeImage(file));
                    }
                  }}
                  type="file"
                />
              </label>
              <label className="capture-button">
                上传动作视频
                <input
                  accept="video/*"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) {
                      void runTask(() => recognizeVideo(file));
                    }
                  }}
                  type="file"
                />
              </label>
            </div>

            {status ? <div className="status compact-status">{status}</div> : null}
            {error ? <div className="status error compact-status">{error}</div> : null}
          </div>
        </section>

        <section className="learn-stage">
          <div className="panel soft-panel">
            <div className="panel-title">
              <h2>识别结果</h2>
              <span className="badge">可改选</span>
            </div>
            <CandidateList
              candidates={recognition?.candidates ?? []}
              onSelect={setSelectedCandidate}
              selectedId={selectedCandidate?.candidate_id}
            />
            <div className="button-row" style={{ marginTop: 14 }}>
              <button
                className="primary-button"
                disabled={!canGenerate}
                onClick={() => void runTask(generateCard)}
                type="button"
              >
                生成贴纸卡
              </button>
            </div>
          </div>

          {card ? (
            <LearningCardView
              card={card}
              compact
              imageUrl={previewUrl}
              actions={
                <>
                  <button
                    className="primary-button"
                    disabled={Boolean(savedCard)}
                    onClick={() => void runTask(saveCard)}
                    type="button"
                  >
                    {savedCard ? "已在词库" : "放进词库"}
                  </button>
                  {savedCard ? (
                    <a className="secondary-button" href={`/library/${savedCard.id}`}>
                      查看词库卡片
                    </a>
                  ) : null}
                </>
              }
            />
          ) : (
            <div className="sticker-empty">
              <div className="mini-sticker">
                <span>word</span>
                <strong>?</strong>
              </div>
              <p>你的第一张词语贴纸会出现在这里。</p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
