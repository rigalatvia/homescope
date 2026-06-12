import { getAuth } from "firebase-admin/auth";
import { getFirebaseAdminApp } from "@/lib/firebase/admin";

export interface AuthenticatedUser {
  uid: string;
  email: string | null;
}

export async function getAuthenticatedUser(request: Request): Promise<AuthenticatedUser | null> {
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return null;

  const token = header.slice("Bearer ".length).trim();
  if (!token) return null;

  try {
    const decoded = await getAuth(getFirebaseAdminApp()).verifyIdToken(token);
    return {
      uid: decoded.uid,
      email: typeof decoded.email === "string" ? decoded.email : null
    };
  } catch (error) {
    console.error("[auth] Failed to verify Firebase ID token", error);
    return null;
  }
}
