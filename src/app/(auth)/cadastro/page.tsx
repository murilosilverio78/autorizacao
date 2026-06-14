"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FirebaseError } from "firebase/app";
import { useState } from "react";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
} from "firebase/auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { auth } from "@/lib/firebase";

const cadastroSchema = z
  .object({
    email: z.string().email("Informe um e-mail válido"),
    senha: z
      .string()
      .min(8, "A senha deve ter no mínimo 8 caracteres")
      .regex(/[A-Z]/, "A senha deve ter pelo menos uma letra maiúscula")
      .regex(/[0-9]/, "A senha deve ter pelo menos um número"),
    confirmarSenha: z.string(),
  })
  .refine((data) => data.senha === data.confirmarSenha, {
    message: "As senhas não conferem",
    path: ["confirmarSenha"],
  });

type CadastroFormData = z.infer<typeof cadastroSchema>;

function getCadastroErrorMessage(error: unknown) {
  if (
    error instanceof FirebaseError &&
    error.code === "auth/email-already-in-use"
  ) {
    return "Este e-mail já está cadastrado";
  }

  return "Erro ao criar conta. Tente novamente";
}

export default function CadastroPage() {
  const router = useRouter();
  const [authError, setAuthError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CadastroFormData>({
    resolver: zodResolver(cadastroSchema),
    defaultValues: {
      email: "",
      senha: "",
      confirmarSenha: "",
    },
  });

  async function onSubmit(data: CadastroFormData) {
    setAuthError("");

    try {
      const credential = await createUserWithEmailAndPassword(
        auth,
        data.email,
        data.senha,
      );
      await sendEmailVerification(credential.user);
      router.push("/verificar-email");
    } catch (error) {
      setAuthError(getCadastroErrorMessage(error));
    }
  }

  return (
    <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-semibold text-gray-950">
          Móbile — Autorizações
        </h1>
      </div>

      <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
        <div>
          <label
            className="mb-1 block text-sm font-medium text-gray-700"
            htmlFor="email"
          >
            E-mail
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-950 outline-none transition focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10"
            {...register("email")}
          />
          {errors.email ? (
            <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
          ) : null}
        </div>

        <div>
          <label
            className="mb-1 block text-sm font-medium text-gray-700"
            htmlFor="senha"
          >
            Senha
          </label>
          <input
            id="senha"
            type="password"
            autoComplete="new-password"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-950 outline-none transition focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10"
            {...register("senha")}
          />
          {errors.senha ? (
            <p className="mt-1 text-sm text-red-600">{errors.senha.message}</p>
          ) : null}
        </div>

        <div>
          <label
            className="mb-1 block text-sm font-medium text-gray-700"
            htmlFor="confirmarSenha"
          >
            Confirmar senha
          </label>
          <input
            id="confirmarSenha"
            type="password"
            autoComplete="new-password"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-950 outline-none transition focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10"
            {...register("confirmarSenha")}
          />
          {errors.confirmarSenha ? (
            <p className="mt-1 text-sm text-red-600">
              {errors.confirmarSenha.message}
            </p>
          ) : null}
        </div>

        {authError ? <p className="text-sm text-red-600">{authError}</p> : null}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-md bg-gray-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting ? "Criando conta..." : "Criar conta"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm">
        <Link
          href="/login"
          className="text-gray-700 underline-offset-4 hover:text-gray-950 hover:underline"
        >
          Já tem conta? Entre
        </Link>
      </p>
    </section>
  );
}
