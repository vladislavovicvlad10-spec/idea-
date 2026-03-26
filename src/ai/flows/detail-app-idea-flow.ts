import { z } from "genkit";
import { generateWithRotation } from "../genkit";
import { classifyIdeaDomain } from "../domain";

const OutputSchema = z.object({
  targetAudience: z.string(),
  monetization: z.string(),
  uniqueness: z.string(),
  marketPerspective: z.string(),
  mainRisks: z.string(),
  technicalRisks: z.string(),
  v1Cut: z.string(),
});

function getPrompt(input: { name: string; description: string; features: string[] }, lang: string) {
  const outputLanguage =
    lang === "uk" ? "Ukrainian" :
    lang === "ru" ? "Russian" :
    "English";
  const domain = classifyIdeaDomain(input);
  const domainNotes = {
    fintech_investment: "For finance or investment products, mention trust, compliance boundaries, data-source credibility, explainability limits, and what cannot be automated safely.",
    devtools_it: "For IT or developer-tool products, mention developer workflow, integration friction, API or CLI usability, onboarding cost, and what would block adoption.",
    marketplace: "For marketplaces, mention liquidity, trust, supply-demand imbalance, moderation, and why either side would join first.",
    consumer: "For consumer products, mention retention risk, novelty decay, habit formation, and distribution difficulty.",
    creator: "For creator products, mention audience acquisition friction, switching cost, monetization leverage, and creator workflow pain.",
    ops_workflow: "For workflow products, mention process-change resistance, integration debt, admin overhead, and measurable operational value.",
    ai_native: "For AI-native products, mention model reliability, prompt drift, tool failure, evaluation cost, and where a human still needs to stay in the loop.",
    game: "For games, mention replayability risk, content production cost, balancing difficulty, and what to cut to reach a fun first playable build.",
    general: "Keep the analysis domain-aware and realistic.",
  } as const;

  return `You are a product strategist helping a solo developer shape a practical business or product direction.

Project: ${input.name}
Description: ${input.description}
Features: ${input.features.join(", ")}

Write all text content in ${outputLanguage}.
Return JSON only. Each field must be a plain string.

Write:
1. targetAudience: one concise paragraph about who adopts this first and what pain or desire they feel.
2. monetization: one concise paragraph with a realistic revenue model or retention hook for an early solo product.
3. uniqueness: one concise paragraph explaining the strongest differentiation and why this is chosen over an incumbent.
4. marketPerspective: one concise paragraph covering market timing, likely competitors, and the main commercial risk.
5. mainRisks: one concise paragraph on market or product weaknesses that could stop adoption.
6. technicalRisks: one concise paragraph on the hardest technical risks, integrations, or reliability issues.
7. v1Cut: one concise paragraph explaining what must be removed from version one to keep scope realistic.

Constraints:
- Prefer realistic execution over hype.
- If payments are relevant, prefer managed billing such as Stripe Checkout or LemonSqueezy.
- If subscriptions are relevant, prefer managed billing over custom billing logic.
- If email is relevant, prefer simple providers such as Resend or Brevo.
- Make the analysis domain-aware. ${domainNotes[domain]}
- mainRisks and technicalRisks must be candid, not optimistic marketing text.
- uniqueness must explicitly explain which incumbent pattern this idea rejects and why the alternative behavior is better for the first user segment.
- marketPerspective must mention one brutal reason the market may ignore this idea even if the concept is interesting.
- Avoid generic phrasing like provides a platform, is designed to, offers a solution, enhances the experience, or connects users.
- Write directly and concretely. Mention at least one specific user action or internal mechanism when it helps clarify uniqueness or risk.
- No nested objects, no markdown, no bullet lists.`;
}

export const detailAppIdeaFlow = async (input: { name: string; description: string; features: string[]; lang?: string }) => {
  return generateWithRotation(async (ai, model) => {
    const lang = input.lang || "ru";

    const result = await ai.generate({
      model,
      prompt: getPrompt(input, lang),
      config: {
        temperature: 0.35,
        topP: 0.9,
        maxOutputTokens: 2200,
      },
      output: {
        schema: OutputSchema,
      },
    });

    return result.output as z.infer<typeof OutputSchema>;
  });
};
