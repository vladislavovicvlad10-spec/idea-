"use server";

import { db } from "@/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { Idea } from "@/components/idea-card";

export async function saveIdeaForSharing(idea: Idea): Promise<string> {
  // Generate a stable ID from the idea name
  const id = Buffer.from(idea.name).toString("base64url").slice(0, 20);
  const ref = doc(db, "shared_ideas", id);
  
  const existing = await getDoc(ref);
  if (!existing.exists()) {
    await setDoc(ref, {
      ...idea,
      createdAt: new Date().toISOString(),
    });
  }
  
  return id;
}

export async function getSharedIdea(id: string): Promise<Idea | null> {
  try {
    const ref = doc(db, "shared_ideas", id);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    return snap.data() as Idea;
  } catch {
    return null;
  }
}
