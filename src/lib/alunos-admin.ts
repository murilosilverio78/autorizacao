import { adminDb } from "@/lib/firebase-admin";
import type { Aluno } from "@/lib/alunos";

const COLLECTION_NAME = "alunos";

function toAluno(id: string, data: FirebaseFirestore.DocumentData): Aluno {
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

export async function getAlunoAdmin(
  id: string,
  userId: string,
): Promise<Aluno | null> {
  const snapshot = await adminDb.collection(COLLECTION_NAME).doc(id).get();

  if (!snapshot.exists) {
    return null;
  }

  const aluno = toAluno(snapshot.id, snapshot.data() ?? {});

  if (aluno.userId !== userId) {
    return null;
  }

  return aluno;
}
