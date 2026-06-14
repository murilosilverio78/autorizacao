"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { useAuth } from "@/lib/auth-context";
import {
  createResponsavel,
  type Qualidade,
  type ResponsavelInput,
} from "@/lib/responsaveis";

const qualidadeOptions: Array<{ value: Qualidade; label: string }> = [
  { value: "MAE", label: "Mãe" },
  { value: "PAI", label: "Pai" },
  { value: "TUTOR", label: "Tutor(a)" },
  { value: "GUARDIAO", label: "Guardião/Guardiã" },
  { value: "REPRESENTANTE_LEGAL", label: "Representante Legal" },
];

const responsavelSchema = z.object({
  nomeCompleto: z.string().min(3, "Informe o nome completo"),
  rg: z.string().min(1, "Informe o RG"),
  rgOrgaoExpedidor: z.string().min(1, "Informe o órgão expedidor"),
  rgDataExpedicao: z
    .string()
    .regex(/^\d{2}\/\d{2}\/\d{4}$/, "Use o formato DD/MM/AAAA"),
  cpf: z.string().regex(/^\d{11}$/, "Informe um CPF com 11 dígitos"),
  endereco: z.string().min(1, "Informe o endereço"),
  cidade: z.string().min(1, "Informe a cidade"),
  uf: z.string().regex(/^[A-Z]{2}$/, "Informe a UF com 2 letras"),
  telefone: z
    .string()
    .regex(/^\d{10,}$/, "Informe um telefone com ao menos 10 dígitos"),
  qualidade: z.enum([
    "MAE",
    "PAI",
    "TUTOR",
    "GUARDIAO",
    "REPRESENTANTE_LEGAL",
  ]),
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

function formatTelefone(value: string) {
  const digits = onlyDigits(value).slice(0, 11);

  if (digits.length <= 10) {
    return digits
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{4})(\d{1,4})$/, "$1-$2");
  }

  return digits
    .replace(/(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d{1,4})$/, "$1-$2");
}

export default function NovoResponsavelPage() {
  const router = useRouter();
  const { user } = useAuth();
  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResponsavelInput>({
    resolver: zodResolver(responsavelSchema),
    defaultValues: {
      nomeCompleto: "",
      rg: "",
      rgOrgaoExpedidor: "",
      rgDataExpedicao: "",
      cpf: "",
      endereco: "",
      cidade: "",
      uf: "",
      telefone: "",
      qualidade: "MAE",
    },
  });

  async function onSubmit(data: ResponsavelInput) {
    if (!user) {
      return;
    }

    await createResponsavel(data, user.uid);
    router.push("/responsaveis");
  }

  return (
    <section className="max-w-3xl">
      <div className="mb-6">
        <h1 className="text-3xl font-semibold text-gray-950">
          Novo Responsável
        </h1>
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

        <div className="grid gap-5 sm:grid-cols-2">
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

          <Controller
            control={control}
            name="telefone"
            render={({ field }) => (
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Telefone
                </label>
                <input
                  value={formatTelefone(field.value)}
                  onChange={(event) =>
                    field.onChange(onlyDigits(event.target.value).slice(0, 11))
                  }
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-950 outline-none transition focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10"
                />
                {errors.telefone ? (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.telefone.message}
                  </p>
                ) : null}
              </div>
            )}
          />
        </div>

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

        <fieldset>
          <legend className="mb-2 block text-sm font-medium text-gray-700">
            Qualidade
          </legend>
          <Controller
            control={control}
            name="qualidade"
            render={({ field }) => (
              <div className="grid gap-2 sm:grid-cols-2">
                {qualidadeOptions.map((option) => (
                  <label
                    key={option.value}
                    className="flex items-center gap-2 rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-700"
                  >
                    <input
                      type="radio"
                      checked={field.value === option.value}
                      onChange={() => field.onChange(option.value)}
                    />
                    {option.label}
                  </label>
                ))}
              </div>
            )}
          />
          {errors.qualidade ? (
            <p className="mt-1 text-sm text-red-600">
              {errors.qualidade.message}
            </p>
          ) : null}
        </fieldset>

        <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
          <Link
            href="/responsaveis"
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
