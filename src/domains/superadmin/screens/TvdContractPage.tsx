"use client";

import { ExternalLink } from "lucide-react";
import CopyButton from "../components/CopyButton";
import SuperadminPageHeader from "../components/SuperadminPageHeader";
import { tvdContractStatusMock } from "../data/superadminTvd.mock";

const explorerAddressUrl = (address: string) =>
  `${tvdContractStatusMock.explorerBaseUrl}/address/${address}`;

const explorerTxUrl = (txHash: string) =>
  `${tvdContractStatusMock.explorerBaseUrl}/tx/${txHash}`;

const ExplorerButton = ({ href }: { href: string }) => (
  <a
    href={href}
    target="_blank"
    rel="noreferrer"
    className="inline-flex items-center justify-center gap-1.5 rounded-md bg-[#287c36] px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#1f642b]"
  >
    <ExternalLink className="h-3.5 w-3.5" />
    Comprobar en la web
  </a>
);

const InfoRow = ({
  label,
  value,
  action,
}: {
  label: string;
  value: string;
  action?: React.ReactNode;
}) => (
  <div className="grid gap-2 border-b border-[#e8ece8] px-4 py-3 last:border-b-0 sm:grid-cols-[1fr_auto] sm:items-center">
    <div className="min-w-0">
      <p className="text-xs text-[#7a7a7a]">{label}</p>
      <p className="mt-1 break-all font-mono text-sm text-[#313131]">{value}</p>
    </div>
    {action ? <div className="sm:pl-4">{action}</div> : null}
  </div>
);

export default function TvdContractPage() {
  const data = tvdContractStatusMock;

  return (
    <section>
      <SuperadminPageHeader
        title="Contrato $TVD"
        subtitle="Datos básicos del contrato tokenizado"
      />

      <div className="space-y-5">
        <article className="overflow-hidden rounded-2xl border border-[#dfe6df] bg-white shadow-sm">
          <h2 className="border-b border-[#e8ece8] px-5 py-4 font-semibold text-[#3f3f3f]">
            Estado del contrato
          </h2>
          <InfoRow label="Red activa" value={data.network} />
          <InfoRow
            label="Dirección del contrato $TVD"
            value={data.contractAddress}
            action={<ExplorerButton href={explorerAddressUrl(data.contractAddress)} />}
          />
          <InfoRow
            label="txHash de despliegue"
            value={data.deploymentTxHash}
            action={<ExplorerButton href={explorerTxUrl(data.deploymentTxHash)} />}
          />
          <InfoRow label="Fecha de registro" value={data.registeredAt} />
        </article>

        <article className="overflow-hidden rounded-2xl border border-[#dfe6df] bg-white shadow-sm">
          <h2 className="border-b border-[#e8ece8] px-5 py-4 font-semibold text-[#3f3f3f]">
            Personas autorizadas
          </h2>
          <InfoRow
            label="Dirección de la cuenta"
            value={data.multisigAddress}
            action={<ExplorerButton href={explorerAddressUrl(data.multisigAddress)} />}
          />
          <InfoRow label="Umbral de aprobación" value={data.approvalThreshold} />
          <div className="px-4 py-3">
            <p className="mb-3 text-xs text-[#7a7a7a]">Firmantes autorizados</p>
            <div className="space-y-2">
              {data.signers.map((signer) => (
                <div
                  key={signer.address}
                  className="grid gap-2 rounded-lg border border-[#edf0ed] p-3 sm:grid-cols-[1fr_auto] sm:items-center"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[#3f3f3f]">
                      {signer.label}
                    </p>
                    <p className="break-all font-mono text-xs text-[#555]">
                      {signer.address}
                    </p>
                  </div>
                  <ExplorerButton href={explorerAddressUrl(signer.address)} />
                </div>
              ))}
            </div>
          </div>
        </article>

        <article className="overflow-hidden rounded-2xl border border-[#dfe6df] bg-white shadow-sm">
          <div className="border-b border-[#e8ece8] px-5 py-4">
            <h2 className="font-semibold text-[#3f3f3f]">
              Fondos y wallets oficiales
            </h2>
            <p className="mt-1 text-xs text-[#747474]">
              Distribución del ecosistema $TVD
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-[860px] w-full text-left text-sm">
              <thead className="bg-[#fafafa] text-xs uppercase text-[#777]">
                <tr>
                  <th className="px-4 py-3">Fondo</th>
                  <th className="px-4 py-3">Distribución inicial</th>
                  <th className="px-4 py-3">Distribución actual</th>
                  <th className="px-4 py-3">Dirección</th>
                  <th className="px-4 py-3">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {data.funds.map((fund) => (
                  <tr key={fund.address} className="border-t border-[#e8ece8]">
                    <td className="px-4 py-3 font-medium text-[#424242]">
                      {fund.name}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-semibold text-[#287c36]">
                        {fund.initialDistribution}
                      </span>
                      <p className="text-xs text-[#777]">{fund.initialAmount}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-semibold text-[#424242]">
                        {fund.currentDistribution}
                      </span>
                      <p className="text-xs text-[#777]">{fund.currentAmount}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="max-w-[190px] truncate font-mono text-xs text-[#555]">
                          {fund.address}
                        </span>
                        <CopyButton value={fund.address} label="Copiar" />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <ExplorerButton href={explorerAddressUrl(fund.address)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      </div>
    </section>
  );
}
