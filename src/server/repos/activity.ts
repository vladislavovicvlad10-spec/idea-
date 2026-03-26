import { collection, addDoc, serverTimestamp, doc, getDoc, setDoc, updateDoc, increment } from "firebase/firestore";
import { db } from "@/firebase";

export async function logGenerationActivity(params: {
  theme: string;
  lang: string;
  count: number;
}) {
  const { theme, lang, count } = params;

  await addDoc(collection(db, "activity_logs"), {
    type: "generation",
    theme,
    lang,
    timestamp: serverTimestamp(),
    count,
  });

  const statsRef = doc(db, "stats", "global");
  const statsDoc = await getDoc(statsRef);

  if (!statsDoc.exists()) {
    await setDoc(statsRef, { totalGenerations: count });
    return;
  }

  await updateDoc(statsRef, {
    totalGenerations: increment(count),
  });
}
