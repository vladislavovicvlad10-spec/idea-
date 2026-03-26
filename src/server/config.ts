function getRequiredEnv(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

function normalizePrivateKey(value: string | undefined): string | undefined {
  return value?.replace(/\\n/g, "\n");
}

export const serverConfig = {
  adminEmail: getRequiredEnv("ADMIN_EMAIL"),
  firebaseProjectId:
    getRequiredEnv("FIREBASE_PROJECT_ID") ||
    getRequiredEnv("NEXT_PUBLIC_FIREBASE_PROJECT_ID"),
  firebaseClientEmail: getRequiredEnv("FIREBASE_CLIENT_EMAIL"),
  firebasePrivateKey: normalizePrivateKey(getRequiredEnv("FIREBASE_PRIVATE_KEY")),
};

export function hasServiceAccountCredentials() {
  return Boolean(
    serverConfig.firebaseProjectId &&
    serverConfig.firebaseClientEmail &&
    serverConfig.firebasePrivateKey
  );
}
