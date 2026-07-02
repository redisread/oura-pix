import { PackageCheck } from "lucide-react";
import { localizeHref } from "@/paraglide/runtime.js";

export default function BrandLink() {
  return (
    <a href={localizeHref("/")} className="flex items-center gap-3">
      <div className="flex h-11 w-11 items-center justify-center rounded-md bg-[hsl(var(--foreground))] text-[hsl(var(--background))]">
        <PackageCheck className="h-5 w-5" aria-hidden="true" />
      </div>
      <span className="font-display text-2xl font-semibold text-foreground">OuraPix</span>
    </a>
  );
}
