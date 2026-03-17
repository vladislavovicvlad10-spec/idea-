import { z } from "genkit";
import { generateWithRotation } from "../genkit";

const OutputSchema = z.object({
  targetAudience: z.string(),
  monetization: z.string(),
  uniqueness: z.string(),
});

export const detailAppIdeaFlow = async (input: { name: string; description: string; features: string[]; lang?: string }) => {
  return generateWithRotation(async (ai, model) => {
    const lang = input.lang || 'ru';
    
    let prompt: string;

    if (lang === 'en') {
      prompt = `You are an elite business strategist and CEO. Develop a concise but powerful business model for the project: "${input.name}".
    
    Base: ${input.description}. 
    Features: ${input.features.join(", ")}.

    RESPONSE REQUIREMENTS:
    1. Target Audience: Describe the "ideal customers" in one dense, juicy paragraph. Who are they, what is their main pain point, and why will they buy this product.
    2. Monetization: Describe the revenue strategy. Not just a list, but a logical scheme (e.g.: "Freemium model with a focus on enterprise subscriptions and a commission from each transaction").
    3. Uniqueness (USP): Formulate the killer feature and market advantage. Why will competitors be left behind?

    STYLE: Business, expert, devoid of fluff. Only essence and strategy. LANGUAGE: English.`;
    } else if (lang === 'uk') {
      prompt = `Ти — елітний бізнес-стратег і CEO. Розроби коротку, але потужну бізнес-модель для проекту: "${input.name}".
    
    База: ${input.description}. 
    Фічі: ${input.features.join(", ")}.

    ВИМОГИ ДО ВІДПОВІДІ:
    1. Цільова аудиторія: Опиши "ідеальних клієнтів" одним щільним, соковитим абзацом. Хто вони, яка в них головна біль і чому вони куплять цей продукт.
    2. Монетизація: Опиши стратегію заробітку. Не просто список, а логічну схему (наприклад: "Freemium-модель з акцентом на корпоративні підписки та комісію з кожної транзакції").
    3. Унікальність (УТП): Сформулюй кілер-фічу та ринкову перевагу. Чому конкуренти залишаться позаду?

    СТИЛЬ: Діловий, експертний, без зайвої води. Тільки суть і стратегія. МОВА: Українська.`;
    } else {
      prompt = `Ты — элитный бизнес-стратег и CEO. Разработай краткую, но мощную бизнес-модель для проекта: "${input.name}".
    
    База: ${input.description}. 
    Фичи: ${input.features.join(", ")}.

    ТРЕБОВАНИЯ К ОТВЕТУ:
    1. Целевая аудитория: Опиши "идеальных клиентов" одним плотным, сочным абзацем. Кто они, какая у них главная боль и почему они купят этот продукт.
    2. Монетизация: Опиши стратегию заработка. Не просто список, а логичную схему (например: "Фримиум-модель с упором на корпоративные подписки и комиссию с каждой транзакции").
    3. Уникальность (УТП): Сформулируй киллер-фичу и рыночное преимущество. Почему конкуренты останутся позади?

    СТИЛЬ: Деловой, экспертный, лишенный воды. Только суть и стратегия. ЯЗЫК: Русский.`;
    }

    const result = await ai.generate({
      model: model,
      prompt: prompt,
      config: {
        temperature: 0.7
      },
      output: {
        schema: OutputSchema
      }
    });
    
    return result.output as z.infer<typeof OutputSchema>;
  });
};
