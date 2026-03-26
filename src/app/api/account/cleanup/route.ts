import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/firebase/admin";
import type { QueryDocumentSnapshot } from "firebase-admin/firestore";

function getBearerToken(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  return authHeader.slice("Bearer ".length).trim();
}

export async function POST(request: Request) {
  try {
    const idToken = getBearerToken(request);
    if (!idToken) {
      return NextResponse.json({ success: false }, { status: 401 });
    }

    const decoded = await adminAuth.verifyIdToken(idToken);
    const uid = decoded.uid;

    const bookmarksSnap = await adminDb.collection("users").doc(uid).collection("bookmarks").get();
    const batch = adminDb.batch();
    bookmarksSnap.docs.forEach((bookmarkDoc: QueryDocumentSnapshot) => batch.delete(bookmarkDoc.ref));
    batch.delete(adminDb.collection("users").doc(uid));
    await batch.commit();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("ACCOUNT_CLEANUP_ERROR:", error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
