"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { useAuth } from "@/lib/auth-context";

export default function NovoTemplatePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [nome, setNome] = useState("");
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [textoFixo, setTextoFixo] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!user || !arquivo || !nome.trim()) {
      setError("Informe nome e arquivo PDF.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const token = await user.getIdToken();
      const formData = new FormData();
      formData.append("nome", nome);
      formData.append("arquivo", arquivo);

      const response = await fetch("/api/extrair-template", {
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
        templateId: string;
        textoFixo: string;
      };
      setTemplateId(data.templateId);
      setTextoFixo(data.textoFixo);
    } catch {
      setError("Erro ao processar PDF. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  function resetUpload() {
    setArquivo(null);
    setTextoFixo("");
    setTemplateId("");
    setError("");
  }

  return (
    <section className="max-w-3xl">
      <div className="mb-6">
        <h1 className="text-3xl font-semibold text-gray-950">
          Novo Template
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          Envie um PDF para extrair o texto fixo da autorização com IA.
        </p>
      </div>

      <form
        className="space-y-5 rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
        onSubmit={handleSubmit}
      >
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Nome do template
          </label>
          <input
            value={nome}
            onChange={(event) => setNome(event.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-950 outline-none transition focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10"
          />
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

        <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
          <Link
            href="/templates"
            className="inline-flex items-center justify-center rounded-md border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 hover:text-gray-950"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center rounded-md bg-gray-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? "Lendo documento com IA..." : "Processar PDF"}
          </button>
        </div>
      </form>

      {textoFixo ? (
        <div className="mt-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-950">
            Preview do texto extraído
          </h2>
          <pre className="mt-4 max-h-96 overflow-auto whitespace-pre-wrap rounded-md bg-gray-50 p-4 text-sm leading-6 text-gray-700">
            {textoFixo}
          </pre>
          <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={resetUpload}
              className="inline-flex items-center justify-center rounded-md border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 hover:text-gray-950"
            >
              Tentar Novamente
            </button>
            <button
              type="button"
              onClick={() => templateId && router.push("/templates")}
              className="inline-flex items-center justify-center rounded-md bg-gray-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800"
            >
              Confirmar e Salvar
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
