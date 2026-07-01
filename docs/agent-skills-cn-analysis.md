# Agent 技能汉化与适配分析

基于 https://github.com/addyosmani/agent-skills 仓库，共 23 个技能。

---

## 1. documentation-and-adrs → 文档与架构决策记录

**描述：** 记录架构决策和文档。在进行重大架构决策、更改公共 API、发布功能或需要记录上下文时使用。

**使用场景：**
- 做出重大架构决策时
- 在竞争方案之间做选择时
- 添加或更改公共 API 时
- 发布改变用户可见行为的功能时
- 新成员（或 Agent）加入项目时

**Oura Pix 适配度：** ⭐⭐⭐ 高
- 已为多个架构决策使用了 ADR 思维（路由、i18n、prerender）
- 需要为团队决策补写正式 ADR 文档

---

## 2. frontend-ui-engineering → 前端 UI 工程

**描述：** 构建生产级质量的 UI。在构建或修改用户界面时使用。关注无障碍、性能和视觉设计。

**使用场景：**
- 构建新 UI 组件或页面时
- 修改现有用户界面时
- 实现响应式布局时
- 添加交互或状态管理时

**Oura Pix 适配度：** ⭐⭐⭐ 高
- 我们的 UI 组件库（Button/Card/Input/Badge）直接应用此技能
- 设计系统（间距 scale、颜色 token）需要持续遵循

---

## 3. git-workflow-and-versioning → Git 工作流与版本管理

**描述：** 结构化 Git 工作流实践。在进行任何代码更改、提交、分支、解决冲突时使用。

**核心原则：**
- 主干开发：保持 main 始终可部署
- 短生命周期功能分支（1-3 天内合并）
- 提交作为保存点，分支作为沙箱

**Oura Pix 适配度：** ⭐⭐⭐ 高
- 当前使用 worktree 分支开发模式
- 遵循主干开发原则

---

## 4. code-review-and-quality → 代码审查与质量

**描述：** 多维度代码审查。在合并任何更改前使用。覆盖五个维度：正确性、可读性、架构、安全、性能。

**审批标准：** 当更改确实改善整体代码健康时批准，即使不完美。

**Oura Pix 适配度：** ⭐⭐⭐ 高
- 每次 PR 合并前执行 CR
- 已成功应用于 Bob 的 PR #55 审查

---

## 5. spec-driven-development → 规格驱动开发

**描述：** 在写代码之前写规格说明。在开始新项目、功能或重大更改且尚无规格时使用。

**使用场景：**
- 开始新项目或功能时
- 需求不明确或不完整时
- 更改涉及多个文件或模块时

**Oura Pix 适配度：** ⭐⭐⭐ 高
- 每个新功能应先写规格说明
- 当前任务执行隐含了此模式

---

## 6. test-driven-development → 测试驱动开发

**描述：** 用测试驱动开发。在实现任何逻辑、修复任何 bug 或更改任何行为时使用。

**核心原则：** 先写失败测试，再写通过代码。测试是证明。

**Oura Pix 适配度：** ⭐⭐⭐ 高
- Playwright E2E 测试已覆盖核心页面
- 需要为新增功能补写 TDD 流程

---

## 7. incremental-implementation → 增量实现

**描述：** 增量交付更改。在实现涉及多个文件的任何功能或更改时使用。

**核心原则：** 薄垂直切片 — 实现一个片段，测试它，验证它，然后扩展。

**Oura Pix 适配度：** ⭐⭐⭐ 高
- Bob 的 P0/P1 实现模式（分批 PR）完美遵循此技能

---

## 8. using-agent-skills → 使用 Agent 技能

**描述：** 发现和调用 Agent 技能。在开始会话或发现适用技能时使用。这是管理所有其他技能调用的元技能。

**Oura Pix 适配度：** ⭐⭐⭐ 高
- 所有开发工作流的基础设施

---

## 9. planning-and-task-breakdown → 规划与任务分解

**描述：** 将工作分解为有序任务。在有规格或明确需求需要分解为可实施任务时使用。

**Oura Pix 适配度：** ⭐⭐ 中
- 任务分解已在 Slock channel 中执行
- 与 spec-driven-development 协同使用

---

## 10. performance-optimization → 性能优化

**描述：** 优化应用性能。在怀疑性能退化或 Core Web Vitals 需要改进时使用。

**Oura Pix 适配度：** ⭐⭐ 中
- P2 优化已完成（字体预加载、页面预取）
- OG 图片缺失影响了性能
- 需要持续监控 Core Web Vitals

---

## 11. security-and-hardening → 安全加固

**描述：** 加固代码防止漏洞。在处理用户输入、认证、数据存储或外部集成时使用。

