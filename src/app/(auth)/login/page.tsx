"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FirebaseError } from "firebase/app";
import { useState } from "react";
import {
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { auth } from "@/lib/firebase";

const loginSchema = z.object({
  email: z.string().email("Informe um e-mail válido"),
  senha: z.string().min(6, "A senha deve ter no mínimo 6 caracteres"),
});

type LoginFormData = z.infer<typeof loginSchema>;

function getLoginErrorMessage(error: unknown) {
  if (error instanceof FirebaseError) {
    if (
      error.code === "auth/user-not-found" ||
      error.code === "auth/wrong-password" ||
      error.code === "auth/invalid-credential"
    ) {
      return "E-mail ou senha incorretos";
    }

    if (error.code === "auth/too-many-requests") {
      return "Muitas tentativas. Tente novamente mais tarde";
    }
  }

  return "Erro ao fazer login. Tente novamente";
}

export default function LoginPage() {
  const router = useRouter();
  const [authError, setAuthError] = useState("");
  const [resetMessage, setResetMessage] = useState("");
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  const {
    register,
    handleSubmit,
    getValues,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      senha: "",
    },
  });

  async function onSubmit(data: LoginFormData) {
    setAuthError("");
    setResetMessage("");

    try {
      await signInWithEmailAndPassword(auth, data.email, data.senha);
      router.push("/");
    } catch (error) {
      setAuthError(getLoginErrorMessage(error));
    }
  }

  async function handlePasswordReset() {
    setAuthError("");
    setResetMessage("");

    const isEmailValid = await trigger("email");
    if (!isEmailValid) {
      return;
    }

    setIsResettingPassword(true);

    try {
      await sendPasswordResetEmail(auth, getValues("email"));
      setResetMessage("Enviamos as instruções para redefinir sua senha.");
    } catch {
      setAuthError("Erro ao enviar e-mail de recuperação. Tente novamente");
    } finally {
      setIsResettingPassword(false);
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
            autoComplete="current-password"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-950 outline-none transition focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10"
            {...register("senha")}
          />
          {errors.senha ? (
            <p className="mt-1 text-sm text-red-600">{errors.senha.message}</p>
          ) : null}
        </div>

        {authError ? <p className="text-sm text-red-600">{authError}</p> : null}
        {resetMessage ? (
          <p className="text-sm text-green-700">{resetMessage}</p>
        ) : null}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-md bg-gray-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting ? "Entrando..." : "Entrar"}
        </button>
      </form>

      <div className="mt-6 flex flex-col gap-3 text-center text-sm">
        <button
          type="button"
          disabled={isResettingPassword}
          onClick={handlePasswordReset}
          className="text-gray-700 underline-offset-4 hover:text-gray-950 hover:underline disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isResettingPassword ? "Enviando..." : "Esqueci minha senha"}
        </button>
        <Link
          href="/cadastro"
          className="text-gray-700 underline-offset-4 hover:text-gray-950 hover:underline"
        >
          Não tem conta? Cadastre-se
        </Link>
      </div>
    </section>
  );
}
