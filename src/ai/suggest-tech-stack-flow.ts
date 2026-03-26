import { z } from "genkit";
import { generateWithRotation } from "./genkit";
import { classifyIdeaDomain, isAiNativeDomain, isGameDomain } from "./domain";

const OutputSchema = z.object({
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

function getPrompt(input: { name: string; description: string; features: string[] }, lang: string) {
  const domain = classifyIdeaDomain(input);
  const aiNativeNote = isAiNativeDomain(domain)
    ? `
- This is an AI-native product. Do not describe AI as a vague feature.
- The plan must include the actual AI system shape: model/provider layer, prompt or orchestration layer, tool/integration layer, state or memory handling, and execution flow.
- Prefer LLM APIs, prompt/orchestration logic, task runners, job queues, caching, and evaluation/logging where appropriate.
- Do not default to scikit-learn, TensorFlow, or classic ML training unless the product explicitly requires custom model training.
- If the product involves agents or automation, include background jobs, retries, tool execution, and failure handling in the implementation path.
- If the product is a chatbot or assistant, include conversation state, memory strategy, and tool usage boundaries.`
    : "";
  const gameNote = isGameDomain(domain)
    ? `
- This is a video game. Do not describe it like a SaaS product.
- The plan must cover actual game development needs: engine choice, gameplay systems, physics/input loop, level/content pipeline, save/progression systems, performance targets, and playtesting.
- Prefer game-appropriate tooling such as Unity, Unreal, Godot, custom game servers, asset pipelines, and gameplay-state storage where appropriate.
- Do not suggest Stripe, Elasticsearch, Neo4j, Shopify, admin dashboards, CRM-style backends, or generic SaaS infrastructure unless the game explicitly needs live-service commerce.
- If multiplayer or realtime play is involved, include networking model and session/state handling.
- If the game depends on physics or skill, mention frame-rate/performance considerations and input responsiveness.`
    : "";
  const domainNote = {
    fintech_investment: `
- This is a fintech or investment product. Prefer trusted market-data providers, relational data, auditability, and clear compliance boundaries.
- Avoid magical AI investing claims. Explain where data comes from and what the system is not allowed to do.`,
    devtools_it: `
- This is a developer or IT product. Prefer API-first thinking, CLI or SDK ergonomics, auth tokens, logs, metrics, observability, and integration workflows.
- Avoid reducing the idea to a generic dashboard if the real value is in workflow or developer experience.`,
    marketplace: `
- This is a marketplace. The plan must account for trust, moderation, payouts, onboarding, and the practical supply-demand bootstrapping problem.`,
    consumer: `
- This is a consumer product. The plan should consider onboarding speed, retention loops, notifications or reminders where relevant, and reasons users return.`,
    creator: `
- This is a creator product. The plan should consider integrations, publishing workflow, audience analytics, and monetization leverage.`,
    ops_workflow: `
- This is a workflow or operations product. The plan should consider approvals, idempotency, background jobs, integrations, and admin overhead.`,
    general: "",
    ai_native: "",
    game: "",
  } as const;

  return `You are a pragmatic MVP architect helping a solo developer choose the simplest credible implementation path.

Project: ${input.name}
Description: ${input.description}
Features: ${input.features.join(", ")}
Language: ${lang}

Return JSON only.

Requirements:
- Provide 5 to 7 steps.
- Return these keys exactly: technical_steps, recommended_database, backend_runtime, frontend_stack, key_libraries, infrastructure_services, background_jobs, search_strategy, realtime_strategy, storage_strategy, auth_strategy, billing_strategy, compliance_notes.
- Each step must have a short title and a concrete description.
- Optimize for solo developer execution, low cost, and fast launch.
- Prefer one coherent ecosystem instead of mixing many platforms.
- Choose tools based on the product shape. Do not default to the same stack for every project.
- Do not default to Node + React + Postgres + AWS unless this exact product clearly needs that combination.
- Vary the stack when the product shape suggests a simpler or more fitting option such as Python, Go, Supabase/Postgres, SQLite, managed search, Firebase, or edge/browser-heavy architecture.
- Avoid custom auth, custom billing, long-running server jobs, and server-side websocket assumptions on serverless hosting.
- Do not introduce blockchain, crypto, Web3, tokens, wallets, IPFS, or advanced cryptography unless the product explicitly requires them.
- Prefer boring, maintainable tools over impressive stacks.
- Mention specific tools only when they directly fit the project.
- If a simpler implementation exists, prefer it over a more fashionable one.
- Avoid giving the same recommendation pattern every time such as "Next.js + serverless + NoSQL + Stripe" unless this project truly needs it.
- Do not add Redis, SQS, Kafka, RabbitMQ, New Relic, Datadog, OpenSearch, or dedicated caches/queues/observability stacks for MVP unless there is a concrete product-specific reason.
- If background_jobs, search_strategy, realtime_strategy, caching, or infrastructure are not essential for MVP, explicitly say they are not needed yet.
- Reflect realistic tradeoffs for this exact product: data shape, user interaction pattern, search/filtering needs, async jobs, file handling, and admin overhead.
- Each step should describe what to build and why that choice is appropriate for this product.
- If this is a marketplace, do not suggest Shopify or WooCommerce unless the product is truly just ecommerce.
- If this is an automation or agent product, do not hand-wave the execution engine.
- If this is a consumer AI product, include what makes the interaction loop different from a generic chatbot builder.${aiNativeNote}
- If this is a game, prefer game-dev tooling and runtime architecture over web-app stacks.${gameNote}
- Make the implementation domain-aware.${domainNote[domain]}
- Avoid community-driven, moderation-heavy, or user-generated-content architecture unless the product explicitly depends on those loops.
- Choose databases, libraries, and infrastructure by domain:
  - transactional or financial flows -> prefer relational databases such as Postgres
  - document-like flexible content -> consider document stores only if schema volatility really matters
  - heavy search/filtering -> include a search layer like Postgres full-text search first, then Elasticsearch/OpenSearch only if justified
  - realtime collaboration or presence -> include websocket/realtime infrastructure explicitly
  - file/media handling -> include object storage and background processing
  - analytics or event-heavy products -> include queueing, workers, and event storage where needed
  - investment or finance products -> mention market data providers, auditability, and compliance boundaries instead of vague "AI insights"
- Mention concrete technologies, libraries, databases, and hosted services when they fit, but only when they are defensible for this product.
- key_libraries and infrastructure_services should contain concrete names, not generic categories.
- If a field is not important for this product, still return a short honest string such as "Not needed for MVP" rather than inventing complexity.
- No markdown, no bullets inside strings, no extra keys.`;
}

export const suggestTechStackFlow = async (input: { name: string; description: string; features: string[]; lang?: string }) => {
  return generateWithRotation(async (ai, model) => {
    const lang = input.lang || "ru";

    const result = await ai.generate({
      model,
      prompt: getPrompt(input, lang),
      config: {
        temperature: 0.1,
        maxOutputTokens: 2200,
        response_format: { type: "json_object" },
      },
      output: {
        format: "json",
        schema: OutputSchema,
      },
    });

    return result.output as z.infer<typeof OutputSchema>;
  });
};
