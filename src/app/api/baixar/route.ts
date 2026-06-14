import { NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";

const PYTHON_SERVICE_URL = "http://localhost:8000";
const SECRET = process.env.PYTHON_SERVICE_SECRET ?? "dev-secret";

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

export async function POST(request: Request) {
  try {
    const userId = await getUserId(request);

    if (!userId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { textoPreenchido, logoBase64 } = (await request.json()) as {
      textoPreenchido?: string;
      logoBase64?: string | null;
    };

    if (!textoPreenchido) {
      return NextResponse.json(
        { error: "Texto preenchido obrigatório" },
        { status: 400 },
      );
    }

    const response = await fetch(`${PYTHON_SERVICE_URL}/gerar`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-secret": SECRET,
      },
      body: JSON.stringify({
        texto_preenchido: textoPreenchido,
        logo_base64: logoBase64 ?? null,
      }),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Erro ao gerar PDF" },
        { status: 502 },
      );
    }

    const pdfBytes = await response.arrayBuffer();

    return new Response(pdfBytes, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="autorizacao.pdf"',
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erro ao baixar PDF" }, { status: 500 });
  }
}
