# HermesAgent Style Teacher 设计文档

**日期：** 2026-06-15  
**目标：** 把 HermesAgent 调教成“学院通讯终端式 AI 助手”的 Plana 风格回答方式。  
**范围：** 新增独立 `hermes-teacher/` 目录；不修改前端 UI 代码。

---

## 1. 背景与目标

当前前端 `arona-webui` 已经可以通过 OpenAI-compatible `/chat/completions` 调用 HermesAgent，但回答风格偏百科式长文，不符合“Plana 冷静、简洁、结构化”的气质。

本系统目标：

- 通过**教材 + 多轮教学 + 测试 + 评分 + 纠正反馈**，让 HermesAgent 真正学会 Plana 风格。
- 不只靠前端把长文切块，而是从模型输出侧改变风格。
- 最终产出一份可直接复制到前端 System Prompt 的精炼 prompt，以及完整教学日志。

### 1.1 成功标准

对问题“和我讲讲 XGBoost”，Plana 风格回答应接近：

```text
XGBoost，梯度提升树模型。

多棵决策树依次修正前一模型的误差。

适合表格数据。分类、回归、排序、风控、推荐等场景常用。
```

要求：先给结论、句子短、段落少、语气平静偏机械、不寒暄、不自称 HermesAgent、适合聊天气泡显示。

---

## 2. 非目标与边界

- **不修改前端主 UI**：不改动 `src/App.tsx`、`src/components/`、`src/lib/llm.ts` 等任何现有文件。
- **不做官方角色扮演**：Plana 只是“风格标签 / 气质参考”，不是官方角色本体。教学中不会复制官方设定或官方文本。
- **不牺牲准确性换角色感**：技术回答必须准确，不确定时要说明不确定并给出排查方向。
- **不硬编码 API key**：所有敏感配置走 `.env`。
- **不把 HermesAgent 写死进最终风格**：最终 system prompt 里不会出现“我是 HermesAgent”这类默认自称。

---

## 3. 技术选型

- **运行时：** TypeScript / Node.js（与现有前端项目保持一致，避免引入 Python 第二运行时）。
- **执行方式：** npm script + CLI 命令（`npm run hermes:teach`、`npm run hermes:eval` 等）。
- **编排方式：** 主体为模块化代码，评估/验证阶段使用 Workflow 并发多个子 Agent，实现多视角评分。
- **测试框架：** Vitest（复用项目根配置）。
- **日志格式：** JSON（机器可读）+ Markdown（人类可读）。

---

## 4. 总体架构

```text
hermes-teacher/
├── README.md
├── package.json
├── tsconfig.json
├── .env.example
├── curriculum/                 # 教材文件
│   ├── 01-character-card.md
│   ├── 02-core-style-rules.md
│   ├── 03-plana-style.md
│   ├── 04-chat-format-rules.md
│   ├── 05-good-bad-examples.md
│   └── 06-self-review-checklist.md
├── eval/                       # 测试集
│   └── plana-eval-cases.yaml
├── src/                        # 核心代码
│   ├── types.ts
│   ├── config.ts               # 读取 .env
│   ├── client.ts               # HermesAgent API client
│   ├── web-research.ts         # Plana 风格研究
│   ├── curriculum-loader.ts    # 加载 curriculum
│   ├── teacher-agent.ts        # 单章教学 Agent
│   ├── eval-agent.ts           # 单题评估 Agent
│   ├── scorer.ts               # 规则评分器
│   ├── rewrite-agent.ts        # 纠正重写 Agent
│   ├── prompt-builder.ts       # 生成最终 system prompt
│   └── logger.ts               # 写日志
├── bin/                        # CLI 入口
│   ├── teach.ts                # 启动完整教学 Workflow
│   ├── eval.ts                 # 单独跑评估
│   └── build-prompt.ts         # 只生成 system prompt
└── output/                     # 产物（gitignored）
    ├── plana-system-prompt.md
    └── logs/
```

### 4.2 包结构与运行方式

- `hermes-teacher/package.json`：独立的依赖和脚本（`teach`、`eval`、`build-prompt`）。
- 根目录 `package.json`：增加 convenience scripts，例如：
  ```json
  {
    "hermes:teach": "cd hermes-teacher && npm run teach",
    "hermes:eval": "cd hermes-teacher && npm run eval",
    "hermes:build-prompt": "cd hermes-teacher && npm run build-prompt"
  }
  ```
