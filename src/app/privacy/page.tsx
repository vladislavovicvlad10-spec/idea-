"use client";

import { useLang } from "@/lib/lang-context";
import { getTranslation } from "@/lib/translations";

export default function PrivacyPolicy() {
  const { lang } = useLang();
  const t = getTranslation(lang);

  return (
    <div className="min-h-screen pt-32 pb-16 px-4 relative flex justify-center">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-black to-black -z-10" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/20 blur-[120px] rounded-full pointer-events-none -z-10" />
      
      <div className="max-w-4xl w-full bg-card/40 backdrop-blur-3xl border border-border/40 rounded-[32px] p-8 md:p-12 shadow-2xl space-y-10 text-foreground/80 relative overflow-hidden">
        {/* Декоративный акцент на границе сверху */}
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

        <h1 className="text-4xl md:text-5xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400 mb-8 tracking-tight">
          {t.privacyPolicy}
        </h1>

        <div className="space-y-8 text-sm md:text-base leading-relaxed">
          <section className="bg-secondary/10 border border-border/20 rounded-2xl p-6 hover:bg-secondary/20 hover:border-primary/20 transition-all duration-300 group">
            <h2 className="text-foreground text-xl md:text-2xl font-bold mb-4 flex items-center gap-3">
              <span className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary text-sm group-hover:scale-110 transition-transform">1</span>
              {t.privacy1Title}
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              {t.privacy1Text}
            </p>
          </section>

          <section className="bg-secondary/10 border border-border/20 rounded-2xl p-6 hover:bg-secondary/20 hover:border-primary/20 transition-all duration-300 group">
            <h2 className="text-foreground text-xl md:text-2xl font-bold mb-4 flex items-center gap-3">
              <span className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary text-sm group-hover:scale-110 transition-transform">2</span>
              {t.privacy2Title}
            </h2>
            <p className="text-muted-foreground leading-relaxed">{t.privacy2Text}</p>
          </section>

          <section className="bg-secondary/10 border border-border/20 rounded-2xl p-6 hover:bg-secondary/20 hover:border-primary/20 transition-all duration-300 group">
            <h2 className="text-foreground text-xl md:text-2xl font-bold mb-4 flex items-center gap-3">
              <span className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary text-sm group-hover:scale-110 transition-transform">3</span>
              {t.privacy3Title}
            </h2>
            <p className="text-muted-foreground leading-relaxed">{t.privacy3Text}</p>
          </section>

          <section className="bg-secondary/10 border border-border/20 rounded-2xl p-6 hover:bg-secondary/20 hover:border-primary/20 transition-all duration-300 group">
            <h2 className="text-foreground text-xl md:text-2xl font-bold mb-4 flex items-center gap-3">
              <span className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary text-sm group-hover:scale-110 transition-transform">4</span>
              {t.privacy4Title}
            </h2>
            <p className="text-muted-foreground leading-relaxed">{t.privacy4Text}</p>
          </section>

          <section className="bg-secondary/10 border border-border/20 rounded-2xl p-6 hover:bg-secondary/20 hover:border-primary/20 transition-all duration-300 group">
            <h2 className="text-foreground text-xl md:text-2xl font-bold mb-4 flex items-center gap-3">
              <span className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary text-sm group-hover:scale-110 transition-transform">5</span>
              {t.privacy5Title}
            </h2>
            <p className="text-muted-foreground leading-relaxed">{t.privacy5Text}</p>
          </section>

          <div className="pt-8 border-t border-white/10 text-xs text-zinc-500">
            {t.lastUpdated}: {t.march2026}<br/>
            {t.contactUs}: help@ideaspark.app
          </div>
        </div>
      </div>
    </div>
  );
}
