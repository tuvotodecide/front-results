"use client";

import { AlertTriangle, ExternalLink } from "lucide-react";
import CopyButton from "../components/CopyButton";
import SuperadminPageHeader from "../components/SuperadminPageHeader";
import { useTvdContractsReadModel } from "../hooks/useSuperadminTvdReadModel";
import { formatDateTimeForUi } from "@/features/electionConfig/renderUtils";
import { truncateAddress } from "@/shared/tvd/tvdBlockchainFormatters";

const ExplorerButton = ({ href }: { href: string | null }) => {
  if (!href) {
    return (
      <span className="inline-flex items-center justify-center rounded-md border border-[#dfe6df] px-3 py-2 text-xs font-medium text-[#747474]">
        Configuración incompleta
      </span>
    );
  }
  return (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    className="inline-flex items-center justify-center gap-1.5 rounded-md bg-[#287c36] px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#1f642b]"
  >
    <ExternalLink className="h-3.5 w-3.5" />
    Ver en BaseScan
  </a>
  );
};

const InfoRow = ({
  label,
  value,
  fullValue,
  action,
}: {
  label: string;
  value: string;
  fullValue?: string | null;
  action?: React.ReactNode;
}) => (
  <div className="grid gap-2 border-b border-[#e8ece8] px-4 py-3 last:border-b-0 sm:grid-cols-[1fr_auto] sm:items-center">
    <div className="min-w-0">
      <p className="text-xs text-[#7a7a7a]">{label}</p>
      <p
        className="mt-1 break-all font-mono text-sm text-[#313131]"
        title={fullValue ?? value}
      >
        {value}
      </p>
    </div>
    {action ? <div className="sm:pl-4">{action}</div> : null}
  </div>
);

const StatusBanner = ({
  isLoading,
  status,
  error,
  onRetry,
}: {
  isLoading: boolean;
  status?: string;
  error?: string | null;
  onRetry?: () => void;
}) => {
  if (isLoading) {
    return (
      <div className="rounded-lg border border-[#dfe6df] bg-white px-4 py-3 text-sm text-[#555]">
        Cargando datos blockchain...
      </div>
    );
  }
  if (error) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#f3ca72] bg-[#fff8e8] px-4 py-3 text-sm text-[#a45400]">
        <span>{error}</span>
        {onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            className="rounded-md border border-[#d7952f] px-3 py-1.5 text-xs font-semibold"
          >
            Reintentar
          </button>
        ) : null}
      </div>
    );
  }
  if (status === "not_configured") {
    return (
      <div className="rounded-lg border border-[#dfe6df] bg-white px-4 py-3 text-sm text-[#747474]">
        No configurado.
      </div>
    );
  }
  if (status === "partial") {
    return (
      <div className="rounded-lg border border-[#f3ca72] bg-[#fff8e8] px-4 py-3 text-sm text-[#a45400]">
        Parcialmente disponible. Algunas lecturas secundarias no respondieron.
      </div>
    );
  }
  return null;
};

