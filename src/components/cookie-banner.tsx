"use client";

import { useState, useEffect } from "react";
import { useLang } from "@/lib/lang-context";
import Link from "next/link";
import { Cookie, X } from "lucide-react";
import { Button } from "./ui/button";

export function CookieBanner() {
  const { t } = useLang();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("cookie_consent");
    if (!consent) {
      const timer = setTimeout(() => setIsVisible(true), 1500); // Показываем чуть позже для эффекта
      return () => clearTimeout(timer);
    }
  }, []);

  if (!isVisible) return null;

  const handleAccept = () => {
    localStorage.setItem("cookie_consent", "true");
    setIsVisible(false);
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] w-[calc(100%-2rem)] max-w-2xl animate-in fade-in slide-in-from-bottom-8 duration-700 ease-out px-4 md:px-0">
      <div className="bg-card/90 backdrop-blur-xl border border-primary/20 p-5 md:p-6 rounded-3xl flex flex-col md:flex-row items-center gap-5 shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative overflow-hidden group">
        {/* Декоративное свечение */}
        <div className="absolute -top-10 -left-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-colors" />
        
        <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20">
          <Cookie className="w-6 h-6 text-primary animate-pulse" />
        </div>

        <div className="flex-grow text-center md:text-left">
          <p className="text-sm md:text-base text-foreground/90 leading-relaxed font-medium">
            {t.cookieMessage}
          </p>
          <Link 
            href="/privacy" 
            className="text-xs text-primary hover:text-accent font-bold mt-2 inline-block transition-colors underline underline-offset-4"
          >
            {t.privacyPolicy}
          </Link>
        </div>

        <div className="flex shrink-0 gap-2 w-full md:w-auto">
          <Button
            onClick={handleAccept}
            className="flex-1 md:flex-none h-11 px-8 rounded-xl font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 active:scale-95 transition-all"
          >
            {t.cookieAccept}
          </Button>
          <button 
            onClick={() => setIsVisible(false)}
            className="md:hidden absolute top-4 right-4 text-muted-foreground hover:text-foreground"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
