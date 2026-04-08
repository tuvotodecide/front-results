import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Suspense } from "react";
import "./globals.css";
import Providers from "./providers";
import NavigationProgressBar from "./NavigationProgressBar";

export const metadata: Metadata = {
  title: "Tu voto decide",
  icons: {
    icon: "/bol.svg",
  },
};

interface RootLayoutProps {
  children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="es">
      <body>
        <Providers>{children}</Providers>
        <Suspense fallback={null}>
          <NavigationProgressBar />
        </Suspense>
      </body>
    </html>
  );
}
