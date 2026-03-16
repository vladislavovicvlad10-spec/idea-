"use client";

import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Globe } from "lucide-react";

export function LanguageSelector() {
  const [mounted, setMounted] = useState(false);
  const [show, setShow] = useState(false);

  useEffect(() => {
    setTimeout(() => {
      setMounted(true);
      const lang = localStorage.getItem("app_lang");
      if (!lang) {
        setShow(true);
      }
    }, 0);
  }, []);

  const handleSelect = (lang: string) => {
    localStorage.setItem("app_lang", lang);
    setShow(false);
    window.location.reload();
  };

  if (!mounted || !show) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-xl animate-in fade-in duration-700">
      <div className="bg-card/40 border border-white/10 p-8 rounded-[2.5rem] shadow-[0_0_50px_rgba(0,0,0,0.5)] max-w-md w-full mx-4 text-center animate-in zoom-in-95 slide-in-from-bottom-10 duration-700 delay-200 relative overflow-hidden group">
        {/* Декоративные элементы */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-primary/20 rounded-full blur-[80px] pointer-events-none group-hover:bg-primary/30 transition-colors duration-700" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-accent/20 rounded-full blur-[80px] pointer-events-none group-hover:bg-accent/30 transition-colors duration-700" />

        <div className="relative z-10">
          <div className="w-16 h-16 bg-gradient-to-tr from-primary to-accent rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-primary/20 rotate-3 group-hover:rotate-0 transition-transform duration-500">
            <Globe className="w-8 h-8 text-white animate-pulse" />
          </div>

          <h2 className="text-3xl font-space-grotesk font-bold mb-3 tracking-tight">
            Select Language
          </h2>
          <p className="text-muted-foreground mb-8 text-sm leading-relaxed px-4">
            Выберите язык интерфейса для продолжения работы с ассистентом
          </p>

          <div className="grid grid-cols-1 gap-3">
            <Button 
              variant="outline" 
              className="h-16 text-lg font-medium bg-white/5 border-white/10 hover:border-primary/50 hover:bg-primary/5 transition-all rounded-2xl flex items-center justify-between px-6 group/btn"
              onClick={() => handleSelect('en')}
            >
              <div className="flex items-center gap-4">
                <span className="text-3xl filter grayscale group-hover/btn:grayscale-0 transition-all duration-300">🇺🇸</span>
                <span className="font-space-grotesk">English</span>
              </div>
              <span className="text-xs text-primary opacity-0 group-hover/btn:opacity-100 transition-all translate-x-2 group-hover/btn:translate-x-0">Select →</span>
            </Button>

            <Button 
              variant="outline" 
              className="h-16 text-lg font-medium bg-white/5 border-white/10 hover:border-primary/50 hover:bg-primary/5 transition-all rounded-2xl flex items-center justify-between px-6 group/btn"
              onClick={() => handleSelect('ru')}
            >
              <div className="flex items-center gap-4">
                <span className="text-3xl filter grayscale group-hover/btn:grayscale-0 transition-all duration-300">🇷🇺</span>
                <span className="font-space-grotesk">Русский</span>
              </div>
              <span className="text-xs text-primary opacity-0 group-hover/btn:opacity-100 transition-all translate-x-2 group-hover/btn:translate-x-0">Выбрать →</span>
            </Button>

            <Button 
              variant="outline" 
              className="h-16 text-lg font-medium bg-white/5 border-white/10 hover:border-primary/50 hover:bg-primary/5 transition-all rounded-2xl flex items-center justify-between px-6 group/btn"
              onClick={() => handleSelect('uk')}
            >
              <div className="flex items-center gap-4">
                <span className="text-3xl filter grayscale group-hover/btn:grayscale-0 transition-all duration-300">🇺🇦</span>
                <span className="font-space-grotesk">Українська</span>
              </div>
              <span className="text-xs text-primary opacity-0 group-hover/btn:opacity-100 transition-all translate-x-2 group-hover/btn:translate-x-0">Вибрати →</span>
            </Button>
          </div>

          <p className="mt-8 text-[10px] text-muted-foreground/50 uppercase tracking-[0.2em]">
            Powered by IdeaSpark Global
          </p>
        </div>
      </div>
    </div>
  );
}
