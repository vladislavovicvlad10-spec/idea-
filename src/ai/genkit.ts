import { genkit, Genkit } from "genkit";
import groq from "genkitx-groq";
import { googleAI } from "@genkit-ai/googleai";

// Ключи из .env.local
const getGroqKeys = () => {
  const keysStr = process.env.GROQ_API_KEYS || "";
  return keysStr.split(",").map(k => k.trim()).filter(k => k.length > 0);
};

const geminiKey = process.env.GEMINI_API_KEY || "";
const togetherKey = process.env.TOGETHER_API_KEY || "";
const togetherModel = process.env.TOGETHER_MODEL || "meta-llama/Llama-3-70b-chat-hf";
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
  
  const callTogetherAI = async (prompt: string): Promise<string> => {
    console.log(`[Together AI] Пытаемся вызвать Together AI [${togetherModel}]...`);
    const resp = await fetch("https://api.together.xyz/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${togetherKey}`
      },
      body: JSON.stringify({
        model: togetherModel,
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0.8,
        max_tokens: 4000
      })
    });
    
    if (!resp.ok) {
      const errorText = await resp.text();
      throw new Error(`Together AI Error: ${resp.status} - ${errorText}`);
    }
    
    const data = await resp.json();
    return data.choices[0].message.content;
  };

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

  try {
    return await tryGroqModel("meta-llama/llama-4-scout-17b-16e-instruct");
  } catch (error) {
    if (togetherKey) {
      console.warn(`[Llama-4 Full Mode] Все ключи Groq под лимитами, переключаемся на Together AI как фоллбэк...`);
      
      return await generateFn({
        generate: async (options: { prompt: string }) => {
          const content = await callTogetherAI(options.prompt);
          try {
            return { output: JSON.parse(content) };
          } catch {
            return { output: content };
          }
        }
      } as unknown as Genkit, "together");
    }
    throw error;
  }
}
