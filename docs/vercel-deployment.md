# Vercel 部署方案

## 目标

把“拍照学英语”部署成公网 Web App，让手机不用同一 Wi-Fi、也不用电脑开着，就能直接访问。

## 推荐架构

- 前端和 API：Vercel
- 数据库和图片：Supabase
- AI：OpenAI 或 OpenAI-compatible 视觉模型

## 为什么不用 GitHub Pages

本项目需要 `app/api/**` Route Handlers 在服务端执行 AI 调用和数据保存。GitHub Pages 只能托管静态文件，不能安全保存 AI Key，也不能运行这些 API。

## 生产环境规则

- 本地开发可以使用 `.local-data/store.json` 兜底。
- Vercel 生产环境不使用 `.local-data`，必须配置 Supabase。
- Supabase 配错时，生产环境会直接报错，避免“看起来保存了但实际丢失”。

## Vercel 环境变量

在 Vercel 项目 Settings -> Environment Variables 添加：

```env
SUPABASE_URL=https://你的项目.supabase.co
SUPABASE_SERVICE_ROLE_KEY=你的 sb_secret_...
SUPABASE_MEDIA_BUCKET=learning-card-media
NEXT_PUBLIC_APP_URL=https://你的 Vercel 域名
```

OpenAI 原生方案：

```env
AI_PROVIDER=openai
OPENAI_API_KEY=你的 OpenAI API Key
OPENAI_MODEL=gpt-4o-mini
```

OpenAI-compatible 方案，例如 DashScope：

```env
AI_PROVIDER=dashscope
AI_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
AI_API_KEY=你的 DashScope API Key
AI_MODEL=qwen-vl-plus
```

## Supabase 准备

1. 在 SQL Editor 执行 `supabase/schema.sql`。
2. 在 Storage 创建公开 bucket：`learning-card-media`。
3. 在 Project Settings -> API Keys 复制 Secret key，填到 `SUPABASE_SERVICE_ROLE_KEY`。
4. 在 Data API 页面复制 API URL 的域名部分，填到 `SUPABASE_URL`，不要带 `/rest/v1/`。

## 部署流程

1. 本地运行验证：

```bash
npm.cmd run lint
npm.cmd run typecheck
npm.cmd run build
```

2. 提交代码并推送到 GitHub。
3. 在 Vercel 新建项目，导入 GitHub 仓库。
4. Framework 选择 Next.js。
5. 添加上面的环境变量。
6. Deploy。
7. 手机打开 Vercel 域名，测试拍照、生成词卡、收藏、词库详情。

## 费用边界

- Vercel Hobby：小规模 Demo 通常 0 元。
- Supabase Free：小规模词卡和图片通常 0 元。
- AI：按调用计费，是最主要的可变成本。

先用少量照片测试，确认产品体验后再扩大使用。