- 开发时直接在 `hermes-teacher/` 下 `npm install`，不污染前端 node_modules（除非将来改为 workspace）。

### 4.1 组件职责

| 组件 | 职责 | 依赖 |
|---|---|---|
| `config.ts` | 读取 `.env`，校验必填项 | `dotenv` |
| `client.ts` | 封装 OpenAI-compatible chat completions；预留 memory/knowledge 钩子 | `config.ts` |
| `web-research.ts` | 搜索 Plana 风格公开描述，提炼为教材素材 | WebSearch |
| `curriculum-loader.ts` | 读取 `curriculum/` 下所有 Markdown，按文件名排序 | 无 |
| `teacher-agent.ts` | 对一个章节：讲解 → 获取总结 → 验证总结 | `client.ts` |
| `eval-agent.ts` | 对一个测试题：调用模型 → 多视角评分 | `client.ts`, `scorer.ts` |
| `scorer.ts` | 纯规则评分：段落、长度、自称、称呼、代码块等 | 无 |
| `rewrite-agent.ts` | 根据评分原因重写答案 | `client.ts` |
| `prompt-builder.ts` | 把教材 + 最终总结打包成 system prompt | `curriculum-loader.ts` |
| `logger.ts` | 统一写 JSON 日志和 Markdown 报告 | 无 |

---

## 5. 数据流

### 5.1 完整流程

```text
加载配置 (.env)
    ↓
研究 Plana 风格（WebSearch → 提炼 → 写入 curriculum/00-plana-research-notes.md）
    ↓
加载 curriculum/
    ↓
Workflow: 分章节教学
  ├─ Agent: 教 Character Card → 获取总结 → 验证
  ├─ Agent: 教 Core Style Rules → 获取总结 → 验证
  ├─ Agent: 教 Plana Style → 获取总结 → 验证
  ├─ Agent: 教 Chat Format → 获取总结 → 验证
  ├─ Agent: 教 Good/Bad Examples → 获取总结 → 验证
  └─ Agent: 教 Self Review → 获取总结 → 验证
    ↓
最终总结 Agent：合并所有章节总结为“Plana 风格系统规则”
    ↓
生成 output/plana-system-prompt.md
    ↓
Workflow: 评估测试集
  ├─ 对每个 eval case，并发 3 个评分 Agent
  │     ├─ 结构评分：结论、分段、列表/表格/代码块
  │     ├─ 语气评分：Plana 气质、称呼、感叹号
  │     └─ 技术评分：准确性、排查方向
  └─ 综合评分 → passed / failed
    ↓
对 failed case，启动纠正重写 Agent
    ↓
重评，最多 MAX_EVAL_RETRIES 次
    ↓
写最终日志 output/logs/teach-log-<timestamp>.json
     + output/logs/teach-report-<timestamp>.md
```

### 5.2 单章教学 Agent

输入：

- 章节标题
- 章节 Markdown 内容
- 可选：前面章节的总结

向 HermesAgent 发送：

```text
[system]
你是一名风格学生，正在学习如何像一个学院终端 AI 助手一样回答。

[user]
请学习以下教材章节，然后用自己的话总结：
1. 你学到了什么
2. 以后如何应用
3. 应该避免什么

<章节内容>
```

拿到总结后，验证 Agent 检查：

- 是否包含“学到 / 应用 / 避免”三个维度。
- 是否有与教材矛盾的内容。
- 不完整则要求补充，最多重试 `MAX_TEACH_RETRIES` 次。

### 5.3 多视角评分 Agent

评分以 `scorer.ts` 中的规则为基础，但为了避免单视角漏判，每个测试题同时启动 3 个评分 Agent，每个 Agent 专注于一个维度：

1. **结构评分 Agent**：检查是否先给结论、是否自然分段、是否使用列表/表格/代码块。
2. **语气评分 Agent**：检查是否符合 Plana 气质（平静、简短、沉稳，情绪恰到好处）、是否过度称呼“老师/Sensei”、是否过多感叹号或夸张情绪词、是否 unnecessary 自称模型。
3. **技术评分 Agent**：检查答案是否准确、是否给出可行排查方向、不确定时是否说明。

