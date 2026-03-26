"use server";

import { headers } from "next/headers";
import { AI_CONFIG_MISSING, RATE_LIMIT_ALL_ENGINES } from "@/ai/genkit";
import { classifyDomainFlow } from "@/ai/classify-domain-flow";
import { generateAppIdeasFlow } from "@/ai/flows/generate-app-ideas-flow";
import { detailAppIdeaFlow } from "@/ai/flows/detail-app-idea-flow";
import { suggestTechStackFlow } from "@/ai/suggest-tech-stack-flow";
import { analyzeArchitectureFlow } from "@/ai/analyze-architecture-flow";
import { verifyIdeasOutput } from "@/ai/verify-output-flow";
import { translations } from "@/lib/translations";
import { logGenerationActivity } from "@/server/repos/activity";
import { logGenerationReviewFailure, logGenerationReviewSample } from "@/server/repos/generation-review";
import { checkRateLimit } from "@/server/repos/rate-limit";

type CurrentLang = "ru" | "en" | "uk";
const AI_TEMPORARY_FAILURE = "AI_TEMPORARY_FAILURE";

function getCurrentLang(lang?: string): CurrentLang {
  return (lang as CurrentLang) || "ru";
}

async function getRequestIp() {
  return ((await headers()).get("x-forwarded-for") ?? "unknown").split(",")[0].trim();
}

function getLocalizedRateLimitMessage(lang?: string, mins?: number) {
  const currentLang = getCurrentLang(lang);
  return translations[currentLang].rateLimitError.replace("{time}", String(mins ?? 1));
}

export async function getIdeasAction(theme: string, lang?: string) {
  let domain = "general";

  try {
    const ip = await getRequestIp();
    const limitInfo = await checkRateLimit({
      ip,
      actionType: "gen",
      limit: 7,
      windowMs: 60000 * 5,
    });

    if (!limitInfo.allowed) {
      const mins = Math.ceil(limitInfo.remainingMs / 60000);
      return { success: false, error: "RATE_LIMIT", remainingMins: mins };
    }

    domain = await classifyDomainFlow({ theme, lang });
    const result = await generateAppIdeasFlow({ themeOrKeywords: theme, lang, domain });
    const verified = await verifyIdeasOutput(result, lang).catch(() => result);

    try {
      await logGenerationActivity({
        theme,
        lang: lang || "ru",
        count: verified.ideas.length,
      });

      await logGenerationReviewSample({
        theme,
        lang: lang || "ru",
        domain,
        ideas: verified.ideas,
      });
    } catch {
      // Ignore logging failures so the core generation path stays responsive.
    }

    return { success: true, data: verified.ideas };
  } catch (err) {
    console.error("GENKIT_ERROR:", err);

    try {
      await logGenerationReviewFailure({
        theme,
        lang: lang || "ru",
        domain,
        error: err instanceof Error ? err.message : "Unknown error",
      });
    } catch {
      // Ignore review logging failures on the error path.
    }

    if (err instanceof Error && err.message === RATE_LIMIT_ALL_ENGINES) {
      return { success: false, error: "RATE_LIMIT_AI_GLOBAL" };
    }
    if (err instanceof Error && err.message === AI_CONFIG_MISSING) {
      return { success: false, error: "AI is not configured on the server." };
    }
    if (err instanceof Error && (err.message.startsWith("AI error:") || err.message.includes("We tried all configured keys."))) {
      return { success: false, error: AI_TEMPORARY_FAILURE };
    }
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: errorMessage };
  }
}

export async function detailIdeaAction(
  idea: { name: string; description: string; features: string[] },
  lang?: string
) {
  try {
    const ip = await getRequestIp();
    const limitInfo = await checkRateLimit({
      ip,
      actionType: "detail",
      limit: 30,
      windowMs: 60000 * 5,
    });

    if (!limitInfo.allowed) {
      const mins = Math.ceil(limitInfo.remainingMs / 60000);
      return {
        success: false,
        error: "RATE_LIMIT",
        message: getLocalizedRateLimitMessage(lang, mins),
      };
    }

    const result = await detailAppIdeaFlow({ ...idea, lang });
    return { success: true, data: result };
  } catch (err) {
    const currentLang = getCurrentLang(lang);
    const msg = translations[currentLang]?.toastError || "Error fetching details";
    return { success: false, error: err instanceof Error ? err.message : msg };
  }
}

