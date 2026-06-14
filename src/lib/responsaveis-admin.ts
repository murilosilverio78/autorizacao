import { adminDb } from "@/lib/firebase-admin";
import type { Qualidade, Responsavel } from "@/lib/responsaveis";

const COLLECTION_NAME = "responsaveis";

function toResponsavel(
  id: string,
  data: FirebaseFirestore.DocumentData,
): Responsavel {
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

export async function getResponsavelAdmin(
  id: string,
  userId: string,
): Promise<Responsavel | null> {
  const snapshot = await adminDb.collection(COLLECTION_NAME).doc(id).get();

  if (!snapshot.exists) {
    return null;
  }

  const responsavel = toResponsavel(snapshot.id, snapshot.data() ?? {});

  if (responsavel.userId !== userId) {
    return null;
  }

  return responsavel;
}
