import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  updateProfile,
} from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";
import { createUserDoc } from "@/lib/firestore";
import type { UserRole } from "@/types";

export function useAuth() {
  async function registerWithEmail(
    email: string,
    password: string,
    displayName: string,
    role: UserRole
  ) {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName });
    await createUserDoc(cred.user.uid, {
      uid: cred.user.uid,
      email,
      displayName,
      role,
      profileImage: "",
      isApproved: role === "student",
    });
    return cred.user;
  }

  async function loginWithEmail(email: string, password: string) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  async function loginWithGoogle(role: UserRole = "student") {
    sessionStorage.setItem("google_login_role", role);
    await signInWithRedirect(auth, googleProvider);
  }

  async function handleRedirectResult() {
    const result = await getRedirectResult(auth);
    if (!result) return null;
    const user = result.user;
    const role = (sessionStorage.getItem("google_login_role") as UserRole) ?? "student";
    sessionStorage.removeItem("google_login_role");
    const { getUserDoc } = await import("@/lib/firestore");
    const existing = await getUserDoc(user.uid);
    if (!existing) {
      await createUserDoc(user.uid, {
        uid: user.uid,
        email: user.email ?? "",
        displayName: user.displayName ?? "",
        role,
        profileImage: user.photoURL ?? "",
        isApproved: role === "student",
      });
    }
    return user;
  }

  async function logout() {
    await signOut(auth);
  }

  return { registerWithEmail, loginWithEmail, loginWithGoogle, handleRedirectResult, logout };
}