export default function TvdContractPage() {
  const { data, isLoading, error, retry } = useTvdContractsReadModel();
  const tvdAddress = data?.tvdToken.address ?? null;
  const tvdTxHash = data?.tvdToken.txHash ?? null;
  const deploymentDate =
    data?.tvdToken.deploymentDate.isoDate
      ? formatDateTimeForUi(data.tvdToken.deploymentDate.isoDate)
      : (data?.tvdToken.deploymentDate.message ?? "No disponible");
  const networkLabel =
    data?.network.chainId ? `${data.network.name} (chainId ${data.network.chainId})` : "Configuración incompleta";
  const multisigAddress = data?.multisig.address ?? null;
  const multisigOwners = data?.multisig.owners ?? [];

  return (
    <section>
      <SuperadminPageHeader
        title="Contrato $TVD"
        subtitle="Datos básicos del contrato tokenizado"
      />

      <div className="space-y-5">
        <StatusBanner isLoading={isLoading} status={data?.status} error={error} onRetry={retry} />
        {data?.network.chainStatus === "error" ? (
          <div className="rounded-lg border border-[#f3ca72] bg-[#fff8e8] px-4 py-3 text-sm text-[#a45400]">
            {data.network.chainMessage}
          </div>
        ) : null}

        <article className="overflow-hidden rounded-2xl border border-[#dfe6df] bg-white shadow-sm">
          <h2 className="border-b border-[#e8ece8] px-5 py-4 font-semibold text-[#3f3f3f]">
            Estado del contrato
          </h2>
          <InfoRow label="Red activa" value={networkLabel} />
          <InfoRow
            label="Dirección del contrato $TVD"
            value={truncateAddress(tvdAddress)}
            fullValue={tvdAddress}
            action={
              <div className="flex flex-wrap gap-2">
                {tvdAddress ? <CopyButton value={tvdAddress} label="Copiar" /> : null}
                <ExplorerButton href={data?.tvdToken.explorerUrl ?? null} />
              </div>
            }
          />
          <InfoRow
            label="txHash de despliegue"
            value={truncateAddress(tvdTxHash)}
            fullValue={tvdTxHash}
            action={
              <div className="flex flex-wrap gap-2">
                {tvdTxHash ? <CopyButton value={tvdTxHash} label="Copiar" /> : null}
                <ExplorerButton href={data?.tvdToken.txExplorerUrl ?? null} />
              </div>
            }
          />
          <InfoRow label="Fecha de registro" value={deploymentDate} />
        </article>

        <article className="overflow-hidden rounded-2xl border border-[#dfe6df] bg-white shadow-sm">
          <h2 className="border-b border-[#e8ece8] px-5 py-4 font-semibold text-[#3f3f3f]">
            Personas autorizadas
          </h2>
          <InfoRow
            label="Dirección de la cuenta"
            value={truncateAddress(multisigAddress)}
            fullValue={multisigAddress}
            action={<ExplorerButton href={data?.multisig.explorerUrl ?? null} />}
          />
          <InfoRow
            label="Umbral de aprobación"
            value={data?.multisig.thresholdLabel ?? "Dato pendiente/no encontrado"}
          />
          {data?.multisig.warning ? (
            <div className="flex items-start gap-2 border-b border-[#e8ece8] bg-[#fff8e8] px-4 py-3 text-sm text-[#a45400]">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              {data.multisig.warning}
            </div>
          ) : null}
          <div className="px-4 py-3">
            <p className="mb-3 text-xs text-[#7a7a7a]">
              Firmantes autorizados
              {typeof data?.multisig.ownersCount === "number"
                ? ` (${data.multisig.ownersCount})`
                : ""}
            </p>
            <div className="space-y-2">
              {data?.multisig.readStatus === "error" ? (
                <p className="rounded-lg border border-[#f3ca72] bg-[#fff8e8] px-3 py-2 text-sm text-[#a45400]">
                  {data.multisig.errorMessage ?? "Error al consultar la blockchain"}
                  <button
                    type="button"
                    onClick={retry}
                    className="ml-3 rounded-md border border-[#d7952f] px-2 py-1 text-xs font-semibold"
                  >
                    Reintentar
                  </button>
                </p>
              ) : null}
              {multisigOwners.length === 0 &&
              data?.multisig.readStatus !== "error" ? (
                <p className="rounded-lg border border-[#edf0ed] px-3 py-2 text-sm text-[#747474]">
                  No hay firmantes configurados.
                </p>
              ) : null}
              {multisigOwners.map((signer, index) => (
                <div
                  key={signer.address}
                  className="grid gap-2 rounded-lg border border-[#edf0ed] p-3 sm:grid-cols-[1fr_auto] sm:items-center"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[#3f3f3f]">
                      Firmante {index + 1}
                    </p>
                    <p className="break-all font-mono text-xs text-[#555]" title={signer.address}>
                      {truncateAddress(signer.address)}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <ExplorerButton href={signer.explorerUrl} />
                  </div>
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
                {(data?.officialWallets ?? []).map((fund) => (
                  <tr key={fund.id} className="border-t border-[#e8ece8]">
                    <td className="px-4 py-3 font-medium text-[#424242]">
                      {fund.name}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-semibold text-[#287c36]">
                        {fund.initialDistribution.amount ??
                          fund.initialDistribution.message ??
                          "Dato pendiente/no encontrado"}
                      </span>
                      {fund.initialDistribution.txExplorerUrl ? (
                        <p className="mt-1">
                          <a
                            href={fund.initialDistribution.txExplorerUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-semibold text-[#287c36] underline-offset-2 hover:underline"
                          >
                            Ver transacción
                          </a>
                        </p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-semibold text-[#424242]">
                        {fund.currentDistribution.amount ??
                          fund.currentDistribution.message ??
                          "Dato pendiente/no encontrado"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="max-w-[190px] truncate font-mono text-xs text-[#555]">
                          {truncateAddress(fund.address)}
                        </span>
                        {fund.address ? <CopyButton value={fund.address} label="Copiar" /> : null}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <ExplorerButton href={fund.explorerUrl} />
                    </td>
                  </tr>
                ))}
                {!isLoading && (data?.officialWallets.length ?? 0) === 0 ? (
                  <tr className="border-t border-[#e8ece8]">
                    <td className="px-4 py-4 text-sm text-[#747474]" colSpan={5}>
                      No configurado.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </article>
        {data?.updatedAt ? (
          <p className="text-xs text-[#747474]">
            Última actualización: {formatDateTimeForUi(data.updatedAt)}
          </p>
        ) : null}
      </div>
    </section>
  );
}
