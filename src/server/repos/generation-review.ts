import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/firebase";

type ReviewIdea = {
  name: string;
  description: string;
  problem: string;
  audience: string;
  valueProposition: string;
  features: string[];
};

export async function logGenerationReviewSample(params: {
  theme: string;
  lang: string;
  domain: string;
  ideas: ReviewIdea[];
}) {
  const { theme, lang, domain, ideas } = params;

  await addDoc(collection(db, "generation_reviews"), {
    theme,
    lang,
    domain,
    ideas,
    source: "auto",
    reviewStatus: "pending",
    reviewTags: [],
    createdAt: serverTimestamp(),
  });
}

export async function logGenerationReviewFailure(params: {
  theme: string;
  lang: string;
  domain: string;
  error: string;
}) {
  const { theme, lang, domain, error } = params;

  await addDoc(collection(db, "generation_reviews"), {
    theme,
    lang,
    domain,
    source: "auto",
    reviewStatus: "error",
    reviewTags: ["generation_failure"],
    error,
    createdAt: serverTimestamp(),
  });
}
