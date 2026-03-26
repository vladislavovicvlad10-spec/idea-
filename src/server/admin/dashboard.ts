import { adminDb } from "@/firebase/admin";
import { DashboardStats, ActivityAction, ReviewRecord, ReviewSummary, UserData, TopicStat } from "@/lib/types/dashboard";
import type { QueryDocumentSnapshot } from "firebase-admin/firestore";

const AGGR_LIMIT = 500;
const RECENT_ACTIONS_LIMIT = 60;
const RECENT_USERS_LIMIT = 12;
const REVIEW_LIMIT = 30;

function normalizeDate(value: unknown): string {
  if (!value) return new Date(0).toISOString();
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string") return value;
  if (typeof value === "object" && value !== null && "toDate" in value && typeof (value as { toDate?: () => Date }).toDate === "function") {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }
  return new Date(0).toISOString();
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const usersRef = adminDb.collection("users");
  const activityRef = adminDb.collection("activity_logs");
  const reviewsRef = adminDb.collection("generation_reviews");

  const [usersSnap, recentUsersSnap, recentActivityAggSnap, recentActionsSnap, reviewsSnap] = await Promise.all([
    usersRef.get(),
    usersRef.orderBy("createdAt", "desc").limit(RECENT_USERS_LIMIT).get(),
    activityRef.orderBy("timestamp", "desc").limit(AGGR_LIMIT).get(),
    activityRef.orderBy("timestamp", "desc").limit(RECENT_ACTIONS_LIMIT).get(),
    reviewsRef.orderBy("createdAt", "desc").limit(REVIEW_LIMIT).get(),
  ]);

  let totalIdeas = 0;
  const themes: Record<string, number> = {};
  const langs: Record<"ru" | "en" | "uk", number> = { ru: 0, en: 0, uk: 0 };

  recentActivityAggSnap.forEach((docSnap: QueryDocumentSnapshot) => {
    const data = docSnap.data();
    totalIdeas += data.count || 0;

    if (typeof data.theme === "string" && data.theme.trim()) {
      const term = data.theme.trim().toLowerCase();
      themes[term] = (themes[term] || 0) + 1;
    }

    if (data.lang === "ru" || data.lang === "en" || data.lang === "uk") {
      const langValue = data.lang as "ru" | "en" | "uk";
      langs[langValue]++;
    } else {
      langs.ru++;
    }
  });

  const topTopics: TopicStat[] = Object.entries(themes)
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const recentUsers: UserData[] = recentUsersSnap.docs.map((docSnap: QueryDocumentSnapshot) => {
    const data = docSnap.data();
    return {
      id: docSnap.id,
      email: typeof data.email === "string" ? data.email : "",
      createdAt: typeof data.createdAt === "string" ? data.createdAt : normalizeDate(data.createdAt),
    };
  });

  const recentActions: ActivityAction[] = recentActionsSnap.docs.map((docSnap: QueryDocumentSnapshot) => {
    const data = docSnap.data();
    return {
      id: docSnap.id,
      type: data.type,
      theme: data.theme,
      count: data.count,
      lang: data.lang,
      timestamp: normalizeDate(data.timestamp),
    };
  });

  const domainCounts: Record<string, number> = {};
  let pending = 0;
  let failed = 0;
  let approved = 0;
  let flagged = 0;

  const recentReviews: ReviewRecord[] = reviewsSnap.docs.map((docSnap: QueryDocumentSnapshot) => {
    const data = docSnap.data();
    const domain = typeof data.domain === "string" && data.domain.trim() ? data.domain : "general";
    const reviewStatus = typeof data.reviewStatus === "string" && data.reviewStatus.trim() ? data.reviewStatus : "pending";

    domainCounts[domain] = (domainCounts[domain] || 0) + 1;
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

  const reviews: ReviewSummary = {
    total: reviewsSnap.size,
    pending,
    failed,
    approved,
    flagged,
    byDomain: Object.entries(domainCounts)
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6),
    recent: recentReviews,
  };

  const engagement = usersSnap.size > 0 ? (recentActivityAggSnap.size / usersSnap.size) * 20 : 0;

  return {
    totalUsers: usersSnap.size,
    totalIdeas,
    recentActions,
    recentUsers,
    topTopics,
    langDistribution: langs,
    conversionRate: Math.min(Math.round(engagement), 100),
    reviews,
  };
}
