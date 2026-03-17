"use server";

import { generateAppIdeasFlow } from "@/ai/flows/generate-app-ideas-flow";
import { detailAppIdeaFlow } from "@/ai/flows/detail-app-idea-flow";
import { suggestTechStackFlow } from "@/ai/flows/suggest-tech-stack-flow";

import { db } from "@/firebase";
import {
  collection, addDoc, serverTimestamp, doc, updateDoc,
  increment, setDoc, getDoc, runTransaction, Timestamp
} from "firebase/firestore";
import { headers } from "next/headers";
import { translations } from "@/lib/translations";

// ──────────────────────────────────────────────
// Admin check (server-side only — not exposed to client)
// ──────────────────────────────────────────────
export async function isAdminEmail(email: string | null | undefined): Promise<boolean> {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail || !email) return false;
  return email.toLowerCase() === adminEmail.toLowerCase();
}

// ──────────────────────────────────────────────
// Rate Limiting via Firestore (persists across cold starts)
// ──────────────────────────────────────────────
async function checkRateLimitFirestore(
  ip: string,
  limit: number = 7,
  windowMs: number = 5 * 60 * 1000
): Promise<{ allowed: boolean; remainingMs: number }> {
  const now = Date.now();
  const rateLimitRef = doc(db, "rate_limits", ip.replace(/[/.]/g, "_"));

  try {
    const result = await runTransaction(db, async (transaction) => {
      const snap = await transaction.get(rateLimitRef);

      if (!snap.exists()) {
        transaction.set(rateLimitRef, {
          count: 1,
          resetAt: new Date(now + windowMs),
          updatedAt: serverTimestamp(),
        });
        return { allowed: true, remainingMs: 0 };
      }

      const data = snap.data();
      const resetAt: number = data.resetAt instanceof Timestamp
        ? data.resetAt.toDate().getTime()
        : new Date(data.resetAt).getTime();

      if (now > resetAt) {
        // Window expired — reset
        transaction.update(rateLimitRef, {
          count: 1,
          resetAt: new Date(now + windowMs),
          updatedAt: serverTimestamp(),
        });
        return { allowed: true, remainingMs: 0 };
      }

      if (data.count >= limit) {
        return { allowed: false, remainingMs: resetAt - now };
      }

      transaction.update(rateLimitRef, {
        count: increment(1),
        updatedAt: serverTimestamp(),
      });
      return { allowed: true, remainingMs: 0 };
    });

    return result;
  } catch {
    // If Firestore fails — allow the request (fail open)
    return { allowed: true, remainingMs: 0 };
  }
}

// ──────────────────────────────────────────────
// Generate Ideas Action
// ──────────────────────────────────────────────
export async function getIdeasAction(theme: string, lang?: string) {
  try {
    const ip = ((await headers()).get("x-forwarded-for") ?? "unknown").split(",")[0].trim();
    const limitInfo = await checkRateLimitFirestore(ip, 7, 60000 * 5);

    if (!limitInfo.allowed) {
      const mins = Math.ceil(limitInfo.remainingMs / 60000);
      return { success: false, error: "RATE_LIMIT", remainingMins: mins };
    }

    const result = await generateAppIdeasFlow({ themeOrKeywords: theme, lang });

    // Log the activity and increment global stats
    try {
      await addDoc(collection(db, "activity_logs"), {
        type: "generation",
        theme,
        lang: lang || "ru",
        timestamp: serverTimestamp(),
        count: result.ideas.length,
      });

      const statsRef = doc(db, "stats", "global");
      const statsDoc = await getDoc(statsRef);

      if (!statsDoc.exists()) {
        await setDoc(statsRef, { totalGenerations: result.ideas.length });
      } else {
        await updateDoc(statsRef, {
          totalGenerations: increment(result.ideas.length),
        });
      }
    } catch {
      // Silently ignore logging errors
    }

    return { success: true, data: result.ideas };
  } catch (err) {
    console.error("GENKIT_ERROR:", err);
    let errorMessage = "Неизвестная ошибка";
    if (err instanceof Error) {
      if (err.message.includes("429")) {
        errorMessage = "Лимит запросов исчерпан. Система переключится на другой ключ, попробуйте ещё раз.";
      } else if (err.message.includes("404")) {
        errorMessage = "Модель ИИ не найдена или недоступна в вашем регионе.";
      } else {
        errorMessage = err.message;
      }
    }
    return { success: false, error: errorMessage };
  }
}

// ──────────────────────────────────────────────
// Detail Idea Action
// ──────────────────────────────────────────────
export async function detailIdeaAction(
  idea: { name: string; description: string; features: string[] },
  lang?: string
) {
  try {
    const ip = ((await headers()).get("x-forwarded-for") ?? "unknown").split(",")[0].trim();
    const limitInfo = await checkRateLimitFirestore(ip, 15, 60000 * 5);

    if (!limitInfo.allowed) {
      const mins = Math.ceil(limitInfo.remainingMs / 60000);
      const currentLang = (lang as "ru" | "en" | "uk") || "ru";
      const errorMessage = translations[currentLang].rateLimitError.replace("{time}", mins.toString());
      return { success: false, error: "RATE_LIMIT", message: errorMessage };
    }

    const result = await detailAppIdeaFlow({ ...idea, lang });
    return { success: true, data: result };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Ошибка при получении деталей" };
  }
}

// ──────────────────────────────────────────────
// Suggest Tech Stack Action
// ──────────────────────────────────────────────
export async function suggestTechStackAction(
  idea: { name: string; description: string; features: string[] },
  lang?: string
) {
  try {
    const ip = ((await headers()).get("x-forwarded-for") ?? "unknown").split(",")[0].trim();
    const limitInfo = await checkRateLimitFirestore(ip, 15, 60000 * 5);

    if (!limitInfo.allowed) {
      const mins = Math.ceil(limitInfo.remainingMs / 60000);
      const currentLang = (lang as "ru" | "en" | "uk") || "ru";
      const errorMessage = translations[currentLang].rateLimitError.replace("{time}", mins.toString());
      return { success: false, error: "RATE_LIMIT", message: errorMessage };
    }

    const result = await suggestTechStackFlow({ ...idea, lang });
    return { success: true, data: result };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Ошибка при подборе стека" };
  }
}
