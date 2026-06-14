"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { deleteAluno, getAlunos, type Aluno } from "@/lib/alunos";

function formatCpf(cpf: string) {
  return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}

export default function AlunosPage() {
  const { user } = useAuth();
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) {
      return;
    }

    const userId = user.uid;

    async function loadAlunos() {
      setLoading(true);
      setError("");

      try {
        const data = await getAlunos(userId);
        setAlunos(data);
      } catch {
        setError("Erro ao carregar alunos. Tente novamente.");
      } finally {
        setLoading(false);
      }
    }

    loadAlunos();
  }, [user]);

  async function handleDelete(aluno: Aluno) {
    if (!user) {
      return;
    }

    const confirmed = window.confirm(`Excluir o aluno ${aluno.nomeCompleto}?`);

    if (!confirmed) {
      return;
    }

    try {
      await deleteAluno(aluno.id, user.uid);
      setAlunos((current) => current.filter((item) => item.id !== aluno.id));
    } catch {
      setError("Erro ao excluir aluno. Tente novamente.");
    }
  }

  if (loading) {
    return <p className="text-sm text-gray-600">Carregando alunos...</p>;
  }

  return (
    <section>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-gray-950">Alunos</h1>
          <p className="mt-2 text-sm text-gray-600">
            Cadastre e gerencie alunos vinculados à sua conta.
          </p>
        </div>

        <Link
          href="/alunos/novo"
          className="inline-flex items-center justify-center rounded-md bg-gray-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800"
        >
          Novo Aluno
        </Link>
      </div>

      {error ? <p className="mb-4 text-sm text-red-600">{error}</p> : null}

      {alunos.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-8 text-center shadow-sm">
          <p className="text-gray-700">Nenhum aluno cadastrado</p>
          <Link
            href="/alunos/novo"
            className="mt-5 inline-flex items-center justify-center rounded-md bg-gray-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800"
          >
            Cadastrar aluno
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse text-left text-sm">
              <thead className="bg-gray-50 text-gray-700">
                <tr>
                  <th className="px-4 py-3 font-medium">Nome</th>
                  <th className="px-4 py-3 font-medium">
                    Data de Nascimento
                  </th>
                  <th className="px-4 py-3 font-medium">CPF</th>
                  <th className="px-4 py-3 text-right font-medium">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {alunos.map((aluno) => (
                  <tr key={aluno.id}>
                    <td className="px-4 py-3 text-gray-950">
                      {aluno.nomeCompleto}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {aluno.dataNascimento}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {formatCpf(aluno.cpf)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/alunos/${aluno.id}`}
                          className="rounded-md border border-gray-300 px-3 py-1.5 text-gray-700 transition hover:bg-gray-50 hover:text-gray-950"
                        >
                          Editar
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleDelete(aluno)}
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
