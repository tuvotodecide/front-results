"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Banknote,
  BarChart3,
  ChevronDown,
  ClipboardList,
  Home,
  ListRestart,
  Search,
  Shield,
  Users,
  Wallet,
} from "lucide-react";
import tuvotoDecideImage from "@/assets/tuvotodecide.webp";
import { logOut, selectAuth } from "@/store/auth/authSlice";
import type { SuperadminNavItem } from "../types";

const tvdItems: SuperadminNavItem[] = [
  {
    label: "Contrato $TVD",
    href: "/superadmin/tvd/contrato",
    icon: <Shield className="h-4 w-4" />,
  },
  {
    label: "Parámetros económicos",
    href: "/superadmin/tvd/parametros",
    icon: <BarChart3 className="h-4 w-4" />,
  },
  {
    label: "Asignación de $TVD",
    href: "/superadmin/tvd/asignacion",
    icon: <Banknote className="h-4 w-4" />,
  },
  {
    label: "Operaciones $TVD",
    href: "/superadmin/tvd/operaciones",
    icon: <ListRestart className="h-4 w-4" />,
  },
  {
    label: "Consulta billetera",
    href: "/superadmin/tvd/consulta-billetera",
    icon: <Wallet className="h-4 w-4" />,
  },
];

const gestionItems: SuperadminNavItem[] = [
  {
    label: "Gestión de registros",
    href: "/superadmin/gestion/registros",
    icon: <ClipboardList className="h-4 w-4" />,
  },
  {
    label: "Recuperación institucional",
    href: "/superadmin/gestion/recuperacion",
    icon: <Users className="h-4 w-4" />,
  },
];

const Dropdown = ({
  label,
  items,
  align = "left",
}: {
  label: string;
  items: SuperadminNavItem[];
  align?: "left" | "right";
}) => {
  const pathname = usePathname() ?? "";
  const [open, setOpen] = useState(false);
  const active = items.some((item) => pathname === item.href);

  return (
    <div className="relative min-w-0">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className={`inline-flex h-9 items-center gap-2 rounded-lg px-3 pr-3.5 text-sm font-medium transition-colors sm:h-10 sm:px-3.5 sm:pr-4 ${
          active || open
            ? "bg-[#287c36] text-white"
            : "text-[#666] hover:bg-[#edf6ef] hover:text-[#287c36]"
        }`}
        aria-expanded={open}
      >
        {label}
        <ChevronDown
          className={`h-4 w-4 flex-none transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open ? (
        <div
          className={`absolute z-30 mt-2 w-[min(18rem,calc(100vw-2rem))] overflow-hidden rounded-lg border border-[#dfe6df] bg-white shadow-[0_10px_26px_rgba(15,23,42,0.18)] ${
            align === "right" ? "right-0" : "left-0"
          }`}
        >
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 text-sm transition-colors ${
                pathname === item.href
                  ? "bg-[#e7f2e8] font-semibold text-[#287c36]"
                  : "text-[#4b4b4b] hover:bg-[#f5f7f5]"
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
};

export default function SuperadminTopNav() {
  const pathname = usePathname() ?? "";
  const auth = useSelector(selectAuth);
  const dispatch = useDispatch();
  const logoAsset = tuvotoDecideImage as string | { src: string };
  const logoSrc = typeof logoAsset === "string" ? logoAsset : logoAsset.src;

  const linkClass = (href: string) =>
    `inline-flex h-9 items-center gap-2 rounded-lg px-3 text-sm font-medium transition-colors sm:h-10 sm:px-3.5 ${
      pathname === href
        ? "bg-[#287c36] text-white"
        : "text-[#666] hover:bg-[#edf6ef] hover:text-[#287c36]"
    }`;

  return (
    <header className="sticky top-0 z-20 border-b border-[#dfe6df] bg-white/95 shadow-sm backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 py-3 sm:grid sm:min-h-[64px] sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:items-center sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center justify-between gap-3 sm:justify-self-start">
          <Link href="/superadmin" className="flex min-w-0 items-center gap-2">
            <img src={logoSrc} alt="Tu voto decide" className="h-7 w-7 rounded" />
            <span className="truncate text-sm font-semibold text-[#2f3c31]">
              Tu voto decide
            </span>
          </Link>
          <span className="inline-flex items-center rounded-full bg-[#edf6ef] px-2.5 py-1 text-[11px] font-semibold text-[#287c36] sm:hidden">
            SUPERADMIN
          </span>
        </div>

        <nav className="flex w-full min-w-0 flex-wrap items-center justify-center gap-2 sm:w-auto sm:justify-self-center">
          <Link href="/superadmin" className={linkClass("/superadmin")}>
            <Home className="h-4 w-4" />
            Inicio
          </Link>
          <Dropdown label="$TVD" items={tvdItems} />
          <Dropdown label="Gestión" items={gestionItems} align="right" />
        </nav>

        <div className="hidden items-center gap-2 sm:flex sm:justify-self-end">
          {auth.isDevSession ? (
            <>
              <span className="rounded-full bg-[#fff8e8] px-3 py-1.5 text-xs font-semibold text-[#a45400]">
                Modo desarrollo · Superadmin local
              </span>
              <button
                type="button"
                onClick={async () => {
                  await fetch("/api/dev/auth/logout", { method: "POST" });
                  dispatch(logOut());
                  window.location.assign("/dev/superadmin-login");
                }}
                className="rounded-full border border-[#dfe3df] px-3 py-1.5 text-xs font-semibold text-[#555] transition-colors hover:bg-[#f7f8f7]"
              >
                Salir dev
              </button>
            </>
          ) : (
            <span className="inline-flex items-center gap-2 rounded-full bg-[#edf6ef] px-3 py-1.5 text-xs font-semibold text-[#287c36]">
              <Search className="h-3.5 w-3.5" />
              SUPERADMIN
            </span>
          )}
        </div>
      </div>
    </header>
  );
}
