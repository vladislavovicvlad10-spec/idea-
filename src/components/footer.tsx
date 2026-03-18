"use client";

import { useLang } from "@/lib/lang-context";
import { getTranslation } from "@/lib/translations";
import Link from "next/link";

export function Footer() {
  const { lang } = useLang();
  const t = getTranslation(lang);

  return (
    <footer className="mt-auto border-t border-white/5 bg-black/20 backdrop-blur-xl py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-zinc-500 text-sm">
            <span>© {new Date().getFullYear()} IdeaSpark. {t.allRightsReserved}</span>
          </div>
          
          <div className="flex gap-6 text-sm">
            <Link href="/terms" className="text-zinc-400 hover:text-white transition-colors">
              {t.termsOfService}
            </Link>
            <Link href="/privacy" className="text-zinc-400 hover:text-white transition-colors">
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