export async function suggestTechStackAction(
  idea: { name: string; description: string; features: string[] },
  lang?: string
) {
  try {
    const ip = await getRequestIp();
    const limitInfo = await checkRateLimit({
      ip,
      actionType: "detail",
      limit: 30,
      windowMs: 60000 * 5,
    });

    if (!limitInfo.allowed) {
      const mins = Math.ceil(limitInfo.remainingMs / 60000);
      return {
        success: false,
        error: "RATE_LIMIT",
        message: getLocalizedRateLimitMessage(lang, mins),
      };
    }

    const result = await suggestTechStackFlow({ ...idea, lang });
    return {
      success: true,
      data: {
        ...result,
        steps: result.technical_steps,
        recommendedDatabase: result.recommended_database,
        backendRuntime: result.backend_runtime,
        frontendStack: result.frontend_stack,
        keyLibraries: result.key_libraries,
        infrastructureServices: result.infrastructure_services,
        backgroundJobs: result.background_jobs,
        searchStrategy: result.search_strategy,
        realtimeStrategy: result.realtime_strategy,
        storageStrategy: result.storage_strategy,
        authStrategy: result.auth_strategy,
        billingStrategy: result.billing_strategy,
        complianceNotes: result.compliance_notes,
      },
    };
  } catch (err) {
    const currentLang = getCurrentLang(lang);
    const msg = translations[currentLang]?.toastError || "Error selecting stack";
    return { success: false, error: err instanceof Error ? err.message : msg };
  }
}

export async function analyzeArchitectureAction(
  idea: { name: string; description: string; features: string[]; selectedSteps?: { title: string; description: string }[] },
  lang?: string
) {
  try {
    const ip = await getRequestIp();
    const limitInfo = await checkRateLimit({
      ip,
      actionType: "detail",
      limit: 30,
      windowMs: 60000 * 5,
    });

    if (!limitInfo.allowed) {
      const mins = Math.ceil(limitInfo.remainingMs / 60000);
      return {
        success: false,
        error: "RATE_LIMIT",
        message: getLocalizedRateLimitMessage(lang, mins),
      };
    }

    const result = await analyzeArchitectureFlow({ ...idea, lang });

    const analysisHeaders = {
      ru: { e: "Р‘РёС‚РІР° Р±Р°Р· РґР°РЅРЅС‹С…", s: "Р‘СЌРєРµРЅРґ Рё СЏР·С‹РєРё", t: "Р”РІРёР¶РѕРє Рё С„СЂРѕРЅС‚РµРЅРґ", f: "РљРѕРјРїСЂРѕРјРёСЃСЃС‹" },
      en: { e: "Database Battle", s: "Backend & Languages", t: "Engine & Frontend", f: "Architectural Trade-offs" },
      uk: { e: "Р‘РёС‚РІР° Р±Р°Р· РґР°РЅРёС…", s: "Р‘РµРєРµРЅРґ С‚Р° РјРѕРІРё", t: "Р СѓС€С–Р№ С‚Р° С„СЂРѕРЅС‚РµРЅРґ", f: "РўРµС…РЅС–С‡РЅС– РєРѕРјРїСЂРѕРјС–СЃРё" },
    };
    const currentLang = getCurrentLang(lang);
    const h = analysisHeaders[currentLang];

    const archSections = [
      { title: h.e, content: result.db_battle },
      { title: h.s, content: result.backend_war },
      { title: h.t, content: result.engine_logic },
      { title: h.f, content: result.scalability_justification },
      { title: currentLang === "en" ? "Deployment Model" : currentLang === "uk" ? "Модель деплою" : "Модель деплоя", content: result.deployment_model },
      { title: currentLang === "en" ? "Caching Strategy" : currentLang === "uk" ? "Стратегія кешу" : "Стратегия кеша", content: result.caching_strategy },
      { title: currentLang === "en" ? "Queue Strategy" : currentLang === "uk" ? "Стратегія черг" : "Стратегия очередей", content: result.queue_strategy },
      { title: currentLang === "en" ? "Observability" : currentLang === "uk" ? "Спостережуваність" : "Наблюдаемость", content: result.observability_strategy },
      { title: currentLang === "en" ? "Failure Handling" : currentLang === "uk" ? "Обробка збоїв" : "Обработка сбоев", content: result.failure_handling },
    ];

    const combinedReasoning = archSections.map((s) => `### ${s.title}\n${s.content}`).join("\n\n---\n\n");

    return {
      success: true,
      data: {
        ...result,
        steps: result.technical_steps,
        deploymentModel: result.deployment_model,
        cachingStrategy: result.caching_strategy,
        queueStrategy: result.queue_strategy,
        observabilityStrategy: result.observability_strategy,
        failureHandling: result.failure_handling,
        reasoning: combinedReasoning,
        archSections,
        bottlenecks: result.bottlenecks,
      },
    };
  } catch (err) {
    const currentLang = getCurrentLang(lang);
    const msg = translations[currentLang]?.toastError || "Error analyzing architecture";
    return { success: false, error: err instanceof Error ? err.message : msg };
  }
}
