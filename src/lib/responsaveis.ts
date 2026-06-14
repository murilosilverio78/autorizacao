import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export type Qualidade =
  | "MAE"
  | "PAI"
  | "TUTOR"
  | "GUARDIAO"
  | "REPRESENTANTE_LEGAL";

export type Responsavel = {
  id: string;
  userId: string;
  nomeCompleto: string;
  rg: string;
  rgOrgaoExpedidor: string;
  rgDataExpedicao: string;
  cpf: string;
  endereco: string;
  cidade: string;
  uf: string;
  telefone: string;
  qualidade: Qualidade;
  criadoEm: string;
  atualizadoEm: string;
};

export type ResponsavelInput = Omit<
  Responsavel,
  "id" | "userId" | "criadoEm" | "atualizadoEm"
>;

const COLLECTION_NAME = "responsaveis";

function toResponsavel(id: string, data: Record<string, unknown>): Responsavel {
  return {
    id,
    userId: String(data.userId ?? ""),
    nomeCompleto: String(data.nomeCompleto ?? ""),
    rg: String(data.rg ?? ""),
    rgOrgaoExpedidor: String(data.rgOrgaoExpedidor ?? ""),
    rgDataExpedicao: String(data.rgDataExpedicao ?? ""),
    cpf: String(data.cpf ?? ""),
    endereco: String(data.endereco ?? ""),
    cidade: String(data.cidade ?? ""),
    uf: String(data.uf ?? ""),
    telefone: String(data.telefone ?? ""),
    qualidade: data.qualidade as Qualidade,
    criadoEm: String(data.criadoEm ?? ""),
    atualizadoEm: String(data.atualizadoEm ?? ""),
  };
}

export async function getResponsaveis(
  userId: string,
): Promise<Responsavel[]> {
  const responsaveisQuery = query(
    collection(db, COLLECTION_NAME),
    where("userId", "==", userId),
  );
  const snapshot = await getDocs(responsaveisQuery);

  return snapshot.docs
    .map((document) => toResponsavel(document.id, document.data()))
    .sort((a, b) => a.nomeCompleto.localeCompare(b.nomeCompleto));
}

export async function getResponsavel(
  id: string,
  userId: string,
): Promise<Responsavel | null> {
  const responsavelRef = doc(db, COLLECTION_NAME, id);
  const snapshot = await getDoc(responsavelRef);

  if (!snapshot.exists()) {
    return null;
  }

  const responsavel = toResponsavel(snapshot.id, snapshot.data());

  if (responsavel.userId !== userId) {
    return null;
  }

  return responsavel;
}

export async function createResponsavel(
  data: ResponsavelInput,
  userId: string,
): Promise<string> {
  const now = new Date().toISOString();
  const document = await addDoc(collection(db, COLLECTION_NAME), {
    ...data,
    userId,
    criadoEm: now,
    atualizadoEm: now,
  });

  return document.id;
}

export async function updateResponsavel(
  id: string,
  data: ResponsavelInput,
  userId: string,
): Promise<void> {
  const responsavel = await getResponsavel(id, userId);

  if (!responsavel) {
    throw new Error("Responsavel nao encontrado");
  }

  await updateDoc(doc(db, COLLECTION_NAME, id), {
    ...data,
    atualizadoEm: new Date().toISOString(),
  });
}

export async function deleteResponsavel(
  id: string,
  userId: string,
): Promise<void> {
  const responsavel = await getResponsavel(id, userId);

  if (!responsavel) {
    throw new Error("Responsavel nao encontrado");
  }

  await deleteDoc(doc(db, COLLECTION_NAME, id));
}
