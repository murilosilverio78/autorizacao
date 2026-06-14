"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { auth } from "@/lib/firebase";

const navigationLinks = [
  { href: "/", label: "Dashboard" },
  { href: "/responsaveis", label: "Responsáveis" },
  { href: "/alunos", label: "Alunos" },
  { href: "/gerar-autorizacao", label: "Gerar Autorização" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) {
      return;
    }

    if (!user) {
      router.push("/login");
      return;
    }

    if (!user.emailVerified) {
      router.push("/verificar-email");
    }
  }, [loading, router, user]);

  async function handleSignOut() {
    await signOut(auth);
    router.push("/login");
  }

  if (loading || !user || !user.emailVerified) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50 text-sm text-gray-600">
        Carregando...
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <Link href="/" className="text-lg font-semibold text-gray-950">
            Móbile — Autorizações
          </Link>

          <nav className="flex flex-wrap items-center gap-2 text-sm">
            {navigationLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-md px-3 py-2 text-gray-700 transition hover:bg-gray-100 hover:text-gray-950"
              >
                {link.label}
              </Link>
            ))}
            <button
              type="button"
              onClick={handleSignOut}
              className="rounded-md bg-gray-950 px-3 py-2 font-medium text-white transition hover:bg-gray-800"
            >
              Sair
            </button>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
