# 拍照学英语项目规范

## 项目目标

这是一个移动端优先的 Web App：用户拍照或上传 3-5 秒短视频，系统识别物品、动作或场景，并生成以英文为主、中文辅助解释的英语学习卡片。

## 技术栈

- 前端：Next.js App Router + React + TypeScript
- 后端：Next.js Route Handlers
- 数据：Supabase PostgreSQL
- AI：可插拔视觉 provider，第一版实现 OpenAI provider，并保留 mock fallback
- 发音：浏览器 SpeechSynthesis API
- 部署：Vercel + Supabase

## 目录约定

- `app/`：页面、布局和 API Route Handlers
- `components/`：可复用 React 组件
- `lib/`：业务逻辑、provider、数据访问、工具函数
- `types/`：共享 TypeScript 类型
- `supabase/`：数据库 schema 和迁移草案
- `docs/`：产品、架构或运维文档

## 命名约定

- React 组件使用 PascalCase，例如 `LearningCard.tsx`
- 工具函数和业务模块使用 kebab-case 或 camelCase，按所在目录现有风格保持一致
- API 路由使用 Next.js App Router 约定：`app/api/**/route.ts`
- 数据库字段使用 snake_case
- TypeScript 类型使用 PascalCase

## 环境变量

只在 `.env.local` 放真实密钥，不提交真实密钥。

需要的变量：

- `OPENAI_API_KEY`
- `OPENAI_MODEL`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_APP_URL`

`.env.example` 只放占位值。

## 开发规则

- 不做复杂登录，第一版使用匿名用户 ID。
- 后端 API 负责 Supabase 写入，前端不直接写数据库。
- OpenAI 调用必须经过 provider 抽象，避免业务代码绑定单一模型供应商。
- 没有 API Key 时必须有 mock fallback，保证 Demo 可本地跑通。
- 视频第一版只做前端抽帧，不上传原始视频。
- 删除收藏是业务功能，可以通过 API 删除数据库记录；不得删除项目文件或 Git 历史，除非用户明确要求。

## 验证命令

修改代码后至少运行：

```bash
npm run lint
npm run typecheck
```

涉及构建或路由结构时运行：

```bash
npm run build
```

## 设计原则

- 首页就是工具工作台，不做营销页。
- 移动端优先，按钮和上传控件适合手机操作。
- 英文学习内容以真实表达为核心，不只返回识别标签。
- UI 文案中文为主，学习卡片内容英文为主、中文辅助。

## 本地运行数据

- `.local-data/`：本地 Demo 持久化数据目录，只保存开发运行时生成的词卡、识别会话和图片 data URL。
- `.local-data/` 不提交到 Git，不作为正式数据库或生产存储。
- Supabase 未配置或连接失败时，可以自动回退到 `.local-data/store.json`，保证非程序员也能本地跑通完整流程。
