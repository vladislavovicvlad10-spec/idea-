import { genkit, Genkit } from "genkit";
import groq from "genkitx-groq";

export const RATE_LIMIT_ALL_ENGINES = "RATE_LIMIT_ALL_ENGINES";
export const AI_CONFIG_MISSING = "AI_CONFIG_MISSING";

const getGroqKeys = () => {
  const keysStr = process.env.GROQ_API_KEYS || "";
  return keysStr.split(",").map((key) => key.trim()).filter((key) => key.length > 0);
};

const groqKeys = getGroqKeys();

const globalForGenkit = global as unknown as {
  groqInstances?: Genkit[];
};

if (!globalForGenkit.groqInstances) {
  globalForGenkit.groqInstances = groqKeys.map((key) =>
    genkit({
      plugins: [groq({ apiKey: key })],
    })
  );
}

const groqInstances = globalForGenkit.groqInstances!;

export let currentKeyIndex = Math.floor(Math.random() * Math.max(groqInstances.length, 1));

interface AIError {
  message?: string;
}

function isRateLimitError(error: unknown): boolean {
  const err = error as AIError;
  const msg = err?.message?.toLowerCase() || "";
  return msg.includes("429") || msg.includes("too many requests") || msg.includes("rate limit");
}

export async function generateWithRotation<T>(
  generateFn: (ai: Genkit, model: string) => Promise<T>,
  modelName = "llama-3.3-70b-versatile"
): Promise<T> {
  if (groqInstances.length === 0) {
    throw new Error(AI_CONFIG_MISSING);
  }
  let retries = 0;
  let sawRateLimit = false;

  while (retries < groqInstances.length) {
    try {
      const ai = groqInstances[currentKeyIndex];
      console.log(
        `[AI MODE] Key #${currentKeyIndex + 1}/${groqInstances.length} | Model: ${modelName} | Attempt: ${retries + 1}`
      );

      return await generateFn(ai, `groq/${modelName}`);
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      const isRateLimit = isRateLimitError(error);
      sawRateLimit = sawRateLimit || isRateLimit;

      if (isRateLimit) {
        console.warn(`[AI MODE] Key #${currentKeyIndex + 1} RATE LIMIT on ${modelName}. Rotating...`);
      } else {
        console.error(`[AI ERROR] Groq [${modelName}] failed on Key #${currentKeyIndex + 1}: ${errMsg}`);
      }

      currentKeyIndex = (currentKeyIndex + 1) % groqInstances.length;
      retries++;

      if (retries >= groqInstances.length) {
        console.error(`[CRITICAL] All ${groqInstances.length} keys exhausted or failed for ${modelName}.`);
        throw new Error(
          sawRateLimit
            ? RATE_LIMIT_ALL_ENGINES
            : `AI error: ${errMsg}. We tried all configured keys.`
        );
      }
    }
  }

  throw new Error(`${modelName} is unavailable.`);
}
