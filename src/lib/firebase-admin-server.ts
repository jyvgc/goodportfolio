import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

// Import only from server routes. Never import this module in client components.
export function getAdminServices() {
  const name = "goodportfolio-server";
  let app = getApps().find((item) => item.name === name);
  if (!app) {
    const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n");
    if (!projectId || !clientEmail || !privateKey) throw new Error("Server credentials unavailable");
    app = initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) }, name);
  }
  return { adminAuth: getAuth(app), adminDb: getFirestore(app) };
}