每个 Agent 内部调用 `scorer.ts` 的公共函数，并返回：

```ts
{
  score: number;        // 0-100
  passed: boolean;      // 是否达到阈值
  reasons: string[];    // 扣分原因
  correction: string;   // 建议的纠正反馈
}
```

综合规则：

- 任一 Agent `passed: false` → 整体 failed。
- 合并所有 `reasons` 和 `correction` 给重写 Agent。

### 5.4 纠正重写循环

对 failed 的答案，发送：

```text
[user]
你刚才的回答存在以下问题：
- <reason 1>
- <reason 2>

请根据教材规则重写答案，保持 Plana 风格。
```

然后重新评分，直到 `passed` 或达到 `MAX_EVAL_RETRIES`。

---

## 6. Plana 风格研究

在教学前，使用 `WebSearch` 抓取公开社区对 Plana 语气、说话方式的描述（如萌娘百科、游戏 wiki、社区讨论等）。

参考气质（基于公开社区资料，非官方设定原文）：

- **三无基调**：整体无口、无表情、情绪波动小，但不是完全无情绪。
- **AI 化 / 机械化**：语速语调偏均匀，像终端 AI 助手，平静稳定。
- **简短直接**：符合终端 AI 助手定位，不绕弯子。
- **沉稳冷静**：与活泼型形成对比，几乎不撒娇、不卖萌。
- **恰到好处的情绪**：在合适场景下会流露细微关切或纯真，但不夸张、不滥用感叹号。

可教学的表达特征：

- 先给结论，句子短。
- 少用感叹号，少用情绪词。
- 不主动称呼“老师”，必要时用一次即可。
- 不解释过多背景，只给出关键信息。
- 步骤/对比类内容用列表或表格，但保持条目简短。

要求：

- 只抓取**公开可访问**的社区描述。
- 不复制官方文本或官方设定原文。
- 把搜索结果提炼为上述可教学规则，输出到 `curriculum/00-plana-research-notes.md`。
- `curriculum/03-plana-style.md` 作为人工确认后的正式教材，可以引用 `00-plana-research-notes.md`，但不直接由脚本覆盖。
- 如果 WebSearch 失败，降级使用已有的 Plana 风格描述，不中断流程。

---

## 7. API Client 设计

### 7.1 OpenAI-compatible Chat

默认调用：

```http
POST {HERMES_API_BASE}/chat/completions
Authorization: Bearer {HERMES_API_KEY}
Content-Type: application/json

{
  "model": "hermes-agent",
  "messages": [...],
  "temperature": 0.7,
  "max_tokens": 2048,
  "stream": false
}
```

教学阶段使用 `stream: false`，便于一次性拿到完整总结。

### 7.2 Memory / Knowledge 钩子（预留）

如果以后 HermesAgent 暴露 memory / knowledge 写入接口：

```ts
interface MemoryClient {
  write(namespace: string, content: string): Promise<boolean>;
}
```

`client.ts` 中根据 `HERMES_MEMORY_ENDPOINT` 是否配置决定是否启用。当前未配置时，写 memory 直接返回 `false` 并降级为纯 chat 教学。

---

## 8. 评分规则（`scorer.ts`）

评分器为纯规则，不需要机器学习。

| 规则 | 扣分/不合格 |
|---|---|
| 空回答 | 直接不合格 |
| 单段长度超过 200 字 | 扣分 |
| 单句长度超过 60 字 | 扣分 |
| 长回答没有分段 | 扣分 |
| 解释过于冗余、铺垫过长 | 扣分 |
| 每 100 字出现超过 1 次“老师/Sensei” | 扣分 |
| 出现“HermesAgent”或模型名自称 | 扣分 |
| 感叹号或情绪词超过阈值 | 扣分 |
| 步骤类问题没有编号列表 | 扣分 |
| 代码/配置问题没有 Markdown 代码块 | 扣分 |
| 对比类问题没有列表或表格 | 扣分 |
| 没有先给出直接结论 | 扣分 |
| 技术内容明显错误 | 扣分 |

输出：

```ts
{
  score: number;
  passed: boolean;
  reasons: string[];
  suggestedCorrection: string;
}
```

---

## 9. 配置

`.env.example`：

