import { z } from "genkit";
import { generateWithRotation } from "../genkit";

const OutputSchema = z.object({
  targetAudience: z.string(),
  monetization: z.string(),
  uniqueness: z.string(),
  marketPerspective: z.string(),
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
    4. Market Perspective: Briefly describe current market trends, potential competitors, and key risks to consider.

    STYLE: Business, expert, devoid of fluff. Only essence and strategy. LANGUAGE: English.
    
    IMPORTANT: Every field in the response JSON MUST be a STRING. Do NOT use nested objects in the description fields.
    STRICT RULE: All output fields MUST be in ENGLISH and use LATIN characters ONLY. Use of Chinese or other scripts is PROHIBITED.`;
    } else if (lang === 'uk') {
      prompt = `Ти — елітний бізнес-стратег і CEO. Розроби коротку, але потужну бізнес-модель для проекту: "${input.name}".
    
    База: ${input.description}. 
    Фічі: ${input.features.join(", ")}.

    ВИМОГИ ДО ВІДПОВІДІ:
    1. Цільова аудиторія: Опиши "ідеальних клієнтів" одним щільним, соковитим абзацом. Хто вони, яка в них головна біль і чому вони куплять цей продукт.
    2. Монетизація: Опиши стратегію заробітку. Не просто список, а логічну схему (наприклад: "Freemium-модель з акцентом на корпоративні подписки та комісію з кожної транзації").
    3. Унікальність (УТП): Сформулюй кілер-фічу та ринкову перевагу. Чому конкуренти залишаться позаду?
    4. Ринкова перспектива: Коротко опишіть поточні ринкові тенденції, потенційних конкурентів та ключові ризики, які слід врахувати.

    СТИЛЬ: Діловий, експертний, без зайвої води. Тільки суть і стратегія. МОВА: Українська.
    
    ВАЖЛИВО: Кожне поле у відповіді JSON має бути РЯДКОМ (string). НЕ використовуйте вкладені об'єкти.
    СУВОРА ВИМОГА: Уся вихідна інформація МАЄ БУТИ ВИКЛЮЧНО УКРАЇНСЬКОЮ МОВОЮ (кирилиця/латиниця). Ієрогліфи КАТЕГОРИЧНО ЗАБОРОНЕНІ.`;
    } else {
      prompt = `Ты — элитный бизнес-стратег и CEO. Разработай краткую, но мощную бизнес-модель для проекта: "${input.name}".
    
    База: ${input.description}. 
    Фичи: ${input.features.join(", ")}.

    ТРЕБОВАНИЯ К ОТВЕТУ:
    1. Целевая аудитория: Опиши "идеальных клиентов" одним плотным, сочным абзацем. Кто они, какая у них главная боль и почему они купят этот продукт.
    2. Монетизация: Опиши стратегии заработка. Не просто список, а логичную схему (например: "Фримиум-модель с упором на корпоративные подписки и комиссию с каждой транзакции").
    3. Уникальность (УТП): Сформулируй киллер-фичу и рыночное преимущество. Почему конкуренты останутся позади?
    4. Рыночная перспектива: Кратко опишите текущие рыночные тенденции, потенциальных конкурентов и ключевые риски, которые следует учитывать.

    STYLE: Деловой, экспертный, лишенный воды. Только суть и стратегия. ЯЗЫК: Русский.
    
    ВАЖНО: Каждое поле в ответе JSON должно быть строго СТРОКОЙ (string). НЕ используйте вложенные объекты.
    СТРОГОЕ ПРАВИЛО: Вся выходная информация в JSON должна быть СТРОГО НА РУССКОМ ЯЗЫКЕ (кириллица/латиница). Иероглифы КАТЕГОРИЧЕСКИ ЗАПРЕЩЕНЫ.`;
    }

    const result = await ai.generate({
      model: model,
      prompt: prompt,
      config: {
        temperature: 0.5,
        topP: 0.9,
        maxOutputTokens: 2048
      },
      output: {
        schema: OutputSchema
      }
    });
    
    return result.output as z.infer<typeof OutputSchema>;
  });
};
