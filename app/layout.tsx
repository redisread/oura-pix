import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { cookies } from "next/headers";
import "./globals.css";
import Navbar from "./components/navbar";
import Footer from "./components/footer";
import { Toaster } from "@/components/ui/toaster";
import { Providers } from "./components/providers";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

// 加载翻译文件
async function getMessages(locale: string) {
  try {
    const messages = (await import(`@/i18n/messages/${locale}.json`)).default;
    return messages;
  } catch {
    // 如果加载失败，返回默认英文
    const defaultMessages = (await import(`@/i18n/messages/en.json`)).default;
    return defaultMessages;
  }
}

/**
 * 动态生成页面元数据（支持国际化）
 */
export async function generateMetadata(): Promise<Metadata> {
  // 从 cookie 获取语言设置
  const cookieStore = await cookies();
  const langCookie = cookieStore.get("language");
  const locale = langCookie?.value || "zh";

  // 加载翻译消息
  const messages = await getMessages(locale);
  const metadata = messages.metadata || {
    title: "OuraPix - AI Product Detail Page Generator",
    description: "Generate stunning product detail pages with AI",
  };

  // 根据语言设置关键词
  const keywords =
    locale === "zh"
      ? ["AI", "商品详情页", "跨境电商", "Amazon", "Shopify", "图片生成"]
      : [
          "AI",
          "Product Detail Page",
          "E-commerce",
          "Amazon",
          "Shopify",
          "Image Generation",
        ];

  return {
    title: metadata.title,
    description: metadata.description,
    keywords,
    authors: [{ name: "OuraPix" }],
    icons: {
      icon: "/favicon.svg",
      shortcut: "/favicon.svg",
      apple: "/favicon.svg",
    },
    openGraph: {
      title: metadata.title,
      description: metadata.description,
      type: "website",
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // 从 cookie 获取语言设置
  const cookieStore = await cookies();
  const langCookie = cookieStore.get("language");
  const locale = langCookie?.value || "zh";

  // 加载翻译消息
  const messages = await getMessages(locale);

  return (
    <html lang={locale} className={inter.variable}>
      <body className="font-sans antialiased min-h-screen bg-background text-foreground">
        <Providers locale={locale} messages={messages}>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
