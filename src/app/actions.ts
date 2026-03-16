"use server";

import { generateAppIdeasFlow } from "@/ai/flows/generate-app-ideas-flow";
import { detailAppIdeaFlow } from "@/ai/flows/detail-app-idea-flow";
import { suggestTechStackFlow } from "@/ai/flows/suggest-tech-stack-flow";

import { db } from "@/firebase";
import { collection, addDoc, serverTimestamp, doc, updateDoc, increment, setDoc, getDoc } from "firebase/firestore";
import { headers } from "next/headers";

// Global map for simple rate limiting (resets on server restart/cold start)
const globalRateLimit = new Map<string, { count: number, resetTime: number }>();

function checkRateLimit(ip: string, limit: number = 3, windowMs: number = 60000): boolean {
  const now = Date.now();
  const record = globalRateLimit.get(ip);
  if (!record || now > record.resetTime) {
    globalRateLimit.set(ip, { count: 1, resetTime: now + windowMs });
    return true;
  }
  if (record.count >= limit) return false;
  record.count++;
  return true;
}

export async function getIdeasAction(theme: string, lang?: string) {
  try {
    const ip = ((await headers()).get("x-forwarded-for") ?? "unknown").split(",")[0].trim();
    if (!checkRateLimit(ip, 10, 60000 * 5)) { // max 10 requests per 5 minutes
      return { success: false, error: "Вы превысили лимит генераций. Пожалуйста, подождите немного." };
    }

    const result = await generateAppIdeasFlow({ themeOrKeywords: theme, lang });

    // Log the activity and increment global stats
    try {
      // Log individual generation
      await addDoc(collection(db, "activity_logs"), {
        type: "generation",
        theme,
        lang: lang || "ru",
        timestamp: serverTimestamp(),
        count: result.ideas.length
      });

      // Increment global counter (atomic)
      const statsRef = doc(db, "stats", "global");
      const statsDoc = await getDoc(statsRef);

      if (!statsDoc.exists()) {
        await setDoc(statsRef, { totalGenerations: result.ideas.length });
      } else {
        await updateDoc(statsRef, {
          totalGenerations: increment(result.ideas.length)
        });
      }
    } catch {
      // Молча игнорируем ошибки прав доступа в логах
    }

    return { success: true, data: result.ideas };
  } catch (err) {
    console.error("GENKIT_ERROR:", err);
    let errorMessage = "Неизвестная ошибка";
    if (err instanceof Error) {
      if (err.message.includes("429")) {
        errorMessage = "Лимит запросов исчерпан для текущего ключа. Попробуйте еще раз прямо сейчас — система автоматически переключится на другой ключ.";
      } else if (err.message.includes("404")) {
        errorMessage = "Модель ИИ не найдена или недоступна в вашем регионе.";
      } else {
        errorMessage = err.message;
      }
    }
    return { success: false, error: errorMessage };
  }
}



export async function detailIdeaAction(idea: { name: string, description: string, features: string[] }) {
  try {
    const ip = ((await headers()).get("x-forwarded-for") ?? "unknown").split(",")[0].trim();
    if (!checkRateLimit(ip, 15, 60000 * 5)) return { success: false, error: "Лимит запросов исчерпан." };

    const result = await detailAppIdeaFlow(idea);
    return { success: true, data: result };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Ошибка при получении деталей" };
  }
}

export async function suggestTechStackAction(idea: { name: string, description: string, features: string[] }) {
  try {
    const ip = ((await headers()).get("x-forwarded-for") ?? "unknown").split(",")[0].trim();
    if (!checkRateLimit(ip, 15, 60000 * 5)) return { success: false, error: "Лимит запросов исчерпан." };

    const result = await suggestTechStackFlow(idea);
    return { success: true, data: result };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Ошибка при подборе стека" };
  }
}
