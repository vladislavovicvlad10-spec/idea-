"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "./ui/card";
import { Button } from "./ui/button";
import { Skeleton } from "./ui/skeleton";
import { Bookmark, Sparkles, Code, Briefcase, Loader2, Check, Copy, Share2 } from "lucide-react";
import { detailIdeaAction, suggestTechStackAction } from "@/app/actions";
import { saveIdeaForSharing } from "@/app/idea/actions";
import { toast } from "sonner";
import { useAuth } from "@/firebase/provider";
import { db } from "@/firebase";
import { collection, addDoc, query, where, getDocs, deleteDoc, doc } from "firebase/firestore";
import { getTranslation } from "@/lib/translations";

export interface Idea {
  id?: string;
  name: string;
  description: string;
  features: string[];
}

export function IdeaCard({ idea, saved = false }: { idea: Idea, saved?: boolean }) {
  const { user } = useAuth();
  const [isSaved, setIsSaved] = useState(saved);
  const [isSharing, setIsSharing] = useState(false);
  const [lang, setLang] = useState("en");

  useEffect(() => {
    const activeLang = localStorage.getItem("app_lang");
    if (activeLang) {
      setTimeout(() => setLang(activeLang), 0);
    }
  }, []);

  const t = getTranslation(lang);

  const [businessDetails, setBusinessDetails] = useState<{
    targetAudience: string;
    monetization: string;
    uniqueness: string;
  } | null>(null);
  const [isBusinessLoading, setIsBusinessLoading] = useState(false);

  const [techStack, setTechStack] = useState<{
    steps: { title: string; description: string }[];
  } | null>(null);
  const [isTechLoading, setIsTechLoading] = useState(false);

  const handleBookmark = async () => {
    if (!user) {
      toast.error(t.loginRequired);
      return;
    }

    try {
      const bookmarksRef = collection(db, "users", user.uid, "bookmarks");

      if (isSaved) {
        const q = query(bookmarksRef, where("name", "==", idea.name));
        const querySnapshot = await getDocs(q);
        const deletePromises = querySnapshot.docs.map(document =>
          deleteDoc(doc(db, "users", user.uid, "bookmarks", document.id))
        );
        await Promise.all(deletePromises);

        setIsSaved(false);
        toast.success(t.removedFromBookmarks);
      } else {
        await addDoc(bookmarksRef, {
          ...idea,
          savedAt: new Date().toISOString()
        });
        setIsSaved(true);
        toast.success(t.savedToBookmarks);
      }
    } catch (error) {
      console.error("Error toggling bookmark:", error);
      toast.error(t.toastError);
    }
  };

  const handleCopy = async () => {
    const content = `${idea.name}\n${idea.description}\n\n${idea.features.map(f => `- ${f}`).join('\n')}`;

    try {
      await navigator.clipboard.writeText(content);
      toast.success(t.copySuccess);
    } catch {
      toast.error(t.toastError);
    }
  };

  const handleShare = async () => {
    setIsSharing(true);
    try {
      const id = await saveIdeaForSharing(idea);
      const url = `${window.location.origin}/idea/${id}`;
      await navigator.clipboard.writeText(url);
      const shareMsg = lang === 'en' ? 'Link copied!' : lang === 'uk' ? 'Посилання скопійовано!' : 'Ссылка скопирована!';
      toast.success(shareMsg);
    } catch {
      toast.error(t.toastError);
    } finally {
      setIsSharing(false);
    }
  };

  const fetchBusinessDetails = async () => {
    if (businessDetails) return;
    setIsBusinessLoading(true);
    const result = await detailIdeaAction(idea, lang);
    if (result.success && result.data) {
      setBusinessDetails(result.data as { targetAudience: string; monetization: string; uniqueness: string });
    } else {
      toast.error(t.toastError);
    }
    setIsBusinessLoading(false);
  };

  const fetchTechStack = async () => {
    if (techStack) return;
    setIsTechLoading(true);
    const result = await suggestTechStackAction(idea, lang);
    if (result.success && result.data) {
      setTechStack(result.data as { steps: { title: string; description: string }[] });
    } else {
      toast.error(t.toastError);
    }
    setIsTechLoading(false);
  };

  return (
    <Card className="w-full h-full flex flex-col bg-card/80 backdrop-blur border-border/50 shadow-lg hover:border-primary/50 transition-colors animate-in fade-in zoom-in-95 duration-500 overflow-hidden">
      <CardHeader className="bg-secondary/30 pb-4">
        <div className="flex justify-between items-start gap-4">
          <div>
            <CardTitle className="text-xl font-space-grotesk text-primary text-balance leading-tight">{idea.name}</CardTitle>
            <CardDescription className="text-muted-foreground mt-2 text-sm leading-relaxed">{idea.description}</CardDescription>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button variant="ghost" size="icon" onClick={handleShare} disabled={isSharing} title="Share" className="text-muted-foreground hover:text-accent">
              {isSharing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Share2 className="h-5 w-5" />}
            </Button>
            <Button variant="ghost" size="icon" onClick={handleCopy} title="Copy" className="text-muted-foreground hover:text-accent">
              <Copy className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleBookmark} className={isSaved ? "text-primary hover:text-primary/80" : "text-muted-foreground"}>
              <Bookmark className={`h-5 w-5 ${isSaved ? "fill-current" : ""}`} />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-grow space-y-4 pt-4">
        <div>
          <h4 className="text-sm font-semibold text-secondary-foreground mb-3 flex items-center">
            <Sparkles className="w-4 h-4 mr-2 text-accent" />
            {t.features}
          </h4>
          <ul className="space-y-2">
            {idea.features.map((feature, idx) => (
              <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                <Check className="w-3.5 h-3.5 text-accent mt-0.5 shrink-0" />
                <span className="leading-snug">{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        {isBusinessLoading && (
          <div className="pt-4 border-t border-border/50 space-y-3 animate-in fade-in duration-300">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-5/6" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-4/5" />
          </div>
        )}

        {businessDetails && (
          <div className="pt-4 border-t border-border/50 animate-in fade-in slide-in-from-top-2 duration-300 space-y-3">
            <h4 className="text-sm font-bold text-foreground">{t.businessDetails}</h4>
            <div className="space-y-3">
              <div>
                <span className="text-xs font-semibold text-primary block mb-1">{t.targetAudience}</span>
                <p className="text-sm text-muted-foreground leading-snug">{businessDetails.targetAudience}</p>
              </div>
              <div>
                <span className="text-xs font-semibold text-primary block mb-1">{t.monetization}</span>
                <p className="text-sm text-muted-foreground leading-snug">{businessDetails.monetization}</p>
              </div>
              <div>
                <span className="text-xs font-semibold text-primary block mb-1">{t.uniqueness}</span>
                <p className="text-sm text-muted-foreground leading-snug">{businessDetails.uniqueness}</p>
              </div>
            </div>
          </div>
        )}

        {isTechLoading && (
          <div className="pt-4 border-t border-border/50 space-y-3 animate-in fade-in duration-300">
            <Skeleton className="h-4 w-1/3" />
            {[1,2,3].map(i => (
              <div key={i} className="bg-secondary/40 p-3 rounded-xl border border-border/30 space-y-2">
                <Skeleton className="h-3 w-1/4" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-5/6" />
              </div>
            ))}
          </div>
        )}

        {techStack && (
          <div className="pt-4 border-t border-border/50 animate-in fade-in slide-in-from-top-2 duration-300 space-y-3">
            <h4 className="text-sm font-bold text-foreground">{t.techSteps}</h4>
            <div className="space-y-3">
              {techStack.steps.map((step, idx) => (
                <div key={idx} className="bg-secondary/40 p-3 rounded-xl border border-border/30 shadow-sm">
                  <span className="text-xs font-bold text-accent">{step.title}</span>
                  <p className="text-sm text-muted-foreground mt-1 leading-snug">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex flex-wrap gap-2 pt-4 pb-4 bg-secondary/10 border-t border-border/20">
        <Button variant={"secondary"} size="sm" onClick={fetchBusinessDetails} disabled={isBusinessLoading || !!businessDetails} className="flex-1 text-xs">
          {isBusinessLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Briefcase className="h-4 w-4 mr-2" />}
          {t.businessDetails}
        </Button>
        <Button variant={"outline"} size="sm" onClick={fetchTechStack} disabled={isTechLoading || !!techStack} className="flex-1 text-xs bg-background/50">
          {isTechLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Code className="h-4 w-4 mr-2" />}
          {t.techSteps}
        </Button>
      </CardFooter>
    </Card>
  );
}
