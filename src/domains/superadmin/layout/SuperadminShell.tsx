"use client";

import type { ReactNode } from "react";
import SuperadminTopNav from "./SuperadminTopNav";

export default function SuperadminShell({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div
      data-domain="superadmin"
      data-access="private"
      className="min-h-screen bg-[#f7f8f7] text-[#3d3d3d]"
    >
      <SuperadminTopNav />
      <main className="mx-auto w-full max-w-7xl px-4 py-7 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
