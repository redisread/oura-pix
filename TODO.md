# TODO

## 低优先级优化

### Fix 8: Stripe Webhook 补全
- [ ] `handleInvoicePaymentSucceeded`: 补全 priceId → plan 映射逻辑（使用 `SUBSCRIPTION_PLANS` 常量），调用 `addCredits` 充值月度额度
- [ ] `handleInvoicePaymentFailedWebhook`: 更新订阅状态为 `past_due`
- [ ] `handleTrialWillEnd`: 发送试用到期提醒邮件
- [ ] `handleAsyncPaymentFailed`: 记录失败日志，通知用户

### Fix 9: `app/layout.tsx` 元数据国际化
- [ ] 将静态 `metadata` 对象改为 `generateMetadata` 动态函数，根据用户语言 cookie 返回正确语言的标题/描述
