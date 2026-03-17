import { z } from "genkit";
import { generateWithRotation } from "../genkit";

const OutputSchema = z.object({
  steps: z.array(z.object({
    title: z.string(),
    description: z.string()
  }))
});

export const suggestTechStackFlow = async (input: { name: string; description: string; features: string[]; lang?: string }) => {
  return generateWithRotation(async (ai, model) => {
    const lang = input.lang || 'ru';

    let prompt: string;

    if (lang === 'en') {
      prompt = `You are an experienced CTO. Design the technical foundation and roadmap for the startup: "${input.name}".
    Description: ${input.description}.
    
    CREATE 5 SPECIFIC STEPS (Headings should be short and powerful):
    1. Core Stack: Choose the main stack (Frontend/Backend/DB) with a short rationale. Suggest only modern and scalable solutions (Next.js, FastAPI, Node.js, Go, PostgreSQL, Redis, etc.).
    2. Infrastructure: Cloud, containerization, and CI/CD (Docker, AWS/GCP, GitHub Actions).
    3. AI Engine: How exactly to implement intelligence (OpenAI API, local models via Ollama, LangChain, vector bases like Pinecone).
    4. Data & Architecture: Describe the architectural pattern (microservices, monolith, serverless).
    5. MVP Milestone: The main technical goal of the first release.

    STYLE: Technical, clear, without extra words. Only specific libraries and tools. LANGUAGE: English.`;
    } else if (lang === 'uk') {
      prompt = `Ти — досвідчений CTO. Спроектуй технічний фундамент і дорожню карту для стартапу: "${input.name}".
    Опис: ${input.description}.
    
    СТВОРИ 5 КОНКРЕТНИХ КРОКІВ (Заголовки мають бути короткими і потужними):
    1. Core Stack: Обери основний стек (Frontend/Backend/DB) з коротким обґрунтуванням. Пропонуй лише сучасні та масштабовані рішення (Next.js, FastAPI, Node.js, Go, PostgreSQL, Redis тощо).
    2. Infrastructure: Хмара, контейнеризація та CI/CD (Docker, AWS/GCP, GitHub Actions).
    3. AI Engine: Як саме реалізувати інтелект (OpenAI API, локальні моделі через Ollama, LangChain, векторні бази типу Pinecone).
    4. Data & Architecture: Опиши архітектурний паттерн (мікросервіси, моноліт, serverless).
    5. MVP Milestone: Головна технічна ціль першого релізу.

    СТИЛЬ: Технічний, чіткий, без зайвих слів. Тільки конкретні бібліотеки та інструменти. МОВА: Українська.`;
    } else {
      prompt = `Ты — опытный CTO. Спроектируй технический фундамент и дорожную карту для стартапа: "${input.name}".
    Описание: ${input.description}.
    
    СОЗДАЙ 5 КОНКРЕТНЫХ ШАГОВ (Заголовки должны быть короткими и мощными):
    1. Core Stack: Выбери основной стек (Frontend/Backend/DB) с коротким обоснованием. Предлагай только современные и масштабируемые решения (Next.js, FastAPI, Node.js, Go, PostgreSQL, Redis и т.д.).
    2. Infrastructure: Облако, контейнеризация и CI/CD (Docker, AWS/GCP, GitHub Actions).
    3. AI Engine: Как именно реализовать интеллект (OpenAI API, локальные модели через Ollama, LangChain, вектроные базы типа Pinecone).
    4. Data & Architecture: Опиши архитектурный паттерн (микросервисы, монолит, serverless).
    5. MVP Milestone: Главная техническая цель первого релиза.

    STYLE: Технический, четкий, без лишних слов. Только конкретные библиотеки и инструменты. ЯЗЫК: Русский.`;
    }

    const result = await ai.generate({
      model: model,
      prompt: prompt,
      config: {
        temperature: 0.6
      },
      output: {
        schema: OutputSchema
      }
    });

    return result.output as z.infer<typeof OutputSchema>;
  });
};
