"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import {
  deleteResponsavel,
  getResponsaveis,
  type Qualidade,
  type Responsavel,
} from "@/lib/responsaveis";

const qualidadeLabels: Record<Qualidade, string> = {
  MAE: "Mãe",
  PAI: "Pai",
  TUTOR: "Tutor(a)",
  GUARDIAO: "Guardião/Guardiã",
  REPRESENTANTE_LEGAL: "Representante Legal",
};

function formatCpf(cpf: string) {
  return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}

export default function ResponsaveisPage() {
  const { user } = useAuth();
  const [responsaveis, setResponsaveis] = useState<Responsavel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) {
      return;
    }

    const userId = user.uid;

    async function loadResponsaveis() {
      setLoading(true);
      setError("");

      try {
        const data = await getResponsaveis(userId);
        setResponsaveis(data);
      } catch {
        setError("Erro ao carregar responsáveis. Tente novamente.");
      } finally {
        setLoading(false);
      }
    }

    loadResponsaveis();
  }, [user]);

  async function handleDelete(responsavel: Responsavel) {
    if (!user) {
      return;
    }

    const confirmed = window.confirm(
      `Excluir o responsável ${responsavel.nomeCompleto}?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      await deleteResponsavel(responsavel.id, user.uid);
      setResponsaveis((current) =>
        current.filter((item) => item.id !== responsavel.id),
      );
    } catch {
      setError("Erro ao excluir responsável. Tente novamente.");
    }
  }

  if (loading) {
    return <p className="text-sm text-gray-600">Carregando responsáveis...</p>;
  }

  return (
    <section>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-gray-950">
            Responsáveis
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Cadastre e gerencie responsáveis vinculados à sua conta.
          </p>
        </div>

        <Link
          href="/responsaveis/novo"
          className="inline-flex items-center justify-center rounded-md bg-gray-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800"
        >
          Novo Responsável
        </Link>
      </div>

      {error ? <p className="mb-4 text-sm text-red-600">{error}</p> : null}

      {responsaveis.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-8 text-center shadow-sm">
          <p className="text-gray-700">Nenhum responsável cadastrado</p>
          <Link
            href="/responsaveis/novo"
            className="mt-5 inline-flex items-center justify-center rounded-md bg-gray-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800"
          >
            Cadastrar responsável
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-left text-sm">
              <thead className="bg-gray-50 text-gray-700">
                <tr>
                  <th className="px-4 py-3 font-medium">Nome</th>
                  <th className="px-4 py-3 font-medium">CPF</th>
                  <th className="px-4 py-3 font-medium">Vínculo</th>
                  <th className="px-4 py-3 text-right font-medium">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {responsaveis.map((responsavel) => (
                  <tr key={responsavel.id}>
                    <td className="px-4 py-3 text-gray-950">
                      {responsavel.nomeCompleto}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {formatCpf(responsavel.cpf)}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {qualidadeLabels[responsavel.qualidade]}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/responsaveis/${responsavel.id}`}
                          className="rounded-md border border-gray-300 px-3 py-1.5 text-gray-700 transition hover:bg-gray-50 hover:text-gray-950"
                        >
                          Editar
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleDelete(responsavel)}
                          className="rounded-md border border-red-200 px-3 py-1.5 text-red-700 transition hover:bg-red-50"
                        >
                          Excluir
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}
