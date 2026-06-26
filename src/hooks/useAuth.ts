import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
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

  async function logout() {
    await signOut(auth);
  }

  return { registerWithEmail, loginWithEmail, logout };
}
