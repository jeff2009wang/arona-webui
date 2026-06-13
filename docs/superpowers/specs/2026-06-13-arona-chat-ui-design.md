# Arona Chat UI 设计规格文档

**日期**: 2026-06-13  
**项目**: Arona WebUI —— 二次元学院手游通讯风格 LLM Chat UI  
**状态**: 设计已确认，待进入实现计划  
**版本**: v3.0 (Wireframe 已确认)

---

## 1. 设计目标

打造一个**明亮、清爽、学院手游通讯风格**的 Web LLM 聊天界面。整体气质类似游戏内手机聊天 App（MomoTalk 感）+ 学院任务终端，而非普通后台管理系统或深色赛博风。

### 核心设计原则

1. **游戏通讯感优先**: 主界面应让玩家/用户感觉在和一个学院角色对话。
2. **克制信息密度**: 不把 API、模型、温度、token 等后台字段堆在主界面。
3. **双人格主题**: Arona（明亮活泼）与 Plana（深色冷静）不只是 light/dark，而是两种 UI 人格。
4. **功能游戏化包装**: History、Actions、Tool Calls 都是真实功能，但视觉表现为游戏终端风格。
5. **素材可替换**: 所有头像、立绘使用 placeholder，预留清晰的替换接口。

---

## 2. 信息架构

### 2.1 桌面端布局

```
┌─────────────────────────────────────────────────────────────┐
│  Top Status Bar (sticky)                                    │
├──────────┬───────────────────────────────────┬──────────────┤
│          │                                   │              │
│ History  │        Chat Phone Frame           │   Actions    │
│  230px   │          自适应 (主视觉)           │   200px      │
│          │                                   │              │
│          │                                   │              │
│  历史会话 │       顶部栏 + 聊天气泡            │  当前会话信息 │
│  列表     │       工具调用卡片                │  快捷操作     │
│          │       输入作曲家                  │  Tool Logs   │
│          │                                   │              │
└──────────┴───────────────────────────────────┴──────────────┘
```

- **左侧 History**: 历史会话列表，不是角色选择器。
- **中间 Chat Phone Frame**: 核心聊天区，游戏内通讯 App 视觉。
- **右侧 Actions**: 轻量操作栏，可折叠，隐藏模型/统计后台信息。

### 2.2 移动端布局

单栏 + 底部导航：

- **Chat**: 当前聊天（默认页）
- **History**: 历史会话列表
- **Tools**: 工具调用记录 / 快捷动作
- **Settings**: 设置入口

### 2.3 内容层级

| 层级 | 位置 | 内容 |
|------|------|------|
| 一级 | 主界面 | 聊天、历史列表、轻量操作 |
| 二级 | Settings Modal / Page | API、模型、温度、System Prompt、导入导出 |
| 三级 | Tool Logs 详情 | 完整工具调用链、参数、返回值 |

---

## 3. 视觉设计系统

### 3.1 字体

- **西文**: Inter
- **中文**: Noto Sans SC
- **代码**: SF Mono / JetBrains Mono / 系统等宽字体

### 3.2 Arona 主题（默认亮色）

关键词: 明亮、清爽、天蓝、白色、柔和、活泼、学院感

| Token | 值 | 用途 |
|-------|-----|------|
| `--bg-page` | `#F4FBFF` → `#EAF7FF` | 页面背景渐变 |
| `--bg-card` | `rgba(255,255,255,0.92)` | 卡片背景 |
| `--primary` | `#35B8FF` | 主按钮、强调 |
| `--primary-light` | `#4CCBFF` | 头像渐变、hover |
| `--border` | `rgba(189,238,255,0.7)` | 细边框 |
| `--border-strong` | `#BDEEFF` | 明显边框 |
| `--accent` | `#FF8BA7` | 未读点、少女系点缀 |
| `--text-main` | `#1E2D3D` | 主文本 |
| `--text-secondary` | `#6B8A9E` | 次要文本 |
| `--text-muted` | `#9AB8CC` | 时间、hint |
| `--shadow` | `rgba(53,156,215,0.10)` | 柔和阴影 |
| `--shadow-strong` | `rgba(53,156,215,0.16)` | 强阴影 |

### 3.3 Plana 主题（深色）

