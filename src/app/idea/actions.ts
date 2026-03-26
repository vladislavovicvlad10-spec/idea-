"use server";

import { randomUUID } from "crypto";
import { db } from "@/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { Idea } from "@/lib/types/idea";

const MAX_NAME_LEN = 200;
const MAX_DESC_LEN = 5000;
const MAX_SHORT_SECTION_LEN = 1200;
const MAX_FEATURES = 10;
const MAX_FEATURE_LEN = 300;
const MAX_SECTION_LEN = 3000;
const MAX_STEPS = 12;
const MAX_STEP_TITLE_LEN = 200;
const MAX_STEP_DESC_LEN = 1000;
const MAX_BOTTLENECKS = 5;

function trimString(value: unknown, maxLen: number): string {
  return typeof value === "string" ? value.trim().slice(0, maxLen) : "";
}

export async function saveIdeaForSharing(idea: Idea): Promise<string> {
  if (!idea?.name || typeof idea.name !== "string" || idea.name.trim().length === 0) {
    throw new Error("Invalid idea: name is required");
  }

  const safeIdea: Idea & { updatedAt: string } = {
    name: idea.name.trim().slice(0, MAX_NAME_LEN),
    description: trimString(idea.description, MAX_DESC_LEN),
    problem: trimString(idea.problem, MAX_SHORT_SECTION_LEN) || undefined,
    audience: trimString(idea.audience, MAX_SHORT_SECTION_LEN) || undefined,
    valueProposition: trimString(idea.valueProposition, MAX_SHORT_SECTION_LEN) || undefined,
    coreTwist: trimString(idea.coreTwist, MAX_SHORT_SECTION_LEN) || undefined,
    noveltyReason: trimString(idea.noveltyReason, MAX_SHORT_SECTION_LEN) || undefined,
    antiCloneNote: trimString(idea.antiCloneNote, MAX_SHORT_SECTION_LEN) || undefined,
    features: Array.isArray(idea.features)
      ? idea.features.slice(0, MAX_FEATURES).map((feature) => trimString(feature, MAX_FEATURE_LEN))
      : [],
    businessDetails: idea.businessDetails ? {
      targetAudience: trimString(idea.businessDetails.targetAudience, MAX_SECTION_LEN),
      monetization: trimString(idea.businessDetails.monetization, MAX_SECTION_LEN),
      uniqueness: trimString(idea.businessDetails.uniqueness, MAX_SECTION_LEN),
      marketPerspective: trimString(idea.businessDetails.marketPerspective, MAX_SECTION_LEN) || undefined,
      mainRisks: trimString(idea.businessDetails.mainRisks, MAX_SECTION_LEN) || undefined,
      technicalRisks: trimString(idea.businessDetails.technicalRisks, MAX_SECTION_LEN) || undefined,
      v1Cut: trimString(idea.businessDetails.v1Cut, MAX_SECTION_LEN) || undefined,
    } : undefined,
    techStack: idea.techStack ? {
      steps: Array.isArray(idea.techStack.steps)
        ? idea.techStack.steps.slice(0, MAX_STEPS).map((step) => ({
            title: trimString(step?.title, MAX_STEP_TITLE_LEN),
            description: trimString(step?.description, MAX_STEP_DESC_LEN),
          }))
        : [],
      recommendedDatabase: trimString(idea.techStack.recommendedDatabase, MAX_STEP_TITLE_LEN) || undefined,
      backendRuntime: trimString(idea.techStack.backendRuntime, MAX_STEP_TITLE_LEN) || undefined,
      frontendStack: trimString(idea.techStack.frontendStack, MAX_STEP_TITLE_LEN) || undefined,
      keyLibraries: Array.isArray(idea.techStack.keyLibraries)
        ? idea.techStack.keyLibraries.slice(0, MAX_STEPS).map((item) => trimString(item, MAX_STEP_TITLE_LEN))
        : undefined,
      infrastructureServices: Array.isArray(idea.techStack.infrastructureServices)
        ? idea.techStack.infrastructureServices.slice(0, MAX_STEPS).map((item) => trimString(item, MAX_STEP_TITLE_LEN))
        : undefined,
      backgroundJobs: trimString(idea.techStack.backgroundJobs, MAX_SECTION_LEN) || undefined,
      searchStrategy: trimString(idea.techStack.searchStrategy, MAX_SECTION_LEN) || undefined,
      realtimeStrategy: trimString(idea.techStack.realtimeStrategy, MAX_SECTION_LEN) || undefined,
      storageStrategy: trimString(idea.techStack.storageStrategy, MAX_SECTION_LEN) || undefined,
      authStrategy: trimString(idea.techStack.authStrategy, MAX_SECTION_LEN) || undefined,
      billingStrategy: trimString(idea.techStack.billingStrategy, MAX_SECTION_LEN) || undefined,
      complianceNotes: trimString(idea.techStack.complianceNotes, MAX_SECTION_LEN) || undefined,
      deploymentModel: trimString(idea.techStack.deploymentModel, MAX_SECTION_LEN) || undefined,
      cachingStrategy: trimString(idea.techStack.cachingStrategy, MAX_SECTION_LEN) || undefined,
      queueStrategy: trimString(idea.techStack.queueStrategy, MAX_SECTION_LEN) || undefined,
      observabilityStrategy: trimString(idea.techStack.observabilityStrategy, MAX_SECTION_LEN) || undefined,
      failureHandling: trimString(idea.techStack.failureHandling, MAX_SECTION_LEN) || undefined,
      reasoning: trimString(idea.techStack.reasoning, MAX_SECTION_LEN) || undefined,
      archSections: Array.isArray(idea.techStack.archSections)
        ? idea.techStack.archSections.slice(0, MAX_STEPS).map((section) => ({
            title: trimString(section?.title, MAX_STEP_TITLE_LEN),
            content: trimString(section?.content, MAX_SECTION_LEN),
          }))
        : undefined,
      bottlenecks: Array.isArray(idea.techStack.bottlenecks)
        ? idea.techStack.bottlenecks.slice(0, MAX_BOTTLENECKS).map((item) => ({
            trigger: trimString(item?.trigger, MAX_STEP_TITLE_LEN),
            component: trimString(item?.component, MAX_STEP_TITLE_LEN),
            migrationPath: trimString(item?.migrationPath, MAX_SECTION_LEN),
          }))
        : undefined,
    } : undefined,
    updatedAt: new Date().toISOString(),
  };

  const id = randomUUID();
  const ref = doc(db, "shared_ideas", id);

  await setDoc(ref, safeIdea);

  return id;
}

export async function getSharedIdea(id: string): Promise<Idea | null> {
  try {
    if (!id || typeof id !== "string" || id.length > 80) return null;
    const ref = doc(db, "shared_ideas", id);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    return snap.data() as Idea;
  } catch {
    return null;
  }
}
