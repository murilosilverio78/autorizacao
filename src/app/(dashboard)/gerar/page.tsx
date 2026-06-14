"use client";

import { FormEvent, useEffect, useState } from "react";
import { getAlunos, type Aluno } from "@/lib/alunos";
import { useAuth } from "@/lib/auth-context";
import { getResponsaveis, type Responsavel } from "@/lib/responsaveis";
import { getTemplates, type Template } from "@/lib/templates";

export default function GerarPage() {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [responsaveis, setResponsaveis] = useState<Responsavel[]>([]);
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [templateId, setTemplateId] = useState("");
  const [responsavelId, setResponsavelId] = useState("");
  const [alunoId, setAlunoId] = useState("");
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) {
      return;
    }

    const userId = user.uid;

    async function loadData() {
      setLoading(true);
      setError("");

      try {
        const [templateData, responsavelData, alunoData] = await Promise.all([
          getTemplates(userId),
          getResponsaveis(userId),
          getAlunos(userId),
        ]);
        setTemplates(templateData);
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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!user || !templateId || !responsavelId || !alunoId) {
      setError("Selecione template, responsável e aluno.");
      return;
    }

    setGenerating(true);
    setError("");

    try {
      const token = await user.getIdToken();
      const response = await fetch("/api/gerar-pdf", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ templateId, responsavelId, alunoId }),
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
    } catch {
      setError("Erro ao gerar PDF. Tente novamente.");
    } finally {
      setGenerating(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-gray-600">Carregando dados...</p>;
  }

  return (
    <section className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-3xl font-semibold text-gray-950">
          Gerar Autorização
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          Selecione um template, responsável e aluno para gerar o PDF.
        </p>
      </div>

      <form
        className="space-y-5 rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
        onSubmit={handleSubmit}
      >
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Template
          </label>
          <select
            value={templateId}
            onChange={(event) => setTemplateId(event.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-950 outline-none transition focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10"
          >
            <option value="">Selecione um template</option>
            {templates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.nome}
              </option>
            ))}
          </select>
        </div>

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

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={generating}
            className="inline-flex items-center justify-center rounded-md bg-gray-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {generating ? "Gerando PDF..." : "Gerar PDF"}
          </button>
        </div>
      </form>
    </section>
  );
}
