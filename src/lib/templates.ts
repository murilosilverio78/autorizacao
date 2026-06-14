import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export type Template = {
  id: string;
  userId: string;
  nome: string;
  textoFixo: string;
  criadoEm: string;
};

export type TemplateInput = {
  nome: string;
  textoFixo: string;
};

const COLLECTION_NAME = "templates";

function toTemplate(id: string, data: Record<string, unknown>): Template {
  return {
    id,
    userId: String(data.userId ?? ""),
    nome: String(data.nome ?? ""),
    textoFixo: String(data.textoFixo ?? ""),
    criadoEm: String(data.criadoEm ?? ""),
  };
}

export async function getTemplates(userId: string): Promise<Template[]> {
  const templatesQuery = query(
    collection(db, COLLECTION_NAME),
    where("userId", "==", userId),
  );
  const snapshot = await getDocs(templatesQuery);

  return snapshot.docs
    .map((document) => toTemplate(document.id, document.data()))
    .sort((a, b) => b.criadoEm.localeCompare(a.criadoEm));
}

export async function createTemplate(
  data: TemplateInput,
  userId: string,
): Promise<string> {
  const document = await addDoc(collection(db, COLLECTION_NAME), {
    ...data,
    userId,
    criadoEm: new Date().toISOString(),
  });

  return document.id;
}

export async function deleteTemplate(
  id: string,
  userId: string,
): Promise<void> {
  const templateRef = doc(db, COLLECTION_NAME, id);
  const snapshot = await getDoc(templateRef);

  if (!snapshot.exists() || snapshot.data().userId !== userId) {
    throw new Error("Template nao encontrado");
  }

  await deleteDoc(templateRef);
}
