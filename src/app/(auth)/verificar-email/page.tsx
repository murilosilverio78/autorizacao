"use client";

import Link from "next/link";
import { sendEmailVerification } from "firebase/auth";
import { useState } from "react";
import { auth } from "@/lib/firebase";

export default function VerificarEmailPage() {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSending, setIsSending] = useState(false);

  async function handleResendEmail() {
    setMessage("");
    setError("");

    if (!auth.currentUser) {
      setError("Entre novamente para reenviar o e-mail de verificação.");
      return;
    }

    setIsSending(true);

    try {
      await sendEmailVerification(auth.currentUser);
      setMessage("E-mail de verificação reenviado.");
    } catch {
      setError("Erro ao reenviar e-mail. Tente novamente");
    } finally {
      setIsSending(false);
    }
  }

  return (
    <section className="rounded-lg border border-gray-200 bg-white p-6 text-center shadow-sm">
      <h1 className="text-2xl font-semibold text-gray-950">
        Verifique seu e-mail
      </h1>
      <p className="mt-4 text-sm leading-6 text-gray-600">
        Enviamos um link de verificação para o seu e-mail. Clique nesse link
        para ativar sua conta antes de acessar o sistema.
      </p>

      {message ? <p className="mt-4 text-sm text-green-700">{message}</p> : null}
      {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}

      <div className="mt-6 flex flex-col gap-3">
        <button
          type="button"
          disabled={isSending}
          onClick={handleResendEmail}
          className="w-full rounded-md bg-gray-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSending ? "Reenviando..." : "Reenviar e-mail"}
        </button>
        <Link
          href="/login"
          className="text-sm text-gray-700 underline-offset-4 hover:text-gray-950 hover:underline"
        >
          Voltar para o login
        </Link>
      </div>
    </section>
  );
}
