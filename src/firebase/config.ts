// Next.js replacement for NEXT_PUBLIC_ variables ONLY works with literal access:
// process.env.NEXT_PUBLIC_VAR. Dynamic access process.env[name] fails on client.

export const firebaseConfig = {
  apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY            || "dummy-key-to-allow-render",
  authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN        || "dummy-domain.firebaseapp.com",
  projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID         || "dummy-project",
  storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET     || "dummy-project.appspot.com",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "000000000000",
  appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID             || "1:000000000000:web:dummy12345",
};
