import { cert, getApp, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { hasServiceAccountCredentials, serverConfig } from "@/server/config";

const adminApp = getApps().length
  ? getApp()
  : initializeApp(
      hasServiceAccountCredentials()
        ? {
            credential: cert({
              projectId: serverConfig.firebaseProjectId,
              clientEmail: serverConfig.firebaseClientEmail,
              privateKey: serverConfig.firebasePrivateKey,
            }),
          }
        : {
            projectId: serverConfig.firebaseProjectId,
          }
    );

export const adminAuth = getAuth(adminApp);
export const adminDb = getFirestore(adminApp);
