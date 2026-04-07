import type { ReactNode } from "react";
import type { Metadata } from "next";
import "../index.css";
import AppProviders from "@/shared/providers/AppProviders";

export const metadata: Metadata = {
  title: "Tu Voto Decide",
  description: "Plataforma de votacion y resultados electorales",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="es">
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
