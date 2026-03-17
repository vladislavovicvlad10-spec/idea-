"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Home, Flame } from "lucide-react";

export default function NotFound() {
  const [lang] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("app_lang") || "ru";
    }
    return "ru";
  });

  const labels = {
    ru: { title: "Страница не найдена", sub: "Похоже, эта страница улетела в космос вместе с вашими идеями.", home: "На главную" },
    en: { title: "Page Not Found", sub: "Looks like this page flew off into space with your ideas.", home: "Go Home" },
    uk: { title: "Сторінку не знайдено", sub: "Схоже, ця сторінка полетіла в космос разом з вашими ідеями.", home: "На головну" },
  };
  const l = labels[lang as keyof typeof labels] || labels.ru;

  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[70vh] px-4 relative overflow-hidden">
      {/* Background glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="z-10 text-center animate-in fade-in slide-in-from-bottom-6 duration-700">
        {/* Giant 404 */}
        <div className="relative mb-6 select-none">
          <p className="text-[10rem] md:text-[14rem] font-black font-space-grotesk leading-none text-transparent bg-clip-text bg-gradient-to-b from-primary/40 via-primary/20 to-transparent">
            404
          </p>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="p-4 bg-gradient-to-tr from-primary to-accent rounded-3xl shadow-2xl shadow-primary/30 rotate-6 hover:rotate-0 transition-transform duration-500">
              <Flame className="w-12 h-12 text-white" />
            </div>
          </div>
        </div>

        <h1 className="text-3xl md:text-4xl font-bold font-space-grotesk mb-3">{l.title}</h1>
        <p className="text-muted-foreground text-lg mb-10 max-w-md mx-auto leading-relaxed">{l.sub}</p>

        <Link href="/">
          <Button size="lg" className="font-bold px-8 gap-2">
            <Home className="w-5 h-5" />
            {l.home}
          </Button>
        </Link>
      </div>
    </div>
  );
}
