import type { ReactNode } from "react";
import type { DomainKey } from "@/shared/routing/domains";

interface DomainLayoutProps {
  children: ReactNode;
  domain: DomainKey;
}

export default function DomainLayout({
  children,
  domain,
}: Readonly<DomainLayoutProps>) {
  const backgroundByDomain: Record<DomainKey, string> = {
    public: "bg-white text-slate-900",
    "institutional-private": "bg-slate-50 text-slate-900",
    results: "bg-slate-50 text-slate-900",
    admin: "bg-slate-50 text-slate-900",
  };

  return (
    <div
      data-domain={domain}
      className={`min-h-screen overflow-x-hidden antialiased ${backgroundByDomain[domain]}`}
    >
      {children}
    </div>
  );
}
