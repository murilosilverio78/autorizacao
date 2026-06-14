"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth-context";

const shortcutCards = [
  {
    href: "/responsaveis",
    title: "Responsáveis",
    description: "Gerencie os responsáveis pelos alunos.",
  },
  {
    href: "/alunos",
    title: "Alunos",
    description: "Acesse os cadastros dos alunos.",
  },
  {
    href: "/gerar-autorizacao",
    title: "Gerar Autorização",
    description: "Crie uma nova autorização escolar.",
  },
];

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <section>
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-gray-950">Bem-vindo</h1>
        <p className="mt-2 text-gray-600">{user?.email}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {shortcutCards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm transition hover:border-gray-300 hover:shadow"
          >
            <h2 className="text-lg font-semibold text-gray-950">
              {card.title}
            </h2>
            <p className="mt-2 text-sm leading-6 text-gray-600">
              {card.description}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