**Oura Pix 适配度：** ⭐⭐ 中
- 认证中间件已就位
- API 路由有 auth 保护
- 需要定期安全审查

---

## 12. ci-cd-and-automation → CI/CD 与自动化

**描述：** 自动化 CI/CD 流水线设置。在配置构建和部署流水线时使用。

**Oura Pix 适配度：** ⭐⭐ 中
- GitHub Actions 已配置 quality/test/security 检查
- Cloudflare Workers 自动部署
- 需要完善 test 阶段

---

## 13. debugging-and-error-recovery → 调试与错误恢复

**描述：** 引导系统化根因调试。在测试失败、构建中断、行为不符合预期时使用。

**Oura Pix 适配度：** ⭐⭐ 中
- 已成功修复多个生产问题（前端的 [slug] 路由）
- 需要系统化的调试流程文档

---

## 14. api-and-interface-design → API 与接口设计

**描述：** 指导稳定的 API 和接口设计。在设计 API、模块边界或任何公共接口时使用。

**Oura Pix 适配度：** ⭐⭐ 中
- API 路由设计遵循 RESTful
- 需要为前端组件接口（props）建立类型契约

---

## 15. browser-testing-with-devtools → 浏览器 DevTools 测试

**描述：** 通过 Chrome DevTools MCP 在真实浏览器中测试。在构建或调试浏览器运行内容时使用。

**Oura Pix 适配度：** ⭐⭐ 中
- Playwright E2E 已覆盖
- DevTools MCP 服务器需要配置

---

## 16. context-engineering → 上下文工程

**描述：** 优化 Agent 上下文设置。在开始新会话、Agent 输出质量下降或在任务间切换时使用。

**Oura Pix 适配度：** ⭐⭐ 中
- CLAUDE.md 和 AGENTS.md 已配置
- 需要持续维护上下文质量

---

## 17. deprecation-and-migration → 废弃与迁移

**描述：** 管理废弃和迁移。在移除旧系统、API 或功能时使用。

**Oura Pix 适配度：** ⭐ 低
- 当前阶段主要是新功能开发
- 暂时没有废弃需求

---

## 18. source-driven-development → 源码驱动开发

**描述：** 每个实现决策都以官方文档为依据。在需要权威、有出处的代码时使用。

**Oura Pix 适配度：** ⭐ 低
- 适用于框架升级时的版本迁移
- 当前开发节奏更偏向实用主义

---

## 19. doubt-driven-development → 怀疑驱动开发

**描述：** 让每个非平凡决策都经过对抗性审查。在正确性比速度更重要时使用。

**Oura Pix 适配度：** ⭐ 低
- 适用于安全关键逻辑
- 当前项目的复杂性尚未达到此级别

---

## 20. interview-me → 需求访谈

**描述：** 通过一次一个问题的方式提取用户真正想要什么。在需求不明确时使用。

**Oura Pix 适配度：** ⭐ 低
- 需求通常来自 Victor 的直接指令
- 适用于产品探索阶段

---

## 21. idea-refine → 想法精炼

**描述：** 通过结构化的发散和收敛思维将原始想法转化为清晰、可操作的概念。

**Oura Pix 适配度：** ⭐ 低
- Victor 的需求已经比较明确
- 适用于产品创新阶段

---

## 22. code-simplification → 代码简化

**描述：** 在不改变行为的情况下简化代码以提高清晰度。在重构代码以提高可读性时使用。

**Oura Pix 适配度：** ⭐ 低
- 适用于技术债务清理阶段
- 当前重点是功能交付

---

## 23. observability-and-instrumentation → 可观测性与埋点

**描述：** 让代码在生产环境中行为可见和可诊断。在添加日志、指标、追踪或警报时使用。

**Oura Pix 适配度：** ⭐ 低
- Cloudflare Workers 有基础日志
- 需要更完善的生产监控

---

## 24. shipping-and-launch → 发布与上线

**描述：** 准备生产发布。在准备部署到生产环境时使用。

**Oura Pix 适配度：** ⭐ 低
- 已具备基础部署流程
- 需要回滚策略和阶段性发布机制

---

## 总结

### 高适配度（7 个）— 立即采用
documentation-and-adrs, frontend-ui-engineering, git-workflow-and-versioning, code-review-and-quality, spec-driven-development, test-driven-development, incremental-implementation, using-agent-skills

### 中适配度（8 个）— 按需采用
planning-and-task-breakdown, performance-optimization, security-and-hardening, ci-cd-and-automation, debugging-and-error-recovery, api-and-interface-design, browser-testing-with-devtools, context-engineering

### 低适配度（8 个）— 暂不采用
deprecation-and-migration, source-driven-development, doubt-driven-development, interview-me, idea-refine, code-simplification, observability-and-instrumentation, shipping-and-launch
