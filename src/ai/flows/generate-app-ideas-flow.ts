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
    const langPrompt = lang === 'en' ? 'English' : lang === 'uk' ? 'Ukrainian' : 'Russian';

    const result = await ai.generate({
      model: model,
      prompt: `Сгенерируй 3 по-настоящему КРУТЫХ и масштабных стартапа на тему: "${input.themeOrKeywords}".

      ПРАВИЛО №1 (ЯЗЫК): Пиши весь ответ на языке: ${langPrompt}. 
      ВАЖНО: Сами названия проектов (name) должны ВСЕГДА быть на английском языке (English), даже если описание на другом языке.

      ПРАВИЛО №2 (СТИЛЬ): Пиши как азартный фаундер из Кремниевой Долины. Максимум энергии, живой язык, никакой корпоративной скуки. Забудь фразы типа "проект представляет собой" или "решает проблему". Сразу в бой!

      ПРАВИЛО №3 (ОБЪЕМ): Каждое описание должно быть ОЧЕНЬ ПОДРОБНЫМ (минимум 180-220 слов). Если напишешь мало — это провал. 
      Распиши идею так, чтобы я прямо видел её перед глазами:
      - В чем самая главная "магия" твоего проекта?
      - Опиши формат (мобильное приложение или веб-сервис) и пошагово: что делает пользователь, какой интерфейс он видит, как именно ИИ меняет его жизнь и решает задачи в реальном времени.
      - Добавляй детали про интерфейс и UX: "элегантный темный режим", "интуитивные жесты", "реальное время", "умные алгоритмы".

      ПРАВИЛО №4 (ФИШКИ): 5 штук. Каждая фишка — это не просто название, а подробное объяснение (минимум 12-15 слов), как она работает внутри.

      ФОРМАТ: JSON.`,
      config: {
        temperature: 0.8, 
        maxOutputTokens: 5000 
      },
      output: {
        schema: OutputSchema
      }
    });

    return result.output as z.infer<typeof OutputSchema>;
  }, 'ultra');
};
