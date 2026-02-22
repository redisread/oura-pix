"use client";

export const runtime = "edge";

import { use } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { useTranslations } from "next-intl";
import { formatDate } from "@/lib/utils";

// 模拟博客数据
const blogPosts = [
  {
    slug: "templates/amazon",
    title: "Amazon 详情页模板指南",
    description: "如何使用 OuraPix 生成高转化的 Amazon A+ 内容",
    date: "2024-01-15",
    author: "OuraPix Team",
    tags: ["template", "amazon"],
    content: () => (
      <div>
        <p>Amazon A+ 内容可以有效提升商品转化率...</p>
      </div>
    ),
  },
  {
    slug: "templates/shopify",
    title: "Shopify 详情页设计指南",
    description: "打造高转化率的 Shopify 商品详情页",
    date: "2024-01-10",
    author: "OuraPix Team",
    tags: ["template", "shopify"],
    content: () => (
      <div>
        <p>Shopify 详情页设计需要注意...</p>
      </div>
    ),
  },
  {
    slug: "tips/prompts",
    title: "AI 提示词技巧",
    description: "掌握这些技巧，让 AI 生成更精准的商品详情页",
    date: "2024-01-05",
    author: "OuraPix Team",
    tags: ["tips", "ai"],
    content: () => (
      <div>
        <p>AI 提示词是生成高质量内容的关键...</p>
      </div>
    ),
  },
  {
    slug: "showcase",
    title: "成功案例展示",
    description: "看看其他卖家如何使用 OuraPix 提升转化率",
    date: "2024-01-01",
    author: "OuraPix Team",
    tags: ["showcase"],
    content: () => (
      <div>
        <p>这些成功案例展示了 OuraPix 的强大功能...</p>
      </div>
    ),
  },
];

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default function BlogPostPage({ params }: PageProps) {
  const { slug } = use(params);
  const t = useTranslations("blog");
  const post = blogPosts.find((p) => p.slug === slug);

  if (!post) {
    notFound();
  }

  const Content = post.content;
  const relatedPosts = blogPosts
    .filter((p) => p.slug !== post.slug)
    .slice(0, 2);

  return (
    <div className="min-h-screen bg-background">
      {/* Article Header */}
      <section className="pt-16 pb-12 px-4">
        <div className="container mx-auto max-w-3xl">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <span>←</span>
            <span>{t("backToBlog")}</span>
          </Link>

          <div className="flex items-center gap-3 text-sm text-muted-foreground mb-6">
            <time>{formatDate(post.date)}</time>
            {post.author && (
              <>
                <span>·</span>
                <span>{post.author}</span>
              </>
            )}
          </div>

          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-6">
            {post.title}
          </h1>

          <p className="text-xl text-muted-foreground">
            {post.description}
          </p>

          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-6">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-sm"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Article Content */}
      <article className="pb-20 px-4">
        <div className="container mx-auto max-w-3xl">
          <div className="prose prose-neutral dark:prose-invert max-w-none">
            <Content />
          </div>
        </div>
      </article>

      {/* Related Posts */}
      <section className="border-t py-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-2xl font-bold mb-8">{t("relatedPosts")}</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {relatedPosts.map((relatedPost) => (
              <Link
                key={relatedPost.slug}
                href={`/blog/${relatedPost.slug}`}
                className="group block rounded-xl border p-6 transition-all hover:shadow-md"
              >
                <div className="flex items-center gap-3 text-sm text-muted-foreground mb-3">
                  <time>{formatDate(relatedPost.date)}</time>
                </div>
                <h3 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors">
                  {relatedPost.title}
                </h3>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {relatedPost.description}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
