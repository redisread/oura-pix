"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { formatDate } from "@/lib/utils";

// 模拟博客数据 - 实际项目中应该从 API 或文件获取
const blogPosts = [
  {
    slug: "templates/amazon",
    title: "Amazon 详情页模板指南",
    description: "如何使用 OuraPix 生成高转化的 Amazon A+ 内容",
    date: "2024-01-15",
    tags: ["template", "amazon"],
  },
  {
    slug: "templates/shopify",
    title: "Shopify 详情页设计指南",
    description: "打造高转化率的 Shopify 商品详情页",
    date: "2024-01-10",
    tags: ["template", "shopify"],
  },
  {
    slug: "tips/prompts",
    title: "AI 提示词技巧",
    description: "掌握这些技巧，让 AI 生成更精准的商品详情页",
    date: "2024-01-05",
    tags: ["tips", "ai"],
  },
  {
    slug: "showcase",
    title: "成功案例展示",
    description: "看看其他卖家如何使用 OuraPix 提升转化率",
    date: "2024-01-01",
    tags: ["showcase"],
  },
];

export default function BlogPage() {
  const t = useTranslations("blog");
  const posts = blogPosts;

  return (
    <div className="min-h-screen bg-background py-20 px-4">
      {/* Hero */}
      <section className="mb-16">
        <div className="container mx-auto max-w-4xl text-center">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
            OuraPix {t("title")}
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {t("subtitle")}
          </p>
        </div>
      </section>

      {/* Featured Post */}
      {posts.length > 0 && (
        <section className="pb-16">
          <div className="container mx-auto max-w-6xl">
            <Link href={`/blog/${posts[0].slug}`} className="group block">
              <article className="relative overflow-hidden rounded-2xl border bg-card transition-all hover:shadow-lg">
                <div className="grid md:grid-cols-2 gap-0">
                  <div className="aspect-video md:aspect-auto bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center">
                    <span className="text-6xl">✨</span>
                  </div>
                  <div className="p-8 md:p-12 flex flex-col justify-center">
                    <div className="flex items-center gap-3 text-sm text-muted-foreground mb-4">
                      <span className="px-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                        {t("featured")}
                      </span>
                      <time>{formatDate(posts[0].date)}</time>
                    </div>
                    <h2 className="text-2xl md:text-3xl font-bold mb-4 group-hover:text-primary transition-colors">
                      {posts[0].title}
                    </h2>
                    <p className="text-muted-foreground mb-6">
                      {posts[0].description}
                    </p>
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <span>{t("readMore")}</span>
                      <span className="group-hover:translate-x-1 transition-transform">→</span>
                    </div>
                  </div>
                </div>
              </article>
            </Link>
          </div>
        </section>
      )}

      {/* All Posts */}
      <section className="pb-20">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-2xl font-bold mb-8">{t("allPosts")}</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.slice(1).map((post) => (
              <Link key={post.slug} href={`/blog/${post.slug}`} className="group">
                <article className="h-full rounded-xl border bg-card overflow-hidden transition-all hover:shadow-md">
                  <div className="aspect-video bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center">
                    <span className="text-4xl opacity-50">📝</span>
                  </div>
                  <div className="p-6">
                    <div className="flex items-center gap-3 text-sm text-muted-foreground mb-3">
                      <time>{formatDate(post.date)}</time>
                    </div>
                    <h3 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors line-clamp-2">
                      {post.title}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {post.description}
                    </p>
                    {post.tags && post.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-4">
                        {post.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-1 rounded-full bg-secondary text-secondary-foreground text-xs"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </article>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
