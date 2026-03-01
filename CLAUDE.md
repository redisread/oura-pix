
## 开发参考

遵守使用 OpenNext 的最佳实践，可以参考 ：
- https://opennext.js.org/cloudflare/get-started
- https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/

Cloudflare 适配器提供了一个 opennextjs-cloudflare 命令行界面 (CLI)，用于开发、构建和部署应用程序。除非另有文档说明或您清楚自己在做什么，否则不应直接使用 wrangler 命令。可以参考 https://opennext.js.org/cloudflare/cli


## 项目迭代规范
- 发现优化点可以记录在 TODO.md 文件中
- 需要实现的功能可以记录在 TODO.md 文件中
- 完成 TODO.md 的某个待办，需要标记对应的待办为完成,并且将完成的事项移动到FINISH.md中

## 多语言适配规范
- 所有用户可见的文案必须进行多语言适配
- 新增或修改文案时，同步更新多语言资源文件
- 使用 I18n 工具类获取多语言文案，禁止硬编码
- 多语言 key 命名规范：`模块名.功能名.具体文案标识`
- 英文文案作为默认语言，其他语言跟随翻译 
