import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Móbile — Gerador de Autorizações",
  description: "Sistema de geração de autorizações escolares",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}