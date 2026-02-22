"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  showText?: boolean;
}

export function Logo({ className, showText = true }: LogoProps) {
  return (
    <Link href="/" className={cn("flex items-center gap-2", className)}>
      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
        <span className="text-white font-bold text-sm">O</span>
      </div>
      {showText && (
        <span className="font-bold text-xl tracking-tight">
          OuraPix
        </span>
      )}
    </Link>
  );
}
