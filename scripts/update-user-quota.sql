-- ============================================================
-- 更新用户配额 SQL 脚本
-- 目标用户: wujiahong2013@gmail.com
-- 新配额: 1,000,000
-- ============================================================

-- 1. 先查看用户当前信息
SELECT
  u.id AS user_id,
  u.email,
  u.name,
  s.id AS subscription_id,
  s.plan,
  s.status,
  s.generationLimit,
  s.usedGenerations,
  (s.generationLimit - s.usedGenerations) AS remaining
FROM user u
LEFT JOIN subscriptions s ON u.id = s.userId
WHERE u.email = 'wujiahong2013@gmail.com';

-- 2. 如果用户存在且有订阅记录，更新配额
UPDATE subscriptions
SET generationLimit = 1000000,
    updatedAt = (strftime('%s', 'now') * 1000)
WHERE userId = (
  SELECT id FROM user WHERE email = 'wujiahong2013@gmail.com'
);

-- 3. 如果用户存在但没有订阅记录，创建新记录
INSERT INTO subscriptions (
  userId,
  plan,
  status,
  generationLimit,
  usedGenerations,
  createdAt,
  updatedAt
)
SELECT
  id,
  'free',
  'active',
  1000000,
  0,
  (strftime('%s', 'now') * 1000),
  (strftime('%s', 'now') * 1000)
FROM user
WHERE email = 'wujiahong2013@gmail.com'
AND NOT EXISTS (
  SELECT 1 FROM subscriptions WHERE userId = user.id
);

-- 4. 验证更新结果
SELECT
  u.email,
  s.plan,
  s.generationLimit,
  s.usedGenerations,
  (s.generationLimit - s.usedGenerations) AS remaining
FROM subscriptions s
JOIN user u ON s.userId = u.id
WHERE u.email = 'wujiahong2013@gmail.com';