关键词: 冷静、理性、科技感、深蓝、灰蓝、少量紫蓝

| Token | 值 | 用途 |
|-------|-----|------|
| `--bg-page` | `#0F1724` → `#131D2F` | 深色背景渐变 |
| `--bg-card` | `rgba(27,38,56,0.85)` | 深色卡片 |
| `--primary` | `#69B7FF` | 主强调 |
| `--primary-light` | `#8DA8FF` | 渐变、hover |
| `--border` | `rgba(105,183,255,0.22)` | 细边框 |
| `--accent` | `#A78BFA` | 点缀色 |
| `--text-main` | `#E8F1FA` | 主文本 |
| `--text-secondary` | `#9FB8D4` | 次要文本 |
| `--text-muted` | `#6B85A3` | 时间、hint |
| `--shadow` | `rgba(0,0,0,0.25)` | 阴影 |

### 3.4 圆角与阴影

- 大面板: `26px`
- 卡片: `18px - 24px`
- 气泡: `20px`
- 按钮: `12px - 14px`
- 头像: `14px - 16px`
- 输入框: `16px - 18px`
- 阴影统一使用蓝调柔和阴影，避免重黑影

### 3.5 HUD 装饰

- 背景浅蓝点阵（低密度，opacity 5%）
- 1-2 条淡蓝细横线
- 少量十字标记
- **原则**: 装饰性元素必须克制，不能干扰阅读。

---

## 4. 组件规格

### 4.1 TopStatusBar

- 高度: `50px`
- 位置: sticky top
- 内容:
  - 左侧: Logo Mark + "ARONA CHAT" + 副标题
  - 右侧: Arona/Plana 主题切换 + 设置入口
- 风格: 半透明毛玻璃，细下边框

### 4.2 HistoryPanel（左侧历史列表）

- 宽度: `230px`（桌面）
- 头部:
  - 标题 "History"
  - 会话数量 badge
  - "+ New Chat" 按钮（dashed border，轻量）
- 列表项:
  - placeholder 头像（方形圆角，渐变背景）
  - 会话标题
  - 最近一句摘要（单行截断）
  - 时间
  - 未读点（accent 色）
- 交互:
  - hover 高亮
  - active 状态带主色边框 + 淡背景
  - 长按/右键可重命名、删除

### 4.3 ChatPhoneFrame（中间手机聊天框）

- 外框: 大圆角卡片，带手机刘海 notch
- 顶部栏:
  - 角色头像（可替换）
  - 角色名 / 当前会话标题
  - 在线状态
  - 右侧: Regenerate、Stop、More
- 聊天区:
  - Assistant Bubble: 白色/深色卡片，左侧尖角，柔和阴影
  - User Bubble: 蓝渐变，右侧尖角，白色文字
  - 显示时间戳，用户消息显示已发送状态
- 输入作曲家:
  - 圆角输入框，placeholder "输入消息..."
  - 发送按钮为蓝渐变方形圆角
  - 支持 Enter 发送、Shift+Enter 换行

### 4.4 ToolCard（工具调用卡片）

- 展示在聊天流中，作为系统消息
- 结构:
  - 头部: 工具图标 + Tool Call · 工具名 + 状态标签
  - 状态: Running / Done / Failed
  - 内容区: 可折叠，显示参数/结果摘要
  - 底部: 一句话总结
- 视觉:
  - 使用 tool-bg 背景
  - 细边框
  - 状态标签 pill 形状
  - 避免开发者控制台的单调感

### 4.5 TypingIndicator

- 三个跳动圆点
- 放在 assistant 消息位置
- 使用主色

### 4.6 ActionsPanel（右侧轻量操作栏）

- 宽度: `200px`（桌面），移动端放入 Tools tab
- 内容:
  - Current Chat: 标题、创建时间、消息数
  - Quick Actions: Regenerate / Stop / Export / Clear
  - Tool Logs: 最近 2-3 条工具调用入口
- **禁止**: 模型名、温度、token、base URL、API key

### 4.7 SettingsModal

- 弹窗/设置页形式
- 内容:
  - Personality 切换: Arona / Plana
  - API Connection: Base URL、API Key
  - Model、Temperature
  - System Prompt
  - Import / Export Sessions
  - Danger Zone: Clear all data
