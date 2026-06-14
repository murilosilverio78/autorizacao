"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { deleteTemplate, getTemplates, type Template } from "@/lib/templates";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR").format(new Date(value));
}

export default function TemplatesPage() {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) {
      return;
    }

    const userId = user.uid;

    async function loadTemplates() {
      setLoading(true);
      setError("");

      try {
        const data = await getTemplates(userId);
        setTemplates(data);
      } catch {
        setError("Erro ao carregar templates. Tente novamente.");
      } finally {
        setLoading(false);
      }
    }

    loadTemplates();
  }, [user]);

  async function handleDelete(template: Template) {
    if (!user) {
      return;
    }

    const confirmed = window.confirm(`Excluir o template ${template.nome}?`);

    if (!confirmed) {
      return;
    }

    try {
      await deleteTemplate(template.id, user.uid);
      setTemplates((current) =>
        current.filter((item) => item.id !== template.id),
      );
    } catch {
      setError("Erro ao excluir template. Tente novamente.");
    }
  }

  if (loading) {
    return <p className="text-sm text-gray-600">Carregando templates...</p>;
  }

  return (
    <section>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-gray-950">Templates</h1>
          <p className="mt-2 text-sm text-gray-600">
            Gerencie modelos de autorização extraídos de PDFs.
          </p>
        </div>

        <Link
          href="/templates/novo"
          className="inline-flex items-center justify-center rounded-md bg-gray-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800"
        >
          Novo Template
        </Link>
      </div>

      {error ? <p className="mb-4 text-sm text-red-600">{error}</p> : null}

      {templates.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-8 text-center shadow-sm">
          <p className="text-gray-700">Nenhum template cadastrado</p>
          <Link
            href="/templates/novo"
            className="mt-5 inline-flex items-center justify-center rounded-md bg-gray-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800"
          >
            Novo Template
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {templates.map((template) => (
            <article
              key={template.id}
              className="flex flex-col gap-4 rounded-lg border border-gray-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <h2 className="text-lg font-semibold text-gray-950">
                  {template.nome}
                </h2>
                <p className="mt-1 text-sm text-gray-600">
                  Criado em {formatDate(template.criadoEm)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleDelete(template)}
                className="inline-flex items-center justify-center rounded-md border border-red-200 px-3 py-2 text-sm font-medium text-red-700 transition hover:bg-red-50"
              >
                Excluir
              </button>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
