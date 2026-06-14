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

export type Aluno = {
  id: string;
  userId: string;
  nomeCompleto: string;
  dataNascimento: string;
  naturalidade: string;
  rg: string;
  rgOrgaoExpedidor: string;
  rgDataExpedicao: string;
  cpf: string;
  endereco: string;
  cidade: string;
  uf: string;
  criadoEm: string;
  atualizadoEm: string;
};

export type AlunoInput = Omit<
  Aluno,
  "id" | "userId" | "criadoEm" | "atualizadoEm"
>;

const COLLECTION_NAME = "alunos";

function toAluno(id: string, data: Record<string, unknown>): Aluno {
  return {
    id,
    userId: String(data.userId ?? ""),
    nomeCompleto: String(data.nomeCompleto ?? ""),
    dataNascimento: String(data.dataNascimento ?? ""),
    naturalidade: String(data.naturalidade ?? ""),
    rg: String(data.rg ?? ""),
    rgOrgaoExpedidor: String(data.rgOrgaoExpedidor ?? ""),
    rgDataExpedicao: String(data.rgDataExpedicao ?? ""),
    cpf: String(data.cpf ?? ""),
    endereco: String(data.endereco ?? ""),
    cidade: String(data.cidade ?? ""),
    uf: String(data.uf ?? ""),
    criadoEm: String(data.criadoEm ?? ""),
    atualizadoEm: String(data.atualizadoEm ?? ""),
  };
}

export async function getAlunos(userId: string): Promise<Aluno[]> {
  const alunosQuery = query(
    collection(db, COLLECTION_NAME),
    where("userId", "==", userId),
  );
  const snapshot = await getDocs(alunosQuery);

  return snapshot.docs
    .map((document) => toAluno(document.id, document.data()))
    .sort((a, b) => a.nomeCompleto.localeCompare(b.nomeCompleto));
}

export async function getAluno(
  id: string,
  userId: string,
): Promise<Aluno | null> {
  const alunoRef = doc(db, COLLECTION_NAME, id);
  const snapshot = await getDoc(alunoRef);

  if (!snapshot.exists()) {
    return null;
  }

  const aluno = toAluno(snapshot.id, snapshot.data());

  if (aluno.userId !== userId) {
    return null;
  }

  return aluno;
}

export async function createAluno(
  data: AlunoInput,
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

export async function updateAluno(
  id: string,
  data: AlunoInput,
  userId: string,
): Promise<void> {
  const aluno = await getAluno(id, userId);

  if (!aluno) {
    throw new Error("Aluno nao encontrado");
  }

  await updateDoc(doc(db, COLLECTION_NAME, id), {
    ...data,
    atualizadoEm: new Date().toISOString(),
  });
}

export async function deleteAluno(
  id: string,
  userId: string,
): Promise<void> {
  const aluno = await getAluno(id, userId);

  if (!aluno) {
    throw new Error("Aluno nao encontrado");
  }

  await deleteDoc(doc(db, COLLECTION_NAME, id));
}
