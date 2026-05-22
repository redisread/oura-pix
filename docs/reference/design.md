# OuraPix Design System

## 项目概述

OuraPix 是一个极简「AI跨境商品详情页生成」工具，设计风格追求克制、现代、无冗余。

## 设计理念

- **极简主义**：去除一切不必要的装饰，聚焦核心功能
- **留白艺术**：大量留白创造呼吸感，提升内容可读性
- **克制配色**：以纯白/浅灰为基底，蓝绿点缀强调
- **清晰层次**：通过间距和字重建立视觉层级

---

## 配色方案

### 主色调

| Token | 值 | 用途 |
|-------|------|------|
| `--primary` | `#0f172a` (Slate 900) | 主要文字、按钮、强调 |
| `--primary-foreground` | `#ffffff` | 主色上的文字 |
| `--accent` | `#3b82f6` (Blue 500) | 链接、高亮、交互状态 |
| `--accent-green` | `#10b981` (Emerald 500) | 成功状态、在线指示 |

### 背景色

| Token | 值 | 用途 |
|-------|------|------|
| `--background` | `#ffffff` | 主背景 |
| `--background-subtle` | `#f8fafc` (Slate 50) | 次级背景、卡片 |
| `--background-muted` | `#f1f5f9` (Slate 100) | 悬停状态、分隔 |

### 文字色

| Token | 值 | 用途 |
|-------|------|------|
| `--foreground` | `#0f172a` (Slate 900) | 主要文字 |
| `--foreground-muted` | `#475569` (Slate 600) | 次要文字 |
| `--foreground-subtle` | `#94a3b8` (Slate 400) | 占位符、禁用 |

### 边框色

| Token | 值 | 用途 |
|-------|------|------|
| `--border` | `#e2e8f0` (Slate 200) | 默认边框 |
| `--border-subtle` | `#f1f5f9` (Slate 100) | 浅色边框 |
| `--border-strong` | `#cbd5e1` (Slate 300) | 强调边框 |

### 功能色

| Token | 值 | 用途 |
|-------|------|------|
| `--success` | `#10b981` | 成功状态 |
| `--warning` | `#f59e0b` | 警告状态 |
| `--error` | `#ef4444` | 错误状态 |
| `--info` | `#3b82f6` | 信息提示 |

---

## 字体规范

### 字体族

- **主字体**: `Inter, system-ui, -apple-system, sans-serif`
- **等宽字体**: `JetBrains Mono, Consolas, monospace` (代码展示)

### 字号系统

| 级别 | 大小 | 字重 | 行高 | 字间距 | 用途 |
|------|------|------|------|--------|------|
| Display | 4rem (64px) | 700 | 1.1 | -0.02em | Hero 标题 |
| H1 | 3rem (48px) | 700 | 1.2 | -0.02em | 页面标题 |
| H2 | 2rem (32px) | 600 | 1.3 | -0.01em | 区块标题 |
| H3 | 1.5rem (24px) | 600 | 1.4 | 0 | 卡片标题 |
| H4 | 1.25rem (20px) | 600 | 1.5 | 0 | 小标题 |
| Body | 1rem (16px) | 400 | 1.6 | 0 | 正文 |
| Body Small | 0.875rem (14px) | 400 | 1.5 | 0 | 次要文字 |
| Caption | 0.75rem (12px) | 500 | 1.4 | 0.01em | 标签、注释 |

### 字体规则

- 标题使用负字间距增加紧凑感
- 正文保持 1.6 行高提升阅读体验
- 标签使用中等字重区分层级

---

## 间距系统

基于 4px 网格系统，所有间距值为 4 的倍数。

| Token | 值 | 用途 |
|-------|------|------|
| `--space-1` | 0.25rem (4px) | 极紧凑 |
| `--space-2` | 0.5rem (8px) | 紧凑间距 |
| `--space-3` | 0.75rem (12px) | 小间距 |
| `--space-4` | 1rem (16px) | 默认间距 |
| `--space-5` | 1.25rem (20px) | 中间距 |
| `--space-6` | 1.5rem (24px) | 中间距 |
| `--space-8` | 2rem (32px) | 大间距 |
| `--space-10` | 2.5rem (40px) | 大间距 |
| `--space-12` | 3rem (48px) | 区块内边距 |
| `--space-16` | 4rem (64px) | 大区块间距 |
| `--space-20` | 5rem (80px) | Section 间距 |
| `--space-24` | 6rem (96px) | 大 Section 间距 |

