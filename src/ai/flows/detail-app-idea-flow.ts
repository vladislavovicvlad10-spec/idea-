import { z } from "genkit";
import { generateWithRotation } from "../genkit";

const OutputSchema = z.object({
  targetAudience: z.string(),
  monetization: z.string(),
  uniqueness: z.string(),
});

export const detailAppIdeaFlow = async (input: { name: string; description: string; features: string[] }) => {
  return generateWithRotation(async (ai, model) => {
    const result = await ai.generate({
      model: model,
      prompt: `Ты — элитный бизнес-стратег и CEO. Разработай краткую, но мощную бизнес-модель для проекта: "${input.name}".
    
    База: ${input.description}. 
    Фичи: ${input.features.join(", ")}.

    ТРЕБОВАНИЯ К ОТВЕТУ:
    1. Целевая аудитория: Опиши "идеальных клиентов" одним плотным, сочным абзацем. Кто они, какая у них главная боль и почему они купят этот продукт.
    2. Монетизация: Опиши стратегию заработка. Не просто список, а логичную схему (например: "Фримиум-модель с упором на корпоративные подписки и комиссию с каждой транзакции").
    3. Уникальность (УТП): Сформулируй киллер-фичу и рыночное преимущество. Почему конкуренты останутся позади?

    СТИЛЬ: Деловой, экспертный, лишенный воды. Только суть и стратегия. ЯЗЫК: Русский.`,
      config: {
        temperature: 0.7
      },
      output: {
        schema: OutputSchema
      }
    });
    
    return result.output as z.infer<typeof OutputSchema>;
  }, 'ultra');
};
