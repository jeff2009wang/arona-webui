# Arona WebUI v4 — BA-like Glass UI Design Spec

**Date:** 2026-06-14  
**Approach:** B — 保留数据层，替换 UI 层  
**Default theme:** Arona Light

---

## 1. 总体方向

v4 的核心转变：从"三栏 Web App"改为"全屏 CG 背景 + 半透明游戏通讯浮层"。

视觉参考：蔚蓝档案 MomoTalk。目标感觉是游戏内通讯 App，不是管理后台，不是普通 ChatGPT 页面。

**不使用任何官方版权素材。** 所有 CG 背景由用户自行放置本地文件，仓库只内置 CSS 渐变 fallback 和自绘 SVG 占位。

---

## 2. 保留不动的部分

以下文件**不修改**：

- `src/stores/` — sessionStore, settingsStore, uiStore
- `src/hooks/useLLM.ts`
- `src/lib/` — llm.ts, storage.ts
- `src/types/index.ts`（需新增字段，见第 4 节）

所有测试继续有效。

---

## 3. 背景层系统

### 本地背景目录

```
public/assets/local/backgrounds/
  arona-light.png   ← 用户自行放置，不提交到仓库
  plana-dark.png    ← 用户自行放置，不提交到仓库
```

### 层级顺序

```
Layer 0  CG 图片 / CSS 渐变 fallback
Layer 1  主题遮罩（半透明渐变）
Layer 2  点阵装饰（非常淡，opacity 0.05–0.08）
Layer 3  Glass UI 面板（backdrop-filter: blur）
Layer 4  聊天气泡 / 工具卡片
Layer 5  FAB 悬浮按钮
```

### Arona Light 背景

```css
/* 有本地图时 */
background:
  linear-gradient(rgba(235,250,255,0.72), rgba(235,250,255,0.86)),
  url("/assets/local/backgrounds/arona-light.png") center/cover no-repeat;

/* fallback（无图时）*/
background: linear-gradient(145deg, #c9eeff 0%, #a8d8f0 18%, #d4f0ff 35%,
            #b8e8ff 50%, #e8f8ff 65%, #cce8f8 80%, #b0d8f0 100%);
```

### Plana Dark 背景

```css
/* 有本地图时 */
background:
  linear-gradient(rgba(8,14,28,0.70), rgba(8,14,28,0.88)),
  url("/assets/local/backgrounds/plana-dark.png") center/cover no-repeat;

/* fallback */
background: linear-gradient(145deg, #0a1322 0%, #0d1a30 40%, #091220 100%);
```

### 图片 fallback 机制

`ThemeProvider` 尝试加载本地图片（用 `new Image()` 预检）。加载成功则应用带图版 CSS；加载失败或图不存在则静默 fallback 到渐变，UI 不报错、不闪烁。

---

## 4. 类型扩展

在 `src/types/index.ts` 的 `Settings` 接口新增：

```ts
interface Settings {
  // ...已有字段...
  enableCgBackground: boolean;   // default: true
  backgroundOpacity: number;     // default: 0.75（遮罩透明度系数）
  backgroundBlur: number;        // default: 0（背景模糊 px，0=不模糊）
  maxTokens: number;             // default: 2048
}
```

`settingsStore` 的 `defaultSettings` 同步补充这些默认值。

---

## 5. CSS 变量体系

`src/index.css` 更新，保持现有变量名兼容，调整值：

### Arona Light（`:root`）

```css
--bg-main: #F3FBFF;
--bg-soft: #EAF7FF;
--card: rgba(255,255,255,0.72);
--card-header: rgba(255,255,255,0.40);
--line: rgba(180,235,255,0.75);
--line-soft: rgba(180,235,255,0.40);
--primary: #1FA8FF;
--primary-light: #6dd5ff;
--text-main: #1a2d40;
--text-sub: #5a7a8a;
--text-muted: #8faabb;
--bubble-user-from: #6dd5ff;
--bubble-user-to: #1FA8FF;
--bubble-ai: rgba(255,255,255,0.88);
--tool-bg: rgba(31,168,255,0.06);
--hud: rgba(69,200,255,0.06);   /* 点阵 opacity 降低 */
--shadow: rgba(45,170,230,0.18);
--danger: #f87171;
--status-ok: #4ade80;
```

### Plana Dark（`[data-theme='plana']`）

