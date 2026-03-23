"use client";

import { useEffect, useState } from "react";
import { IdeaForm } from "@/components/idea-form";
import { IdeaList } from "@/components/idea-list";
import { getIdeasAction } from "./actions";
import { toast } from "sonner";
import { Idea } from "@/components/idea-card";
import { Sparkles, HeartHandshake, ArrowRight } from "lucide-react";
import { useLang } from "@/lib/lang-context";

export default function Home() {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { lang, t } = useLang();

  useEffect(() => {
    const savedIdeas = sessionStorage.getItem("lastIdeas");
    if (savedIdeas) {
      try {
        const parsed = JSON.parse(savedIdeas) as Idea[];
        setTimeout(() => setIdeas(parsed), 0);
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const handleGenerate = async (theme: string) => {
    setIsLoading(true);
    setIdeas([]);
    toast.info(t.toastGenerating);
    
    const result = await getIdeasAction(theme, lang);
    
    if (result.success && result.data) {
       setIdeas(result.data);
       sessionStorage.setItem("lastIdeas", JSON.stringify(result.data));
       toast.success(t.toastSuccess);
    } else if (result.error === "RATE_LIMIT") {
       const msg = t.rateLimitError.replace("{time}", String(result.remainingMins));
       toast.error(msg, { icon: "⏳" });
    } else if (result.error === "RATE_LIMIT_AI_GLOBAL") {
       toast.error(t.rateLimitAll, { icon: "🚀" });
    } else {
       toast.error(result.error || t.toastError);
    }
    
    setIsLoading(false);
  };

  return (
    <div className="flex flex-col items-center justify-start py-12 md:py-24 px-4 relative overflow-hidden flex-1">
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/20 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="z-10 text-center w-full max-w-4xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="inline-flex items-center justify-center px-4 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-sm font-bold mb-4 shadow-[0_0_15px_rgba(200,80,250,0.2)]">
          <Sparkles className="w-4 h-4 mr-2 text-accent" />
          {t.poweredBy}
        </div>
        
        <h1 className="text-4xl md:text-6xl font-black font-space-grotesk tracking-tight text-balance leading-tight">
          {t.title} <br/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-primary animate-gradient">{t.titleAccent}</span>
        </h1>
        
        <p className="text-lg md:text-xl text-muted-foreground w-full max-w-2xl mx-auto leading-relaxed text-balance">
          {t.description}
        </p>

        <div className="pt-8 w-full max-w-3xl mx-auto pb-4">
          <IdeaForm onGenerate={handleGenerate} isLoading={isLoading} />
        </div>

        {/* Monobank Donation Banner */}
        <div className="w-full max-w-md mx-auto animate-in fade-in slide-in-from-bottom-6 duration-700 delay-200">
          <a
            href="https://send.monobank.ua/jar/2z2qtVvT1H"
            target="_blank"
            rel="noopener noreferrer"
            className="group relative flex items-center justify-between p-4 rounded-2xl border border-primary/20 bg-background/50 backdrop-blur-sm text-foreground shadow-sm hover:border-primary/50 hover:shadow-[0_0_25px_rgba(200,80,250,0.15)] hover:-translate-y-1 transition-all duration-300 overflow-hidden outline-none ring-2 ring-transparent focus-visible:ring-primary"
          >
            <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-primary/10 blur-2xl rounded-full group-hover:scale-150 transition-transform duration-700 pointer-events-none" />
            
            <div className="flex items-center gap-3 z-10">
              <div className="p-2 bg-primary/10 rounded-xl">
                <HeartHandshake className="w-5 h-5 text-primary" />
              </div>
              <div className="text-left">
                <p className="font-bold text-sm leading-tight text-foreground">{t.supportProject}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{t.supportDesc}</p>
              </div>
            </div>
            <div className="p-1.5 bg-primary/10 rounded-full text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors z-10">
              <ArrowRight className="w-4 h-4" />
            </div>
          </a>
        </div>
      </div>

      <div className="z-10 w-full mt-4 flex-1">
        <IdeaList ideas={ideas} />
      </div>
    </div>
  );
}
