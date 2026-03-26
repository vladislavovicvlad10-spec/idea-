"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/firebase/provider";
import { useRouter } from "next/navigation";
import { collection, getDocs, limit, orderBy, query, type QueryDocumentSnapshot } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, ChartColumn, Clock3, Database, Filter, Globe, Lightbulb, Search, Sparkles, TrendingUp, Users } from "lucide-react";
import { getTranslation } from "@/lib/translations";
import { type ActivityAction, type DashboardStats, type ReviewRecord, type UserData } from "@/lib/types/dashboard";
import { db } from "@/firebase";

const EMPTY_STATS: DashboardStats = {
  totalUsers: 0,
  totalIdeas: 0,
  recentActions: [],
  recentUsers: [],
  topTopics: [],
  langDistribution: { ru: 0, en: 0, uk: 0 },
  conversionRate: 0,
  reviews: { total: 0, pending: 0, failed: 0, approved: 0, flagged: 0, byDomain: [], recent: [] },
};
const AGGR_LIMIT = 500;
const RECENT_ACTIONS_LIMIT = 60;
const RECENT_USERS_LIMIT = 12;
const REVIEW_LIMIT = 30;
const RANGE_OPTIONS = [{ id: "24h", label: "24H", hours: 24 }, { id: "7d", label: "7D", hours: 168 }, { id: "30d", label: "30D", hours: 720 }, { id: "all", label: "All", hours: null }] as const;
type RangeId = (typeof RANGE_OPTIONS)[number]["id"];
type LangFilter = "all" | "ru" | "en" | "uk";

const normalizeDate = (value: unknown) => !value ? new Date(0).toISOString() : value instanceof Date ? value.toISOString() : typeof value === "string" ? value : typeof value === "object" && value !== null && "toDate" in value && typeof (value as { toDate?: () => Date }).toDate === "function" ? (value as { toDate: () => Date }).toDate().toISOString() : new Date(0).toISOString();
const actionTimestamp = (action: ActivityAction) => new Date(normalizeDate(action.timestamp)).getTime();
const userTimestamp = (user: UserData) => new Date(normalizeDate(user.createdAt)).getTime();
const sumIdeas = (actions: ActivityAction[]) => actions.reduce((sum, item) => sum + (item.count || 0), 0);
const deltaLabel = (current: number, previous: number) => previous === 0 ? (current > 0 ? "new activity vs previous window" : "flat vs previous window") : `${Math.round(((current - previous) / previous) * 100) > 0 ? "+" : ""}${Math.round(((current - previous) / previous) * 100)}% vs previous window`;