```css
--bg-main: #0F1724;
--bg-soft: #131D2F;
--card: rgba(18,28,46,0.78);
--card-header: rgba(18,28,46,0.40);
--line: rgba(110,170,230,0.28);
--line-soft: rgba(70,100,140,0.35);
--primary: #69B7FF;
--primary-light: #8DA8FF;
--text-main: #E7F1FF;
--text-sub: #6a90b0;
--text-muted: #4a6a8a;
--bubble-user-from: #3a6aa0;
--bubble-user-to: #69B7FF;
--bubble-ai: rgba(27,38,56,0.88);
--tool-bg: rgba(105,183,255,0.06);
--hud: rgba(105,183,255,0.05);
--shadow: rgba(0,0,0,0.42);
--danger: #f87171;
--status-ok: #4ade80;
```

---

## 6. 布局结构

### Desktop（≥ lg）

```
全屏背景（Layer 0–2）
  └── padding: 16px, display: grid, grid-template-columns: 210px 1fr
        ├── HistoryPanel（glass card）
        └── ChatFrame（glass card，内嵌 FABDrawer）
```

`DesktopLayout` 改为两栏（移除原右侧 ActionsPanel 列）。`ActionsPanel` 组件**删除**。

### Mobile（< lg）

保持现有 `MobileLayout` tab 结构，只更新内部组件样式。

---

## 7. 组件改动清单

### 7.1 `ThemeProvider`

- 新增背景图预检逻辑（`new Image()` probe）
- 根据检测结果动态设置 `document.body` 的 `background` 内联样式
- 监听 `persona`、`enableCgBackground`、`backgroundOpacity`、`backgroundBlur` 变化
- `backgroundOpacity` 作为系数乘以遮罩 rgba alpha 值（Arona 基准 0.72/0.86，Plana 基准 0.70/0.88），范围 0–1
- `backgroundBlur` 对背景图层伪元素添加 `filter: blur(Xpx)`，仅作用于 Layer 0，不影响 glass 面板的 `backdrop-filter`

### 7.2 `DesktopLayout`

- 改为 `grid-template-columns: 210px 1fr`（两栏）
- 背景点阵移到这里渲染（`::before` 伪元素）
- 增加 HUD 角线装饰（`::after` 或独立 div）

### 7.3 `HistoryPanel`

重写视觉，逻辑不变：

- 外容器：`background: var(--card); backdrop-filter: blur(20px); border-radius: 20px; border: 1px solid var(--line)`
- Header：`var(--card-header)` 背景，`CHATS` 标签 + New Chat 虚线按钮
- 会话项：`padding: 8px 9px; border-radius: 13px`，选中态 `background: rgba(primary, .14); border: 1px solid rgba(primary, .4)`
- 会话头像：渐变方块（`border-radius: 9px`），fallback emoji 🎓 / 🌙
- 会话元信息：标题（11px bold）+ 摘要（9px truncate）+ 时间（8px muted）

### 7.4 `ChatFrame`（原 `ChatPhoneFrame`，文件重命名为 `ChatFrame.tsx`，组件名同步改为 `ChatFrame`）

- 外容器：`background: var(--card); backdrop-filter: blur(22px); border-radius: 22px; border: 1px solid var(--line); box-shadow: 0 24px 80px var(--shadow)`
- 顶部移除模拟"刘海"div
- 内嵌 `FABDrawer`（见 7.7）

### 7.5 `ChatHeader`

- 高度更自然（`padding: 12px 16px`）
- 角色头像：40px 圆形，渐变背景，在线绿点
- 角色名：14px 800 weight
- 副标题：10px，Online · Terminal 状态
- 右侧：当前模型名 HUD 标签（从 settingsStore 读取）

### 7.6 `AssistantBubble` / `UserBubble`

- AI 气泡：`background: var(--bubble-ai); border: 1px solid var(--line-soft); backdrop-filter: blur(8px); border-radius: 18px; border-bottom-left-radius: 4px`
- 用户气泡：`background: linear-gradient(135deg, var(--bubble-user-from), var(--bubble-user-to)); border-radius: 18px; border-bottom-right-radius: 4px; box-shadow: 0 6px 20px rgba(var(--primary-rgb), .3)`
- 时间戳：9px muted，气泡下方，不在气泡内
- 头像：28px 圆形，AI 用渐变，用户用半透明白色

### 7.7 `FABDrawer`（新组件，替代 `ActionsPanel`）

悬浮在 `ChatFrame` 内部右下角（`position: absolute; bottom: 62px; right: 12px; z-index: 10`）。

**收起状态：** 只显示主 FAB 按钮（42px 渐变圆形，☰ 图标，glow 阴影）。

