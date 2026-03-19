import { z } from "genkit";
import { generateWithRotation } from "../genkit";

const OutputSchema = z.object({
  ideas: z.array(z.object({
    name: z.string(),
    description: z.string(),
    features: z.array(z.string()),
  }))
});

export const generateAppIdeasFlow = async (input: { themeOrKeywords: string, lang?: string }) => {
  return generateWithRotation(async (ai, model) => {
    const lang = input.lang || 'ru';
    
    let prompt: string;
    
    if (lang === 'en') {
      prompt = `Generate 3 truly COOL and large-scale startups on the topic: "${input.themeOrKeywords}".
      
      RULE #1 (LANGUAGE): Write the entire response in English.
      STRICT RULE: ONLY use Latin characters. Use of Chinese, Japanese or other non-Latin scripts is PROHIBITED.
      IMPORTANT: The project names (name) must ALWAYS be in English.
      
      RULE #2 (STYLE): Write like a passionate Silicon Valley founder. Maximum energy, vivid language, no corporate boredom. Skip phrases like "the project is" or "solves the problem". Dive straight into the action!
      
      RULE #3 (VOLUME): Each description must be VERY DETAILED (minimum 180-220 words). Short descriptions are a failure.
      Describe the idea so I can see it before my eyes:
      - What is the main "magic" of your project?
      - Describe the format (mobile app or web service) step-by-step: what the user does, what interface they see, how AI changes their life and solves tasks in real-time.
      - Add details about UI and UX: "elegant dark mode", "intuitive gestures", "real-time", "smart algorithms".
      
      RULE #4 (FEATURES): 5 items. Each feature is not just a name, but a detailed explanation (min 12-15 words) of how it works inside.
      
      RULE #5 (TECH ARCHITECTURE): 
      - If it is a 3D/Action game, NEVER suggest Next.js/React as core. Suggest Unreal Engine 5 or Unity.
      - If Multiplayer: specify server-side authority or matchmaking ideas.
      - For real-time AI in games, NEVER suggest OpenAI. Suggest Local AI, Behavior Trees, or Unity Sentis.
      - Meta-services (profiles, store) can remain on FastAPI/Next.js.
      
      FORMAT: JSON.`;
    } else if (lang === 'uk') {
      prompt = `Згенеруй 3 справді КРУТИХ і масштабних стартапи на тему: "${input.themeOrKeywords}".

      ПРАВИЛО №1 (МОВА): Пиши весь відповідь Українською мовою.
      СУВОРА ВИМОГА: Використовувати тільки КИРИЛИЦЮ (українську) та ЛАТИНИЦЮ. Китайські, японські та інші ієрогліфи КАТЕГОРИЧНО ЗАБОРОНЕНІ.
      ВАЖЛИВО: Самі назви проектів (name) мають ЗАВЖДИ бути англійською (English), навіть якщо опис іншою мовою.

      ПРАВИЛО №2 (СТИЛЬ): Пиши як азартний засновник із Кремнієвої Долини. Максимум енергії, жива мова, ніякої корпоративної нудьги. Забудь фрази типу "проект являє собою" або "вирішує проблему". Одразу в бій!

      ПРАВИЛО №3 (ОБСЯГ): Кожен опис має бути ДУЖЕ ДЕТАЛЬНИМ (мінімум 180-220 слів). Якщо напишеш мало — це провал.
      Розпиши ідею так, щоб я прямо бачив її перед очима:
      - У чому головна "магія" твого проекту?
      - Опиши формат (мобільний додаток або веб-сервіс) і покроково: що робить користувач, який інтерфейс він бачить, як саме ШІ змінює його життя і вирішує завдання в реальному часі.
      - Додавай деталі про інтерфейс та UX: "елегантний темний режим", "інтуїтивні жести", "реальний час", "розумні алгоритми".

      ПРАВИЛО №4 (ФІЧІ): 5 штук. Кожна фіча — це не просто назва, а детальне пояснення (мінімум 12-15 слів), як вона працює всередині.

      ПРАВИЛО №5 (ТЕХНІЧНА АРХІТЕКТУРА):
      - Якщо це 3D/Action гра, НІКОЛИ не пропонуй Next.js/React як основу. Пропонуй Unreal Engine 5 або Unity.
      - Якщо Мультиплеєр: вказуй на серверний авторитет або систему матчмейкінгу.
      - Для ШІ в реальному часі в іграх НІКОЛИ не пропонуй OpenAI. Пропонуй Behavior Trees або локальні моделі.
      - Веб-сервіси (профілі, магазин) можуть залишатися на FastAPI/Next.js.

      ФОРМАТ: JSON.`;
    } else {
      prompt = `Сгенерируй 3 по-настоящему КРУТЫХ и масштабных стартапа на тему: "${input.themeOrKeywords}".

      ПРАВИЛО №1 (ЯЗЫК): Пиши весь ответ на Русском языке.
      СТРОГОЕ ПРАВИЛО: Используй только КИРИЛЛИЦУ и ЛАТИНИЦУ. Китайские, японские и прочие иероглифы КАТЕГОРИЧЕСКИ ЗАПРЕЩЕНЫ.
      ВАЖНО: Сами названия проектов (name) должны ВСЕГДА быть на английском языке (English), даже если описание на другом языке.

      ПРАВИЛО №2 (СТИЛЬ): Пиши как азартный фаундер из Кремниевой Долины. Максимум энергии, живой язык, никакой корпоративной скуки. Забудь фразы типа "проект представляет собой" или "решает проблему". Сразу в бой!

      ПРАВИЛО №3 (ОБЪЕМ): Каждое описание должно быть ОЧЕНЬ ПОДРОБНЫМ (минимум 180-220 слов). Если напишешь мало — это провал.
      Распиши идею так, чтобы я прямо видел её перед глазами:
      - В чем самая главная "магия" твоего проекта?
      - Опиши формат (мобильное приложение или веб-сервис) и пошагово: что делает пользователь, какой интерфейс он видит, как именно ИИ меняет его жизнь и решает задачи в реальном времени.
      - Добавляй детали про интерфейс и UX: "элегантный темный режим", "интуитивные жесты", "реальное время", "умные алгоритмы".

      ПРАВИЛО №4 (ФИШКИ): 5 штук. Каждая фишка — это не просто название, а подробное объяснение (минимум 12-15 слов), как она работает внутри.

      ПРАВИЛО №5 (ТЕХНИЧЕСКАЯ АРХИТЕКТУРА): 
      - Если это 3D/Action игра, НИКОГДА не предлагай Next.js/React как ядро системы. Предлагай Unreal Engine 5 или Unity.
      - Если Мультиплеер: упоминай серверный авторитет или системы матчмейкинга.
      - Для ИИ в реальном времени в играх НИКОГДА не предлагай OpenAI API. Предлагай Behavior Trees или локальные модели.
      - Веб-сервисы (профили, магазин) могут оставаться на FastAPI/Next.js.

      ФОРМАТ: JSON.`;
    }

    const result = await ai.generate({
      model: model,
      prompt: prompt,
      config: {
        temperature: 0.65, 
        topP: 0.9,
        maxOutputTokens: 5000 
      },
      output: {
        schema: OutputSchema
      }
    });

    return result.output as z.infer<typeof OutputSchema>;
  });
};
