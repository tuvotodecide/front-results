"use client";

import Link from "next/link";
import {
  Banknote,
  BarChart3,
  ClipboardList,
  FileText,
  ListRestart,
  Shield,
  Users,
  Wallet,
} from "lucide-react";
import SuperadminPageHeader from "../components/SuperadminPageHeader";

const cards = [
  {
    title: "Contrato $TVD",
    description: "Estado, owner y fondos",
    href: "/superadmin/tvd/contrato",
    icon: <Shield className="h-5 w-5" />,
  },
  {
    title: "Parámetros económicos",
    description: "Reglas de consumo y recompensa",
    href: "/superadmin/tvd/parametros",
    icon: <BarChart3 className="h-5 w-5" />,
  },
  {
    title: "Asignación manual",
    description: "Asignar $TVD a institución",
    href: "/superadmin/tvd/asignacion",
    icon: <Banknote className="h-5 w-5" />,
  },
  {
    title: "Operaciones $TVD",
    description: "Auditoría de operaciones",
    href: "/superadmin/tvd/operaciones",
    icon: <ListRestart className="h-5 w-5" />,
  },
  {
    title: "Consulta billetera",
    description: "Ver saldo de una wallet",
    href: "/superadmin/tvd/consulta-billetera",
    icon: <Wallet className="h-5 w-5" />,
  },
  {
    title: "Gestión de registros",
    description: "Solicitudes institucionales",
    href: "/superadmin/gestion/registros",
    icon: <FileText className="h-5 w-5" />,
  },
  {
    title: "Recuperación institucional",
    description: "Accesos institucionales",
    href: "/superadmin/gestion/recuperacion",
    icon: <Users className="h-5 w-5" />,
  },
];

export default function SuperadminHomePage() {
  return (
    <section>
      <SuperadminPageHeader
        title="Panel Superadmin"
        subtitle="Gestión general del sistema, instituciones, operaciones y módulos administrativos"
      />

      <div className="rounded-2xl border border-[#dfe6df] bg-white p-5 shadow-[0_8px_22px_rgba(15,23,42,0.08)] sm:p-6">
        <h2 className="mb-4 text-base font-semibold text-[#3f3f3f]">
          Revisar
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {cards.map((card) => (
            <Link
              key={card.href}
              href={card.href}
              className="group flex min-h-[84px] items-center gap-4 rounded-lg border border-[#dfe3df] bg-white p-4 text-left shadow-sm transition-all hover:border-[#88b98f] hover:shadow-md"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#e7f2e8] text-[#287c36] transition-colors group-hover:bg-[#d8ebdc]">
                {card.icon}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-[#424242]">
                  {card.title}
                </span>
                <span className="mt-0.5 block text-xs text-[#747474]">
                  {card.description}
                </span>
              </span>
              <ClipboardList className="h-4 w-4 shrink-0 text-[#888] transition-transform group-hover:translate-x-0.5 group-hover:text-[#287c36]" />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
