import {
  doc, getDoc, setDoc, updateDoc, deleteDoc,
  collection, query, where, orderBy, limit,
  getDocs, addDoc, serverTimestamp, increment,
} from "firebase/firestore";
import { db } from "./firebase";
import type { UserDoc, StudentProfile, Work, Offer } from "@/types";

export async function getUserDoc(uid: string): Promise<UserDoc | null> {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? (snap.data() as UserDoc) : null;
}

export async function createUserDoc(uid: string, data: Partial<UserDoc>) {
  await setDoc(doc(db, "users", uid), {
    ...data, uid, isApproved: false, createdAt: serverTimestamp(),
  });
}

export async function getStudentProfile(uid: string): Promise<StudentProfile | null> {
  const snap = await getDoc(doc(db, "studentProfiles", uid));
  return snap.exists() ? (snap.data() as StudentProfile) : null;
}

export async function upsertStudentProfile(uid: string, data: Partial<StudentProfile>) {
  await setDoc(doc(db, "studentProfiles", uid), data, { merge: true });
}

export async function getPublicStudents() {
  try {
    const q = query(
      collection(db, "studentProfiles"),
      where("isPublic", "==", true),
      limit(20)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as StudentProfile);
  } catch {
    return [];
  }
}

export async function getWorksByAuthor(uid: string): Promise<Work[]> {
  try {
    const q = query(
      collection(db, "works"),
      where("authorUid", "==", uid),
      orderBy("order", "asc")
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Work));
  } catch {
    const q = query(collection(db, "works"), where("authorUid", "==", uid));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Work));
  }
}

export async function getPublicWorksByAuthor(uid: string): Promise<Work[]> {
  try {
    const q = query(
      collection(db, "works"),
      where("authorUid", "==", uid),
      where("isPublic", "==", true),
      orderBy("order", "asc")
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Work));
  } catch {
    const q = query(
      collection(db, "works"),
      where("authorUid", "==", uid),
      where("isPublic", "==", true)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Work));
  }
}

export async function createWork(data: Omit<Work, "id" | "createdAt" | "viewCount">) {
  const workData: any = {
    authorUid: data.authorUid,
    title: data.title,
    category: data.category,
    description: data.description,
    images: data.images,
    tools: data.tools,
    isFeatured: data.isFeatured,
    isPublic: data.isPublic,
    order: data.order,
    viewCount: 0,
    createdAt: serverTimestamp(),
  };
  if (data.videoUrl) workData.videoUrl = data.videoUrl;
  const ref = await addDoc(collection(db, "works"), workData);
  return ref.id;
}

export async function updateWork(id: string, data: Partial<Work>) {
  await updateDoc(doc(db, "works", id), data);
}

export async function deleteWork(id: string) {
  await deleteDoc(doc(db, "works", id));
}

export async function incrementWorkView(id: string) {
  await updateDoc(doc(db, "works", id), { viewCount: increment(1) });
}

export async function sendOffer(data: Omit<any, "id" | "createdAt" | "status">) {
  await addDoc(collection(db, "offers"), {
    ...data, status: "pending", createdAt: serverTimestamp(),
  });
}

export async function getOffersForStudent(uid: string): Promise<Offer[]> {
  try {
    const q = query(
      collection(db, "offers"),
      where("toStudentUid", "==", uid),
      orderBy("createdAt", "desc")
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Offer));
  } catch {
    const q = query(collection(db, "offers"), where("toStudentUid", "==", uid));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Offer));
  }
}

export async function getOffersFromCompany(uid: string): Promise<Offer[]> {
  try {
    const q = query(
      collection(db, "offers"),
      where("fromCompanyUid", "==", uid),
      orderBy("createdAt", "desc")
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Offer));
  } catch {
    const q = query(collection(db, "offers"), where("fromCompanyUid", "==", uid));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Offer));
  }
}

export async function respondToOffer(id: string, status: "accepted" | "declined") {
  await updateDoc(doc(db, "offers", id), { status, respondedAt: serverTimestamp() });
}
