"use client";

import { useState, useEffect } from "react";
import { Globe, Sparkles } from "lucide-react";

const languages = [
  {
    code: "en",
    flag: "🇺🇸",
    name: "English",
    hint: "Select",
    sub: "American English",
  },
  {
    code: "ru",
    flag: "🇷🇺",
    name: "Русский",
    hint: "Выбрать",
    sub: "Русский язык",
  },
  {
    code: "uk",
    flag: "🇺🇦",
    name: "Українська",
    hint: "Вибрати",
    sub: "Українська мова",
  },
];

export function LanguageSelector() {
  const [mounted, setMounted] = useState(false);
  const [show, setShow] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);

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
    setSelected(lang);
    setTimeout(() => {
      localStorage.setItem("app_lang", lang);
      setShow(false);
      window.location.reload();
    }, 400);
  };

  if (!mounted || !show) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-2xl animate-in fade-in duration-500">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/15 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative w-full max-w-md mx-4 animate-in zoom-in-95 slide-in-from-bottom-6 duration-600 delay-100">
        {/* Card */}
        <div className="bg-card/80 backdrop-blur-xl border border-white/10 rounded-[2rem] overflow-hidden shadow-[0_0_80px_rgba(0,0,0,0.6)]">
          
          {/* Top gradient stripe */}
          <div className="h-1 w-full bg-gradient-to-r from-primary via-accent to-primary" />

          <div className="p-8">
            {/* Icon + Title */}
            <div className="text-center mb-8">
              <div className="relative inline-flex mb-5">
                <div className="w-20 h-20 bg-gradient-to-tr from-primary to-accent rounded-3xl flex items-center justify-center shadow-xl shadow-primary/30 rotate-3 hover:rotate-0 transition-transform duration-500">
                  <Globe className="w-10 h-10 text-white" />
                </div>
                <div className="absolute -top-1.5 -right-1.5 w-7 h-7 bg-accent rounded-full flex items-center justify-center border-2 border-card animate-bounce">
                  <Sparkles className="w-3.5 h-3.5 text-white" />
                </div>
              </div>

              <h2 className="text-3xl font-black font-space-grotesk mb-2 tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
                Welcome to IdeaSpark
              </h2>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Choose your language to get started
              </p>
            </div>

            {/* Language Buttons */}
            <div className="space-y-3">
              {languages.map((l) => {
                const isSelected = selected === l.code;
                return (
                  <button
                    key={l.code}
                    onClick={() => handleSelect(l.code)}
                    className={`
                      w-full group relative flex items-center gap-4 p-4 rounded-2xl border transition-all duration-300 text-left overflow-hidden
                      ${isSelected
                        ? "border-primary/70 bg-primary/15 scale-[1.02] shadow-[0_0_25px_rgba(200,80,250,0.25)]"
                        : "border-white/8 bg-white/3 hover:border-primary/40 hover:bg-primary/8 hover:scale-[1.01]"
                      }
                    `}
                  >
                    {/* Shine effect */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-r from-transparent via-white/3 to-transparent -translate-x-full group-hover:translate-x-full" style={{ transition: 'transform 0.6s ease, opacity 0.3s' }} />
                    
                    {/* Flag */}
                    <div className={`text-4xl flex-shrink-0 transition-all duration-400 ${isSelected ? '' : 'filter grayscale group-hover:grayscale-0'}`}>
                      {l.flag}
                    </div>
                    
                    {/* Text */}
                    <div className="flex-1 min-w-0">
                      <p className={`font-bold font-space-grotesk text-base transition-colors ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                        {l.name}
                      </p>
                      <p className="text-xs text-muted-foreground/60 mt-0.5">{l.sub}</p>
                    </div>

                    {/* Arrow / Check */}
                    <div className={`flex-shrink-0 transition-all duration-300 ${isSelected ? 'scale-100 opacity-100' : 'scale-75 opacity-0 group-hover:scale-100 group-hover:opacity-60'}`}>
                      {isSelected ? (
                        <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center">
                          <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      ) : (
                        <span className="text-primary text-sm font-medium">{l.hint} →</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Footer */}
            <p className="mt-7 text-center text-[10px] text-muted-foreground/40 uppercase tracking-[0.25em] font-medium">
              ⚡ Powered by IdeaSpark · AI-First Platform
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
