"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AppNav } from "@/components/AppNav";
import { LearningCardView } from "@/components/LearningCardView";
import { getOrCreateAnonUserId } from "@/lib/client/anon-user";
import type { StoredLearningCard } from "@/types/domain";

export default function CardDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [anonUserId, setAnonUserId] = useState("");
  const [card, setCard] = useState<StoredLearningCard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setAnonUserId(getOrCreateAnonUserId());
  }, []);

  useEffect(() => {
    if (!anonUserId || !params.id) {
      return;
    }

    async function loadCard() {
      setLoading(true);
      setError("");
      const response = await fetch(
        `/api/cards/${params.id}?${new URLSearchParams({ anonUserId })}`
      );

      if (!response.ok) {
        throw new Error((await response.json()).error ?? "读取词卡失败");
      }

      setCard((await response.json()) as StoredLearningCard);
      setLoading(false);
    }

    loadCard().catch((loadError) => {
      setLoading(false);
      setError(loadError instanceof Error ? loadError.message : "读取词卡失败");
    });
  }, [anonUserId, params.id]);

  async function removeCard() {
    if (!anonUserId || !params.id) {
      return;
    }

    setError("");
    const response = await fetch(
      `/api/cards/${params.id}?${new URLSearchParams({ anonUserId })}`,
      {
        method: "DELETE"
      }
    );

    if (!response.ok) {
      setError((await response.json()).error ?? "删除失败");
      return;
    }

    router.push("/library");
  }

  return (
    <main className="app-shell">
      <AppNav />
      <section className="section">
        <div className="button-row">
          <Link className="secondary-button" href="/library">
            返回词库
          </Link>
        </div>
        {loading ? <div className="status">正在读取词卡...</div> : null}
        {error ? <div className="status error">{error}</div> : null}
        {card ? (
          <LearningCardView
            actions={
              <button className="danger-button" onClick={() => void removeCard()} type="button">
                删除收藏
              </button>
            }
            card={card}
            imageUrl={card.source_asset_url}
          />
        ) : !loading ? (
          <div className="empty-state">没有找到这张词卡。</div>
        ) : null}
      </section>
    </main>
  );
}
