/**
 * Source utilities for docs
 */

import fs from "fs";
import path from "path";

const docsDirectory = path.join(process.cwd(), "content/docs");

export interface DocPage {
  slug: string;
  title: string;
  description?: string;
  content: string;
  [key: string]: unknown;
}

const pageCache = new Map<string, DocPage>();

/**
 * Parse frontmatter from markdown content
 */
function parseFrontmatter(content: string): { frontmatter: Record<string, unknown>; content: string } {
  const frontmatterRegex = /^---\s*([\s\S]*?)\s*---\s*/;
  const match = content.match(frontmatterRegex);

  if (!match) {
    return { frontmatter: {}, content };
  }

  const frontmatterString = match[1];
  const contentWithoutFrontmatter = content.slice(match[0].length);

  // Simple YAML-like parsing for common fields
  const frontmatter: Record<string, unknown> = {};
  for (const line of frontmatterString.split("\n")) {
    const [key, ...valueParts] = line.split(":");
    if (key && valueParts.length > 0) {
      const value = valueParts.join(":").trim().replace(/^["']|["']$/g, "");
      frontmatter[key.trim()] = value;
    }
  }

  return { frontmatter, content: contentWithoutFrontmatter };
}

/**
 * Get page by slug
 */
export function getPage(slug: string): DocPage | null {
  if (pageCache.has(slug)) {
    return pageCache.get(slug)!;
  }

  try {
    const filePath = path.join(docsDirectory, `${slug}.mdx`);
    if (!fs.existsSync(filePath)) {
      return null;
    }

    const source = fs.readFileSync(filePath, "utf8");
    const { frontmatter, content } = parseFrontmatter(source);

    const page: DocPage = {
      slug,
      title: frontmatter.title as string || slug,
      description: frontmatter.description as string,
      content,
      ...frontmatter,
    };

    pageCache.set(slug, page);
    return page;
  } catch {
    return null;
  }
}

/**
 * Get all pages
 */
export function getAllPages(): DocPage[] {
  const files = fs.readdirSync(docsDirectory);
  const pages: DocPage[] = [];

  for (const file of files) {
    if (file.endsWith(".mdx")) {
      const slug = file.replace(/\.mdx$/, "");
      const page = getPage(slug);
      if (page) {
        pages.push(page);
      }
    }
  }

  return pages;
}
