import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

let appInstance: App | null = null;

function getRequiredEnv(name: "FIREBASE_PROJECT_ID" | "FIREBASE_CLIENT_EMAIL" | "FIREBASE_PRIVATE_KEY"): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required Firebase env var: ${name}`);
  }
  return value;
}

export function getFirebaseAdminApp(): App {
  if (appInstance) return appInstance;

  if (getApps().length > 0) {
    appInstance = getApps()[0]!;
    return appInstance;
  }

  const projectId = getRequiredEnv("FIREBASE_PROJECT_ID");
  const clientEmail = getRequiredEnv("FIREBASE_CLIENT_EMAIL");
  const privateKey = getRequiredEnv("FIREBASE_PRIVATE_KEY").replace(/\\n/g, "\n");

  appInstance = initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey
    })
  });

  return appInstance;
}

export function getFirebaseAdminFirestore(): Firestore {
  return getFirestore(getFirebaseAdminApp());
}