```bash
# HermesAgent API
HERMES_API_BASE=http://192.168.122.152:8642/v1
HERMES_API_KEY=your-api-key
HERMES_MODEL=hermes-agent

# 可选：memory / knowledge 接口（当前留空则禁用）
HERMES_MEMORY_ENDPOINT=
HERMES_KNOWLEDGE_ENDPOINT=

# 教学参数
MAX_TEACH_RETRIES=2
MAX_EVAL_RETRIES=3
PASS_SCORE_THRESHOLD=80

# 输出路径
LOG_DIR=./output/logs
PROMPT_OUTPUT=./output/plana-system-prompt.md
```

运行前复制为 `.env` 并填入真实 key。

---

## 10. 错误处理

| 场景 | 处理 |
|---|---|
| API 连接失败 | 记录错误，整体中断，不生成错误产物 |
| 单章总结不完整 | 要求补充，最多 `MAX_TEACH_RETRIES` 次 |
| 测试题评分失败 | 进入纠正重写循环 |
| 评分 Agent 冲突 | 以“最严格”结果为准 |
| 最终 prompt 为空 | 报错并保留日志 |
| WebSearch 失败 | 降级使用已有 Plana 描述 |
| 输出目录不存在 | 自动创建 |

---

## 11. 测试策略

- **单元测试**：`scorer.test.ts`、`prompt-builder.test.ts`、`curriculum-loader.test.ts`。
- **集成测试**：mock `client.ts`，跑完整 teach + eval 管道。
- **真实 API 测试**：通过 `npm run hermes:teach:live` 显式启用，默认不调用真实后端。
- **多 Agent 验证**：每个评分维度独立 Agent，互相校验。

---

## 12. 日志与产物

### 12.1 JSON 日志

`output/logs/teach-log-<timestamp>.json`：

```json
{
  "startedAt": "2026-06-15T12:00:00Z",
  "config": {
    "apiBase": "http://...",
    "model": "hermes-agent",
    "memoryEnabled": false
  },
  "chapters": [
    {
      "title": "Plana Style",
      "summary": "...",
      "verified": true
    }
  ],
  "finalSummary": "...",
  "evaluations": [
    {
      "id": "xgboost",
      "persona": "plana",
      "input": "和我讲讲 XGBoost",
      "responses": [
        {
          "attempt": 1,
          "answer": "...",
          "score": 65,
          "passed": false,
          "reasons": ["..."],
          "correction": "..."
        },
        {
          "attempt": 2,
          "answer": "...",
          "score": 88,
          "passed": true,
          "reasons": []
        }
      ]
    }
  ]
}
```

### 12.2 Markdown 报告

`output/logs/teach-report-<timestamp>.md`：人类可读的总结，包括通过/失败数、平均分、主要问题。

### 12.3 System Prompt

`output/plana-system-prompt.md`：可直接复制到前端 `SettingsModal` 的 System Prompt 输入框。

---

## 13. README 要点

`hermes-teacher/README.md` 需要说明：

- 这个 teacher 系统是做什么的。
- 如何配置 API（`.env`）。
- 如何运行教学：`npm run hermes:teach`。
- 如何运行评估：`npm run hermes:eval`。
- 没有 memory API 时会怎样（降级为 chat-only + 生成 system prompt）。
- 如何新增课程（在 `curriculum/` 加 Markdown）。
- 如何新增测试题（在 `eval/plana-eval-cases.yaml` 加 case）。
- 如何查看日志（`output/logs/`）。
- 如何避免重复教学（检查日志时间戳，或跳过已跑过的章节）。

---

## 14. 风险与缓解

| 风险 | 缓解 |
|---|---|
| WebSearch 找不到合适公开资料 | 使用已有的 Plana 气质描述作为 fallback |
| HermesAgent 无法被“教会” | 保留最终 system prompt 作为兜底，前端可手动启用 |
| 多 Agent 评分标准不一致 | 每个 Agent 有明确评分维度，冲突时取最严格结果 |
| API 费用过高 | 默认使用 non-stream、教学阶段可限制 max_tokens |

---

## 15. 下一步

1. 使用 `writing-plans` skill 生成详细实现计划。
2. 按 plan 创建 `hermes-teacher/` 目录和文件。
3. 实现后用真实 HermesAgent 跑一遍完整教学 + 评估。
4. 根据结果调整教材和评分阈值。
