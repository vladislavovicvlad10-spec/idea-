import { z } from "genkit";
import { generateWithRotation } from "../genkit";

const OutputSchema = z.object({
  steps: z.array(z.object({
    title: z.string(),
    description: z.string()
  }))
});

export const suggestTechStackFlow = async (input: { name: string; description: string; features: string[] }) => {
  return generateWithRotation(async (ai, model) => {
    const result = await ai.generate({
      model: model,
      prompt: `Ты — опытный CTO. Спроектируй технический фундамент и дорожную карту для стартапа: "${input.name}".
    Описание: ${input.description}.
    
    СОЗДАЙ 5 КОНКРЕТНЫХ ШАГОВ (Заголовки должны быть короткими и мощными):
    1. Core Stack: Выбери основной стек (Frontend/Backend/DB) с коротким обоснованием. Предлагай только современные и масштабируемые решения (Next.js, FastAPI, Node.js, Go, PostgreSQL, Redis и т.д.).
    2. Infrastructure: Облако, контейнеризация и CI/CD (Docker, AWS/GCP, GitHub Actions).
    3. AI Engine: Как именно реализовать интеллект (OpenAI API, локальные модели через Ollama, LangChain, вектроные базы типа Pinecone).
    4. Data & Architecture: Опиши архитектурный паттерн (микросервисы, монолит, serverless).
    5. MVP Milestone: Главная техническая цель первого релиза.

    СТИЛЬ: Технический, четкий, без лишних слов. Только конкретные библиотеки и инструменты. ЯЗЫК: Русский.`,
      config: {
        temperature: 0.6 // Снижаем температуру для большей технической точности
      },
      output: {
        schema: OutputSchema
      }
    });

    return result.output as z.infer<typeof OutputSchema>;
  }, 'ultra');
};
