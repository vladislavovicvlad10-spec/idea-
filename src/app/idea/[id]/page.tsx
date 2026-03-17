"use client";

import { useEffect, useState } from "react";
import { useParams, notFound } from "next/navigation";
import { getSharedIdea } from "../actions";
import { IdeaCard, Idea } from "@/components/idea-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Share2, Check } from "lucide-react";
import Link from "next/link";


export default function SharedIdeaPage() {
  const { id } = useParams<{ id: string }>();
  const [idea, setIdea] = useState<Idea | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFoundState, setNotFoundState] = useState(false);
  const [copied, setCopied] = useState(false);
  const [lang] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("app_lang") || "en";
    }
    return "en";
  });

  useEffect(() => {
    const load = async () => {
      const data = await getSharedIdea(id);
      if (!data) {
        setNotFoundState(true);
      } else {
        setIdea(data);
      }
      setLoading(false);
    };
    load();
  }, [id]);

  const handleShare = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // ignore
    }
  };

  if (notFoundState) {
    notFound();
  }

  const backLabel = lang === 'en' ? 'Back' : lang === 'uk' ? 'Назад' : 'Назад';
  const shareLabel = lang === 'en' ? 'Share' : lang === 'uk' ? 'Поділитися' : 'Поделиться';
  const copiedLabel = lang === 'en' ? 'Copied!' : lang === 'uk' ? 'Скопійовано!' : 'Скопировано!';
  const sharedIdeaLabel = lang === 'en' ? 'Shared Idea' : lang === 'uk' ? 'Публічна ідея' : 'Публичная идея';

  return (
    <div className="container mx-auto max-w-3xl py-12 px-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-8">
        <Link href="/">
          <Button variant="ghost" size="sm" className="gap-1.5">
            <ArrowLeft className="w-4 h-4" />
            {backLabel}
          </Button>
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground bg-secondary/50 px-3 py-1 rounded-full border border-border/30">
            {sharedIdeaLabel}
          </span>
          <Button
            size="sm"
            variant="outline"
            onClick={handleShare}
            className="gap-1.5 border-primary/20 hover:border-primary/50"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-green-500" />
                {copiedLabel}
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4" />
                {shareLabel}
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Idea Card */}
      {loading ? (
        <div className="space-y-6">
          <Skeleton className="h-10 w-2/3" />
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-4/5" />
          <div className="space-y-3 pt-4">
            {[1, 2, 3, 4, 5].map(i => (
              <Skeleton key={i} className="h-4 w-full" />
            ))}
          </div>
        </div>
      ) : idea ? (
        <IdeaCard idea={idea} />
      ) : null}
    </div>
  );
}
