"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { getAlunos, type Aluno } from "@/lib/alunos";
import { useAuth } from "@/lib/auth-context";
import { getResponsaveis, type Responsavel } from "@/lib/responsaveis";

type Step = "selecao" | "revisao" | "sucesso";

export default function GerarPage() {
  const { user } = useAuth();
  const [responsaveis, setResponsaveis] = useState<Responsavel[]>([]);
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [responsavelId, setResponsavelId] = useState("");
  const [alunoId, setAlunoId] = useState("");
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [textoPreenchido, setTextoPreenchido] = useState("");
  const [logoBase64, setLogoBase64] = useState<string | null>(null);
  const [step, setStep] = useState<Step>("selecao");
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  const canProcess = Boolean(responsavelId && alunoId && arquivo && !processing);
  const paragraphs = useMemo(
    () => textoPreenchido.split(/\n{2,}/).filter(Boolean),
    [textoPreenchido],
  );

  useEffect(() => {
    if (!user) {
      return;
    }

    const userId = user.uid;

    async function loadData() {
      setLoading(true);
      setError("");

      try {
        const [responsavelData, alunoData] = await Promise.all([
          getResponsaveis(userId),
          getAlunos(userId),
        ]);
        setResponsaveis(responsavelData);
        setAlunos(alunoData);
      } catch {
        setError("Erro ao carregar dados. Tente novamente.");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [user]);

  async function handleProcess(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!user || !arquivo || !canProcess) {
      return;
    }

    setProcessing(true);
    setError("");

    try {
      const token = await user.getIdToken();
      const formData = new FormData();
      formData.append("arquivo", arquivo);
      formData.append("responsavelId", responsavelId);
      formData.append("alunoId", alunoId);

      const response = await fetch("/api/extrair", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Erro ao processar PDF");
      }

      const data = (await response.json()) as {
        textoPreenchido: string;
        logoBase64: string | null;
      };
      setTextoPreenchido(data.textoPreenchido);
      setLogoBase64(data.logoBase64);
      setStep("revisao");
    } catch {
      setError("Erro ao processar PDF. Tente novamente.");
    } finally {
      setProcessing(false);
    }
  }

  async function handleDownload() {
    if (!user || !textoPreenchido) {
      return;
    }

    setGenerating(true);
    setError("");

    try {
      const token = await user.getIdToken();
      const response = await fetch("/api/baixar", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ textoPreenchido, logoBase64 }),
      });

      if (!response.ok) {
        throw new Error("Erro ao gerar PDF");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "autorizacao.pdf";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      setStep("sucesso");
    } catch {
      setError("Erro ao gerar PDF. Tente novamente.");
    } finally {
      setGenerating(false);
    }
  }

  function resetFlow() {
    setResponsavelId("");
    setAlunoId("");
    setArquivo(null);
    setTextoPreenchido("");
    setLogoBase64(null);
    setStep("selecao");
    setError("");
  }

  if (loading) {
    return <p className="text-sm text-gray-600">Carregando dados...</p>;
  }

  return (
    <section>
      <div className="mb-6">
        <h1 className="text-3xl font-semibold text-gray-950">
          Gerar Autorização
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          Envie o PDF, revise o texto preenchido e baixe a autorização final.
        </p>
      </div>

      {step === "selecao" ? (
        <form
          className="max-w-2xl space-y-5 rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
          onSubmit={handleProcess}
        >
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Responsável
            </label>
            <select
              value={responsavelId}
              onChange={(event) => setResponsavelId(event.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-950 outline-none transition focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10"
            >
              <option value="">Selecione um responsável</option>
              {responsaveis.map((responsavel) => (
                <option key={responsavel.id} value={responsavel.id}>
                  {responsavel.nomeCompleto}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Aluno
            </label>
            <select
              value={alunoId}
              onChange={(event) => setAlunoId(event.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-950 outline-none transition focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10"
            >
              <option value="">Selecione um aluno</option>
              {alunos.map((aluno) => (
                <option key={aluno.id} value={aluno.id}>
                  {aluno.nomeCompleto}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Arquivo PDF
            </label>
            <input
              type="file"
              accept="application/pdf"
              onChange={(event) => setArquivo(event.target.files?.[0] ?? null)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 outline-none transition focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10"
            />
          </div>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={!canProcess}
              className="inline-flex items-center justify-center rounded-md bg-gray-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {processing ? "Lendo documento com IA..." : "Processar"}
            </button>
          </div>
        </form>
      ) : null}

      {step === "revisao" ? (
        <div>
          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Revise e edite o texto
              </label>
              <textarea
                value={textoPreenchido}
                onChange={(event) => setTextoPreenchido(event.target.value)}
                className="min-h-[520px] w-full rounded-lg border border-gray-300 bg-white p-4 text-sm leading-6 text-gray-950 outline-none transition focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10"
              />
            </div>

            <div>
              <p className="mb-2 text-sm font-medium text-gray-700">Preview</p>
              <div className="min-h-[520px] rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                <div
                  className="space-y-3 text-justify text-gray-950"
                  style={{
                    fontFamily: "Arial, sans-serif",
                    fontSize: "10.5pt",
                    lineHeight: 1.55,
                  }}
                >
                  {paragraphs.map((paragraph, index) => (
                    <p key={`${paragraph.slice(0, 16)}-${index}`}>
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}

          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={resetFlow}
              className="inline-flex items-center justify-center rounded-md border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 hover:text-gray-950"
            >
              Recomeçar
            </button>
            <button
              type="button"
              onClick={handleDownload}
              disabled={generating}
              className="inline-flex items-center justify-center rounded-md bg-gray-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {generating ? "Gerando PDF..." : "Baixar PDF"}
            </button>
          </div>
        </div>
      ) : null}

      {step === "sucesso" ? (
        <div className="max-w-2xl rounded-lg border border-gray-200 bg-white p-8 text-center shadow-sm">
          <h2 className="text-2xl font-semibold text-gray-950">
            PDF gerado com sucesso!
          </h2>
          <button
            type="button"
            onClick={resetFlow}
            className="mt-6 inline-flex items-center justify-center rounded-md bg-gray-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800"
          >
            Gerar outro
          </button>
        </div>
      ) : null}
    </section>
  );
}
