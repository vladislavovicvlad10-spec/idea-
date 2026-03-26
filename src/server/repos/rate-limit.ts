import { doc, runTransaction, serverTimestamp, increment, Timestamp } from "firebase/firestore";
import { db } from "@/firebase";

export async function checkRateLimit(params: {
  ip: string;
  actionType: "gen" | "detail";
  limit: number;
  windowMs: number;
}): Promise<{ allowed: boolean; remainingMs: number }> {
  const { ip, actionType, limit, windowMs } = params;
  const now = Date.now();
  const rateLimitRef = doc(db, "rate_limits", `${actionType}_${ip.replace(/[/.]/g, "_")}`);

  try {
    return await runTransaction(db, async (transaction) => {
      const snap = await transaction.get(rateLimitRef);

      if (!snap.exists()) {
        transaction.set(rateLimitRef, {
          count: 1,
          resetAt: new Date(now + windowMs),
          updatedAt: serverTimestamp(),
        });
        return { allowed: true, remainingMs: 0 };
      }

      const data = snap.data();
      const resetAt =
        data.resetAt instanceof Timestamp
          ? data.resetAt.toDate().getTime()
          : new Date(data.resetAt).getTime();

      if (now > resetAt) {
        transaction.update(rateLimitRef, {
          count: 1,
          resetAt: new Date(now + windowMs),
          updatedAt: serverTimestamp(),
        });
        return { allowed: true, remainingMs: 0 };
      }

      if (data.count >= limit) {
        return { allowed: false, remainingMs: resetAt - now };
      }

      transaction.update(rateLimitRef, {
        count: increment(1),
        updatedAt: serverTimestamp(),
      });
      return { allowed: true, remainingMs: 0 };
    });
  } catch {
    return { allowed: true, remainingMs: 0 };
  }
}
