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
      prompt = `You are an experienced CTO and Software Architect. Design a precise technical foundation for: "${input.name}".
    Description: ${input.description}.
    
    RESPONSE STRUCTURE (5 steps):
    1. Core Stack (FE, BE, Database)
    2. Cloud & Infrastructure (Hosting, CI/CD, Containers)
    3. AI Implementation (Be specific about models, libraries, and architecture)
    4. Scaling & Performance (Caching, Load balancing, DB optimization)
    5. Security & Compliance (Auth, Data protection, Standards)

    DEEP ARCHITECTURAL RULES (SMART CTO LOGIC): 
    - 3D GAMES: Unreal Engine 5 (C++) or Unity (C#). Local AI (Behavior Trees).
    - MULTIPLAYER: Game servers (Go/C++), WebSockets/UDP, Tick rate optimizations.
    - STRATEGY: ECS pattern for massive unit counts.
    - RPG: Database-heavy inventory systems, Quest/Dialogue graph engines.
    - B2B SAAS: Multi-tenancy, Row-level security in DB, Stripe integration.
    - MARKETPLACE: ElasticSearch/Algolia for search, Redis for real-time inventory.
    - CONTENT/STREAMING: CDN (CloudFront), HLS/DASH, Edge functions for low latency.
    - FINTECH: PostgreSQL (ACID), PCI-DSS, double-entry bookkeeping logic.
    - AI APPS: RAG architecture (Vector DBs like Pinecone/Milvus), streaming LLM responses.

    STYLE: Pro-level, technical, dense. Only specific tech. LANGUAGE: English.`;
    } else if (lang === 'uk') {
      prompt = `Ти — досвідчений CTO та архітектор ПЗ. Спроектуй точний технічний фундамент для: "${input.name}".
    Опис: ${input.description}.
    
    СТРУКТУРА ВІДПОВІДІ (5 кроків):
    1. Core Stack (FE, BE, БД)
    2. Cloud & Infrastructure (Хостинг, CI/CD, контейнери)
    3. AI Implementation (Конкретні моделі, бібліотеки, архітектура)
    4. Scaling & Performance (Кешування, балансування, оптимізація БД)
    5. Security & Compliance (Автентифікація, захист даних, стандарти)

    ГЛИБОКІ АРХІТЕКТУРНІ ПРАВИЛА (SMART CTO LOGIC):
    - 3D ІГРИ: Unreal Engine 5 (C++) або Unity (C#). Локальний ШІ (Behavior Trees).
    - МУЛЬТИПЛЕЄР: Game servers (Go/C++), WebSockets/UDP, Tick rate.
    - СТРАТЕГІЇ: Патерн ECS для великої кількості юнітів.
    - RPG: Складні системи інвентарю, двигуни квестів/діалогів.
    - B2B SAAS: Multi-tenancy, Row-level security в БД, інтеграція Stripe.
    - MARKETPLACE: ElasticSearch/Algolia для пошуку, Redis для запасів у реальному часі.
    - CONTENT/STREAMING: CDN, HLS/DASH, Edge functions для низької затримки.
    - FINTECH: PostgreSQL (ACID), PCI-DSS, логіка подвійного запису.
    - AI APPS: Архітектура RAG (Vector DBs), стрімінг відповідей LLM.

    СТИЛЬ: Професійний, технічний, насичений. Тільки конкретні технології. МОВА: Українська.`;
    } else {
      prompt = `Ты — опытный CTO и системный архитектор. Спроектируй точный технический фундамент для: "${input.name}".
    Описание: ${input.description}.
    
    СТРУКТУРА ОТВЕТА (5 шагов):
    1. Core Stack (FE, BE, БД)
    2. Cloud & Infrastructure (Хостинг, CI/CD, контейнеры)
    3. AI Implementation (Конкретные модели, библиотеки, архитектура)
    4. Scaling & Performance (Кеширование, балансировка, оптимизация БД)
    5. Security & Compliance (Аутентификация, защита данных, стандарты)

    ГЛУБОКИЕ АРХИТЕКТУРНЫЕ ПРАВИЛА (SMART CTO LOGIC):
    - 3D ИГРЫ: Unreal Engine 5 (C++) или Unity (C#). Локальный ИИ (Behavior Trees).
    - МУЛЬТИПЛЕЕР: Game servers (Go/C++), WebSockets/UDP, оптимизация Tick rate.
    - СТРАТЕГИИ: Паттерн ECS для огромного количества юнитов.
    - RPG: Сложные системы инвентаря, движки квестов и диалоговых графов.
    - B2B SAAS: Multi-tenancy, Row-level security в БД, интеграция Stripe.
    - MARKETPLACE: ElasticSearch/Algolia для поиска, Redis для складских остатков в реальном времени.
    - CONTENT/STREAMING: CDN (CloudFront), HLS/DASH, Edge functions для минимальной задержки.
    - FINTECH: PostgreSQL (ACID), PCI-DSS, логика двойной записи.
    - AI APPS: RAG архитектура (Vector DBs), стриминг ответов LLM.

    STYLE: Профессиональный, технический, насыщенный. Только конкретные технологии. ЯЗЫК: Русский.`;
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
