import { z } from "genkit";
import { generateWithRotation } from "./genkit";
import { classifyIdeaDomain, IdeaDomain } from "./domain";

const FAST_CLASSIFIER_MODEL = process.env.GROQ_CLASSIFIER_MODEL || "llama-3.1-8b-instant";

const OutputSchema = z.object({
  domain: z.enum([
    "game",
    "ai_native",
    "fintech_investment",
    "devtools_it",
    "marketplace",
    "consumer",
    "creator",
    "ops_workflow",
    "general",
  ]),
});

export async function classifyDomainFlow(input: { theme: string; lang?: string }): Promise<IdeaDomain> {
  const heuristic = classifyIdeaDomain({ theme: input.theme });
  if (heuristic !== "general") {
    return heuristic;
  }

  try {
    const result = await generateWithRotation(async (ai, model) => {
      const response = await ai.generate({
        model,
        prompt: `Classify the following product theme into exactly one domain.

Theme: ${input.theme}

Allowed domains:
- game
- ai_native
- fintech_investment
- devtools_it
- marketplace
- consumer
- creator
- ops_workflow
- general

Rules:
- game: video games or game concepts
- ai_native: agents, assistants, automation, chatbots, copilots, AI-first products
- fintech_investment: finance, wealth, portfolio, investing, trading, market data
- devtools_it: developer tools, infrastructure, debugging, APIs, observability, testing
- marketplace: two-sided supply and demand products
- consumer: general consumer or social apps
- creator: creator economy, content, audience, publishing
- ops_workflow: internal tools, workflows, operations, approvals, coordination
- general: everything else

Return valid JSON only.`,
        config: {
          temperature: 0,
          maxOutputTokens: 120,
          response_format: { type: "json_object" },
        },
        output: {
          format: "json",
          schema: OutputSchema,
        },
      });

      return response.output as z.infer<typeof OutputSchema>;
    }, FAST_CLASSIFIER_MODEL);

    return result.domain as IdeaDomain;
  } catch {
    return heuristic;
  }
}
