"use client";

import { useLang } from "@/lib/lang-context";
import { getTranslation } from "@/lib/translations";
import Link from "next/link";

export function Footer() {
  const { lang } = useLang();
  const t = getTranslation(lang);

  return (
    <footer className="mt-auto border-t border-border/40 bg-card/30 backdrop-blur-xl py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-zinc-500 text-sm">
            <span>&copy; {new Date().getFullYear()} IdeaSpark. {t.allRightsReserved}</span>
          </div>
          
          <div className="flex gap-8 text-sm font-medium">
            <Link href="/terms" className="text-muted-foreground hover:text-primary transition-all hover:translate-y-[-1px]">
              {t.termsOfService}
            </Link>
            <Link href="/privacy" className="text-muted-foreground hover:text-primary transition-all hover:translate-y-[-1px]">
              {t.privacyPolicy}
            </Link>
          </div>
        </div>
        
        <div className="mt-6 text-xs text-zinc-600 max-w-3xl text-center md:text-left">
          {t.aiDisclaimer}
        </div>
      </div>
    </footer>
  );
}

