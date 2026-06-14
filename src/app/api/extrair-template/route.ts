import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";
import { createTemplateAdmin } from "@/lib/templates-admin";

const prompt = `Você receberá um formulário de autorização escolar em PDF.
Extraia APENAS o texto fixo do documento — ou seja, todo o texto que NÃO são campos a serem preenchidos.
Ignore completamente: linhas em branco (____), campos vazios, espaços para preenchimento.
Retorne um JSON com este formato exato, sem markdown, sem explicações:
{
  "textoFixo": "texto completo do documento com os campos variáveis substituídos por placeholders: {{RESPONSAVEL_NOME}}, {{RESPONSAVEL_RG}}, {{RESPONSAVEL_RG_ORGAO}}, {{RESPONSAVEL_RG_DATA}}, {{RESPONSAVEL_CPF}}, {{RESPONSAVEL_ENDERECO}}, {{RESPONSAVEL_CIDADE}}, {{RESPONSAVEL_UF}}, {{RESPONSAVEL_TELEFONE}}, {{RESPONSAVEL_QUALIDADE}}, {{ALUNO_NOME}}, {{ALUNO_NASCIMENTO}}, {{ALUNO_NATURALIDADE}}, {{ALUNO_RG}}, {{ALUNO_RG_ORGAO}}, {{ALUNO_RG_DATA}}, {{ALUNO_CPF}}, {{ALUNO_ENDERECO}}, {{ALUNO_CIDADE}}, {{ALUNO_UF}}, {{LOCAL_DATA}}"
}`;

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

function extractText(content: Anthropic.Messages.Message["content"]) {
  return content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("\n")
    .trim();
}

export async function POST(request: Request) {
  try {
    const userId = await getUserId(request);

    if (!userId) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: "ANTHROPIC_API_KEY nao configurada" },
        { status: 500 },
      );
    }

    const formData = await request.formData();
    const file = formData.get("arquivo");
    const nome = String(formData.get("nome") ?? "").trim();

    if (!nome || !(file instanceof File) || file.type !== "application/pdf") {
      return NextResponse.json(
        { error: "Informe nome e arquivo PDF" },
        { status: 400 },
      );
    }

    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const base64Pdf = fileBuffer.toString("base64");
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "document",
              source: {
                type: "base64",
                media_type: "application/pdf",
                data: base64Pdf,
              },
            },
            {
              type: "text",
              text: prompt,
            },
          ],
        },
      ],
    });

    const responseText = extractText(message.content);
    const parsed = JSON.parse(responseText) as { textoFixo?: string };
    const textoFixo = String(parsed.textoFixo ?? "").trim();

    if (!textoFixo) {
      return NextResponse.json(
        { error: "Nao foi possivel extrair o texto do PDF" },
        { status: 422 },
      );
    }

    const templateId = await createTemplateAdmin({ nome, textoFixo }, userId);

    return NextResponse.json({ templateId, textoFixo });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Erro ao extrair template" },
      { status: 500 },
    );
  }
}