- 视觉:
  - 圆角卡片
  - 分组明确
  - 输入框使用统一设计语言

### 4.8 ThemeToggle

- 顶部/设置中出现
- 两个选项: Arona / Plana
- active 项使用主色渐变 pill
- 切换时全局 CSS variables 变化

---

## 5. 状态管理架构

采用 **方案 B：按领域拆分多个独立 Zustand Store**。

### 5.1 Store 划分

```
stores/
├── settingsStore.ts    # API、模型、温度、主题、System Prompt
├── sessionStore.ts     # 会话列表、当前 session、消息、流式状态
├── uiStore.ts          # 主题、面板展开、模态框、移动端 tab
└── toolStore.ts        # 工具调用记录（可选，可归入 sessionStore）
```

### 5.2 各 Store 职责

#### useSettingsStore

- `baseUrl: string`
- `apiKey: string`
- `model: string`
- `temperature: number`
- `systemPrompt: string`
- `persona: 'arona' | 'plana'`
- actions: `updateConfig`, `setPersona`, `resetToDefaults`
- 持久化: localStorage (Zustand persist middleware)

#### useSessionStore

- `sessions: Session[]`
- `currentSessionId: string | null`
- `isStreaming: boolean`
- `abortController: AbortController | null`
- actions:
  - `createSession()`
  - `selectSession(id)`
  - `renameSession(id, title)`
  - `deleteSession(id)`
  - `sendMessage(content)`
  - `stopGeneration()`
  - `regenerateMessage()`
  - `clearSession(id)`
  - `exportSessions()` / `importSessions(data)`
- 持久化: localStorage（后续可升级 IndexedDB）

#### useUIStore

- `isHistoryOpen: boolean`（桌面默认 true，移动端由 tab 控制）
- `isActionsOpen: boolean`
- `activeMobileTab: 'chat' | 'history' | 'tools' | 'settings'`
- `isSettingsOpen: boolean`
- `toolLogExpanded: boolean`
- 持久化: 部分可持久化（如主题），UI 状态通常不持久化

### 5.3 数据模型

```typescript
interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  createdAt: number;
  toolCalls?: ToolCall[];
  status?: 'sending' | 'sent' | 'error';
}

interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, any>;
  result?: any;
  status: 'running' | 'success' | 'error';
  startedAt: number;
  finishedAt?: number;
}

interface Session {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
  systemPrompt?: string; // 可覆盖全局
}

interface Settings {
  baseUrl: string;
  apiKey: string;
  model: string;
  temperature: number;
  systemPrompt: string;
  persona: 'arona' | 'plana';
}
```

---

## 6. LLM 集成

### 6.1 API 规范

- 支持 **OpenAI-compatible API**。
- 使用原生 `fetch` 实现，避免额外依赖。
- 流式响应通过 `ReadableStream` + `SSE` 解析。

### 6.2 请求配置

- Base URL 可配置（默认 `https://api.openai.com/v1`）
- API Key 本地存储，请求时加入 `Authorization: Bearer <key>`
- Model、Temperature、System Prompt 均来自 settingsStore

### 6.3 流式生成

- 发送请求时创建 `AbortController`
- 逐段解析 `data: {...}` SSE 行
- 实时更新当前 assistant 消息内容
- 支持 `stopGeneration()` 取消

### 6.4 错误处理

- 网络错误: 显示轻量 toast / 聊天内系统提示
- API 错误: 解析 error message，展示为 assistant 错误消息
- 超时: 可配置，默认 60s

---

## 7. 工具调用可视化

### 7.1 触发时机

当 LLM 返回 `tool_calls` 或应用层主动调用工具时，在聊天流中插入 ToolCard。

### 7.2 展示规则

- 默认折叠，只显示工具名和状态
- 用户可点击展开查看参数和结果
- Running 状态显示脉冲动画
- Failed 状态使用错误色（红/橙）

### 7.3 示例场景

- `list_files`: 显示文件列表摘要
- `search_code`: 显示搜索结果数
- `execute_code`: 显示执行状态和输出
- `read_file`: 显示文件路径和大小

### 7.4 与右侧 Actions 联动

- Tool Logs 展示最近 3 条工具调用
- 点击 "View All" 可展开完整工具调用面板

---

## 8. 主题系统

