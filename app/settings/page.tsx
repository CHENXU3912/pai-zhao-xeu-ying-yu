"use client";

import { useEffect, useState } from "react";
import { AppNav } from "@/components/AppNav";
import { clearAnonUserId, getOrCreateAnonUserId } from "@/lib/client/anon-user";

export default function SettingsPage() {
  const [anonUserId, setAnonUserId] = useState("");

  useEffect(() => {
    setAnonUserId(getOrCreateAnonUserId());
  }, []);

  function resetId() {
    clearAnonUserId();
    setAnonUserId(getOrCreateAnonUserId());
  }

  return (
    <main className="app-shell">
      <AppNav />
      <section className="section">
        <div className="panel soft-panel">
          <div className="panel-title">
            <h1>设置</h1>
          </div>
          <div className="info-box">
            <h3>匿名用户 ID</h3>
            <p>{anonUserId}</p>
          </div>
          <p className="subtle">
            第一版保持 CapWords 式轻量体验：无需注册，打开就能拍。收藏按这个匿名 ID 归属，清除后当前浏览器会生成新的词库身份。
          </p>
          <div className="button-row">
            <button className="secondary-button" onClick={resetId} type="button">
              重新生成匿名 ID
            </button>
          </div>
        </div>

        <div className="panel soft-panel">
          <div className="panel-title">
            <h2>运行方式</h2>
          </div>
          <p className="subtle">
            没有 OpenAI 或 Supabase 配置时，应用会使用 mock 数据和内存词库跑通流程；配置后会自动切换到真实识别和数据库收藏。
          </p>
        </div>
      </section>
    </main>
  );
}
