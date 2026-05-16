"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppNav } from "@/components/AppNav";
import { ModeToggle } from "@/components/ModeToggle";
import { getOrCreateAnonUserId } from "@/lib/client/anon-user";
import type { AppMode, StoredLearningCard } from "@/types/domain";

export default function LibraryPage() {
  const [anonUserId, setAnonUserId] = useState("");
  const [mode, setMode] = useState<AppMode>("life_english");
  const [query, setQuery] = useState("");
  const [cards, setCards] = useState<StoredLearningCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setAnonUserId(getOrCreateAnonUserId());
  }, []);

  useEffect(() => {
    if (!anonUserId) {
      return;
    }

    const controller = new AbortController();

    async function loadCards() {
      setLoading(true);
      setError("");
      const params = new URLSearchParams({
        anonUserId,
        mode
      });

      if (query.trim()) {
        params.set("query", query.trim());
      }

      try {
        const response = await fetch(`/api/cards?${params}`, {
          signal: controller.signal
        });

        if (!response.ok) {
          throw new Error((await response.json()).error ?? "读取词库失败");
        }

        const payload = (await response.json()) as { cards: StoredLearningCard[] };
        setCards(payload.cards);
      } catch (loadError) {
        if (!controller.signal.aborted) {
          setError(loadError instanceof Error ? loadError.message : "读取词库失败");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    const timer = window.setTimeout(() => {
      void loadCards();
    }, 220);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [anonUserId, mode, query]);

  return (
    <main className="app-shell">
      <AppNav />
      <section className="section">
        <div className="wordbook-head">
          <div>
            <span className="eyebrow">Wordbook</span>
            <h1>你的词语贴纸</h1>
            <p>从真实照片和动作里收集来的词，比背列表更容易记住。</p>
          </div>
          <Link className="primary-button" href="/">
            新增贴纸
          </Link>
        </div>

        <div className="panel soft-panel">
          <ModeToggle value={mode} onChange={setMode} />
          <div className="form-row" style={{ marginTop: 14 }}>
            <input
              className="text-input"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="搜索英文或中文"
              type="search"
              value={query}
            />
            <span className="badge">{cards.length} 张</span>
          </div>
          {loading ? <div className="status">正在读取词库...</div> : null}
          {error ? <div className="status error">{error}</div> : null}
        </div>

        {cards.length ? (
          <div className="sticker-grid">
            {cards.map((card) => (
              <Link className="card library-sticker" href={`/library/${card.id}`} key={card.id}>
                <div className="sticker-mark">{card.phrase_en.slice(0, 1).toUpperCase()}</div>
                <div>
                  <h2>{card.phrase_en}</h2>
                  <p>{card.meaning_zh}</p>
                </div>
                <span className="badge">
                  {card.mode === "sports_action" ? "体育动作" : "生活英语"}
                </span>
              </Link>
            ))}
          </div>
        ) : !loading ? (
          <div className="sticker-empty">
            <div className="mini-sticker">
              <span>word</span>
              <strong>0</strong>
            </div>
            <p>还没有贴纸。回到首页拍一张照片开始收集。</p>
          </div>
        ) : null}
      </section>
    </main>
  );
}
