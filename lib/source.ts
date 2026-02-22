// 简单文档数据源 - 不使用 contentlayer
// 直接读取 content/docs 目录下的 MDX 文件

export interface DocPage {
  slug: string;
  title: string;
  description?: string;
  content: string;
}

// 文档页面列表
export const docPages: DocPage[] = [
  {
    slug: "index",
    title: "快速开始",
    description: "了解如何使用 OuraPix 生成 AI 跨境商品详情页",
    content: "",
  },
  {
    slug: "guide/upload",
    title: "上传教程",
    description: "如何上传产品图片以获得最佳效果",
    content: "",
  },
  {
    slug: "guide/settings",
    title: "设置说明",
    description: "配置生成参数和偏好设置",
    content: "",
  },
  {
    slug: "guide/download",
    title: "下载指南",
    description: "如何下载和使用生成的内容",
    content: "",
  },
  {
    slug: "faq",
    title: "常见问题",
    description: "常见问题解答",
    content: "",
  },
];

// 获取所有页面
export function getPages() {
  return docPages;
}

// 根据 slug 获取页面
export function getPage(slug: string) {
  return docPages.find((page) => page.slug === slug);
}

// 页面树结构（用于导航）
export const pageTree = [
  {
    title: "文档",
    pages: docPages,
  },
];
