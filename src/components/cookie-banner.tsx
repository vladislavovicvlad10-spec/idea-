"use client";

import { useState, useEffect } from "react";
import { useLang } from "@/lib/lang-context";
import { getTranslation } from "@/lib/translations";
import Link from "next/link";

export function CookieBanner() {
  const { lang } = useLang();
  const t = getTranslation(lang);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Проверяем, соглашался ли уже пользователь
    const consent = localStorage.getItem("cookie_consent");
    if (!consent) {
      setTimeout(() => setIsVisible(true), 100);
    }
  }, []);

  if (!isVisible) return null;

  const handleAccept = () => {
    localStorage.setItem("cookie_consent", "true");
    setIsVisible(false);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] p-4 md:p-6 animate-in slide-in-from-bottom duration-500 ease-out">
          <div className="max-w-7xl mx-auto bg-zinc-900/90 backdrop-blur-xl border border-white/10 p-4 md:p-6 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 shadow-2xl">
            <div className="text-sm text-zinc-300">
              {t.cookieMessage}{" "}
              <Link href="/privacy" className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2">
                {t.privacyPolicy}
              </Link>
            </div>
            <button
              onClick={handleAccept}
              className="bg-white text-black px-6 py-2 rounded-xl font-medium hover:bg-zinc-200 transition-colors whitespace-nowrap min-w-full md:min-w-0"
            >
              {t.cookieAccept}
            </button>
          </div>
    </div>
  );
}
