# 国产视觉模型平替调研

## 结论

第一版推荐顺序：

1. 阿里百炼 DashScope / Qwen-VL：最适合当前项目。
2. 百度千帆视觉理解：可作为备选。
3. 火山引擎豆包视觉理解：能力强，但接入链路更重，不建议第一版优先接。
4. 智谱 GLM-4V：可以继续观察，当前项目先不作为主路径。

## 1. 阿里百炼 DashScope / Qwen-VL

推荐原因：

- 官方提供 OpenAI 兼容地址：`https://dashscope.aliyuncs.com/compatible-mode/v1`。
- 支持 Qwen-VL 系列视觉模型。
- 支持图片 URL 和 Base64 图片输入。
- 官方示例包含把图片列表作为视频输入的方式，和本项目“前端抽帧”方案很匹配。

建议配置：

```bash
AI_PROVIDER=dashscope
AI_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
AI_API_KEY=你的 DASHSCOPE_API_KEY
AI_MODEL=qwen-vl-plus
```

如果成本优先，可试 `qwen3-vl-flash` 或控制台可用的 flash 视觉模型；如果质量优先，可试 `qwen-vl-max-latest` 或 `qwen3-vl-plus`。

## 2. 百度千帆视觉理解

推荐原因：

- 官方视觉理解 API 支持多个图像输入。
- 图片可通过 URL 或 Base64 编码输入。
- 接口地址为 `https://qianfan.baidubce.com/v2/chat/completions`。

建议配置：

```bash
AI_PROVIDER=qianfan
AI_BASE_URL=https://qianfan.baidubce.com/v2
AI_API_KEY=你的千帆 API Key
AI_MODEL=千帆控制台里的视觉模型 API 名称
```

注意：千帆的 `model` 通常需要在控制台查看服务详情里的 API 名称，不要凭空填写。

## 3. 火山引擎豆包视觉理解

当前判断：

- 豆包视觉理解适合图像内容提取、图像问答等任务。
- 官方 veImageX 最佳实践说明：如果上传视频，需要先配置视频截帧模板，获取静图后再由视觉理解模型处理。
- 对本项目来说，前端已经抽帧，因此技术上可接，但第一版需要额外确认火山方舟具体模型 ID、Base URL 和鉴权方式。

建议：等 OpenAI/Qwen 路线稳定后，再做 `doubao` provider。

## 4. 当前代码支持方式

项目现在有两类 provider：

- OpenAI 原生：`AI_PROVIDER=openai`，走 Responses API 和 Structured Outputs。
- OpenAI-compatible：`AI_PROVIDER=dashscope | qianfan | custom`，走 `/chat/completions`，把图片作为 `image_url` 输入，并要求模型返回 JSON。

没有配置任何真实 key 时，仍然走 mock provider，保证 Demo 可打开。

## 官方资料

- 阿里百炼通义千问 API：`https://help.aliyun.com/zh/model-studio/use-qwen-by-calling-api`
- 阿里百炼视觉理解：`https://help.aliyun.com/zh/model-studio/vision/`
- 百度千帆视觉理解：`https://cloud.baidu.com/doc/qianfan-docs/s/fm8r1ndsm`
- 火山 veImageX 豆包视觉理解最佳实践：`https://www.volcengine.com/docs/508/1398959`
