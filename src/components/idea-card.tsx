"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "./ui/card";
import { Button } from "./ui/button";
import { Skeleton } from "./ui/skeleton";
import { Bookmark, Sparkles, Code, Briefcase, Loader2, Check, Copy, Share2, Lock, Unlock, Download, AlertTriangle } from "lucide-react";
import { detailIdeaAction, suggestTechStackAction, analyzeArchitectureAction } from "@/app/actions";
import { saveIdeaForSharing } from "@/app/idea/actions";
import { toast } from "sonner";
import { useAuth } from "@/firebase/provider";
import { db } from "@/firebase";
import { collection, addDoc, query, where, getDocs, deleteDoc, doc } from "firebase/firestore";
import { useLang } from "@/lib/lang-context";
import { Idea } from "@/lib/types/idea";

export function IdeaCard({ idea, saved = false }: { idea: Idea; saved?: boolean }) {
  const { user } = useAuth();
  const { lang, t } = useLang();
  const [isSaved, setIsSaved] = useState(saved);
  const [isSharing, setIsSharing] = useState(false);

  const promoText = `${t.sharePromo}\n\n`;
  const isGameIdea = (() => {
    const haystack = `${idea.name} ${idea.description} ${idea.features.join(" ")}`.toLowerCase();
    return [
      "game",
      "gameplay",
      "player",
      "level",
      "combat",
      "boss",
      "physics",
      "rpg",
      "shooter",
      "platformer",
      "roguelike",
      "roguelite",
      "action",
      "simulator",
      "enemy",
    ].some((term) => haystack.includes(term));
  })();
  const pitchLabels = {
    audience: isGameIdea
      ? (lang === "ru" ? "Для каких игроков" : lang === "uk" ? "Для яких гравців" : "Player Fit")
      : t.whoItsForLabel,
    problem: isGameIdea
      ? (lang === "ru" ? "Игровое давление" : lang === "uk" ? "Ігровий тиск" : "Challenge Pressure")
      : t.problemSolvedLabel,
    value: isGameIdea
      ? (lang === "ru" ? "Почему это свежо" : lang === "uk" ? "Чому це свіже" : "Why It Feels Fresh")
      : t.whyCanWinLabel,
    twist: isGameIdea
      ? (lang === "ru" ? "Центральный твист" : lang === "uk" ? "Центральний твіст" : "Core Twist")
      : (lang === "ru" ? "Странное правило" : lang === "uk" ? "Дивне правило" : "Weird Rule"),
    novelty: isGameIdea
      ? (lang === "ru" ? "Почему это не клон" : lang === "uk" ? "Чому це не клон" : "Why This Is Not A Clone")
      : (lang === "ru" ? "Почему это действительно новое" : lang === "uk" ? "Чому це справді нове" : "Why This Feels New"),
    antiClone: isGameIdea
      ? (lang === "ru" ? "Какого клона избегает" : lang === "uk" ? "Якого клона уникає" : "Clone Trap Avoided")
      : (lang === "ru" ? "Какой шаблон отвергает" : lang === "uk" ? "Який шаблон відкидає" : "Clone Trap Rejected"),
  };
  const sectionLabels = {
    features: isGameIdea
      ? (lang === "ru" ? "Игровые системы" : lang === "uk" ? "Ігрові системи" : "Gameplay Systems")
      : t.features,
    businessDetails: isGameIdea
      ? (lang === "ru" ? "Позиционирование игры" : lang === "uk" ? "Позиціонування гри" : "Game Positioning")
      : t.businessDetails,
    targetAudience: isGameIdea
      ? (lang === "ru" ? "Тип игроков" : lang === "uk" ? "Тип гравців" : "Player Segment")
      : t.targetAudience,
    monetization: isGameIdea
      ? (lang === "ru" ? "Повод вернуться" : lang === "uk" ? "Причина повернутися" : "Retention Hook")
      : t.monetization,
    uniqueness: isGameIdea
      ? (lang === "ru" ? "Уникальный угол" : lang === "uk" ? "Унікальний кут" : "Fresh Angle")
      : t.uniqueness,
    marketPerspective: isGameIdea
      ? (lang === "ru" ? "Жанровый потенциал" : lang === "uk" ? "Жанровий потенціал" : "Genre Potential")
      : t.marketPerspective,
    mainRisks: lang === "ru" ? "Главные риски" : lang === "uk" ? "Головні ризики" : "Main Risks",
    technicalRisks: lang === "ru" ? "Технические риски" : lang === "uk" ? "Технічні ризики" : "Technical Risks",
    v1Cut: lang === "ru" ? "Что убрать из V1" : lang === "uk" ? "Що прибрати з V1" : "What To Cut From V1",
    stackSummary: lang === "ru" ? "Сводка стека" : lang === "uk" ? "Підсумок стеку" : "Stack Summary",
    database: lang === "ru" ? "База данных" : lang === "uk" ? "База даних" : "Database",
    backend: lang === "ru" ? "Бэкенд" : lang === "uk" ? "Бекенд" : "Backend",
    frontend: lang === "ru" ? "Фронтенд" : lang === "uk" ? "Фронтенд" : "Frontend",
    libraries: lang === "ru" ? "Библиотеки" : lang === "uk" ? "Бібліотеки" : "Libraries",
    infrastructure: lang === "ru" ? "Инфраструктура" : lang === "uk" ? "Інфраструктура" : "Infrastructure",
    backgroundJobs: lang === "ru" ? "Фоновые задачи" : lang === "uk" ? "Фонові задачі" : "Background Jobs",
    search: lang === "ru" ? "Поиск" : lang === "uk" ? "Пошук" : "Search",
    realtime: lang === "ru" ? "Реалтайм" : lang === "uk" ? "Реалтайм" : "Realtime",
    storage: lang === "ru" ? "Хранилище" : lang === "uk" ? "Сховище" : "Storage",
    auth: lang === "ru" ? "Авторизация" : lang === "uk" ? "Авторизація" : "Auth",
    billing: lang === "ru" ? "Биллинг" : lang === "uk" ? "Білінг" : "Billing",
    compliance: lang === "ru" ? "Ограничения и compliance" : lang === "uk" ? "Обмеження та compliance" : "Compliance Notes",
    architectureSummary: lang === "ru" ? "Сводка архитектуры" : lang === "uk" ? "Підсумок архітектури" : "Architecture Summary",
    deployment: lang === "ru" ? "Деплой" : lang === "uk" ? "Деплой" : "Deployment",
    caching: lang === "ru" ? "Кеш" : lang === "uk" ? "Кеш" : "Caching",
    queue: lang === "ru" ? "Очереди" : lang === "uk" ? "Черги" : "Queues",
    observability: lang === "ru" ? "Наблюдаемость" : lang === "uk" ? "Спостережуваність" : "Observability",
    failureHandling: lang === "ru" ? "Обработка сбоев" : lang === "uk" ? "Обробка збоїв" : "Failure Handling",
    techSteps: isGameIdea
      ? (lang === "ru" ? "План разработки" : lang === "uk" ? "План розробки" : "Build Plan")
      : t.techSteps,
    architecture: isGameIdea
      ? (lang === "ru" ? "Архитектура игры" : lang === "uk" ? "Архітектура гри" : "Game Architecture")
      : t.architectureReasoning,
  };

  const sectionTitleClass = "text-sm font-bold text-foreground flex items-center";
  const sectionPanelClass = "bg-secondary/40 p-3 rounded-xl border border-border/30 shadow-sm";
  const sectionLabelClass = "text-xs font-semibold text-primary block mb-1";
  const cardClass = "w-full h-fit flex flex-col bg-card/80 backdrop-blur border-border/50 shadow-lg hover:border-primary/50 transition-colors animate-in fade-in zoom-in-95 duration-500 overflow-hidden";
  const headerClass = "bg-secondary/30 pb-4";
  const footerClass = "flex flex-col gap-2 pt-4 pb-4 bg-secondary/10 border-t border-border/20";

  const sanitizeText = (text: string) => {
    if (!text) return "";
    return text
      .replace(/[#*`-]/g, "")
      .replace(/[^\u0000-\u04FF\s.,!?:;()"'%-+\/]/g, "")
      .trim();
  };

  const [businessDetails, setBusinessDetails] = useState<{
    targetAudience: string;
    monetization: string;
    uniqueness: string;
    marketPerspective?: string;
    mainRisks?: string;
    technicalRisks?: string;
    v1Cut?: string;
  } | null>(idea.businessDetails || null);
  const [isBusinessLoading, setIsBusinessLoading] = useState(false);

  const [techStack, setTechStack] = useState<{
    steps: { title: string; description: string }[];
    recommendedDatabase?: string;
    backendRuntime?: string;
    frontendStack?: string;
    keyLibraries?: string[];
    infrastructureServices?: string[];
    backgroundJobs?: string;
    searchStrategy?: string;
    realtimeStrategy?: string;
    storageStrategy?: string;
    authStrategy?: string;
    billingStrategy?: string;
    complianceNotes?: string;
    deploymentModel?: string;
    cachingStrategy?: string;
    queueStrategy?: string;
    observabilityStrategy?: string;
    failureHandling?: string;
    reasoning?: string;
    archSections?: { title: string; content: string }[]; 
    bottlenecks?: { trigger: string; component: string; migrationPath: string }[];
  } | null>(idea.techStack || null);
  const [isTechLoading, setIsTechLoading] = useState(false);
  const [isArchLoading, setIsArchLoading] = useState(false);
  const [showTechReasoning, setShowTechReasoning] = useState(false);

  const getFullIdea = (): Idea => ({
    ...idea,
    businessDetails: businessDetails || undefined,
    techStack: techStack || undefined,
  });

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
        const deletePromises = querySnapshot.docs.map((document) =>
          deleteDoc(doc(db, "users", user.uid, "bookmarks", document.id)))
        ;
        await Promise.all(deletePromises);

        setIsSaved(false);
        toast.success(t.removedFromBookmarks);
      } else {
        await addDoc(bookmarksRef, {
          ...getFullIdea(),
          savedAt: new Date().toISOString(),
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
    const full = getFullIdea();
    let content = `${promoText}${full.name}\n${full.description}\n\n${full.features.map((f) => `- ${f}`).join("\n")}`;

    if (full.audience) {
      content += `\n\n${pitchLabels.audience}: ${full.audience}`;
    }
    if (full.problem) {
      content += `\n\n${pitchLabels.problem}: ${full.problem}`;
    }
    if (full.valueProposition) {
      content += `\n\n${pitchLabels.value}: ${full.valueProposition}`;
    }
    if (full.coreTwist) {
      content += `\n\n${pitchLabels.twist}: ${full.coreTwist}`;
    }
    if (full.noveltyReason) {
      content += `\n\n${pitchLabels.novelty}: ${full.noveltyReason}`;
    }
    if (full.antiCloneNote) {
      content += `\n\n${pitchLabels.antiClone}: ${full.antiCloneNote}`;
    }

    if (full.businessDetails) {
      content += `\n\n${t.businessDetails}:\n- ${t.targetAudience}: ${full.businessDetails.targetAudience}\n- ${t.monetization}: ${full.businessDetails.monetization}\n- ${t.uniqueness}: ${full.businessDetails.uniqueness}`;
      if (full.businessDetails.marketPerspective) {
        content += `\n- ${t.marketPerspective}: ${full.businessDetails.marketPerspective}`;
      }
    }
    if (full.techStack) {
      content += `\n\n${t.techSteps}:\n${full.techStack.steps.map((s, i) => `${i + 1}. ${s.title} - ${s.description}`).join("\n")}`;

      const clean = (txt: string) => txt.replace(/[#*`-]/g, "").trim();

      if (full.techStack.archSections && full.techStack.archSections.length > 0) {
        content += `\n\n${t.architectureReasoning}:`;
        full.techStack.archSections.forEach((section) => {
          content += `\n\n[${clean(section.title)}]\n${clean(section.content)}`;
        });
      } else if (full.techStack.reasoning) {
        content += `\n\n${t.architectureReasoning}:\n${clean(full.techStack.reasoning)}`;
      }
    }

    try {
      await navigator.clipboard.writeText(content);
      toast.success(t.copySuccess);
    } catch {
      toast.error(t.toastError);
    }
  };

  const handleDownloadReadme = () => {
    const full = getFullIdea();

    let md = `# ${full.name}\n\n`;
    md += `> Automatically generated by **IdeaSpark AI Architect**\n\n`;
    md += `## Description\n${full.description}\n\n`;

    if (full.audience) {
      md += `## ${pitchLabels.audience}\n${full.audience}\n\n`;
    }
    if (full.problem) {
      md += `## ${pitchLabels.problem}\n${full.problem}\n\n`;
    }
    if (full.valueProposition) {
      md += `## ${pitchLabels.value}\n${full.valueProposition}\n\n`;
    }
    if (full.coreTwist) {
      md += `## ${pitchLabels.twist}\n${full.coreTwist}\n\n`;
    }
    if (full.noveltyReason) {
      md += `## ${pitchLabels.novelty}\n${full.noveltyReason}\n\n`;
    }
    if (full.antiCloneNote) {
      md += `## ${pitchLabels.antiClone}\n${full.antiCloneNote}\n\n`;
    }

    md += `## Key Features\n`;
    full.features.forEach((f) => {
      md += `- ${f}\n`;
    });
    md += `\n`;

    if (full.businessDetails) {
      md += `## Business Strategy\n`;
      md += `- **${t.targetAudience}** ${full.businessDetails.targetAudience}\n`;
      md += `- **${t.monetization}** ${full.businessDetails.monetization}\n`;
      md += `- **${t.uniqueness}** ${full.businessDetails.uniqueness}\n`;
      if (full.businessDetails.marketPerspective) {
        md += `- **${t.marketPerspective}** ${full.businessDetails.marketPerspective}\n`;
      }
      md += `\n`;
    }

    if (full.techStack) {
      md += `## Technical Architecture\n`;
      full.techStack.steps.forEach((s, i) => {
        md += `### ${i + 1}. ${s.title}\n${s.description}\n\n`;
      });

      if (full.techStack.reasoning) {
        md += `### Why this stack\n${full.techStack.reasoning}\n\n`;
      }
    }

    md += `---\n*Generated on IdeaSpark.*`;

    try {
      const blob = new Blob([md], { type: "text/markdown" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${full.name.toLowerCase().replace(/\s+/g, "-")}-readme.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(t.readmeReady);
    } catch {
      toast.error(t.toastError);
    }
  };

  const handleShare = async () => {
    setIsSharing(true);
    try {
      const id = await saveIdeaForSharing(getFullIdea());
      const url = `${window.location.origin}/idea/${id}`;
      await navigator.clipboard.writeText(`${promoText}${url}`);
      toast.success(t.linkCopied);
    } catch {
      toast.error(t.toastError);
    } finally {
      setIsSharing(false);
    }
  };

  const updateSessionStorage = (field: keyof Idea, data: unknown) => {
    try {
      const stored = sessionStorage.getItem("lastIdeas");
      if (stored) {
        const parsed = JSON.parse(stored) as Idea[];
        const newIdeas = parsed.map((i) => i.name === idea.name ? { ...i, [field]: data } : i);
        sessionStorage.setItem("lastIdeas", JSON.stringify(newIdeas));
      }
    } catch {
      // Ignore sessionStorage errors
    }
  };

  const fetchBusinessDetails = async () => {
    if (businessDetails) return;
    setIsBusinessLoading(true);
    const result = (await detailIdeaAction(idea, lang)) as { success: boolean; data?: { targetAudience: string; monetization: string; uniqueness: string; marketPerspective?: string; mainRisks?: string; technicalRisks?: string; v1Cut?: string }; error?: string; message?: string };
    if (result.success && result.data) {
      const data = result.data as { targetAudience: string; monetization: string; uniqueness: string; marketPerspective?: string; mainRisks?: string; technicalRisks?: string; v1Cut?: string };
      setBusinessDetails(data);
      updateSessionStorage("businessDetails", data);
    } else {
      const errorMsg = (result as { message?: string }).message || result.error || t.toastError;
      toast.error(errorMsg);
    }
    setIsBusinessLoading(false);
  };

  const fetchTechStack = async () => {
    if (techStack?.steps?.length) return;
    setIsTechLoading(true);
    const result = (await suggestTechStackAction(idea, lang)) as { success: boolean; data?: { steps: { title: string; description: string }[]; recommendedDatabase?: string; backendRuntime?: string; frontendStack?: string; keyLibraries?: string[]; infrastructureServices?: string[]; backgroundJobs?: string; searchStrategy?: string; realtimeStrategy?: string; storageStrategy?: string; authStrategy?: string; billingStrategy?: string; complianceNotes?: string }; error?: string; message?: string };
    if (result.success && result.data) {
      const data = {
        steps: result.data.steps,
        recommendedDatabase: result.data.recommendedDatabase,
        backendRuntime: result.data.backendRuntime,
        frontendStack: result.data.frontendStack,
        keyLibraries: result.data.keyLibraries,
        infrastructureServices: result.data.infrastructureServices,
        backgroundJobs: result.data.backgroundJobs,
        searchStrategy: result.data.searchStrategy,
        realtimeStrategy: result.data.realtimeStrategy,
        storageStrategy: result.data.storageStrategy,
        authStrategy: result.data.authStrategy,
        billingStrategy: result.data.billingStrategy,
        complianceNotes: result.data.complianceNotes,
        reasoning: techStack?.reasoning,
      };
      setTechStack(data);
      updateSessionStorage("techStack", data);
    } else {
      const errorMsg = (result as { message?: string }).message || result.error || t.toastError;
      toast.error(errorMsg);
    }
    setIsTechLoading(false);
  };

  const fetchArchitectureAnalysis = async () => {
    if (techStack?.reasoning || techStack?.archSections) {
      setShowTechReasoning(true);
      return;
    }
    setIsArchLoading(true);
    const result = (await analyzeArchitectureAction({
      name: idea.name,
      description: idea.description,
      features: idea.features,
      selectedSteps: techStack?.steps || [],
    }, lang)) as { success: boolean; data?: { reasoning: string; deploymentModel?: string; cachingStrategy?: string; queueStrategy?: string; observabilityStrategy?: string; failureHandling?: string; archSections?: { title: string; content: string }[]; bottlenecks?: { trigger: string; component: string; migrationPath: string }[] }; error?: string; message?: string };
    if (result.success && result.data) {
      const data = {
        steps: techStack?.steps || [],
        recommendedDatabase: techStack?.recommendedDatabase,
        backendRuntime: techStack?.backendRuntime,
        frontendStack: techStack?.frontendStack,
        keyLibraries: techStack?.keyLibraries,
        infrastructureServices: techStack?.infrastructureServices,
        backgroundJobs: techStack?.backgroundJobs,
        searchStrategy: techStack?.searchStrategy,
        realtimeStrategy: techStack?.realtimeStrategy,
        storageStrategy: techStack?.storageStrategy,
        authStrategy: techStack?.authStrategy,
        billingStrategy: techStack?.billingStrategy,
        complianceNotes: techStack?.complianceNotes,
        deploymentModel: result.data.deploymentModel,
        cachingStrategy: result.data.cachingStrategy,
        queueStrategy: result.data.queueStrategy,
        observabilityStrategy: result.data.observabilityStrategy,
        failureHandling: result.data.failureHandling,
        reasoning: result.data.reasoning,
        archSections: result.data.archSections,
        bottlenecks: result.data.bottlenecks,
      };
      setTechStack(data);
      setShowTechReasoning(true);
      updateSessionStorage("techStack", data);
    } else {
      const errorMsg = (result as { message?: string }).message || result.error || t.toastError;
      toast.error(errorMsg);
    }
    setIsArchLoading(false);
  };

  return (
    <Card className={cardClass}>
      <CardHeader className={headerClass}>
        <div className="flex justify-between items-start gap-4 mb-3">
          <CardTitle className="text-xl font-space-grotesk text-primary leading-tight flex-1 break-words">
            {sanitizeText(idea.name)}
          </CardTitle>
          <div className="flex gap-1.5 md:gap-2 shrink-0 pt-0.5">
            <Button variant="ghost" size="icon" onClick={handleDownloadReadme} title={t.downloadTooltip} className="text-muted-foreground hover:text-accent h-8 w-8">
              <Download className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleShare} disabled={isSharing} title="Share" className="text-muted-foreground hover:text-accent h-8 w-8">
              {isSharing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Share2 className="h-4 w-4" />}
            </Button>
            <Button variant="ghost" size="icon" onClick={handleCopy} title="Copy" className="text-muted-foreground hover:text-accent h-8 w-8">
              <Copy className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleBookmark} className={`h-8 w-8 ${isSaved ? "text-primary hover:text-primary/80" : "text-muted-foreground"}`}>
              <Bookmark className={`h-4 w-4 ${isSaved ? "fill-current" : ""}`} />
            </Button>
          </div>
        </div>
        <CardDescription className="text-muted-foreground text-sm leading-relaxed block w-full whitespace-pre-line">
          {sanitizeText(idea.description)}
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-grow space-y-4 pt-4">
        {(idea.audience || idea.problem || idea.valueProposition) && (
          <div className="space-y-3">
            {idea.audience && (
              <div className="bg-secondary/35 p-3 rounded-xl border border-border/30 shadow-sm">
                <span className="text-xs font-semibold text-primary block mb-1">{pitchLabels.audience}</span>
                <p className="text-sm text-muted-foreground leading-snug">{sanitizeText(idea.audience)}</p>
              </div>
            )}
            {idea.problem && (
              <div className="bg-secondary/35 p-3 rounded-xl border border-border/30 shadow-sm">
                <span className="text-xs font-semibold text-primary block mb-1">{pitchLabels.problem}</span>
                <p className="text-sm text-muted-foreground leading-snug">{sanitizeText(idea.problem)}</p>
              </div>
            )}
            {idea.valueProposition && (
              <div className="bg-secondary/35 p-3 rounded-xl border border-border/30 shadow-sm">
                <span className="text-xs font-semibold text-primary block mb-1">{pitchLabels.value}</span>
                <p className="text-sm text-muted-foreground leading-snug">{sanitizeText(idea.valueProposition)}</p>
              </div>
            )}
            {idea.coreTwist && (
              <div className="bg-secondary/35 p-3 rounded-xl border border-border/30 shadow-sm">
                <span className="text-xs font-semibold text-primary block mb-1">{pitchLabels.twist}</span>
                <p className="text-sm text-muted-foreground leading-snug">{sanitizeText(idea.coreTwist)}</p>
              </div>
            )}
            {idea.noveltyReason && (
              <div className="bg-secondary/35 p-3 rounded-xl border border-border/30 shadow-sm">
                <span className="text-xs font-semibold text-primary block mb-1">{pitchLabels.novelty}</span>
                <p className="text-sm text-muted-foreground leading-snug">{sanitizeText(idea.noveltyReason)}</p>
              </div>
            )}
            {idea.antiCloneNote && (
              <div className="bg-secondary/35 p-3 rounded-xl border border-border/30 shadow-sm">
                <span className="text-xs font-semibold text-primary block mb-1">{pitchLabels.antiClone}</span>
                <p className="text-sm text-muted-foreground leading-snug">{sanitizeText(idea.antiCloneNote)}</p>
              </div>
            )}
          </div>
        )}

        <div>
          <h4 className={`${sectionTitleClass} mb-3`}>
            <Sparkles className="w-4 h-4 mr-2 text-primary" />
            {sectionLabels.features}
          </h4>
          <div className={sectionPanelClass}>
            <ul className="space-y-2">
              {idea.features.map((feature, idx) => (
                <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                  <span className="leading-snug">{sanitizeText(feature)}</span>
                </li>
              ))}
            </ul>
          </div>
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
            <h4 className={sectionTitleClass}>
              <Briefcase className="w-4 h-4 mr-2 text-primary" />
              {sectionLabels.businessDetails}
            </h4>
            <div className="space-y-3">
              <div className={sectionPanelClass}>
                <span className={sectionLabelClass}>{sectionLabels.targetAudience}</span>
                <p className="text-sm text-muted-foreground leading-snug">{sanitizeText(businessDetails.targetAudience)}</p>
              </div>
              <div className={sectionPanelClass}>
                <span className={sectionLabelClass}>{sectionLabels.monetization}</span>
                <p className="text-sm text-muted-foreground leading-snug">{sanitizeText(businessDetails.monetization)}</p>
              </div>
              <div className={sectionPanelClass}>
                <span className={sectionLabelClass}>{sectionLabels.uniqueness}</span>
                <p className="text-sm text-muted-foreground leading-snug">{sanitizeText(businessDetails.uniqueness)}</p>
              </div>
              {businessDetails.marketPerspective && (
                <div className={sectionPanelClass}>
                  <span className={sectionLabelClass}>{sectionLabels.marketPerspective}</span>
                  <p className="text-sm text-muted-foreground leading-snug">{sanitizeText(businessDetails.marketPerspective)}</p>
                </div>
              )}
              {businessDetails.mainRisks && (
                <div className={sectionPanelClass}>
                  <span className={sectionLabelClass}>{sectionLabels.mainRisks}</span>
                  <p className="text-sm text-muted-foreground leading-snug">{sanitizeText(businessDetails.mainRisks)}</p>
                </div>
              )}
              {businessDetails.technicalRisks && (
                <div className={sectionPanelClass}>
                  <span className={sectionLabelClass}>{sectionLabels.technicalRisks}</span>
                  <p className="text-sm text-muted-foreground leading-snug">{sanitizeText(businessDetails.technicalRisks)}</p>
                </div>
              )}
              {businessDetails.v1Cut && (
                <div className={sectionPanelClass}>
                  <span className={sectionLabelClass}>{sectionLabels.v1Cut}</span>
                  <p className="text-sm text-muted-foreground leading-snug">{sanitizeText(businessDetails.v1Cut)}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {isTechLoading && (
          <div className="pt-4 border-t border-border/50 space-y-3 animate-in fade-in duration-300">
            <Skeleton className="h-4 w-1/3" />
            {[1, 2, 3].map((i) => (
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
            <h4 className={sectionTitleClass}>
              <Code className="w-4 h-4 mr-2 text-primary" />
              {sectionLabels.techSteps}
            </h4>
            {(techStack.recommendedDatabase || techStack.backendRuntime || techStack.frontendStack || techStack.keyLibraries?.length || techStack.infrastructureServices?.length || techStack.backgroundJobs || techStack.searchStrategy || techStack.realtimeStrategy || techStack.storageStrategy || techStack.authStrategy || techStack.billingStrategy || techStack.complianceNotes) && (
              <div className="space-y-3">
                <div className={sectionPanelClass}>
                  <span className={sectionLabelClass}>{sectionLabels.stackSummary}</span>
                  <div className="space-y-2">
                    {techStack.recommendedDatabase && <p className="text-sm text-muted-foreground leading-snug"><span className="text-primary font-semibold">{sectionLabels.database}: </span>{sanitizeText(techStack.recommendedDatabase)}</p>}
                    {techStack.backendRuntime && <p className="text-sm text-muted-foreground leading-snug"><span className="text-primary font-semibold">{sectionLabels.backend}: </span>{sanitizeText(techStack.backendRuntime)}</p>}
                    {techStack.frontendStack && <p className="text-sm text-muted-foreground leading-snug"><span className="text-primary font-semibold">{sectionLabels.frontend}: </span>{sanitizeText(techStack.frontendStack)}</p>}
                    {techStack.keyLibraries && techStack.keyLibraries.length > 0 && <p className="text-sm text-muted-foreground leading-snug"><span className="text-primary font-semibold">{sectionLabels.libraries}: </span>{techStack.keyLibraries.map(sanitizeText).join(", ")}</p>}
                    {techStack.infrastructureServices && techStack.infrastructureServices.length > 0 && <p className="text-sm text-muted-foreground leading-snug"><span className="text-primary font-semibold">{sectionLabels.infrastructure}: </span>{techStack.infrastructureServices.map(sanitizeText).join(", ")}</p>}
                    {techStack.backgroundJobs && <p className="text-sm text-muted-foreground leading-snug"><span className="text-primary font-semibold">{sectionLabels.backgroundJobs}: </span>{sanitizeText(techStack.backgroundJobs)}</p>}
                    {techStack.searchStrategy && <p className="text-sm text-muted-foreground leading-snug"><span className="text-primary font-semibold">{sectionLabels.search}: </span>{sanitizeText(techStack.searchStrategy)}</p>}
                    {techStack.realtimeStrategy && <p className="text-sm text-muted-foreground leading-snug"><span className="text-primary font-semibold">{sectionLabels.realtime}: </span>{sanitizeText(techStack.realtimeStrategy)}</p>}
                    {techStack.storageStrategy && <p className="text-sm text-muted-foreground leading-snug"><span className="text-primary font-semibold">{sectionLabels.storage}: </span>{sanitizeText(techStack.storageStrategy)}</p>}
                    {techStack.authStrategy && <p className="text-sm text-muted-foreground leading-snug"><span className="text-primary font-semibold">{sectionLabels.auth}: </span>{sanitizeText(techStack.authStrategy)}</p>}
                    {techStack.billingStrategy && <p className="text-sm text-muted-foreground leading-snug"><span className="text-primary font-semibold">{sectionLabels.billing}: </span>{sanitizeText(techStack.billingStrategy)}</p>}
                    {techStack.complianceNotes && <p className="text-sm text-muted-foreground leading-snug"><span className="text-primary font-semibold">{sectionLabels.compliance}: </span>{sanitizeText(techStack.complianceNotes)}</p>}
                  </div>
                </div>
              </div>
            )}
            {(techStack.deploymentModel || techStack.cachingStrategy || techStack.queueStrategy || techStack.observabilityStrategy || techStack.failureHandling) && (
              <div className={sectionPanelClass}>
                <span className={sectionLabelClass}>{sectionLabels.architectureSummary}</span>
                <div className="space-y-2">
                  {techStack.deploymentModel && <p className="text-sm text-muted-foreground leading-snug"><span className="text-primary font-semibold">{sectionLabels.deployment}: </span>{sanitizeText(techStack.deploymentModel)}</p>}
                  {techStack.cachingStrategy && <p className="text-sm text-muted-foreground leading-snug"><span className="text-primary font-semibold">{sectionLabels.caching}: </span>{sanitizeText(techStack.cachingStrategy)}</p>}
                  {techStack.queueStrategy && <p className="text-sm text-muted-foreground leading-snug"><span className="text-primary font-semibold">{sectionLabels.queue}: </span>{sanitizeText(techStack.queueStrategy)}</p>}
                  {techStack.observabilityStrategy && <p className="text-sm text-muted-foreground leading-snug"><span className="text-primary font-semibold">{sectionLabels.observability}: </span>{sanitizeText(techStack.observabilityStrategy)}</p>}
                  {techStack.failureHandling && <p className="text-sm text-muted-foreground leading-snug"><span className="text-primary font-semibold">{sectionLabels.failureHandling}: </span>{sanitizeText(techStack.failureHandling)}</p>}
                </div>
              </div>
            )}
            <div className="space-y-3">
              {techStack.steps.map((step, idx) => (
                <div key={idx} className={sectionPanelClass}>
                  <span className="text-xs font-bold text-primary">{sanitizeText(step.title)}</span>
                  <p className="text-sm text-muted-foreground mt-1 leading-snug">{sanitizeText(step.description)}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {techStack && showTechReasoning && (techStack.reasoning || techStack.archSections) && (
          <div className="animate-in fade-in slide-in-from-top-2 duration-300 space-y-4 mt-6">
            <h4 className={sectionTitleClass}>
              <Unlock className="w-4 h-4 mr-2 text-primary" />
              {sectionLabels.architecture}
            </h4>

            <div className="space-y-3">
              {techStack.archSections ? (
                techStack.archSections.map((section, idx) => (
                  <div key={idx} className={`${sectionPanelClass} animate-in fade-in zoom-in-95 duration-500`} style={{ animationDelay: `${idx * 150}ms` }}>
                    <span className="text-xs font-bold text-primary">{sanitizeText(section.title)}</span>
                    <p className="text-sm text-muted-foreground mt-1 leading-snug whitespace-pre-wrap">
                      {sanitizeText(section.content)}
                    </p>
                  </div>
                ))
              ) : (
                <div className={sectionPanelClass}>
                  <p className="text-sm text-muted-foreground leading-snug whitespace-pre-wrap">
                    {sanitizeText(techStack.reasoning || "")}
                  </p>
                </div>
              )}
            </div>

            {techStack.bottlenecks && techStack.bottlenecks.length > 0 && (
              <div className="space-y-3 mt-2">
                <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-primary" />
                  {t.bottlenecksLabel}
                </h4>
                <div className="space-y-2">
                  {techStack.bottlenecks.map((b, idx) => (
                    <div key={idx} className={`${sectionPanelClass} animate-in fade-in zoom-in-95 duration-500`} style={{ animationDelay: `${idx * 100}ms` }}>
                      <div className="flex items-start gap-2 mb-2">
                        <span className="text-xs font-semibold text-primary shrink-0">{t.triggerLabel}:</span>
                        <span className="text-xs text-muted-foreground leading-snug">{sanitizeText(b.trigger)}</span>
                      </div>
                      <div className="flex items-start gap-2 mb-2">
                        <span className="text-xs font-semibold text-primary shrink-0">{t.componentLabel}:</span>
                        <span className="text-xs text-muted-foreground leading-snug">{sanitizeText(b.component)}</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-xs font-semibold text-primary shrink-0">{t.migrationLabel}:</span>
                        <span className="text-xs text-muted-foreground leading-snug">{sanitizeText(b.migrationPath)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>

      <CardFooter className={footerClass}>
        <div className="flex gap-2 w-full">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchBusinessDetails}
            disabled={isBusinessLoading || !!businessDetails}
            className="flex-1 text-xs bg-background/50"
          >
            {isBusinessLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Briefcase className="h-4 w-4 mr-2" />}
            {sectionLabels.businessDetails}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchTechStack}
            disabled={isTechLoading || !!techStack?.steps?.length}
            className="flex-1 text-xs bg-background/50"
          >
            {isTechLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Code className="h-4 w-4 mr-2" />}
            {sectionLabels.techSteps}
          </Button>
        </div>

        <Button
          variant={techStack?.reasoning ? "outline" : "default"}
          size="sm"
          onClick={() => {
            if (!techStack?.steps?.length) {
              toast.info(t.techStepsFirst);
              return;
            }
            fetchArchitectureAnalysis();
          }}
          disabled={isArchLoading || !!techStack?.reasoning}
          className="w-full text-xs font-bold"
        >
          {isArchLoading ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : techStack?.reasoning ? (
            <Unlock className="h-4 w-4 mr-2 text-primary" />
          ) : (
            <Lock className={`h-4 w-4 mr-2 ${!techStack?.steps?.length ? "opacity-50" : "text-primary animate-pulse"}`} />
          )}
          {techStack?.reasoning ? t.architectureDone : sectionLabels.architecture}
        </Button>
      </CardFooter>
    </Card>
  );
}
