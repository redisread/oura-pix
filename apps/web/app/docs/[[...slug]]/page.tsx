import { notFound } from "next/navigation";
import { getPage } from "@/lib/source";
import DocPageClient from "./DocPageClient";

interface PageProps {
  params: Promise<{
    slug?: string[];
  }>;
}

export default async function DocPage({ params }: PageProps) {
  const { slug } = await params;
  const pageSlug = slug?.join("/") || "index";
  const page = getPage(pageSlug);

  if (!page) {
    notFound();
  }

  return <DocPageClient page={page} />;
}
