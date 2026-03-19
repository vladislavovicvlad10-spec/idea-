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
    1. Core Stack (FE, BE, Database) - explain WHY (e.g. why PostgreSQL over MongoDB for this case).
    2. Cloud & Infrastructure (Hosting, CI/CD, Containers) - justify the choice.
    3. AI Implementation (Be specific about models, libraries, and architecture) - explain the logic.
    4. Scaling & Performance (Caching, Load balancing, DB optimization) - technical reasoning.
    5. Security & Compliance (Auth, Data protection, Standards) - why this level of security.

    DEEP ARCHITECTURAL RULES (SMART CTO LOGIC): 
    - 3D GAMES: Unreal Engine 5 (C++) or Unity (C#). Local AI (Behavior Trees).
    - MULTIPLAYER: Game servers (Go/C++), WebSockets/UDP, Tick rate optimizations.
    - STRATEGY: ECS pattern for massive unit counts.
    - RPG: Database-heavy inventory systems, Quest/Dialogue graph engines.
    - B2B SAAS: Multi-tenancy, Row-level security in DB, Stripe integration.
    - MARKETPLACE: ElasticSearch/Algolia for search, Redis for real-time inventory.
    - CONTENT/STREAMING: CDN (CloudFront), HLS/DASH, Edge functions for low latency.
    - FINTECH: PostgreSQL (ACID), PCI-DSS, double-entry bookkeeping logic.
    IMPORTANT: The "description" field MUST be a single STRING. Do NOT use nested objects. Use plain text or markdown within the string.
    STRICT RULE: All output (titles and descriptions) MUST be in ENGLISH and use LATIN characters ONLY. Use of Chinese or other scripts is PROHIBITED.

    STYLE: Pro-level, technical, dense. Do not just list tech; write 1-2 sentences of technical justification for each point why this exact stack was chosen. LANGUAGE: English.`;
    } else if (lang === 'uk') {
      prompt = `Ти — досвідчений CTO та архітектор ПЗ. Спроектуй точний технічний фундамент для: "${input.name}".
    Опис: ${input.description}.
    
    СТРУКТУРА ВІДПОВІДІ (5 кроків):
    1. Core Stack (FE, BE, БД) — поясни ЧОМУ (наприклад, чому PostgreSQL, а не MongoDB для цього кейсу).
    2. Cloud & Infrastructure (Хостинг, CI/CD, контейнери) — обґрунтуй вибір.
    3. AI Implementation (Конкретні моделі, бібліотеки, архітектура) — поясни логіку.
    4. Scaling & Performance (Кешування, балансування, оптимізація БД) — технічне обґрунтування.
    5. Security & Compliance (Автентифікація, захист даних, стандарти) — чому саме такий рівень безпеки.

    ГЛИБОКІ АРХІТЕКТУРНІ ПРАВИЛА (SMART CTO LOGIC):
    - 3D ІГРИ: Unreal Engine 5 (C++) або Unity (C#). Локальний ШІ (Behavior Trees).
    - МУЛЬТИПЛЕЄР: Game servers (Go/C++), WebSockets/UDP, Tick rate.
    - СТРАТЕГІЇ: Патерн ECS для великої кількості юнітів.
    - RPG: Складні системи інвентарю, двигуни квестів/діалогів.
    - B2B SAAS: Multi-tenancy, Row-level security в БД, інтеграція Stripe.
    - MARKETPLACE: ElasticSearch/Algolia для пошуку, Redis для запасів у реальному часі.
    - CONTENT/STREAMING: CDN, HLS/DASH, Edge functions для низької затримки.
    - FINTECH: PostgreSQL (ACID), PCI-DSS, логіка подвійного запису.
    ВАЖЛИВО: Поле "description" має бути одним РЯДКОМ (string). НЕ використовуйте вкладені об'єкти.
    СУВОРА ВИМОГА: Уся вихідна інформація (titles та descriptions) МАЄ БУТИ ВИКЛЮЧНО УКРАЇНСЬКОЮ МОВОЮ (кирилиця/латиниця). Ієрогліфи ЗАБОРОНЕНІ.

    СТИЛЬ: Професійний, технічний, насичений. Не просто перелічуй технології; для кожного пункту напиши 1-2 речення з технічним обґрунтуванням — ЧОМУ обрано саме цей стек для даної ідеї. МОВА: Українська.`;
    } else {
      prompt = `Ты — опытный CTO и системный архитектор. Спроектируй точный технический фундамент для: "${input.name}".
    Описание: ${input.description}.
    
    СТРУКТУРА ОТВЕТА (5 шагов):
    1. Core Stack (FE, BE, БД) — объясни ПОЧЕМУ (например, почему PostgreSQL, а не MongoDB для этого кейса).
    2. Cloud & Infrastructure (Хостинг, CI/CD, контейнеры) — обоснуй выбор.
    3. AI Implementation (Конкретные модели, библиотеки, архитектура) — поясни логику.
    4. Scaling & Performance (Кеширование, балансировка, оптимизация БД) — техническое обоснование.
    5. Security & Compliance (Аутентификация, защита данных, стандарти) — почему именно такой уровень безопасности.

    ГЛУБОКИЕ АРХИТЕКТУРНЫЕ ПРАВИЛА (SMART CTO LOGIC):
    - 3D ИГРЫ: Unreal Engine 5 (C++) или Unity (C#). Локальный ИИ (Behavior Trees).
    - МУЛЬТИПЛЕЕР: Game servers (Go/C++), WebSockets/UDP, оптимизация Tick rate.
    - СТРАТЕГИИ: Паттерн ECS для огромного количества юнитов.
    - RPG: Сложные системы инвентаря, движки квестов и диалоговых графов.
    - B2B SAAS: Multi-tenancy, Row-level security в БД, интеграция Stripe.
    - MARKETPLACE: ElasticSearch/Algolia для поиска, Redis для складских остатков в реальном времени.
    - CONTENT/STREAMING: CDN (CloudFront), HLS/DASH, Edge functions for минимальной задержки.
    - FINTECH: PostgreSQL (ACID), PCI-DSS, логика двойной записи.
    ВАЖНО: Поле "description" должно быть строго одной СТРОКОЙ (string). НЕ используйте вложенные объекты.
    СТРОГОЕ ПРАВИЛО: Вся выходная информация (названия шагов и их описания) ДОЛЖНА БЫТЬ СТРОГО НА РУССКОМ ЯЗЫКЕ (кириллица/латиница). Использование иероглифов КАТЕГОРИЧЕСКИ ЗАПРЕЩЕНО.

    STYLE: Профессиональный, технический, насыщенный. Не просто перечисляй технологии; для каждого пункта напиши 1-2 предложения с техническим обоснованием — ПОЧЕМУ выбран именно этот стек для данной идеи. ЯЗЫК: Русский.`;
    }

    const result = await ai.generate({
      model: model,
      prompt: prompt,
      config: {
        temperature: 0.5,
        topP: 0.9,
        maxOutputTokens: 4096
      },
      output: {
        schema: OutputSchema
      }
    });

    return result.output as z.infer<typeof OutputSchema>;
  });
};
