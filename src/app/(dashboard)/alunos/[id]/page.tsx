"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { useAuth } from "@/lib/auth-context";
import { getAluno, updateAluno, type AlunoInput } from "@/lib/alunos";

const alunoSchema = z.object({
  nomeCompleto: z.string().min(3, "Informe o nome completo"),
  dataNascimento: z
    .string()
    .regex(/^\d{2}\/\d{2}\/\d{4}$/, "Use o formato DD/MM/AAAA"),
  naturalidade: z.string().min(1, "Informe a naturalidade"),
  rg: z.string().min(1, "Informe o RG"),
  rgOrgaoExpedidor: z.string().min(1, "Informe o órgão expedidor"),
  rgDataExpedicao: z
    .string()
    .regex(/^\d{2}\/\d{2}\/\d{4}$/, "Use o formato DD/MM/AAAA"),
  cpf: z.string().regex(/^\d{11}$/, "Informe um CPF com 11 dígitos"),
  endereco: z.string().min(1, "Informe o endereço"),
  cidade: z.string().min(1, "Informe a cidade"),
  uf: z.string().regex(/^[A-Z]{2}$/, "Informe a UF com 2 letras"),
});

function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
}

function formatCpf(value: string) {
  const digits = onlyDigits(value).slice(0, 11);
  return digits
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

export default function EditarAlunoPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const {
    control,
    register,
    reset,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AlunoInput>({
    resolver: zodResolver(alunoSchema),
    defaultValues: {
      nomeCompleto: "",
      dataNascimento: "",
      naturalidade: "",
      rg: "",
      rgOrgaoExpedidor: "",
      rgDataExpedicao: "",
      cpf: "",
      endereco: "",
      cidade: "",
      uf: "",
    },
  });

  useEffect(() => {
    if (!user) {
      return;
    }

    const userId = user.uid;

    async function loadAluno() {
      const aluno = await getAluno(params.id, userId);

      if (!aluno) {
        router.push("/alunos");
        return;
      }

      reset({
        nomeCompleto: aluno.nomeCompleto,
        dataNascimento: aluno.dataNascimento,
        naturalidade: aluno.naturalidade,
        rg: aluno.rg,
        rgOrgaoExpedidor: aluno.rgOrgaoExpedidor,
        rgDataExpedicao: aluno.rgDataExpedicao,
        cpf: aluno.cpf,
        endereco: aluno.endereco,
        cidade: aluno.cidade,
        uf: aluno.uf,
      });
      setLoading(false);
    }

    loadAluno();
  }, [params.id, reset, router, user]);

  async function onSubmit(data: AlunoInput) {
    if (!user) {
      return;
    }

    await updateAluno(params.id, data, user.uid);
    router.push("/alunos");
  }

  if (loading) {
    return <p className="text-sm text-gray-600">Carregando aluno...</p>;
  }

  return (
    <section className="max-w-3xl">
      <div className="mb-6">
        <h1 className="text-3xl font-semibold text-gray-950">Editar Aluno</h1>
      </div>

      <form
        className="space-y-5 rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
        onSubmit={handleSubmit(onSubmit)}
      >
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Nome completo
          </label>
          <input
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-950 outline-none transition focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10"
            {...register("nomeCompleto")}
          />
          {errors.nomeCompleto ? (
            <p className="mt-1 text-sm text-red-600">
              {errors.nomeCompleto.message}
            </p>
          ) : null}
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Data de nascimento
            </label>
            <input
              placeholder="DD/MM/AAAA"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-950 outline-none transition focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10"
              {...register("dataNascimento")}
            />
            {errors.dataNascimento ? (
              <p className="mt-1 text-sm text-red-600">
                {errors.dataNascimento.message}
              </p>
            ) : null}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Naturalidade
            </label>
            <input
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-950 outline-none transition focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10"
              {...register("naturalidade")}
            />
            {errors.naturalidade ? (
              <p className="mt-1 text-sm text-red-600">
                {errors.naturalidade.message}
              </p>
            ) : null}
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              RG
            </label>
            <input
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-950 outline-none transition focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10"
              {...register("rg")}
            />
            {errors.rg ? (
              <p className="mt-1 text-sm text-red-600">{errors.rg.message}</p>
            ) : null}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Órgão expedidor
            </label>
            <input
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-950 outline-none transition focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10"
              {...register("rgOrgaoExpedidor")}
            />
            {errors.rgOrgaoExpedidor ? (
              <p className="mt-1 text-sm text-red-600">
                {errors.rgOrgaoExpedidor.message}
              </p>
            ) : null}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Data de expedição
            </label>
            <input
              placeholder="DD/MM/AAAA"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-950 outline-none transition focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10"
              {...register("rgDataExpedicao")}
            />
            {errors.rgDataExpedicao ? (
              <p className="mt-1 text-sm text-red-600">
                {errors.rgDataExpedicao.message}
              </p>
            ) : null}
          </div>
        </div>

        <Controller
          control={control}
          name="cpf"
          render={({ field }) => (
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                CPF
              </label>
              <input
                value={formatCpf(field.value)}
                onChange={(event) =>
                  field.onChange(onlyDigits(event.target.value).slice(0, 11))
                }
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-950 outline-none transition focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10"
              />
              {errors.cpf ? (
                <p className="mt-1 text-sm text-red-600">
                  {errors.cpf.message}
                </p>
              ) : null}
            </div>
          )}
        />

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Endereço
          </label>
          <input
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-950 outline-none transition focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10"
            {...register("endereco")}
          />
          {errors.endereco ? (
            <p className="mt-1 text-sm text-red-600">
              {errors.endereco.message}
            </p>
          ) : null}
        </div>

        <div className="grid gap-5 sm:grid-cols-[1fr_96px]">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Cidade
            </label>
            <input
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-950 outline-none transition focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10"
              {...register("cidade")}
            />
            {errors.cidade ? (
              <p className="mt-1 text-sm text-red-600">
                {errors.cidade.message}
              </p>
            ) : null}
          </div>

          <Controller
            control={control}
            name="uf"
            render={({ field }) => (
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  UF
                </label>
                <input
                  value={field.value}
                  onChange={(event) =>
                    field.onChange(event.target.value.toUpperCase().slice(0, 2))
                  }
                  maxLength={2}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-950 outline-none transition focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10"
                />
                {errors.uf ? (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.uf.message}
                  </p>
                ) : null}
              </div>
            )}
          />
        </div>

        <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
          <Link
            href="/alunos"
            className="inline-flex items-center justify-center rounded-md border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 hover:text-gray-950"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center justify-center rounded-md bg-gray-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </form>
    </section>
  );
}
