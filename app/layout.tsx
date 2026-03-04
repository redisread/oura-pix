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

export const metadata: Metadata = {
  title: "OuraPix - AI跨境商品详情页生成",
  description: "极简AI跨境商品详情页生成工具，一键生成Amazon、Shopify等平台商品详情页",
  keywords: ["AI", "商品详情页", "跨境电商", "Amazon", "Shopify", "图片生成"],
  authors: [{ name: "OuraPix" }],
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
  openGraph: {
    title: "OuraPix - AI跨境商品详情页生成",
    description: "极简AI跨境商品详情页生成工具",
    type: "website",
  },
};

// 加载翻译文件
async function getMessages(locale: string) {
  try {
    const messages = (await import(`@/i18n/messages/${locale}.json`)).default;
    return messages;
  } catch (error) {
    // 如果加载失败，返回默认英文
    const defaultMessages = (await import(`@/i18n/messages/en.json`)).default;
    return defaultMessages;
  }
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
