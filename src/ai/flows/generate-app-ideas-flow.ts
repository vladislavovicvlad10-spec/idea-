import { z } from "genkit";
import { generateWithRotation } from "../genkit";
import { IdeaDomain, classifyIdeaDomain, isGameDomain } from "../domain";

const FAST_GENERATION_MODEL = process.env.GROQ_FAST_MODEL || "llama-3.1-8b-instant";

const OutputSchema = z.object({
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

function getPrompt(theme: string, lang: string, domainOverride?: IdeaDomain) {
  const outputLanguage =
    lang === "uk" ? "Ukrainian" :
    lang === "ru" ? "Russian" :
    "English";
  const domain = domainOverride || classifyIdeaDomain({ theme });

  if (isGameDomain(domain)) {
    return `Invent exactly 3 original video game concepts based on: "${theme}".

Write all text content in ${outputLanguage}. Keep the game title in English and brandable.

This is strictly a game, not a platform, SaaS product, social network, creator tool, or startup app.

Forbidden:
- graph, network, web, node-link, or relationship-map mechanics
- slow atmospheric exploration as the main loop
- passive narrative discovery as the core experience
- copying existing exploration-puzzle formulas
- SaaS-style technology thinking, business software mechanics, or startup-marketplace framing
- repeating the same mechanic family across multiple ideas
- waves of enemies
- bosses as a default climax structure
- standard linear level progression as the main structure
- combining existing genres in a predictable way without a new central interaction model
- controlling a character in a fully standard way as the main novelty
- default progression structures such as classic upgrades, skill trees, or familiar power escalation
- obvious time-control, gravity-control, or sound-control reskins unless the mechanic has a new behavioral rule

Required:
- active real-time player interaction
- physics, timing, dexterity, spatial skill, combat pressure, or strong decision pressure
- a clear gameplay loop
- strong replayability, mastery, or "one more run" energy
- a core mechanic that changes how the player acts moment to moment
- the concept must feel fun to play, not just interesting to describe
- each of the 3 ideas must belong to a meaningfully different gameplay pattern or genre feel
- avoid making all 3 ideas atmospheric, reflective, puzzle-heavy, or abstract
- each idea must revolve around one strange central mechanic, rule change, or control twist
- the central mechanic must be the heart of the game, not one feature among many
- the player should react with "what is this, but I want to try it"
- the mechanic must change habitual player behavior, not just add a power
- the player should initially feel mild discomfort or confusion, then learn the logic and enjoy mastering it
- keep the idea minimal: one twist, one rule, one loop
- each idea must define one explicit coreTwist
- each idea must define one explicit noveltyReason that explains why it is not just a known gimmick
- each idea must define one explicit antiCloneNote naming the clone trap the concept avoids
- each idea must use a slightly different voice and structure from the others while staying professional

Output rules:
1. Return exactly 3 game ideas in the same JSON schema.
2. Each description must describe the fantasy, the mechanic, and how a normal session feels to play.
3. problem must describe what unusual pressure, cognitive shift, or behavioral tension the player is constantly solving in moment-to-moment gameplay.
4. audience should describe the kind of players who would actually enjoy this game.
5. valueProposition should explain why this feels fresh compared to existing games.
6. coreTwist must be 18-40 words and describe the one rule that makes the game feel strange.
7. noveltyReason must be 22-55 words and explain why the concept is not just a remix of an obvious existing mechanic family.
8. antiCloneNote must be 18-45 words and explicitly name the clone trap this idea avoids.
9. features must be gameplay consequences, rule interactions, progression effects, or skill-based systems that grow out of the one central mechanic, not a random pile of features.
10. Every feature must describe a concrete player action, reaction, or system consequence. Avoid generic phrases like provides a platform, is designed to, offers a solution, enhances the experience, or connects players.
10. Do not include monetization, SaaS concepts, collaboration dashboards, payment systems, Stripe, Elasticsearch, Neo4j, or other business-software leftovers.
11. Each description should mention at least one internal mechanism or rule interaction, not only surface fantasy.
12. Before finalizing, internally verify that the 3 concepts do not share the same core mechanic pattern, same sentence rhythm, or same pitch structure.
13. Avoid making the game sound comfortable, familiar, or genre-standard. Make it strange but playable.

Return valid JSON only.`;
  }

  const domainNotes = {
    fintech_investment: `
14. For investment or fintech themes, ideas must mention trusted data sources, compliance boundaries, explainability limits, and why users would trust the product.
15. Avoid fake alpha, guaranteed returns, or magical investing claims.`,
    devtools_it: `
14. For IT or developer-tool themes, ideas must think in terms of developer workflow, API-first usage, integrations, logs/metrics, auth tokens, DX, and adoption friction.
15. Avoid turning devtools ideas into generic dashboards without a clear workflow wedge.`,
    marketplace: `
14. For marketplaces, ideas must consider liquidity, trust, onboarding, and why the marketplace can reach useful supply and demand.
15. Do not default to community-driven, moderation-heavy, or user-generated-content patterns unless they are truly essential to the product.`,
    consumer: `
14. For consumer themes, ideas must consider habit loops, retention, social spread, or reasons the app stays engaging after the first session.`,
    creator: `
14. For creator-economy themes, ideas must consider audience growth, retention, monetization leverage, and workflow pain for creators.`,
    ops_workflow: `
14. For workflow or ops themes, ideas must focus on bottlenecks, approvals, coordination, manual repetition, and measurable operational value.`,
    general: "",
    ai_native: "",
    game: "",
  } as const;

  return `Generate exactly 3 startup ideas for a solo developer based on: "${theme}".

Write all text content in ${outputLanguage}. Keep project names in English and brandable.

Your goal is not to produce safe or familiar startups. Produce 3 ideas that each feel strange, almost wrong, or unnecessary at first, but become obviously valuable when explained well.

Realism rules:
1. The idea must be realistic for one developer with a near-zero budget MVP.
2. Prefer simple products with a clear user flow over impressive-sounding but fragile concepts.
3. Do not use blockchain, crypto, Web3, tokens, NFTs, or wallets unless the theme explicitly requires them.
4. Do not mention homomorphic encryption, tamper-proof systems, decentralized storage, on-chain trust, or other advanced concepts unless they are strictly necessary and clearly justified.
5. Avoid AI startup generator cliches: no vague claims about revolutionizing industries, frictionless ecosystems, or trust through blockchain.
6. The generator must work across any domain, not only SaaS. If the theme suggests investing, finance, healthcare, legal, logistics, education, developer tools, creator economy, or consumer apps, the idea should reflect the real constraints of that domain.${domainNotes[domain]}
7. Each idea should change user behavior, create a new habit, or unlock an unexpected workflow, not just digitize an existing process.
8. Each idea should feel surprising but defensible.
9. Each idea must contain one explicit weird-but-useful rule that makes the product feel unlike a category clone.
10. Each of the 3 ideas must use a meaningfully different writing cadence or framing while staying concise and professional.

Forbidden:
11. AI chatbots or companionship bots
12. HR or recruiting platforms
13. text generators, writing assistants, or generic content copilots
14. classic B2B SaaS dashboards with routine CRUD workflows
15. AI copilot for X unless the idea clearly changes behavior instead of summarizing or chatting
16. overengineered MVP infrastructure or stacks chosen by habit instead of need
17. direct clones of obvious incumbents with only simpler, cheaper, or AI-powered as differentiation
18. defaulting to community-driven, user-generated, moderation-heavy, or social-feed patterns as a lazy source of retention unless the theme clearly demands it
19. generic AI language such as provides a unique platform, is designed to, offers a solution, enhances the experience, or connects users

Output rules:
20. Return exactly 3 ideas in the same JSON schema.
21. Each idea must include exactly these fields: name, description, problem, audience, valueProposition, coreTwist, noveltyReason, antiCloneNote, features.
22. Description must be substantial but focused: around 160-260 words split into exactly 2 or 3 short paragraphs.
23. problem must explain the pain point in 35-70 words and must describe a real behavioral, operational, or emotional friction.
24. audience must explain the main user segment in 20-45 words and be specific, not everyone or businesses.
25. valueProposition must explain why the product can win in 35-70 words, including one realistic advantage or tradeoff compared to existing alternatives.
26. coreTwist must be 18-40 words and state the strange but useful rule that changes user behavior.
27. noveltyReason must be 22-55 words and explain why the idea is not just a clone of a known category.
28. antiCloneNote must be 18-45 words and explicitly state the obvious incumbent or clone trap this idea avoids.
29. Each idea must include exactly 5 concrete features, and each feature should describe a real user action, system response, or internal mechanism rather than abstract benefits.
30. Do not include tech stack, architecture, or tool recommendations in this step.
31. Make the tone direct, concrete, and specific. Avoid generic startup phrasing.
32. The 3 ideas must be materially different from each other in behavior change, product shape, market wedge, and pitch style.

Before finalizing, internally check:
- Do all 3 ideas feel a little strange at first?
- Do all 3 become clearly valuable after explanation?
- Did I avoid defaulting to AI SaaS, HR tools, text generation, or generic dashboards?
- Did I avoid unnecessary Web3 or overengineered buzzwords?
- Are the 3 ideas materially different from each other?
- Does each idea have one weird rule that would make a user change behavior?
- Did I explicitly reject the easiest incumbent-clone version of the idea?
- Did I avoid falling back to community, moderation, or user-generated-content loops unless the theme truly requires them?
- Did I avoid generic startup phrasing and describe concrete user actions instead?
- Did I explain at least one internal mechanism instead of only the surface benefit?

Return valid JSON only.`;
}

export const generateAppIdeasFlow = async (input: { themeOrKeywords: string; lang?: string; domain?: IdeaDomain }) => {
  return generateWithRotation(async (ai, model) => {
    const lang = input.lang || "ru";

    const result = await ai.generate({
      model,
      prompt: getPrompt(input.themeOrKeywords, lang, input.domain),
      config: {
        temperature: 0.9,
        topP: 0.92,
        maxOutputTokens: 3200,
      },
      output: {
        schema: OutputSchema,
      },
    });

    return result.output as z.infer<typeof OutputSchema>;
  }, FAST_GENERATION_MODEL);
};