async function loadDashboardStatsFromClient(): Promise<DashboardStats> {
  const usersRef = collection(db, "users");
  const activityRef = collection(db, "activity_logs");
  const reviewsRef = collection(db, "generation_reviews");
  const [usersSnap, recentUsersSnap, recentActivityAggSnap, recentActionsSnap, reviewsSnap] = await Promise.all([
    getDocs(usersRef),
    getDocs(query(usersRef, orderBy("createdAt", "desc"), limit(RECENT_USERS_LIMIT))),
    getDocs(query(activityRef, orderBy("timestamp", "desc"), limit(AGGR_LIMIT))),
    getDocs(query(activityRef, orderBy("timestamp", "desc"), limit(RECENT_ACTIONS_LIMIT))),
    getDocs(query(reviewsRef, orderBy("createdAt", "desc"), limit(REVIEW_LIMIT))),
  ]);
  let totalIdeas = 0;
  const themes: Record<string, number> = {};
  const langs: Record<"ru" | "en" | "uk", number> = { ru: 0, en: 0, uk: 0 };
  recentActivityAggSnap.forEach((docSnap: QueryDocumentSnapshot) => {
    const data = docSnap.data();
    totalIdeas += data.count || 0;
    if (typeof data.theme === "string" && data.theme.trim()) themes[data.theme.trim().toLowerCase()] = (themes[data.theme.trim().toLowerCase()] || 0) + 1;
    if (data.lang === "ru" || data.lang === "en" || data.lang === "uk") langs[data.lang as "ru" | "en" | "uk"]++; else langs.ru++;
  });

  const reviewDomainCounts: Record<string, number> = {};
  let pending = 0;
  let failed = 0;
  let approved = 0;
  let flagged = 0;

  const recentReviews: ReviewRecord[] = reviewsSnap.docs.map((docSnap: QueryDocumentSnapshot) => {
    const data = docSnap.data();
    const domain = typeof data.domain === "string" && data.domain.trim() ? data.domain : "general";
    const reviewStatus = typeof data.reviewStatus === "string" && data.reviewStatus.trim() ? data.reviewStatus : "pending";

    reviewDomainCounts[domain] = (reviewDomainCounts[domain] || 0) + 1;
    if (reviewStatus === "pending") pending++;
    if (reviewStatus === "error") failed++;
    if (reviewStatus === "approved") approved++;
    if (reviewStatus === "flagged") flagged++;

    return {
      id: docSnap.id,
      theme: typeof data.theme === "string" ? data.theme : "",
      lang: typeof data.lang === "string" ? data.lang : "",
      domain,
      source: typeof data.source === "string" ? data.source : "auto",
      reviewStatus,
      reviewTags: Array.isArray(data.reviewTags) ? data.reviewTags.filter((item): item is string => typeof item === "string") : [],
      error: typeof data.error === "string" ? data.error : undefined,
      createdAt: normalizeDate(data.createdAt),
      ideas: Array.isArray(data.ideas)
        ? data.ideas
            .filter((idea): idea is { name?: unknown; description?: unknown } => typeof idea === "object" && idea !== null)
            .map((idea) => ({
              name: typeof idea.name === "string" ? idea.name : "Untitled",
              description: typeof idea.description === "string" ? idea.description : "",
            }))
        : undefined,
    };
  });

  return {
    totalUsers: usersSnap.size,
    totalIdeas,
    recentActions: recentActionsSnap.docs.map((docSnap: QueryDocumentSnapshot) => {
      const data = docSnap.data();
      return { id: docSnap.id, type: data.type, theme: data.theme, count: data.count, lang: data.lang, timestamp: normalizeDate(data.timestamp) };
    }),
    recentUsers: recentUsersSnap.docs.map((docSnap: QueryDocumentSnapshot) => {
      const data = docSnap.data();
      return { id: docSnap.id, email: typeof data.email === "string" ? data.email : "", createdAt: typeof data.createdAt === "string" ? data.createdAt : normalizeDate(data.createdAt) };
    }),
    topTopics: Object.entries(themes).map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count).slice(0, 5),
    langDistribution: langs,
    conversionRate: usersSnap.size > 0 ? Math.min(Math.round((recentActivityAggSnap.size / usersSnap.size) * 20), 100) : 0,
    reviews: {
      total: reviewsSnap.size,
      pending,
      failed,
      approved,
      flagged,
      byDomain: Object.entries(reviewDomainCounts).map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count).slice(0, 6),
      recent: recentReviews,
    },
  };
}

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>(EMPTY_STATS);
  const [isFetching, setIsFetching] = useState(true);
  const [lang, setLang] = useState("en");
  const [dataSource, setDataSource] = useState<"server" | "client">("server");
  const [range, setRange] = useState<RangeId>("7d");
  const [search, setSearch] = useState("");
  const [langFilter, setLangFilter] = useState<LangFilter>("all");

  useEffect(() => {
    const savedLang = localStorage.getItem("app_lang");
    if (savedLang) setTimeout(() => setLang(savedLang), 0);
  }, []);
  const t = getTranslation(lang);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push("/");
      return;
    }
    const fetchData = async () => {
      try {
        const response = await fetch("/api/admin/dashboard", { method: "GET", headers: { Authorization: `Bearer ${await user.getIdToken()}` } });
        if (response.status === 401 || response.status === 403) {
          router.push("/");
          return;
        }
        if (!response.ok) throw new Error("Failed to load dashboard");
        setStats((await response.json()) as DashboardStats);
        setDataSource("server");
      } catch {
        setStats(await loadDashboardStatsFromClient());
        setDataSource("client");
      } finally {
        setIsFetching(false);
      }
    };
    fetchData();
  }, [user, loading, router]);

  const formatTime = (ts: string | Date | undefined) => {
    if (!ts) return t.justNow;
    const date = ts instanceof Date ? ts : new Date(ts);
    const diff = Math.floor((Date.now() - date.getTime()) / 60000);
    if (diff < 1) return t.justNow;
    if (diff < 60) return `${diff}m ${t.ago}`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h ${t.ago}`;
    return date.toLocaleDateString(lang === "ru" ? "ru-RU" : lang === "uk" ? "uk-UA" : "en-US");
  };

  const view = useMemo(() => {
    const allActions = [...stats.recentActions].sort((a, b) => actionTimestamp(a) - actionTimestamp(b));
    const allUsers = [...stats.recentUsers].sort((a, b) => userTimestamp(a) - userTimestamp(b));
    const selected = RANGE_OPTIONS.find((item) => item.id === range) ?? RANGE_OPTIONS[1];
    const endTime = allActions.length > 0 ? actionTimestamp(allActions[allActions.length - 1]) : Date.now();
    const start = selected.hours === null ? Number.NEGATIVE_INFINITY : endTime - selected.hours * 3600000;
    const prevStart = selected.hours === null ? Number.NEGATIVE_INFINITY : start - selected.hours * 3600000;
    const baseActions = allActions.filter((item) => actionTimestamp(item) >= start && actionTimestamp(item) <= endTime);
    const previousActions = allActions.filter((item) => actionTimestamp(item) >= prevStart && actionTimestamp(item) < start);
    const currentUsers = allUsers.filter((item) => userTimestamp(item) >= start && userTimestamp(item) <= endTime);
    const previousUsers = allUsers.filter((item) => userTimestamp(item) >= prevStart && userTimestamp(item) < start);
    const filteredActions = baseActions.filter((item) => {
      const matchesLang = langFilter === "all" || item.lang === langFilter;
      const needle = search.trim().toLowerCase();
      const hay = `${item.theme || ""} ${item.type || ""}`.toLowerCase();
      return matchesLang && (!needle || hay.includes(needle));
    });
    const themes = filteredActions.reduce<Record<string, number>>((acc, item) => {
      const key = (item.theme || "").trim().toLowerCase();
      if (!key) return acc;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    const languageMix = filteredActions.reduce<Record<"ru" | "en" | "uk", number>>((acc, item) => {
      if (item.lang === "ru" || item.lang === "en" || item.lang === "uk") acc[item.lang]++;
      return acc;
    }, { ru: 0, en: 0, uk: 0 });
    const currentSignals = filteredActions.length;
    const currentIdeas = sumIdeas(filteredActions);
    const currentUsersCount = currentUsers.length;
    return {
      selected,
      filteredActions,
      currentUsers,
      previousSignals: previousActions.length,
      previousIdeas: sumIdeas(previousActions),
      previousUsersCount: previousUsers.length,
      currentSignals,
      currentIdeas,
      currentUsersCount,
      conversion: currentUsersCount > 0 ? Math.min(Math.round((currentSignals / currentUsersCount) * 18), 100) : stats.conversionRate,
      avgIdeas: currentSignals > 0 ? (currentIdeas / currentSignals).toFixed(1) : "0.0",
      peak: filteredActions.length > 0 ? Math.max(...filteredActions.map((item) => item.count || 0)) : 0,
      powerEvents: filteredActions.filter((item) => (item.count || 0) >= 3).length,
      recurringThemes: Object.values(themes).filter((value) => value > 1).length,
      topTopics: Object.entries(themes).map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count).slice(0, 5),
      activitySeries: filteredActions.map((item) => item.count || 0),
      previousSeries: previousActions.map((item) => item.count || 0),
      languageMix,
      langTotal: languageMix.ru + languageMix.en + languageMix.uk,
    };
  }, [stats, range, search, langFilter]);

  const reviewView = useMemo(() => {
    const items = stats.reviews.recent;
    const filtered = items.filter((item) => {
      const matchesLang = langFilter === "all" || item.lang === langFilter;
      const needle = search.trim().toLowerCase();
      const hay = `${item.theme} ${item.domain} ${item.reviewStatus} ${(item.reviewTags || []).join(" ")}`.toLowerCase();
      return matchesLang && (!needle || hay.includes(needle));
    });

    return {
      items: filtered,
      topDomains: stats.reviews.byDomain,
    };
  }, [stats.reviews, langFilter, search]);

  if (loading || isFetching) {
    return <div className="container mx-auto max-w-7xl py-12 px-4 space-y-8"><Skeleton className="h-28 w-full rounded-3xl" /><div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">{[1,2,3,4].map((i) => <Skeleton key={i} className="h-40 rounded-3xl" />)}</div><div className="grid grid-cols-1 xl:grid-cols-3 gap-6"><Skeleton className="h-[360px] rounded-3xl xl:col-span-2" /><Skeleton className="h-[360px] rounded-3xl" /></div></div>;
  }

  return (
    <div className="container mx-auto max-w-7xl py-10 px-4 space-y-6">
      <Card className="overflow-hidden border-primary/20 bg-[radial-gradient(circle_at_top_left,rgba(168,85,247,0.18),transparent_35%),linear-gradient(135deg,rgba(24,24,27,0.98),rgba(39,39,42,0.92))]">
        <CardContent className="space-y-6 p-6 md:p-8">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="space-y-3"><div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary"><Sparkles className="h-3.5 w-3.5" />{t.adminPanel}</div><div><h1 className="text-3xl md:text-5xl font-black tracking-tight text-white font-space-grotesk">Product Control Surface</h1><p className="mt-2 max-w-2xl text-sm md:text-base text-zinc-300">{t.realtimeStats}</p></div></div>
            <div className="grid min-w-full grid-cols-2 gap-3 xl:min-w-[360px] xl:max-w-[420px]"><Badge title={t.liveConnection} value="Online" /><Badge title="Data source" value={dataSource === "server" ? "Server" : "Client fallback"} /><Badge title="Window" value={view.selected.label} /><Badge title="Feed" value={`${view.filteredActions.length} records`} /></div>
          </div>
          <div className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-black/20 p-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-wrap gap-2">{RANGE_OPTIONS.map((option) => <button key={option.id} onClick={() => setRange(option.id)} className={`rounded-full border px-4 py-2 text-xs font-semibold transition ${range === option.id ? "border-primary/40 bg-primary/15 text-primary" : "border-border/40 bg-secondary/20 text-muted-foreground hover:border-primary/20 hover:text-foreground"}`}>{option.label}</button>)}</div>
            <div className="flex flex-col gap-3 md:flex-row xl:min-w-[460px]"><div className="relative flex-1"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search themes or action types" className="h-11 w-full rounded-2xl border border-border/40 bg-background/60 pl-10 pr-4 text-sm outline-none transition focus:border-primary" /></div><div className="relative min-w-[150px]"><Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><select value={langFilter} onChange={(e) => setLangFilter(e.target.value as LangFilter)} className="h-11 w-full appearance-none rounded-2xl border border-border/40 bg-background/60 pl-10 pr-4 text-sm outline-none transition focus:border-primary"><option value="all">All languages</option><option value="ru">{t.langRu}</option><option value="en">{t.langEn}</option><option value="uk">{t.langUk}</option></select></div></div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        <Metric title="Signals" value={String(view.currentSignals)} subtitle={deltaLabel(view.currentSignals, view.previousSignals)} icon={<Activity className="h-5 w-5 text-emerald-300" />} series={view.activitySeries} />
        <Metric title={t.totalIdeas} value={String(view.currentIdeas)} subtitle={deltaLabel(view.currentIdeas, view.previousIdeas)} icon={<Lightbulb className="h-5 w-5 text-amber-300" />} series={view.activitySeries} />
        <Metric title={t.totalUsers} value={String(view.currentUsersCount)} subtitle={deltaLabel(view.currentUsersCount, view.previousUsersCount)} icon={<Users className="h-5 w-5 text-sky-300" />} />
        <Metric title="Activation" value={`${view.conversion}%`} subtitle={`${view.avgIdeas} avg ideas / signal`} icon={<TrendingUp className="h-5 w-5 text-fuchsia-300" />} />
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        <Metric title="Review Queue" value={String(stats.reviews.pending)} subtitle={`${stats.reviews.total} logged generations`} icon={<Search className="h-5 w-5 text-orange-300" />} />
        <Metric title="Review Failures" value={String(stats.reviews.failed)} subtitle="generation errors captured" icon={<Activity className="h-5 w-5 text-rose-300" />} />
        <Metric title="Approved Samples" value={String(stats.reviews.approved)} subtitle="manually accepted cases" icon={<Sparkles className="h-5 w-5 text-emerald-300" />} />
        <Metric title="Flagged Cases" value={String(stats.reviews.flagged)} subtitle="needs prompt or routing fixes" icon={<Filter className="h-5 w-5 text-amber-300" />} />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2 border-border/60 bg-card/60 backdrop-blur"><CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-xl"><ChartColumn className="h-5 w-5 text-primary" />Activity Compare</CardTitle></CardHeader><CardContent className="space-y-6"><CompareChart current={view.activitySeries} previous={view.previousSeries} /><div className="grid grid-cols-1 gap-4 md:grid-cols-4"><Mini label="Current feed" value={String(view.currentSignals)} helper="signals in selected window" /><Mini label="Previous feed" value={String(view.previousSignals)} helper="signals in previous window" /><Mini label="Peak output" value={String(view.peak)} helper="largest single action" /><Mini label="Power events" value={String(view.powerEvents)} helper="actions with 3+ ideas" /></div></CardContent></Card>
        <Card className="border-border/60 bg-card/60 backdrop-blur"><CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-xl"><Globe className="h-5 w-5 text-primary" />Segment Mix</CardTitle></CardHeader><CardContent className="space-y-4"><Mix label={t.langRu} count={view.languageMix.ru} total={view.langTotal} color="bg-blue-500" /><Mix label={t.langEn} count={view.languageMix.en} total={view.langTotal} color="bg-primary" /><Mix label={t.langUk} count={view.languageMix.uk} total={view.langTotal} color="bg-yellow-500" /><Mini label="Recurring themes" value={String(view.recurringThemes)} helper="theme clusters repeated" /></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="border-border/60 bg-card/60 backdrop-blur"><CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-xl"><TrendingUp className="h-5 w-5 text-primary" />Observed Funnel</CardTitle></CardHeader><CardContent className="space-y-3"><Funnel label="Signals" value={view.currentSignals} percent={100} /><Funnel label="Ideas shipped" value={view.currentIdeas} percent={view.currentSignals > 0 ? Math.min(Math.round((view.currentIdeas / view.currentSignals) * 25), 100) : 0} /><Funnel label="New users" value={view.currentUsersCount} percent={view.currentSignals > 0 ? Math.min(Math.round((view.currentUsersCount / view.currentSignals) * 100), 100) : 0} /><Funnel label="Activation" value={view.conversion} percent={view.conversion} suffix="%" /></CardContent></Card>
        <Card className="border-border/60 bg-card/60 backdrop-blur"><CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-xl"><Search className="h-5 w-5 text-primary" />Topic Pressure</CardTitle></CardHeader><CardContent className="space-y-4">{view.topTopics.length === 0 ? <Empty label="No topic signals yet." /> : view.topTopics.map((topic, index) => <Topic key={topic.label} label={topic.label} percent={Math.round((topic.count / Math.max(view.filteredActions.length, 1)) * 100)} color={index === 0 ? "bg-primary" : index === 1 ? "bg-blue-500" : "bg-muted-foreground/30"} />)}</CardContent></Card>
        <Card className="border-primary/20 bg-primary/10 backdrop-blur"><CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-xl text-primary"><Database className="h-5 w-5" />Operator Snapshot</CardTitle></CardHeader><CardContent className="space-y-4 text-sm"><Row label="Data source" value={dataSource === "server" ? "Secure route" : "Client analytics fallback"} /><Row label="Search filter" value={search.trim() ? `Filtered by \"${search.trim()}\"` : "No search filter"} /><Row label="Window" value={view.selected.label} /><Row label="Language" value={langFilter === "all" ? "All languages" : langFilter.toUpperCase()} /><Row label="Feed density" value={`${view.filteredActions.length} tracked rows`} /></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2 border-border/60 bg-card/60 backdrop-blur"><CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-xl"><Clock3 className="h-5 w-5 text-primary" />Filtered Feed</CardTitle></CardHeader><CardContent className="space-y-3">{view.filteredActions.length === 0 ? <Empty label="No actions match the selected filters." /> : view.filteredActions.slice().reverse().map((item) => <div key={item.id} className="flex flex-col gap-3 rounded-2xl border border-border/40 bg-secondary/10 p-4 md:flex-row md:items-center md:justify-between"><div className="flex items-start gap-3"><div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-xs font-bold uppercase text-primary">{item.lang || "--"}</div><div className="min-w-0 space-y-1"><p className="truncate text-sm font-semibold text-foreground">{item.theme || t.systemAction}</p><p className="text-xs text-muted-foreground">{item.count || 0} {t.itemsGenerated}</p></div></div><div className="text-xs text-muted-foreground">{formatTime(item.timestamp)}</div></div>)}</CardContent></Card>
        <Card className="border-border/60 bg-card/60 backdrop-blur"><CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-xl"><Users className="h-5 w-5 text-primary" />Signup Radar</CardTitle></CardHeader><CardContent className="space-y-3">{view.currentUsers.length === 0 ? <Empty label="No signups in this window." /> : view.currentUsers.slice().reverse().map((item) => <div key={item.id} className="rounded-2xl border border-border/40 bg-secondary/10 p-4"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-sm font-bold text-primary">{item.email[0]?.toUpperCase() || "?"}</div><div className="min-w-0"><p className="truncate text-sm font-semibold">{item.email}</p><p className="text-xs text-muted-foreground">{formatTime(item.createdAt)}</p></div></div></div>)}</CardContent></Card>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2 border-border/60 bg-card/60 backdrop-blur">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-xl"><Search className="h-5 w-5 text-primary" />Generation Review Feed</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {reviewView.items.length === 0 ? <Empty label="No review records match the selected filters." /> : reviewView.items.map((item) => <ReviewFeedCard key={item.id} item={item} formatTime={formatTime} />)}
          </CardContent>
        </Card>
        <Card className="border-border/60 bg-card/60 backdrop-blur">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-xl"><Database className="h-5 w-5 text-primary" />Review Domains</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {reviewView.topDomains.length === 0 ? <Empty label="No review domains yet." /> : reviewView.topDomains.map((topic, index) => <Topic key={topic.label} label={topic.label.replaceAll("_", " ")} percent={Math.round((topic.count / Math.max(stats.reviews.total, 1)) * 100)} color={index === 0 ? "bg-primary" : index === 1 ? "bg-blue-500" : "bg-muted-foreground/30"} />)}
            <Mini label="Recent review rows" value={String(reviewView.items.length)} helper="filtered review samples" />
            <Mini label="Pending backlog" value={String(stats.reviews.pending)} helper="needs manual grading" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Badge({ title, value }: { title: string; value: string }) { return <div className="rounded-2xl border border-primary/20 bg-primary/10 px-4 py-3 text-primary"><div className="text-[11px] uppercase tracking-[0.18em] opacity-70">{title}</div><div className="mt-1 text-sm font-semibold">{value}</div></div>; }
