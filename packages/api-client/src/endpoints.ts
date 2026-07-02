/**
 * API Endpoints definition
 */

export const ENDPOINTS = {
  // 认证
  auth: {
    signIn: "/api/auth/sign-in",
    signUp: "/api/auth/sign-up",
    signOut: "/api/auth/sign-out",
    session: "/api/auth/session",
    refreshToken: "/api/auth/refresh",
    forgotPassword: "/api/auth/forgot-password",
    resetPassword: "/api/auth/reset-password",
  },
  // 用户
  user: {
    profile: "/api/user/profile",
    updateProfile: "/api/user/profile",
    updateAvatar: "/api/user/avatar",
  },
  // 生成任务
  generations: {
    list: "/api/generations",
    create: "/api/generations",
    get: (id: string) => `/api/generations/${id}`,
    cancel: (id: string) => `/api/generations/${id}/cancel`,
    preview: "/api/generations/preview",
  },
  // 图片上传
  upload: {
    upload: "/api/upload",
    getSignedUrl: "/api/upload/signed-url",
  },
  // 订阅
  subscription: {
    get: "/api/subscription",
    checkout: "/api/subscription/checkout",
    portal: "/api/subscription/portal",
    cancel: "/api/subscription/cancel",
  },
  // 收藏
  favorites: {
    list: "/api/favorites",
    add: "/api/favorites",
    remove: (id: string) => `/api/favorites/${id}`,
    batchDelete: "/api/favorites/batch-delete",
    check: (imageUrl: string) => `/api/favorites/check/${encodeURIComponent(imageUrl)}`,
  },
  // Webhooks
  webhooks: {
    stripe: "/api/webhooks/stripe",
  },
} as const;
