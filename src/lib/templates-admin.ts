import { adminDb } from "@/lib/firebase-admin";
import type { Template, TemplateInput } from "@/lib/templates";

const COLLECTION_NAME = "templates";

function toTemplate(id: string, data: FirebaseFirestore.DocumentData): Template {
  return {
    id,
    userId: String(data.userId ?? ""),
    nome: String(data.nome ?? ""),
    textoFixo: String(data.textoFixo ?? ""),
    criadoEm: String(data.criadoEm ?? ""),
  };
}

export async function createTemplateAdmin(
  data: TemplateInput,
  userId: string,
): Promise<string> {
  const document = await adminDb.collection(COLLECTION_NAME).add({
    ...data,
    userId,
    criadoEm: new Date().toISOString(),
  });

  return document.id;
}

export async function getTemplatesAdmin(userId: string): Promise<Template[]> {
  const snapshot = await adminDb
    .collection(COLLECTION_NAME)
    .where("userId", "==", userId)
    .get();

  return snapshot.docs
    .map((document) => toTemplate(document.id, document.data()))
    .sort((a, b) => b.criadoEm.localeCompare(a.criadoEm));
}

export async function deleteTemplateAdmin(
  id: string,
  userId: string,
): Promise<void> {
  const templateRef = adminDb.collection(COLLECTION_NAME).doc(id);
  const snapshot = await templateRef.get();

  if (!snapshot.exists || snapshot.data()?.userId !== userId) {
    throw new Error("Template nao encontrado");
  }

  await templateRef.delete();
}
