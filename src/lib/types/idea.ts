export interface Idea {
  id?: string;
  name: string;
  description: string;
  problem?: string;
  audience?: string;
  valueProposition?: string;
  coreTwist?: string;
  noveltyReason?: string;
  antiCloneNote?: string;
  features: string[];
  businessDetails?: {
    targetAudience: string;
    monetization: string;
    uniqueness: string;
    marketPerspective?: string;
    mainRisks?: string;
    technicalRisks?: string;
    v1Cut?: string;
  };
  techStack?: {
    steps: { title: string; description: string }[];
    recommendedDatabase?: string;
    backendRuntime?: string;
    frontendStack?: string;
    keyLibraries?: string[];
    infrastructureServices?: string[];
    backgroundJobs?: string;
    searchStrategy?: string;
    realtimeStrategy?: string;
    storageStrategy?: string;
    authStrategy?: string;
    billingStrategy?: string;
    complianceNotes?: string;
    deploymentModel?: string;
    cachingStrategy?: string;
    queueStrategy?: string;
    observabilityStrategy?: string;
    failureHandling?: string;
    reasoning?: string;
    archSections?: { title: string; content: string }[];
    bottlenecks?: { trigger: string; component: string; migrationPath: string }[];
  };
}