### 间距规则

- 组件内部使用小间距 (space-2 ~ space-4)
- 卡片内边距使用 space-6 ~ space-8
- Section 间距使用 space-16 ~ space-24
- 相关元素间距紧凑，不相关元素间距宽松

---

## 圆角系统

| Token | 值 | 用途 |
|-------|------|------|
| `--radius-none` | 0 | 无圆角 |
| `--radius-sm` | 0.25rem (4px) | 小元素 |
| `--radius-md` | 0.375rem (6px) | 按钮、输入框 |
| `--radius-lg` | 0.5rem (8px) | 卡片、弹窗 |
| `--radius-xl` | 0.75rem (12px) | 大卡片 |
| `--radius-2xl` | 1rem (16px) | 特殊卡片 |
| `--radius-full` | 9999px | 胶囊、圆形 |

---

## 阴影系统

| Token | 值 | 用途 |
|-------|------|------|
| `--shadow-none` | none | 无阴影 |
| `--shadow-sm` | 0 1px 2px 0 rgb(0 0 0 / 0.05) | 轻微提升 |
| `--shadow-md` | 0 4px 6px -1px rgb(0 0 0 / 0.1) | 卡片默认 |
| `--shadow-lg` | 0 10px 15px -3px rgb(0 0 0 / 0.1) | 悬停状态 |
| `--shadow-xl` | 0 20px 25px -5px rgb(0 0 0 / 0.1) | 弹窗、下拉 |

---

## 组件规范

### 按钮