function Metric({ title, value, subtitle, icon, series }: { title: string; value: string; subtitle: string; icon: React.ReactNode; series?: number[] }) { return <Card className="overflow-hidden border-border/60 bg-gradient-to-br from-white/5 to-transparent backdrop-blur"><CardContent className="p-5"><div className="flex items-start justify-between gap-4"><div className="space-y-2"><p className="text-sm text-muted-foreground">{title}</p><p className="text-3xl font-black tracking-tight font-space-grotesk">{value}</p><p className="text-xs text-muted-foreground">{subtitle}</p></div><div className="rounded-2xl border border-white/10 bg-white/5 p-3">{icon}</div></div>{series && series.length > 1 ? <div className="mt-5"><Sparkline values={series} /></div> : null}</CardContent></Card>; }
function Mini({ label, value, helper }: { label: string; value: string; helper: string }) { return <div className="rounded-2xl border border-border/40 bg-secondary/10 p-4"><div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{label}</div><div className="mt-2 text-2xl font-bold font-space-grotesk">{value}</div><div className="mt-1 text-xs text-muted-foreground">{helper}</div></div>; }
function Sparkline({ values }: { values: number[] }) { const max = Math.max(...values, 1); const min = Math.min(...values, 0); const width = 240; const height = 48; const points = values.map((value, index) => { const x = values.length === 1 ? width / 2 : (index / (values.length - 1)) * width; const y = height - ((value - min) / Math.max(max - min, 1)) * (height - 8) - 4; return `${x},${y}`; }).join(" "); return <svg viewBox={`0 0 ${width} ${height}`} className="h-12 w-full"><polyline fill="none" stroke="currentColor" strokeWidth="3" points={points} className="text-primary" strokeLinecap="round" strokeLinejoin="round" /></svg>; }
function CompareChart({ current, previous }: { current: number[]; previous: number[] }) { if (current.length === 0 && previous.length === 0) return <Empty label="No activity points yet." />; const values = [...current, ...previous]; const max = Math.max(...values, 1); const min = Math.min(...values, 0); const width = 560; const height = 220; const line = (series: number[]) => series.map((value, index) => { const x = series.length === 1 ? width / 2 : (index / Math.max(series.length - 1, 1)) * width; const y = height - ((value - min) / Math.max(max - min, 1)) * (height - 40) - 20; return `${x},${y}`; }).join(" "); return <div className="rounded-3xl border border-border/40 bg-[linear-gradient(180deg,rgba(168,85,247,0.12),rgba(168,85,247,0.02))] p-4"><svg viewBox={`0 0 ${width} ${height}`} className="h-56 w-full">{[0,1,2,3].map((row) => <line key={row} x1="0" y1={20 + row * 50} x2={width} y2={20 + row * 50} stroke="rgba(255,255,255,0.08)" strokeDasharray="4 6" />)}{previous.length > 0 ? <polyline points={line(previous)} fill="none" stroke="rgba(96,165,250,0.8)" strokeWidth="3" strokeDasharray="8 8" strokeLinecap="round" strokeLinejoin="round" /> : null}{current.length > 0 ? <polyline points={line(current)} fill="none" stroke="rgba(216,180,254,1)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" /> : null}</svg><div className="mt-3 flex items-center justify-between text-xs text-muted-foreground"><span>Previous window</span><span>Current window</span></div></div>; }
function Funnel({ label, value, percent, suffix = "" }: { label: string; value: number; percent: number; suffix?: string }) { return <div className="space-y-2"><div className="flex items-center justify-between text-sm"><span>{label}</span><span className="font-semibold">{value}{suffix}</span></div><div className="h-2.5 rounded-full bg-secondary/30"><div className="h-full rounded-full bg-primary transition-all duration-700" style={{ width: `${percent}%` }} /></div></div>; }
function Topic({ label, percent, color }: { label: string; percent: number; color: string }) { return <div className="space-y-2"><div className="flex items-center justify-between gap-3 text-sm"><span className="truncate font-medium capitalize">{label}</span><span className="text-xs text-muted-foreground">{percent}%</span></div><div className="h-2.5 w-full rounded-full bg-secondary/30"><div className={`${color} h-full rounded-full transition-all duration-700`} style={{ width: `${percent}%` }} /></div></div>; }
function Mix({ label, count, total, color }: { label: string; count: number; total: number; color: string }) { const percent = total > 0 ? Math.round((count / total) * 100) : 0; return <div className="space-y-1.5"><div className="flex items-center justify-between text-xs"><span>{label}</span><span className="text-muted-foreground">{count} ({percent}%)</span></div><div className="h-2 w-full rounded-full bg-secondary/30"><div className={`${color} h-full rounded-full transition-all duration-700`} style={{ width: `${percent}%` }} /></div></div>; }
function Row({ label, value }: { label: string; value: string }) { return <div className="rounded-2xl border border-primary/15 bg-background/30 p-3"><div className="text-[11px] uppercase tracking-[0.18em] text-primary/80">{label}</div><div className="mt-1 text-sm text-foreground">{value}</div></div>; }
function Empty({ label }: { label: string }) { return <div className="rounded-2xl border border-dashed border-border/40 bg-secondary/10 px-4 py-8 text-center text-sm text-muted-foreground">{label}</div>; }
function ReviewFeedCard({ item, formatTime }: { item: ReviewRecord; formatTime: (ts: string | Date | undefined) => string }) {
  const statusTone = item.reviewStatus === "error" ? "border-rose-500/20 bg-rose-500/10 text-rose-200" : item.reviewStatus === "approved" ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-200" : item.reviewStatus === "flagged" ? "border-amber-500/20 bg-amber-500/10 text-amber-100" : "border-primary/20 bg-primary/10 text-primary";
  return <div className="rounded-2xl border border-border/40 bg-secondary/10 p-4 space-y-3">
    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
      <div className="min-w-0 space-y-1">
        <p className="truncate text-sm font-semibold text-foreground">{item.theme || "Untitled generation"}</p>
        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          <span className="rounded-full border border-border/40 px-2 py-1">{item.domain.replaceAll("_", " ")}</span>
          <span className="rounded-full border border-border/40 px-2 py-1">{item.lang || "--"}</span>
          <span className="rounded-full border border-border/40 px-2 py-1">{item.source}</span>
        </div>
      </div>
      <div className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase ${statusTone}`}>{item.reviewStatus}</div>
    </div>
    {item.error ? <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-xs text-rose-100">{item.error}</div> : null}
    {item.ideas && item.ideas.length > 0 ? <div className="space-y-2">{item.ideas.slice(0, 3).map((idea) => <div key={`${item.id}-${idea.name}`} className="rounded-2xl border border-border/40 bg-background/30 p-3"><div className="text-sm font-medium text-foreground">{idea.name}</div><div className="mt-1 line-clamp-2 text-xs text-muted-foreground">{idea.description}</div></div>)}</div> : null}
    {item.reviewTags.length > 0 ? <div className="flex flex-wrap gap-2">{item.reviewTags.map((tag) => <span key={`${item.id}-${tag}`} className="rounded-full border border-border/40 px-2 py-1 text-[11px] text-muted-foreground">{tag}</span>)}</div> : null}
    <div className="text-xs text-muted-foreground">{formatTime(item.createdAt)}</div>
  </div>;
}