### 8.1 主题切换

- 使用 CSS Variables 实现
- 主题类挂载在 `<html>` 或 `<body>` 上
- 切换时无刷新，过渡动画 0.3s

### 8.2 Arona 人格

- Logo: A
- 终端名: Schale Terminal
- 聊天气泡: 天蓝渐变
- 整体情绪: 活泼、亲和

### 8.3 Plana 人格

- Logo: P
- 终端名: Aria Terminal
- 聊天气泡: 冷蓝渐变
- 整体情绪: 冷静、理性

### 8.4 主题持久化

- 当前主题保存到 settingsStore
- 下次打开恢复上次选择

---

## 9. 持久化策略

### 9.1 第一阶段：localStorage

所有 store 使用 Zustand `persist` middleware 写入 localStorage。

```typescript
persist(store, {
  name: 'arona-settings',
  partialize: (state) => ({ ... })
})
```

### 9.2 第二阶段：IndexedDB（可选升级）

- 当会话数据量大时，将 `sessionStore` 迁移到 IndexedDB
- 其他 store 仍使用 localStorage
- 通过封装 storage adapter 实现，业务代码无感

### 9.3 导入导出

- 导出: 下载 JSON 文件，包含 sessions + settings
- 导入: 读取 JSON 文件，合并或覆盖当前数据
- 格式版本化，便于未来兼容

---

## 10. 响应式策略

### 10.1 断点

- 桌面: `≥1024px`，三栏布局
- 平板: `768px - 1023px`，可隐藏右侧 Actions，左右可切换
- 移动: `<768px`，单栏 + 底部导航

### 10.2 移动端交互

- 默认显示 Chat
- History / Tools / Settings 通过底部导航切换
- 聊天时底部导航可自动隐藏（可选）

---

## 11. 性能考虑

- 长会话使用虚拟滚动（消息多时）
- 流式更新使用 throttle / requestAnimationFrame
- 图片/头像懒加载
- localStorage 数据过大时提示清理或迁移 IndexedDB

---

## 12. 测试策略

### 12.1 单元测试

- Store actions（Vitest）
- LLM 请求工具函数
- 主题切换逻辑

### 12.2 组件测试

- ChatPhoneFrame 渲染
- ToolCard 状态展示
- SettingsModal 表单交互

### 12.3 E2E（可选）

- 创建会话 → 发送消息 → 流式响应
- 主题切换
- 导入导出

---

## 13. 素材与占位符

### 13.1 头像占位符

- 使用 emoji + 渐变背景方块
- 形状: 方形圆角（14-16px radius）
- 后续替换为真实角色头像时，只需修改 avatar 组件的 src

### 13.2 角色立绘

- 本次设计不依赖官方素材
- 如需背景立绘，使用纯色/渐变占位
- 预留 `characterArt` 字段和绝对定位容器

### 13.3 图标

- 初期使用 emoji 或 SVG placeholder
- 后续可替换为统一图标库（如 Phosphor Icons）

---

## 14. 未来扩展

- 多模态消息（图片、文件）
- 语音输入/朗读
- 后端同步与多设备登录
- 插件系统 / MCP 工具市场
- 更多人格主题

---

## 15. 已确认决策

| 项目 | 决策 |
|------|------|
| 技术栈 | React + TypeScript + Vite + Tailwind CSS |
| 状态管理 | 多独立 Zustand Store |
| 持久化 | 先 localStorage，后续可选 IndexedDB |
| 左侧栏 | History（历史会话列表） |
| 右侧栏 | Actions（轻量操作栏） |
| 主题 | Arona / Plana 双人格主题 |
| 配置位置 | Settings Modal / Page（二级） |
| 工具调用 | 聊天流内 ToolCard 可视化 |
| 头像素材 | Placeholder，预留替换接口 |

---

## 16. 待实现计划

下一步：使用 `writing-plans` skill 制定详细实现计划，包括：

1. 项目初始化（Vite + Tailwind）
2. 全局样式与主题系统
3. Store 架构与持久化
4. 核心组件开发顺序
5. LLM 流式集成
6. 工具调用可视化
7. 移动端适配
8. 导入导出与设置
9. 测试与收尾

---

*本设计文档基于 2026-06-13 确认的 Wireframe v3 编写。*