**展开状态：** 主 FAB 上方展开子按钮列（从下到上依次出现）：
- ◻ Stop（仅 isStreaming 时亮起）
- 🗑 Clear
- 📤 Export
- ⚙ Settings

子按钮：32px 圆形，`background: var(--card); backdrop-filter: blur(10px); border: 1px solid var(--line)`，hover 时 `scale(1.1)` + 淡发光。

点击 Settings 触发 `openSettings()`。点击主 FAB 或 FABDrawer 外部区域收起（用 `useEffect` 绑 `document` click listener，点击 FABDrawer 容器内部不冒泡）。不需要额外遮罩 div。Export 按钮触发 `exportToFile()`（sessionStore）。

### 7.8 `ToolCard`

同一张卡片，三种状态（`status: 'running' | 'success' | 'error'`）：

**结构：**
```
[top bar]  左：状态图标 + "TOOL CALL/RESULT/ERROR"  |  右：状态徽章
[body]     工具名（12px bold）
           Running: 描述文字"正在调用..."
           Success: 结果摘要一行
           Error:   错误描述
           Success/Error（展开）: mono 代码块
[footer]   展开/收起 toggle
```

**样式：**
- 左侧 accent 线：`border-left: 3px solid` running=primary / success=green / error=red
- 背景：`var(--tool-bg)`，带对应色调
- Running：spinner（CSS animation）+ pulse dot
- Success：✓ 绿色
- Error：✗ 红色
- 可折叠：`expanded` 本地 state，展开显示 JSON/文本代码块

### 7.9 `SettingsModal`

新增 Background 配置区：

```
Background
  [ ] Enable CG Background
  Arona background: [/assets/local/backgrounds/arona-light.png]
  Plana background:  [/assets/local/backgrounds/plana-dark.png]
  Overlay Opacity:   [slider 0–1, default 0.75]
  Background Blur:   [slider 0–20px, default 0]
  [Reset to fallback]
```

新增 Max Tokens 输入框（与 Temperature 并排）。

"Personality" 标签改为 "Theme"，选项显示 **Arona** / **Plana**（不写 Light/Dark）。

---

## 8. SVG / 公共素材

```
public/assets/
  placeholders/
    avatar-arona.svg      渐变圆形 + 抽象学院图标（自绘，CC0）
    avatar-plana.svg      渐变圆形 + 月亮图标（自绘，CC0）
    avatar-user.svg       渐变圆形 + 人形轮廓（自绘，CC0）
  local/
    backgrounds/          ← gitignore，用户自行放置
      .gitkeep
```

SVG 文件头注释：`<!-- Self-drawn original artwork, CC0 license -->`

`public/assets/local/backgrounds/.gitkeep` 确保目录在仓库中存在，用户放图后自动识别。

---

## 9. FAB 展开动画

子按钮用 CSS transition 实现：

```css
.fab-sub { 
  transform: translateY(8px) scale(0.85);
  opacity: 0;
  transition: transform .2s cubic-bezier(.34,1.56,.64,1), opacity .15s;
  pointer-events: none;
}
.fab-sub.open {
  transform: translateY(0) scale(1);
  opacity: 1;
  pointer-events: auto;
}
```

各子按钮用 `transition-delay` 错开（0ms, 40ms, 80ms, 120ms）产生级联动画。

---

## 10. `.gitignore` 追加

```
.superpowers/
public/assets/local/backgrounds/arona-light.png
public/assets/local/backgrounds/plana-dark.png
public/assets/local/backgrounds/arona-dark.png
public/assets/local/backgrounds/plana-light.png
```

---

## 11. 验收标准

1. 默认主题是 Arona Light（`defaultSettings.persona = 'arona'`）
2. 第一眼不像后台管理系统
3. 聊天区像游戏内通讯 App（气泡圆润、留白自然、glass 面板）
4. 左侧是历史对话列表，不是助手列表
5. 右侧无常驻面板，FAB 在聊天区右下角，展开/收起流畅
6. 工具调用在聊天流中展示为单张卡片，状态原地更新
7. 模型/API/温度/MaxTokens 全部在 Settings Modal
8. 本地 CG 背景自动检测，存在则生效，不存在则 fallback 渐变（不报错）
9. 使用自绘 SVG + CSS 装饰，不内置任何官方版权素材
10. 点阵透明度 ≤ 0.08，不抢眼
11. Plana 主题 glass 面板深蓝色，Arona 主题白色半透明

---

## 12. 不在本次范围内

- 多模态（图片上传）
- Markdown 渲染升级
- 消息编辑 / 重新生成
- PWA / 离线支持
