"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import tuvotoDecideImage from "@/assets/tuvotodecide.webp";

interface AuthCardLayoutProps {
  title: string;
  subtitle: string;
  children: ReactNode;
}

export default function AuthCardLayout({
  title,
  subtitle,
  children,
}: Readonly<AuthCardLayoutProps>) {
  return (
    <div className="flex min-h-[calc(100vh-64px)] items-center justify-center bg-[#459151] px-4 py-8">
      <div className="w-full max-w-[450px] rounded-2xl border border-gray-100 bg-white p-8 shadow-xl sm:p-10">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 rounded-2xl border border-gray-50 bg-white p-3 shadow-sm">
            <Image
              src={tuvotoDecideImage}
              alt="Logo"
              className="h-14 w-auto object-contain"
              priority
            />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-800">{title}</h1>
          <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
        </div>
        {children}
      </div>
    </div>
  );
}
