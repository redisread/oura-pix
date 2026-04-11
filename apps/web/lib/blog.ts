import fs from "fs/promises";
import path from "path";
import { compileMDX } from "next-mdx-remote/rsc";
import { ReactElement } from "react";

// 博客文章类型定义
export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  date: string;
  author?: string;
  tags?: string[];
  content: ReactElement;
}

export interface BlogPostMeta {
  slug: string;
  title: string;
  description: string;
  date: string;
  author?: string;
  tags?: string[];
}

// 博客内容目录
const BLOG_DIR = path.join(process.cwd(), "content/blog");

// 递归获取所有 MDX 文件
async function getAllMdxFiles(dir: string): Promise<string[]> {
  const files: string[] = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await getAllMdxFiles(fullPath)));
    } else if (entry.name.endsWith(".mdx")) {
      files.push(fullPath);
    }
  }

  return files;
}

// 获取相对路径作为 slug
function getSlugFromPath(fullPath: string): string {
  const relativePath = path.relative(BLOG_DIR, fullPath);
  return relativePath.replace(/\.mdx$/, "").replace(/\\/g, "/");
}

// 获取所有博客文章
export async function getBlogPosts(): Promise<BlogPostMeta[]> {
  try {
    const files = await getAllMdxFiles(BLOG_DIR);

    const posts = await Promise.all(
      files.map(async (file) => {
        const content = await fs.readFile(file, "utf-8");
        const slug = getSlugFromPath(file);

        // 简单解析 frontmatter
        const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
        const frontmatter = frontmatterMatch ? frontmatterMatch[1] : "";

        const parseField = (field: string): string | undefined => {
          const match = frontmatter.match(new RegExp(`${field}:\\s*(.+)`));
          return match?.[1].trim().replace(/^["']|["']$/g, "");
        };

        const parseArray = (field: string): string[] | undefined => {
          const match = frontmatter.match(new RegExp(`${field}:\\s*\\[(.+?)\\]`, "s"));
          if (!match) return undefined;
          return match[1]
            .split(",")
            .map((s) => s.trim().replace(/^["']|["']$/g, ""));
        };

        return {
          slug,
          title: parseField("title") || "Untitled",
          description: parseField("description") || "",
          date: parseField("date") || new Date().toISOString().split("T")[0],
          author: parseField("author"),
          tags: parseArray("tags"),
        };
      })
    );

    // 按日期排序（最新的在前）
    return posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  } catch (error) {
    console.error("Error loading blog posts:", error);
    return [];
  }
}

// 获取单篇博客文章
export async function getBlogPost(slug: string): Promise<BlogPost | null> {
  try {
    // 尝试找到匹配的文件
    const files = await getAllMdxFiles(BLOG_DIR);
    const filePath = files.find((f) => getSlugFromPath(f) === slug);

    if (!filePath) {
      return null;
    }

    const fileContent = await fs.readFile(filePath, "utf-8");

    const { content, frontmatter } = await compileMDX<{
      title: string;
      description: string;
      date: string;
      author?: string;
      tags?: string[];
    }>({
      source: fileContent,
      options: { parseFrontmatter: true },
    });

    return {
      slug,
      title: frontmatter.title,
      description: frontmatter.description,
      date: frontmatter.date,
      author: frontmatter.author,
      tags: frontmatter.tags,
      content: content as ReactElement,
    };
  } catch (error) {
    console.error("Error loading blog post:", error);
    return null;
  }
}
