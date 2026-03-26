import { collection, getDocs, writeBatch, doc } from "firebase/firestore";
import { db } from "@/firebase";

export async function deleteUserBookmarksClient(uid: string) {
  const snapshot = await getDocs(collection(db, "users", uid, "bookmarks"));
  if (snapshot.empty) return;

  const batch = writeBatch(db);
  snapshot.docs.forEach((bookmarkDoc) => batch.delete(bookmarkDoc.ref));
  await batch.commit();
}

export async function countUserBookmarks(uid: string) {
  const snapshot = await getDocs(collection(db, "users", uid, "bookmarks"));
  return snapshot.size;
}

export function userDocRef(uid: string) {
  return doc(db, "users", uid);
}
