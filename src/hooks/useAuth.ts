import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";
import { createUserDoc } from "@/lib/firestore";
import type { UserRole } from "@/types";

export function useAuth() {
  // 이메일 회원가입
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
      isApproved: role === "student", // 학생은 자동승인, 기업은 관리자 승인 필요
    });
    return cred.user;
  }

  // 이메일 로그인
  async function loginWithEmail(email: string, password: string) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  // Google 로그인
  async function loginWithGoogle(role: UserRole = "student") {
    const cred = await signInWithPopup(auth, googleProvider);
    const user = cred.user;

    // 기존 계정 없으면 생성
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

  // 로그아웃
  async function logout() {
    await signOut(auth);
  }

  return { registerWithEmail, loginWithEmail, loginWithGoogle, logout };
}
