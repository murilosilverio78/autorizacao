import { NextResponse } from "next/server";
import { getAlunoAdmin } from "@/lib/alunos-admin";
import { adminAuth } from "@/lib/firebase-admin";
import { getResponsavelAdmin } from "@/lib/responsaveis-admin";

const PYTHON_SERVICE_URL = "http://localhost:8000";
const SECRET = process.env.PYTHON_SERVICE_SECRET ?? "dev-secret";

const qualidadeMap: Record<string, string> = {
  MAE: "mãe",
  PAI: "pai",
  TUTOR: "tutor(a)",
  GUARDIAO: "guardião(ã)",
  REPRESENTANTE_LEGAL: "representante legal",
};

const monthNames = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
];

async function getUserId(request: Request) {
  const authorization = request.headers.get("authorization");
  const token = authorization?.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length)
    : null;

  if (!token) {
    return null;
  }

  const decodedToken = await adminAuth.verifyIdToken(token);
  return decodedToken.uid;
}

function formatCpf(cpf: string) {
  return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}

function formatTelefone(telefone: string) {
  const digits = telefone.replace(/\D/g, "");

  if (digits.length <= 10) {
    return digits.replace(/(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3");
  }

  return digits.replace(/(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3");
}

function getLocalDate() {
  const now = new Date();
  return `São Paulo, ${now.getDate()} de ${
    monthNames[now.getMonth()]
  } de ${now.getFullYear()}`;
}

function replacePlaceholders(
  textoFixo: string,
  responsavel: NonNullable<Awaited<ReturnType<typeof getResponsavelAdmin>>>,
  aluno: NonNullable<Awaited<ReturnType<typeof getAlunoAdmin>>>,
) {
  const values: Record<string, string> = {
    RESPONSAVEL_NOME: responsavel.nomeCompleto,
    RESPONSAVEL_RG: responsavel.rg,
    RESPONSAVEL_RG_ORGAO: responsavel.rgOrgaoExpedidor,
    RESPONSAVEL_RG_DATA: responsavel.rgDataExpedicao,
    RESPONSAVEL_CPF: formatCpf(responsavel.cpf),
    RESPONSAVEL_ENDERECO: responsavel.endereco,
    RESPONSAVEL_CIDADE: responsavel.cidade,
    RESPONSAVEL_UF: responsavel.uf,
    RESPONSAVEL_TELEFONE: formatTelefone(responsavel.telefone),
    RESPONSAVEL_QUALIDADE: qualidadeMap[responsavel.qualidade] ?? "",
    ALUNO_NOME: aluno.nomeCompleto,
    ALUNO_NASCIMENTO: aluno.dataNascimento,
    ALUNO_NATURALIDADE: aluno.naturalidade,
    ALUNO_RG: aluno.rg,
    ALUNO_RG_ORGAO: aluno.rgOrgaoExpedidor,
    ALUNO_RG_DATA: aluno.rgDataExpedicao,
    ALUNO_CPF: formatCpf(aluno.cpf),
    ALUNO_ENDERECO: aluno.endereco,
    ALUNO_CIDADE: aluno.cidade,
    ALUNO_UF: aluno.uf,
    LOCAL_DATA: getLocalDate(),
  };

  return textoFixo.replace(/{{([A-Z_]+)}}/g, (_, key: string) => {
    return values[key] ?? "";
  });
}

export async function POST(request: Request) {
  try {
    const userId = await getUserId(request);

    if (!userId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("arquivo");
    const responsavelId = String(formData.get("responsavelId") ?? "");
    const alunoId = String(formData.get("alunoId") ?? "");

    if (
      !(file instanceof File) ||
      file.type !== "application/pdf" ||
      !responsavelId ||
      !alunoId
    ) {
      return NextResponse.json(
        { error: "Dados obrigatórios ausentes" },
        { status: 400 },
      );
    }

    const [responsavel, aluno] = await Promise.all([
      getResponsavelAdmin(responsavelId, userId),
      getAlunoAdmin(alunoId, userId),
    ]);

    if (!responsavel || !aluno) {
      return NextResponse.json(
        { error: "Registro não encontrado" },
        { status: 404 },
      );
    }

    const pdfBase64 = Buffer.from(await file.arrayBuffer()).toString("base64");
    const response = await fetch(`${PYTHON_SERVICE_URL}/extrair`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-secret": SECRET,
      },
      body: JSON.stringify({ pdf_base64: pdfBase64 }),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Erro ao extrair texto do PDF" },
        { status: 502 },
      );
    }

    const data = (await response.json()) as {
      textoFixo: string;
      logoBase64: string | null;
    };

    return NextResponse.json({
      textoPreenchido: replacePlaceholders(data.textoFixo, responsavel, aluno),
      logoBase64: data.logoBase64,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Erro ao processar documento" },
      { status: 500 },
    );
  }
}
