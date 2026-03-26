"use client";

import { Loader2 } from "lucide-react";
import { getTranslation } from "@/lib/translations";

export default function Loading() {
  const lang = typeof window !== "undefined" ? localStorage.getItem("app_lang") : "en";
  const t = getTranslation(lang);

  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[50vh] animate-in fade-in duration-500">
      <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
      <p className="text-muted-foreground font-medium animate-pulse">{t.loading}</p>
    </div>
  );
}
