import { genkit, Genkit } from "genkit";
import groq from "genkitx-groq";

// Ключи из .env.local
const getGroqKeys = () => {
  const keysStr = process.env.GROQ_API_KEYS || "";
  return keysStr.split(",").map(k => k.trim()).filter(k => k.length > 0);
};


const groqKeys = getGroqKeys();

// Используем глобальные переменные, чтобы избежать утечек памяти при перезагрузке кода (HMR)
const globalForGenkit = global as unknown as {
  groqInstances?: Genkit[];
};

// Инициализируем инстансы только если их еще нет
if (!globalForGenkit.groqInstances) {
  globalForGenkit.groqInstances = groqKeys.map(key =>
    genkit({
      plugins: [groq({ apiKey: key })],
    })
  );
}



const groqInstances = globalForGenkit.groqInstances!;

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
  generateFn: (ai: Genkit, model: string) => Promise<T>
): Promise<T> {
  


  const tryGroqModel = async (modelName: string): Promise<T> => {
    let retries = 0;
    while (retries < groqInstances.length) {
      try {
        const ai = groqInstances[currentKeyIndex];
        console.log(`[Llama-4 Full Mode] Пытаемся вызвать Groq [${modelName}] через ключ #${currentKeyIndex + 1}...`);
        return await generateFn(ai, `groq/${modelName}`);
      } catch (error) {
        if (isRateLimitError(error)) {
          console.warn(`[Llama-4 Full Mode] Ключ #${currentKeyIndex + 1} под лимитом, пробуем следующий...`);
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
    throw new Error(`${modelName} недоступна из-за лимитов на всех ключах.`);
  };

  return await tryGroqModel("meta-llama/llama-4-scout-17b-16e-instruct");
}