**主按钮 (Primary)**
- 背景: `--primary` (#0f172a)
- 文字: `--primary-foreground` (white)
- 圆角: `--radius-lg` (8px)
- 内边距: 0.75rem 1.5rem (space-3 space-6)
- 字重: 500
- 悬停: 背景变为 #1e293b (Slate 800)

**次按钮 (Secondary)**
- 背景: transparent
- 边框: 1px solid `--border`
- 文字: `--foreground`
- 悬停: 背景变为 `--background-muted`

**幽灵按钮 (Ghost)**
- 背景: transparent
- 文字: `--foreground-muted`
- 悬停: 背景变为 `--background-muted`，文字变为 `--foreground`

### 卡片

**默认卡片**
- 背景: `--background` (white)
- 边框: 1px solid `--border`
- 圆角: `--radius-xl` (12px)
- 阴影: `--shadow-sm`
- 内边距: space-6 (1.5rem)

**悬停效果**
- 阴影变为 `--shadow-md`
- 轻微上移 translateY(-2px)
- 过渡: 200ms ease

### 输入框

**文本输入**
- 背景: `--background`
- 边框: 1px solid `--border`
- 圆角: `--radius-lg` (8px)
- 内边距: 0.625rem 0.875rem
- 聚焦: 边框变为 `--primary`，添加 ring

### 标签/徽章

**默认徽章**
- 背景: `--background-subtle`
- 文字: `--foreground-muted`
- 圆角: `--radius-full`
- 内边距: 0.25rem 0.75rem
- 字号: 0.875rem

**状态徽章**
- 在线: 绿点 + 文字
- 新功能: 蓝底白字
- 热门: 深底白字

---

## 页面原型描述

### 首页 (Home)

**布局结构**
```
[Navbar]
[Hero Section]
  - Badge (状态指示)
  - 主标题 (高亮关键词)
  - 副标题
  - CTA 按钮组
  - 数据统计
[How It Works Section]
  - 三步流程卡片 (横向排列)
  - 步骤编号大字体背景
  - 图标 + 标题 + 描述
[Features Section]
  - 四列特性展示
  - 图标 + 标题 + 描述
[CTA Section]
  - 深色背景
  - 标题 + 描述 + 按钮
[Footer]
```

**设计要点**
- Hero 区大量留白，文字居中
- 步骤卡片带连接线指示流程
- 数据统计增加信任感
- CTA 区使用深色背景形成对比

### 生成页 (Generate)

**布局结构**
```
[Navbar]
[Header]
  - 页面标题 + 描述
[Main Content - 三栏布局]
  [左栏: 上传区]
    - 主图上传 (单图)
    - 风格参考图上传 (多图)
    - 提示卡片
  [中栏: 设置面板]
    - 平台选择 (图标按钮组)
    - 生成数量滑块
    - 风格选择 (列表)
    - 语言选择下拉
    - 生成按钮
  [右栏: 预览区]
    - 进度条 (生成中)
    - 预览网格 (2x2)
    - 下载按钮
[Footer]
```

**设计要点**
- 三栏布局，左窄右宽
- 上传区使用虚线边框拖拽区
- 设置面板使用卡片容器
- 预览区实时显示生成进度

### 定价页 (Pricing)

**布局结构**
```
[Navbar]
[Header]
  - 页面标题 + 描述
[Pricing Cards - 三列]
  - 免费版
  - 专业版 (Popular 标记)
  - 企业版
[Feature Comparison]
  - 功能对比表格
[FAQ Section]
  - 手风琴式问答
[CTA Section]
  - 深色背景
[Footer]
```

**设计要点**
- 中间卡片突出显示 (ring + badge)
- 价格大号显示，周期小字
- 功能列表使用勾选/禁用图标
- 对比表格清晰展示差异

---

## 动画与过渡

### 过渡时间

- 快速: 150ms (按钮状态)
- 默认: 200ms (悬停效果)
- 中等: 300ms (卡片、弹窗)
- 慢速: 500ms (页面过渡)

### 缓动函数

- 默认: `ease`
- 平滑: `cubic-bezier(0.4, 0, 0.2, 1)`
- 弹跳: `cubic-bezier(0.34, 1.56, 0.64, 1)`

### 常用动画

**悬停提升**
```css
transition: transform 200ms ease, box-shadow 200ms ease;
:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}
```

**按钮缩放**
```css
transition: transform 150ms ease;
:active {
  transform: scale(0.98);
}
```

**渐变显示**
```css
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
```

---

## 响应式断点

| 断点 | 宽度 | 说明 |
|------|------|------|
| sm | 640px | 小屏手机 |
| md | 768px | 平板 |
| lg | 1024px | 小桌面 |
| xl | 1280px | 桌面 |
| 2xl | 1400px | 大桌面 |

### 响应式规则

- 移动端: 单列布局，减少间距
- 平板: 两列布局，中等间距
- 桌面: 完整布局，标准间距

---

## 视觉 Tokens (CSS Variables)

```css
:root {
  /* Colors */
  --background: 0 0% 100%;
  --foreground: 222 47% 11%;
  --primary: 222 47% 11%;
  --primary-foreground: 0 0% 100%;
  --secondary: 210 40% 96%;
  --secondary-foreground: 222 47% 11%;
  --muted: 210 40% 96%;
  --muted-foreground: 215 16% 47%;
  --accent: 217 91% 60%;
  --accent-foreground: 0 0% 100%;
  --border: 214 32% 91%;
  --input: 214 32% 91%;
  --ring: 222 47% 11%;

  /* Radius */
  --radius: 0.5rem;

  /* Shadows */
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
}
```

---

## 文件结构

```
app/
├── globals.css          # 全局样式 + CSS Variables
├── layout.tsx           # 根布局 (字体配置)
├── page.tsx             # 首页
├── generate/
│   └── page.tsx         # 生成页
├── pricing/
│   └── page.tsx         # 定价页
└── components/          # 共享组件
    ├── navbar.tsx
    ├── footer.tsx
    └── upload-dropzone.tsx
```

---

## 参考资源

- 设计参考: picsetai.com
- 字体: [Inter](https://rsms.me/inter/)
- 图标: [Lucide](https://lucide.dev/)
- 配色: [Tailwind Slate](https://tailwindcss.com/docs/customizing-colors)
