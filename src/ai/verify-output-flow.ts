import { z } from "genkit";
import { generateWithRotation } from "./genkit";

const IdeasSchema = z.object({
  ideas: z.array(
    z.object({
      name: z.string(),
      description: z.string(),
      problem: z.string(),
      audience: z.string(),
      valueProposition: z.string(),
      coreTwist: z.string(),
      noveltyReason: z.string(),
      antiCloneNote: z.string(),
      features: z.array(z.string()),
    })
  ),
});

const BusinessSchema = z.object({
  targetAudience: z.string(),
  monetization: z.string(),
  uniqueness: z.string(),
  marketPerspective: z.string(),
  mainRisks: z.string(),
  technicalRisks: z.string(),
  v1Cut: z.string(),
});

const TechStackSchema = z.object({
  technical_steps: z.array(
    z.object({
      title: z.string(),
      description: z.string(),
    })
  ),
  recommended_database: z.string(),
  backend_runtime: z.string(),
  frontend_stack: z.string(),
  key_libraries: z.array(z.string()),
  infrastructure_services: z.array(z.string()),
  background_jobs: z.string(),
  search_strategy: z.string(),
  realtime_strategy: z.string(),
  storage_strategy: z.string(),
  auth_strategy: z.string(),
  billing_strategy: z.string(),
  compliance_notes: z.string(),
});

const ArchitectureSchema = z.object({
  technical_steps: z.array(
    z.object({
      title: z.string(),
      description: z.string(),
    })
  ),
  db_battle: z.string(),
  backend_war: z.string(),
  engine_logic: z.string(),
  scalability_justification: z.string(),
  deployment_model: z.string(),
  caching_strategy: z.string(),
  queue_strategy: z.string(),
  observability_strategy: z.string(),
  failure_handling: z.string(),
  bottlenecks: z.array(
    z.object({
      trigger: z.string(),
      component: z.string(),
      migrationPath: z.string(),
    })
  ),
  architectural_decision_log: z.array(
    z.object({
      category: z.string(),
      chosen: z.string(),
      alternatives: z.array(z.string()),
      rationale: z.string(),
    })
  ),
});

type VerifierMode = "ideas" | "business" | "tech" | "architecture";

const verifierRules = {
  ideas: "Keep ideas realistic for a solo founder, preserve exactly 5 concrete features per idea, preserve rich descriptions instead of compressing them, force the 3 ideas to be materially different, reject unnecessary Web3 or buzzword-heavy concepts, reject obvious incumbent clones, strengthen the weird-but-useful rule in coreTwist, make noveltyReason concrete instead of vague, make antiCloneNote explicitly name the trap each idea avoids, remove lazy community-driven, moderation-heavy, or user-generated retention loops unless the theme truly requires them, remove generic AI phrasing such as provides a platform / is designed to / offers a solution, require concrete user actions in features, and require at least one internal mechanism to be explained in the idea.",
  business: "Remove ungrounded claims, keep monetization realistic, avoid guaranteed outcomes, keep concise professional language, ensure the analysis includes honest risks and realistic version-one cuts, and make uniqueness clearly explain why incumbents lose in this niche rather than just saying simpler or AI-powered.",
  tech: "Keep steps actionable and technically coherent, remove vague or contradictory guidance, avoid overengineering, ensure the stack fits the actual domain instead of defaulting to a generic SaaS pattern, justify every non-trivial technology choice, reject the automatic Node+React+Postgres+AWS template when a simpler or better-fit stack exists, and mark Redis, queues, search engines, and advanced observability as not needed for MVP unless clearly required.",
  architecture: "Keep analysis realistic, coherent, and production-plausible; avoid fabricated facts and impossible scaling promises; reject domain mismatch such as SaaS infrastructure for games, ecommerce platforms for agent marketplaces, or magical AI without execution mechanics; prefer simpler architecture unless there is a concrete load or domain reason for extra systems; and reject unnecessary Redis, SQS, queue workers, dedicated search engines, and heavy observability stacks for MVP.",
} satisfies Record<VerifierMode, string>;

async function verifyWithSchema<T>({
  payload,
  schema,
  mode,
  lang,
}: {
  payload: T;
  schema: z.ZodType<T>;
  mode: VerifierMode;
  lang?: string;
}): Promise<T> {
  if (process.env.AI_VERIFIER_ENABLED === "false") {
    return payload;
  }

  return generateWithRotation(async (ai, model) => {
    const result = await ai.generate({
      model,
      prompt: `You are a strict output verifier for an AI startup assistant.

Task:
- Validate and refine the JSON so it is realistic, internally consistent, and professionally worded.
- Preserve the same schema and top-level keys.
- Do not add new fields.
- Remove fabricated certainty (e.g. guaranteed growth, exact market facts without source).
- Do not shorten outputs unless they are clearly repetitive or bloated.
- Keep language code: ${lang || "ru"}.

Verifier mode: ${mode}
Rules: ${verifierRules[mode]}

Input JSON:
${JSON.stringify(payload)}`,
      config: {
        temperature: 0,
        maxOutputTokens: 4000,
        response_format: { type: "json_object" },
      },
      output: {
        format: "json",
        schema,
      },
    });

    return result.output as T;
  });
}

export async function verifyIdeasOutput(
  payload: z.infer<typeof IdeasSchema>,
  lang?: string
): Promise<z.infer<typeof IdeasSchema>> {
  return verifyWithSchema({ payload, schema: IdeasSchema, mode: "ideas", lang });
}

export async function verifyBusinessOutput(
  payload: z.infer<typeof BusinessSchema>,
  lang?: string
): Promise<z.infer<typeof BusinessSchema>> {
  return verifyWithSchema({ payload, schema: BusinessSchema, mode: "business", lang });
}

export async function verifyTechStackOutput(
  payload: z.infer<typeof TechStackSchema>,
  lang?: string
): Promise<z.infer<typeof TechStackSchema>> {
  return verifyWithSchema({ payload, schema: TechStackSchema, mode: "tech", lang });
}

export async function verifyArchitectureOutput(
  payload: z.infer<typeof ArchitectureSchema>,
  lang?: string
): Promise<z.infer<typeof ArchitectureSchema>> {
  return verifyWithSchema({ payload, schema: ArchitectureSchema, mode: "architecture", lang });
}
