import { z } from "genkit";
import { generateWithRotation } from "./genkit";
import { classifyIdeaDomain, isAiNativeDomain, isGameDomain } from "./domain";

const OutputSchema = z.object({
  technical_steps: z.array(
    z.object({
      title: z.string(),
      description: z.string(),
    })
  ).describe("Implementation roadmap."),
  db_battle: z.string().describe("Database choice and justification."),
  backend_war: z.string().describe("Backend and hosting choice with trade-offs."),
  engine_logic: z.string().describe("Core framework/runtime choice for this product."),
  scalability_justification: z.string().describe("Main trade-offs for a solo developer on a low budget."),
  deployment_model: z.string().describe("Deployment model and hosting shape."),
  caching_strategy: z.string().describe("Caching strategy for this product."),
  queue_strategy: z.string().describe("Background jobs or queue strategy."),
  observability_strategy: z.string().describe("Logging, monitoring, and tracing approach."),
  failure_handling: z.string().describe("How failures, retries, and degraded modes are handled."),
  bottlenecks: z.array(
    z.object({
      trigger: z.string(),
      component: z.string(),
      migrationPath: z.string(),
    })
  ).describe("2-3 concrete bottlenecks and migration paths."),
  architectural_decision_log: z.array(
    z.object({
      category: z.string(),
      chosen: z.string(),
      alternatives: z.array(z.string()),
      rationale: z.string(),
    })
  ).describe("Decision log for the main architecture choices."),
});

type ArchitectureInput = {
  name: string;
  description: string;
  features: string[];
  selectedSteps?: { title: string; description: string }[];
  lang?: string;
};

const consistencyCategories = {
  database: [
    ["postgres", "postgresql"],
    ["mysql"],
    ["sqlite"],
    ["mongodb", "mongo"],
    ["dynamodb"],
    ["redis"],
    ["elasticsearch", "opensearch"],
  ],
  backend: [
    ["node", "node.js", "express", "nestjs"],
    ["python", "flask", "fastapi", "django"],
    ["go", "golang"],
    ["java", "spring"],
    ["php", "laravel"],
    ["ruby", "rails"],
  ],
  frontend: [
    ["next.js", "nextjs"],
    ["react"],
    ["vue", "nuxt"],
    ["svelte", "sveltekit"],
    ["angular"],
  ],
} as const;

function normalizeText(value: string) {
  return value.toLowerCase();
}

function findMentionedChoices(text: string, groups: readonly (readonly string[])[]) {
  const haystack = normalizeText(text);
  return groups
    .filter((group) => group.some((term) => haystack.includes(term)))
    .map((group) => group[0]);
}

function findConsistencyConflicts(selectedSteps: { title: string; description: string }[], result: z.infer<typeof OutputSchema>) {
  const selectedText = selectedSteps.map((step) => `${step.title} ${step.description}`).join(" \n ");
  const architectureText = [
    result.db_battle,
    result.backend_war,
    result.engine_logic,
    result.scalability_justification,
    ...result.technical_steps.map((step) => `${step.title} ${step.description}`),
  ].join(" \n ");

  const conflicts: string[] = [];

  (Object.keys(consistencyCategories) as Array<keyof typeof consistencyCategories>).forEach((category) => {
    const selectedChoices = findMentionedChoices(selectedText, consistencyCategories[category]);
    const architectureChoices = findMentionedChoices(architectureText, consistencyCategories[category]);

    if (selectedChoices.length === 0 || architectureChoices.length === 0) {
      return;
    }

    if (selectedChoices.some((choice) => !architectureChoices.includes(choice))) {
      conflicts.push(`${category}: selected=${selectedChoices.join(", ")} architecture=${architectureChoices.join(", ")}`);
    }
  });

  return conflicts;
}

