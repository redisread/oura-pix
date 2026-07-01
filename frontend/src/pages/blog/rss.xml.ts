import { getCollection } from 'astro:content';
import type { APIRoute } from 'astro';

interface BlogPost {
  data: {
    title: string;
    description: string;
    publishDate: Date;
    tags?: string[];
    category: string;
    draft?: boolean;
  };
  slug: string;
}

export const GET: APIRoute = async () => {
  const posts = await getCollection('blog', ({ data }: { data: BlogPost['data'] }) => !data.draft) as BlogPost[];
  const sorted = posts.sort(
    (a: BlogPost, b: BlogPost) => b.data.publishDate.getTime() - a.data.publishDate.getTime()
  );

  const siteUrl = 'https://ourapix.jiahongw.com';
  const siteTitle = 'OuraPix Blog';
  const siteDescription = 'OuraPix 产品更新与跨境电商资讯';

  const items = sorted
    .slice(0, 20)
    .map((post: BlogPost) => {
      const tags = post.data.tags?.map((t: string) => `<category>${escape(t)}</category>`).join('\n      ') ?? '';
      return `    <item>
      <title>${escape(post.data.title)}</title>
      <link>${siteUrl}/blog/${post.slug}</link>
      <guid isPermaLink="true">${siteUrl}/blog/${post.slug}</guid>
      <description>${escape(post.data.description)}</description>
      <pubDate>${post.data.publishDate.toUTCString()}</pubDate>
      <category>${escape(post.data.category)}</category>
      ${tags}
    </item>`;
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escape(siteTitle)}</title>
    <link>${siteUrl}/blog</link>
    <description>${escape(siteDescription)}</description>
    <language>zh-CN</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${siteUrl}/blog/rss.xml" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};

function escape(str: string) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
