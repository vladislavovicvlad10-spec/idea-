export type IdeaDomain =
  | "game"
  | "ai_native"
  | "fintech_investment"
  | "devtools_it"
  | "marketplace"
  | "consumer"
  | "creator"
  | "ops_workflow"
  | "general";

function hasAny(text: string, terms: string[]) {
  return terms.some((term) => text.includes(term));
}

export function classifyIdeaDomain(input: { name?: string; description?: string; features?: string[]; theme?: string }): IdeaDomain {
  const haystack = `${input.theme || ""} ${input.name || ""} ${input.description || ""} ${(input.features || []).join(" ")}`.toLowerCase();

  if (hasAny(haystack, ["game", "gameplay", "player", "level", "combat", "boss", "physics", "rpg", "shooter", "platformer", "roguelike", "roguelite", "action", "simulator", "enemy"])) {
    return "game";
  }

  if (hasAny(haystack, ["investment", "investing", "portfolio", "stocks", "trading", "equity", "asset", "finance", "fintech", "wealth", "market data", "broker", "crypto research"])) {
    return "fintech_investment";
  }

  if (hasAny(haystack, ["developer", "devtools", "api", "sdk", "cli", "debug", "debugging", "observability", "monitoring", "logs", "tracing", "infrastructure", "deployment", "testing", "developer tool"])) {
    return "devtools_it";
  }

  if (hasAny(haystack, ["ai", "agent", "agents", "automation", "chatbot", "copilot", "assistant", "llm", "prompt", "workflow"])) {
    return "ai_native";
  }

  if (hasAny(haystack, ["marketplace", "buyer", "seller", "vendor", "freelancer", "booking", "gig", "two-sided"])) {
    return "marketplace";
  }

  if (hasAny(haystack, ["creator", "newsletter", "audience", "content", "video", "streamer", "podcast"])) {
    return "creator";
  }

  if (hasAny(haystack, ["operations", "workflow", "dashboard", "field team", "backoffice", "approval", "crm", "erp", "ticketing"])) {
    return "ops_workflow";
  }

  if (hasAny(haystack, ["consumer", "social", "habit", "dating", "family", "mobile app", "community"])) {
    return "consumer";
  }

  return "general";
}

export function isAiNativeDomain(domain: IdeaDomain) {
  return domain === "ai_native";
}

export function isGameDomain(domain: IdeaDomain) {
  return domain === "game";
}