function getPrompt(input: ArchitectureInput, lang: string, inconsistencyNote?: string) {
  const domain = classifyIdeaDomain(input);
  const selectedPlan = input.selectedSteps?.length
    ? input.selectedSteps.map((step, index) => `${index + 1}. ${step.title}: ${step.description}`).join("\n")
    : "No selected technical steps were provided.";
  const aiNativeNote = isAiNativeDomain(domain)
    ? `
- This is an AI-native product. The architecture must explicitly cover: model/provider layer, prompt/orchestration layer, tool execution layer, memory/state, and async job handling.
- Do not describe AI as a black box. Explain where prompts live, how tools are called, how runs are tracked, and how failures/retries are handled.
- Prefer LLM APIs, orchestration logic, queues/workers, caches, rate limiting, and execution audit trails where appropriate.
- Do not default to scikit-learn, TensorFlow, or classic ML training unless the product explicitly needs custom model training.
- If the product involves agents or automation, include planner/executor boundaries, queueing, retry logic, and execution safety limits.
- If the product is a chatbot or assistant, include conversation state, memory boundaries, and tool invocation controls.
- If the product is a marketplace for AI agents, do not suggest Shopify or generic ecommerce architecture.`
    : "";
  const gameNote = isGameDomain(domain)
    ? `
- This is a video game. The architecture must explicitly cover engine/runtime choice, gameplay state, input/physics loop, level/content pipeline, save/progression systems, and performance targets.
- Do not describe it like a CRUD product or SaaS app.
- Prefer game-appropriate architecture such as Unity/Unreal/Godot runtime logic, asset loading, scene/state management, and, when relevant, networking/session architecture.
- Do not suggest Stripe, Elasticsearch, Neo4j, Shopify, generic admin dashboards, or business-app infrastructure unless the game explicitly requires live-service commerce or analytics tooling.
- If the game is multiplayer or realtime, explain the networking model, session authority, and synchronization tradeoffs.
- If the game relies on skill or physics, discuss latency, frame rate, determinism, or responsiveness where relevant.`
    : "";
  const domainNote = {
    fintech_investment: `
- This is a fintech or investment product. The architecture should favor trusted data ingestion, relational consistency, auditability, explainability boundaries, and clear compliance limits.
- Mention data vendors, caching, refresh cadence, and what requires explicit user confirmation or human review.`,
    devtools_it: `
- This is a developer or IT product. The architecture should think in terms of API-first design, CLI or SDK integration, auth tokens, observability, logs/metrics, webhooks, and reliable developer workflows.`,
    marketplace: `
- This is a marketplace. The architecture should address moderation, trust, onboarding, payout flows, dispute-sensitive data, and liquidity-related backend complexity.`,
    consumer: `
- This is a consumer product. The architecture should consider onboarding, notifications, retention loops, and scalable session or profile state without overengineering.`,
    creator: `
- This is a creator product. The architecture should consider media or content workflows, analytics, publishing integrations, and audience-facing performance.`,
    ops_workflow: `
- This is a workflow or operations product. The architecture should consider queues, retries, idempotency, background tasks, integrations, and audit trails.`,
    general: "",
    ai_native: "",
    game: "",
  } as const;

  const basePrompt = `You are a pragmatic software architect reviewing an MVP for a solo developer.

Project: ${input.name}
Description: ${input.description}
Features: ${input.features.join(", ")}
Chosen technical plan:
${selectedPlan}
Language: ${lang}

Return raw JSON only.

Requirements:
- Keep one coherent stack unless there is a strong reason not to.
- Optimize for low cost, operational simplicity, and realistic solo maintenance.
- Do not default to Node + React + Postgres + AWS unless the chosen technical plan and product constraints actually justify that combination.
- Avoid custom auth, custom billing, and server-side state kept only in memory.
- Respect common serverless constraints such as timeouts and weak websocket support.
- For heavy compute, prefer browser-side or managed services when practical.
- Do not default to the same architecture for every project.
- Pick architecture based on actual product constraints such as search, transactions, moderation, file uploads, realtime collaboration, queueing, or analytics.
- Do not introduce blockchain, crypto, Web3, IPFS, wallets, or advanced cryptography unless the product explicitly requires them.
- Reject buzzword architecture. Avoid terms like "tamper-proof", "homomorphic encryption", or "decentralized trust" unless they are strictly necessary and concretely justified.
- Prefer the simplest architecture that can credibly support the MVP.
- Treat Redis, SQS, Kafka, RabbitMQ, dedicated queue workers, New Relic, Datadog, Elasticsearch/OpenSearch, and extra infra layers as opt-in complexity that must be justified by an explicit MVP need.
- Explain tradeoffs like a real engineer: why this choice, why not the simpler alternative, and what breaks first.
- The chosen technical plan is the source of truth. Do not switch databases, runtimes, or frontend frameworks unless the provided plan is clearly impossible.
- technical_steps: 5 to 7 concise steps that stay aligned with the chosen technical plan.
- db_battle, backend_war, engine_logic, scalability_justification, deployment_model, caching_strategy, queue_strategy, observability_strategy, and failure_handling must all be specific to this product and must include at least one tradeoff or downside.
- bottlenecks: 2 or 3 realistic breakpoints with concrete migration paths. Bottlenecks must be operationally believable, not dramatic.
- architectural_decision_log: include the major choices only.
- For architectural_decision_log, prefer entries such as database, backend/runtime, frontend interaction model, search/indexing, background processing, or file storage.
- If the chosen plan uses Postgres, do not suddenly recommend MongoDB. If it uses Python, do not suddenly switch to Node. If it uses React/Next.js, do not switch frontend stacks without a very explicit reason.
- For AI-native products, architecture quality depends on execution flow, memory, observability, and background processing, not just the CRUD stack.${aiNativeNote}
- For game products, architecture quality depends on gameplay runtime, content pipeline, save/progression model, performance, and networking model, not web-app admin patterns.${gameNote}
- Make the architecture domain-aware.${domainNote[domain]}
- Make architecture domain-aware:
  - finance or investment products should usually favor relational data, auditability, market-data ingestion, and compliance boundaries
  - search-heavy products should justify whether Postgres search is enough or whether a dedicated search engine is needed
  - realtime products should describe the actual realtime path, not just "use Firebase"
  - marketplace products should address trust, moderation, payouts, and dispute-related backend complexity
  - media or file products should include object storage, background workers, and processing pipelines
  - workflow or ops products should consider queues, retries, idempotency, and cron/background tasks
- Avoid community-driven, moderation-heavy, or user-generated-content backend complexity unless the product explicitly depends on those loops.
- Mention concrete libraries, databases, infrastructure, caches, queues, and providers when useful, but keep them coherent and minimal.
- No markdown and no extra keys.`;

  if (inconsistencyNote) {
    return `${basePrompt}\n\nPrevious draft had these consistency problems:\n${inconsistencyNote}\nFix them and keep the output aligned with the chosen technical plan.`;
  }

  return basePrompt;
}

export const analyzeArchitectureFlow = async (input: ArchitectureInput) => {
  return generateWithRotation(async (ai, model) => {
    const lang = input.lang || "ru";

    const generateAnalysis = async (inconsistencyNote?: string) => ai.generate({
      model,
      prompt: getPrompt(input, lang, inconsistencyNote),
      config: {
        temperature: 0.1,
        maxOutputTokens: 4200,
        response_format: { type: "json_object" },
      },
      output: {
        format: "json",
        schema: OutputSchema,
      },
    });

    const firstPass = await generateAnalysis();
    let output = firstPass.output as z.infer<typeof OutputSchema>;

    if (input.selectedSteps?.length) {
      const conflicts = findConsistencyConflicts(input.selectedSteps, output);
      if (conflicts.length > 0) {
        const retry = await generateAnalysis(conflicts.join("\n"));
        output = retry.output as z.infer<typeof OutputSchema>;
      }
    }

    return output;
  });
};
