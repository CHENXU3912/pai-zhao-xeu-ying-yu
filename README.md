# 拍照学英语

移动端优先的英语学习 Web App：拍照或上传 3-5 秒短视频，识别物品、动作或场景，并生成真实英语学习卡片。

## 功能

- 图片拍摄/上传识别
- 短视频前端抽帧识别动作
- 生活英语 / 体育动作英语模式
- 多候选对象或动作选择
- 英语学习卡片生成
- 浏览器英文发音
- 匿名用户 ID
- 收藏卡片库、详情页、搜索和删除收藏
- OpenAI provider + mock fallback
- Supabase 收藏存储

## 本地运行

```bash
npm install
npm run dev
```

打开 `http://localhost:3000`。

没有配置环境变量时，应用会使用 mock provider 和内存存储，仍可跑通 Demo。

## 环境变量

复制 `.env.example` 为 `.env.local`，填入需要的变量。

```bash
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini
AI_PROVIDER=openai
AI_BASE_URL=
AI_API_KEY=
AI_MODEL=
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 国产模型平替

当前代码支持两条路径：

- `AI_PROVIDER=openai`：使用 OpenAI Responses API，依赖 `OPENAI_API_KEY`。
- `AI_PROVIDER=dashscope | qianfan | custom`：使用 OpenAI-compatible Chat Completions 接口，依赖 `AI_BASE_URL`、`AI_API_KEY`、`AI_MODEL`。

推荐先用阿里百炼 DashScope：

```bash
AI_PROVIDER=dashscope
AI_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
AI_API_KEY=你的 DASHSCOPE_API_KEY
AI_MODEL=qwen-vl-plus
```

百度千帆可作为第二选择：

```bash
AI_PROVIDER=qianfan
AI_BASE_URL=https://qianfan.baidubce.com/v2
AI_API_KEY=你的千帆 API Key
AI_MODEL=千帆控制台里的视觉模型 API 名称
```

豆包视觉理解第一版不作为默认平替，因为官方最佳实践更偏火山方舟/veImageX 链路，视频通常还需要先截帧再交给视觉理解模型；后续可以作为单独 provider 接入。

## Supabase

在 Supabase SQL Editor 执行：

```text
supabase/schema.sql
```

第一版由后端 API 使用 `SUPABASE_SERVICE_ROLE_KEY` 写入数据库，前端不直接写库。

## 验证

```bash
npm run lint
npm run typecheck
npm run build
```

Windows PowerShell 如果拦截 `npm.ps1`，使用：

```powershell
npm.cmd run lint
npm.cmd run typecheck
npm.cmd run build
```
