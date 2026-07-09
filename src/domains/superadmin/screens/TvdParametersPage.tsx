"use client";

import { CheckCircle2, Edit3, Info, PauseCircle } from "lucide-react";
import { useState } from "react";
import Modal2 from "@/components/Modal2";
import SuperadminPageHeader from "../components/SuperadminPageHeader";
import { tvdEconomicParametersMock } from "../data/superadminTvd.mock";
import type { TvdEconomicParameter } from "../types";

const ReadOnlySwitch = ({ enabled }: { enabled: boolean }) => (
  <span
    aria-label={enabled ? "Activo" : "Inactivo"}
    className={`relative inline-flex h-6 w-11 items-center rounded-full ${
      enabled ? "bg-[#b8d9bd]" : "bg-[#d6dbe0]"
    }`}
  >
    <span
      className={`h-5 w-5 rounded-full bg-white shadow transition-transform ${
        enabled ? "translate-x-5" : "translate-x-1"
      }`}
    />
  </span>
);

export default function TvdParametersPage() {
  const data = tvdEconomicParametersMock;
  const [selected, setSelected] = useState<TvdEconomicParameter | null>(null);

  return (
    <section>
      <SuperadminPageHeader
        title="Parámetros económicos $TVD"
        subtitle="Configuración económica vigente del token consultada desde contrato"
      />

      <div className="space-y-6">
        <article className="overflow-hidden rounded-2xl border border-[#dfe6df] bg-white shadow-sm">
          <div className="border-b border-[#e8ece8] px-5 py-4">
            <h2 className="text-lg font-semibold text-[#3f3f3f]">
              Parámetros de consumo y recompensa
            </h2>
            <p className="mt-1 text-sm text-[#747474]">
              Datos consultados desde contrato o servicio de lectura autorizado
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-[760px] w-full text-left text-sm">
              <thead className="bg-[#fafafa] text-xs uppercase text-[#777]">
                <tr>
                  <th className="px-5 py-3">Parámetro</th>
                  <th className="px-5 py-3">Valor</th>
                  <th className="px-5 py-3">Ejemplo</th>
                  <th className="px-5 py-3">Acción</th>
                </tr>
              </thead>
              <tbody>
                {data.parameters.map((parameter) => (
                  <tr key={parameter.id} className="border-t border-[#e8ece8]">
                    <td className="px-5 py-5 font-medium text-[#424242]">
                      {parameter.name}
                    </td>
                    <td className="px-5 py-5 font-mono font-semibold text-[#287c36]">
                      {parameter.value}
                    </td>
                    <td className="px-5 py-5 text-[#747474]">
                      {parameter.example}
                    </td>
                    <td className="px-5 py-5">
                      <button
                        type="button"
                        onClick={() => setSelected(parameter)}
                        className="inline-flex items-center gap-2 rounded-md border border-[#dfe3df] px-3 py-2 text-sm text-[#666] transition-colors hover:border-[#287c36] hover:text-[#287c36]"
                      >
                        <Edit3 className="h-4 w-4" />
                        Editar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <div className="grid gap-5 lg:grid-cols-2">
          <article className="rounded-2xl border border-[#dfe6df] bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#e7f2e8] text-[#287c36]">
                  <CheckCircle2 className="h-6 w-6" />
                </span>
                <div>
                  <h2 className="font-semibold text-[#287c36]">
                    {data.rewards.title}
                  </h2>
                  <p className="text-sm text-[#747474]">
                    {data.rewards.description}
                  </p>
                </div>
              </div>
              <ReadOnlySwitch enabled={data.rewards.enabled} />
            </div>
          </article>

          <article className="rounded-2xl border border-[#dfe6df] bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#fff3cd] text-[#c76b00]">
                  <PauseCircle className="h-6 w-6" />
                </span>
                <div>
                  <h2 className="font-semibold text-[#c75b00]">
                    {data.initialCampaign.title}
                  </h2>
                  <p className="text-sm text-[#747474]">
                    {data.initialCampaign.description}
                  </p>
                </div>
              </div>
              <ReadOnlySwitch enabled={data.initialCampaign.enabled} />
            </div>
          </article>
        </div>

        <p className="flex items-start gap-2 text-sm text-[#747474]">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          Los parámetros solo pueden modificarse desde el contrato inteligente
          mediante el owner multisig autorizado.
        </p>
      </div>

      <Modal2
        isOpen={Boolean(selected)}
        onClose={() => setSelected(null)}
        title="Editar parámetro desde contrato inteligente"
        type="plain"
        size="md"
      >
        <div className="space-y-4">
          <div className="rounded-lg bg-[#f3f4f3] px-4 py-3">
            <p className="text-xs text-[#747474]">Parámetro</p>
            <p className="mt-1 text-sm font-medium text-[#3f3f3f]">
              {selected?.name}
            </p>
          </div>
          <div className="rounded-lg border border-[#f3ca72] bg-[#fff8e8] px-4 py-4 text-sm text-[#a45400]">
            <p>Este parámetro no se edita directamente desde el panel.</p>
            <p className="mt-1">
              Solo puede modificarse desde el contrato inteligente mediante el
              owner multisig autorizado.
            </p>
            <p className="mt-3 text-xs">
              El panel muestra la configuración vigente en modo consulta.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="rounded-lg border border-[#dfe3df] px-4 py-3 text-sm font-medium text-[#444] transition-colors hover:bg-[#f7f8f7]"
            >
              Cerrar
            </button>
            <a
              href={data.blockchainUrl}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg bg-[#287c36] px-4 py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-[#1f642b]"
            >
              Abrir en blockchain
            </a>
          </div>
        </div>
      </Modal2>
    </section>
  );
}
