import { genkit, Genkit } from "genkit";
import groq from "genkitx-groq";
import { googleAI } from "@genkit-ai/googleai";

// Ключи из .env.local
const getGroqKeys = () => {
  const keysStr = process.env.GROQ_API_KEYS || "";
  return keysStr.split(",").map(k => k.trim()).filter(k => k.length > 0);
};

const geminiKey = process.env.GEMINI_API_KEY || "";
const groqKeys = getGroqKeys();

// Используем глобальные переменные, чтобы избежать утечек памяти при перезагрузке кода (HMR)
const globalForGenkit = global as unknown as {
  groqInstances?: Genkit[];
  geminiInstance?: Genkit | null;
};

// Инициализируем инстансы только если их еще нет
if (!globalForGenkit.groqInstances) {
  globalForGenkit.groqInstances = groqKeys.map(key =>
    genkit({
      plugins: [groq({ apiKey: key })],
    })
  );
}

if (globalForGenkit.geminiInstance === undefined) {
  globalForGenkit.geminiInstance = geminiKey ? genkit({
    plugins: [googleAI({ apiKey: geminiKey })],
  }) : null;
}

const groqInstances = globalForGenkit.groqInstances!;
const geminiInstance = globalForGenkit.geminiInstance;

export let currentKeyIndex = 0;

interface AIError {
  message?: string;
  status?: number;
}

function isRateLimitError(error: unknown): boolean {
  const err = error as AIError;
  const msg = err?.message?.toLowerCase() || "";
  return msg.includes("429") || msg.includes("too many requests") || msg.includes("rate limit");
}

/**
 * Режим ULTRA: Используем топовую Llama-4 Scout как основной движок.
 */
export async function generateWithRotation<T>(
  generateFn: (ai: Genkit, model: string) => Promise<T>,
  priority: 'ultra' | 'fast' = 'ultra'
): Promise<T> {
  
  const tryGroqModel = async (modelName: string): Promise<T> => {
    let retries = 0;
    while (retries < groqInstances.length) {
      try {
        const ai = groqInstances[currentKeyIndex];
        console.log(`[Llama-4 Mode] Пробуем Groq [${modelName}] (Ключ #${currentKeyIndex + 1})...`);
        return await generateFn(ai, `groq/${modelName}`);
      } catch (error) {
        if (isRateLimitError(error)) {
          currentKeyIndex = (currentKeyIndex + 1) % groqInstances.length;
          retries++;
        } else {
          // Выводим реальную причину ошибки для диагностики
          const errMsg = error instanceof Error ? error.message : String(error);
          console.error(`[AI ERROR] Groq [${modelName}] сломался: ${errMsg}`);
          throw error;
        }
      }
    }
    throw new Error(`${modelName} недоступна`);
  };

  const tryGeminiPro = async (): Promise<T> => {
    if (!geminiInstance) throw new Error("Gemini не настроен");
    console.log(`[Llama-4 Mode] Фоллбэк на Google Gemini 1.5 PRO...`);
    return await generateFn(geminiInstance, "googleai/gemini-1.5-pro");
  };

  if (priority === 'ultra') {
    try {
      // 1. СТАРТУЕМ С LLAMA-4 SCOUT (то, что просил юзер)
      return await tryGroqModel("meta-llama/llama-4-scout-17b-16e-instruct");
    } catch {
      console.warn("Llama-4 занята или под лимитами, идем в Gemini PRO...");
      try {
        // 2. ФОЛЛБЭК НА GEMINI PRO
        return await tryGeminiPro();
      } catch {
        console.warn("Gemini PRO тоже недоступна, берем Llama-3.3...");
        // 3. ФОНОВЫЙ ВАРИАНТ
        return await tryGroqModel("llama-3.3-70b-versatile");
      }
    }
  } else {
    try {
      if (!geminiInstance) return await tryGroqModel("llama-3.1-8b-instant");
      return await generateFn(geminiInstance, "googleai/gemini-1.5-flash");
    } catch {
      return await tryGroqModel("llama-3.1-8b-instant");
    }
  }
}
