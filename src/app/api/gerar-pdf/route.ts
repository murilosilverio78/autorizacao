import { NextResponse } from "next/server";
import { PDFDocument, StandardFonts, type PDFFont } from "pdf-lib";
import { getAlunoAdmin } from "@/lib/alunos-admin";
import { adminAuth } from "@/lib/firebase-admin";
import { getResponsavelAdmin } from "@/lib/responsaveis-admin";
import type { Qualidade } from "@/lib/responsaveis";
import { getTemplatesAdmin } from "@/lib/templates-admin";

const qualidadeLabels: Record<Qualidade, string> = {
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

function buildSegments(
  template: string,
  values: Record<string, string>,
): Array<{ text: string; bold: boolean }> {
  const regex = /{{[A-Z_]+}}/g;
  const segments: Array<{ text: string; bold: boolean }> = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(template)) !== null) {
    if (match.index > lastIndex) {
      segments.push({
        text: template.slice(lastIndex, match.index),
        bold: false,
      });
    }

    segments.push({
      text: values[match[0]] ?? "",
      bold: true,
    });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < template.length) {
    segments.push({ text: template.slice(lastIndex), bold: false });
  }

  return segments;
}

function wrapParagraph(
  segments: Array<{ text: string; bold: boolean }>,
  maxWidth: number,
  regularFont: PDFFont,
  boldFont: PDFFont,
  fontSize: number,
) {
  const lines: Array<Array<{ text: string; bold: boolean }>> = [];
  let currentLine: Array<{ text: string; bold: boolean }> = [];
  let currentWidth = 0;

  for (const segment of segments) {
    const parts = segment.text.split(/(\s+)/);

    for (const part of parts) {
      if (!part) {
        continue;
      }

      const font = segment.bold ? boldFont : regularFont;
      const partWidth = font.widthOfTextAtSize(part, fontSize);

      if (currentWidth + partWidth > maxWidth && currentLine.length > 0) {
        lines.push(currentLine);
        currentLine = [];
        currentWidth = 0;

        if (/^\s+$/.test(part)) {
          continue;
        }
      }

      currentLine.push({ text: part, bold: segment.bold });
      currentWidth += partWidth;
    }
  }

  if (currentLine.length > 0) {
    lines.push(currentLine);
  }

  return lines;
}

export async function POST(request: Request) {
  try {
    const userId = await getUserId(request);

    if (!userId) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
    }

    const { templateId, responsavelId, alunoId } = (await request.json()) as {
      templateId?: string;
      responsavelId?: string;
      alunoId?: string;
    };

    if (!templateId || !responsavelId || !alunoId) {
      return NextResponse.json(
        { error: "Dados obrigatorios ausentes" },
        { status: 400 },
      );
    }

    const [templates, responsavel, aluno] = await Promise.all([
      getTemplatesAdmin(userId),
      getResponsavelAdmin(responsavelId, userId),
      getAlunoAdmin(alunoId, userId),
    ]);
    const template = templates.find((item) => item.id === templateId) ?? null;

    if (!template || !responsavel || !aluno) {
      return NextResponse.json(
        { error: "Registro nao encontrado" },
        { status: 404 },
      );
    }

    const values: Record<string, string> = {
      "{{RESPONSAVEL_NOME}}": responsavel.nomeCompleto,
      "{{RESPONSAVEL_RG}}": responsavel.rg,
      "{{RESPONSAVEL_RG_ORGAO}}": responsavel.rgOrgaoExpedidor,
      "{{RESPONSAVEL_RG_DATA}}": responsavel.rgDataExpedicao,
      "{{RESPONSAVEL_CPF}}": formatCpf(responsavel.cpf),
      "{{RESPONSAVEL_ENDERECO}}": responsavel.endereco,
      "{{RESPONSAVEL_CIDADE}}": responsavel.cidade,
      "{{RESPONSAVEL_UF}}": responsavel.uf,
      "{{RESPONSAVEL_TELEFONE}}": formatTelefone(responsavel.telefone),
      "{{RESPONSAVEL_QUALIDADE}}": qualidadeLabels[responsavel.qualidade],
      "{{ALUNO_NOME}}": aluno.nomeCompleto,
      "{{ALUNO_NASCIMENTO}}": aluno.dataNascimento,
      "{{ALUNO_NATURALIDADE}}": aluno.naturalidade,
      "{{ALUNO_RG}}": aluno.rg,
      "{{ALUNO_RG_ORGAO}}": aluno.rgOrgaoExpedidor,
      "{{ALUNO_RG_DATA}}": aluno.rgDataExpedicao,
      "{{ALUNO_CPF}}": formatCpf(aluno.cpf),
      "{{ALUNO_ENDERECO}}": aluno.endereco,
      "{{ALUNO_CIDADE}}": aluno.cidade,
      "{{ALUNO_UF}}": aluno.uf,
      "{{LOCAL_DATA}}": getLocalDate(),
    };

    const pdfDocument = await PDFDocument.create();
    const regularFont = await pdfDocument.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDocument.embedFont(StandardFonts.HelveticaBold);
    let page = pdfDocument.addPage([595, 842]);
    const marginX = 56;
    const maxWidth = 595 - marginX * 2;
    const fontSize = 10;
    const lineHeight = 14;
    let y = 792;

    const titleWidth = boldFont.widthOfTextAtSize(template.nome, 14);
    page.drawText(template.nome, {
      x: (595 - titleWidth) / 2,
      y,
      size: 14,
      font: boldFont,
    });
    y -= 36;

    const paragraphs = template.textoFixo.split(/\n{2,}/);

    for (const paragraph of paragraphs) {
      const lines = wrapParagraph(
        buildSegments(paragraph.replace(/\n/g, " "), values),
        maxWidth,
        regularFont,
        boldFont,
        fontSize,
      );

      for (const line of lines) {
        if (y < 90) {
          page = pdfDocument.addPage([595, 842]);
          y = 792;
        }

        let x = marginX;
        for (const segment of line) {
          const font = segment.bold ? boldFont : regularFont;
          page.drawText(segment.text, {
            x,
            y,
            size: fontSize,
            font,
          });
          x += font.widthOfTextAtSize(segment.text, fontSize);
        }
        y -= lineHeight;
      }

      y -= lineHeight;
    }

    if (y < 140) {
      page = pdfDocument.addPage([595, 842]);
      y = 760;
    }

    y -= 28;
    page.drawLine({
      start: { x: 165, y },
      end: { x: 430, y },
      thickness: 1,
    });
    y -= 16;
    const signature = responsavel.nomeCompleto;
    const signatureWidth = regularFont.widthOfTextAtSize(signature, 10);
    page.drawText(signature, {
      x: (595 - signatureWidth) / 2,
      y,
      size: 10,
      font: regularFont,
    });

    const pdfBytes = await pdfDocument.save();

    return new Response(Buffer.from(pdfBytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="autorizacao.pdf"',
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erro ao gerar PDF" }, { status: 500 });
  }
}
