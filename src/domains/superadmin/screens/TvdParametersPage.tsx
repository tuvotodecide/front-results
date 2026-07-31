"use client";

import { ExternalLink } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import Modal2 from "@/components/Modal2";
import { formatDateTimeForUi } from "@/features/electionConfig/renderUtils";
import {
  useCreateTvdExchangeRateMutation,
  useGetCurrentTvdExchangeRateQuery,
} from "@/store/tvd";
import SuperadminPageHeader from "../components/SuperadminPageHeader";
import { useTvdParametersReadModel } from "../hooks/useSuperadminTvdReadModel";

type ContractAction = {
  id: string;
  name: string;
  value: string;
  status: "available" | "error" | "pending";
  example: string | null;
  explorerUrl: string | null;
};

const DECIMAL_PATTERN = /^(?:0|[1-9]\d*)(?:\.\d{1,18})?$/;

const generateIdempotencyKey = () => {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `rate-${Date.now().toString(36)}-${Math.random().toString(16).slice(2)}`;
};

const isPositiveDecimal = (value: string) => {
  const trimmed = value.trim();
  if (!DECIMAL_PATTERN.test(trimmed)) return false;
  const [integerPart, decimalPart = ""] = trimmed.split(".");
  return BigInt(integerPart) > 0n || /[1-9]/.test(decimalPart);
};

const getApiMessage = (error: unknown, fallback: string) => {
  if (typeof error !== "object" || error === null) return fallback;
  const data = "data" in error ? (error as { data?: any }).data : null;
  const message = data?.message;
  const rawMessage =
    typeof message === "string"
      ? message.trim()
      : Array.isArray(message)
        ? message.join(" ").trim()
        : "";
  if (/bobPerToken|reason|Idempotency-Key|validFrom|validUntil/i.test(rawMessage)) {
    return "Revisa el valor y el motivo antes de guardar.";
  }
  if (rawMessage) return rawMessage;
  return fallback;
};

const valueClassName = (status: ContractAction["status"]) =>
  status === "available"
    ? "font-mono font-semibold text-[#287c36]"
    : status === "error"
      ? "font-medium text-[#a45400]"
      : "font-medium text-[#747474]";

const EditActionLabel = ({ action }: { action: ContractAction }) => (
  <span
    className="inline-flex items-center justify-center gap-2 rounded-md bg-[#287c36] px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#1f642b] disabled:cursor-not-allowed disabled:bg-[#9aa79c]"
    aria-disabled={!action.explorerUrl}
  >
    <ExternalLink className="h-4 w-4" />
    Editar
  </span>
);

const toWriteContractUrl = (url: string | null | undefined) =>
  url ? `${url.replace(/#.*$/, "")}#writeContract` : null;

const formatRawTvd = (raw: string | null | undefined, decimals: number | null | undefined) => {
  if (!raw || decimals === null || decimals === undefined) return null;
  try {
    const value = BigInt(raw);
    const divisor = 10n ** BigInt(decimals);
    const integer = value / divisor;
    const fraction = value % divisor;
    const fractionText = fraction
      .toString()
      .padStart(decimals, "0")
      .replace(/0+$/, "");
    return fractionText ? `${integer}.${fractionText}` : integer.toString();
  } catch {
    return null;
  }
};

const multiplyRawTvd = (
  raw: string | null | undefined,
  multiplier: bigint,
  decimals: number | null | undefined,
) => {
  if (!raw || decimals === null || decimals === undefined) return null;
  try {
    return formatRawTvd((BigInt(raw) * multiplier).toString(), decimals);
  } catch {
    return null;
  }
};

const calculateBurnExample = (
  burnBps: string | null | undefined,
) => {
  if (!burnBps) return null;
  try {
    const bps = BigInt(burnBps);
    const burned = Number(bps) / 100;
    const percentage = Number(bps) / 100;
    const cleaned = Number.isInteger(burned)
      ? String(burned)
      : burned.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
    const percentageText = Number.isInteger(percentage)
      ? String(percentage)
      : percentage.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
    return `Si se consumen 100 $TVD por votos válidos, el ${percentageText}% se quema, es decir ${cleaned} $TVD.`;
  } catch {
    return null;
  }
};

const ReadOnlySwitch = ({
  checked,
  disabled,
  onClick,
  label,
}: {
  checked: boolean;
  disabled?: boolean;
  onClick: () => void;
  label: string;
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    aria-label={label}
    aria-pressed={checked}
    className={`relative inline-flex h-7 w-12 items-center rounded-full transition ${
      checked ? "bg-[#287c36]" : "bg-[#cfd8cf]"
    } disabled:cursor-not-allowed disabled:opacity-60`}
  >
    <span
      className={`inline-block h-5 w-5 rounded-full bg-white shadow transition ${
        checked ? "translate-x-6" : "translate-x-1"
      }`}
    />
  </button>
);

export default function TvdParametersPage() {
  const [selected, setSelected] = useState<ContractAction | null>(null);
  const [rateModalOpen, setRateModalOpen] = useState(false);
  const [rateValue, setRateValue] = useState("");
  const [rateReason, setRateReason] = useState("Actualización del valor del token");
  const [rateError, setRateError] = useState<string | null>(null);
  const [rateFeedback, setRateFeedback] = useState<string | null>(null);
  const { data, isLoading, error, retry } = useTvdParametersReadModel();
  const {
    data: currentRate,
    error: currentRateError,
    isFetching: isRateFetching,
    refetch: refetchCurrentRate,
  } = useGetCurrentTvdExchangeRateQuery();
  const [createRate, createRateState] = useCreateTvdExchangeRateMutation();

  const showData = Boolean(data) && !isLoading;
  const contractActions = useMemo<ContractAction[]>(() => {
    const campaignEnabled =
      data?.campaign.status === "available" &&
      data.campaign.fields.some(
        (field) => field.label === "Estado" && field.value === "Abierta",
      );
    return [
      {
        id: "vote-consumption",
        name: "Consumo por voto válido",
        value:
          data?.tvdPerCredit.status === "error"
            ? "No disponible"
            : data?.tvdPerCredit.formatted ?? "Pendiente de consulta",
        status: data?.tvdPerCredit.status === "available" ? "available" : data?.tvdPerCredit.status === "error" ? "error" : "pending",
        example: multiplyRawTvd(data?.tvdPerCredit.raw, 100n, data?.decimals)
          ? `Si participan 100 votantes válidos, se consumen ${multiplyRawTvd(data?.tvdPerCredit.raw, 100n, data?.decimals)} $TVD.`
          : null,
        explorerUrl: toWriteContractUrl(data?.contracts.electoralCredits.explorerUrl),
      },
      {
        id: "burn-percentage",
        name: "Porcentaje de quema",
        value:
          data?.burn.status === "error"
            ? "No disponible"
            : data?.burn.burnPercentage ?? "Pendiente de consulta",
        status: data?.burn.status === "available" ? "available" : data?.burn.status === "error" ? "error" : "pending",
        example: calculateBurnExample(data?.burn.burnBps),
        explorerUrl: toWriteContractUrl(data?.contracts.electoralCredits.explorerUrl),
      },
      {
        id: "vote-reward",
        name: "Recompensa por voto válido",
        value:
          data?.rewardByVote.status === "error"
            ? "No disponible"
            : data?.rewardByVote.formatted ?? "Pendiente de consulta",
        status: data?.rewardByVote.status === "available" ? "available" : data?.rewardByVote.status === "error" ? "error" : "pending",
        example: formatRawTvd(data?.rewardByVote.raw, data?.decimals)
          ? `Cada votante válido recibe ${formatRawTvd(data?.rewardByVote.raw, data?.decimals)} $TVD si la recompensa está activa.`
          : null,
        explorerUrl: toWriteContractUrl(data?.contracts.voteManager.explorerUrl),
      },
      {
        id: "reward-status",
        name: "Entrega por voto válido",
        value:
          data?.rewardByVote.status === "error"
            ? "No disponible"
            : data?.rewardByVote.enabled === null || data?.rewardByVote.enabled === undefined ? "Pendiente de consulta" : data.rewardByVote.enabled ? "Recompensas activas" : "Recompensas desactivadas",
        status: data?.rewardByVote.status === "available" ? "available" : data?.rewardByVote.status === "error" ? "error" : "pending",
        example: data?.rewardByVote.enabled === null || data?.rewardByVote.enabled === undefined
          ? null
          : data.rewardByVote.enabled
            ? "La recompensa se entrega cuando corresponde."
            : "La recompensa no se entrega mientras esté desactivada.",
        explorerUrl: toWriteContractUrl(data?.contracts.voteManager.explorerUrl),
      },
      {
        id: "initial-campaign",
        name: "Campaña de incentivo inicial",
        value:
          data?.campaign.status === "error"
            ? "No disponible"
            : data?.campaign.status === "available" ? (campaignEnabled ? "Activa" : "Pausada") : "No disponible",
        status: data?.campaign.status === "available" ? "available" : data?.campaign.status === "error" ? "error" : "pending",
        example: data?.campaign.status === "available"
          ? campaignEnabled
            ? "La campaña está disponible para las cuentas elegibles."
            : "La campaña no está disponible en este momento."
          : null,
        explorerUrl: toWriteContractUrl(data?.contracts.incentiveCampaigns.explorerUrl),
      },
    ];
  }, [data]);
  const economicActions = useMemo(
    () =>
      contractActions.filter((action) =>
        ["vote-consumption", "burn-percentage", "vote-reward"].includes(
          action.id,
        ),
      ),
    [contractActions],
  );
  const rewardStatusAction = contractActions.find(
    (action) => action.id === "reward-status",
  );
  const campaignAction = contractActions.find(
    (action) => action.id === "initial-campaign",
  );

  const openContractAction = () => {
    if (!selected?.explorerUrl) return;
    window.open(selected.explorerUrl, "_blank", "noopener,noreferrer");
    setSelected(null);
  };

  const openRateModal = () => {
    setRateValue(currentRate?.bobPerToken ?? "");
    setRateReason("Actualización del valor del token");
    setRateError(null);
    setRateFeedback(null);
    setRateModalOpen(true);
  };

  const handleRateSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextValue = rateValue.trim();
    const nextReason = rateReason.trim();
    setRateError(null);
    setRateFeedback(null);
    if (!isPositiveDecimal(nextValue)) {
      setRateError("Ingresa un valor mayor que cero con hasta 18 decimales.");
      return;
    }
    if (nextReason.length < 8 || nextReason.length > 240) {
      setRateError("Ingresa un motivo entre 8 y 240 caracteres.");
      return;
    }
    try {
      await createRate({
        body: {
          fiatCurrency: "BOB",
          bobPerToken: nextValue,
          reason: nextReason,
        },
        idempotencyKey: generateIdempotencyKey(),
      }).unwrap();
      await refetchCurrentRate();
      setRateFeedback("Valor actualizado correctamente.");
      setRateModalOpen(false);
    } catch (submitError) {
      setRateError(getApiMessage(submitError, "No se pudo guardar el valor."));
    }
  };

  return (
    <section>
      <SuperadminPageHeader
        title="Parámetros económicos $TVD"
        subtitle="Configuración económica vigente del token consultada desde contrato."
      />

      <div className="space-y-6">
        {isLoading ? (
          <div className="rounded-lg border border-[#dfe6df] bg-white p-4">
            <div className="h-4 w-52 animate-pulse rounded bg-[#edf0ed]" />
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <div className="h-16 animate-pulse rounded-lg bg-[#f2f4f2]" />
              <div className="h-16 animate-pulse rounded-lg bg-[#f2f4f2]" />
              <div className="h-16 animate-pulse rounded-lg bg-[#f2f4f2]" />
            </div>
          </div>
        ) : null}
        {error ? (
          <div className="rounded-lg border border-[#f3ca72] bg-[#fff8e8] px-4 py-3 text-sm text-[#a45400]">
            <p>{error}</p>
            <button
              type="button"
              onClick={retry}
              className="mt-2 rounded-md border border-[#e9c39d] px-3 py-2 text-xs font-semibold hover:border-[#a45400]"
            >
              Reintentar
            </button>
          </div>
        ) : null}
        {showData && !error && data?.status === "partial" ? (
          <div className="rounded-lg border border-[#f3ca72] bg-[#fff8e8] px-4 py-3 text-sm text-[#a45400]">
            <p>
              Algunos valores no pudieron consultarse. Los demás se muestran con normalidad.
            </p>
            <button
              type="button"
              onClick={retry}
              className="mt-2 rounded-md border border-[#e9c39d] px-3 py-2 text-xs font-semibold hover:border-[#a45400]"
            >
              Reintentar
            </button>
          </div>
        ) : null}

        {showData ? (
          <article className="overflow-hidden rounded-2xl border border-[#dfe6df] bg-white shadow-sm">
            <div className="border-b border-[#e8ece8] px-5 py-4">
              <h2 className="text-lg font-semibold text-[#3f3f3f]">
                Parámetros de consumo y recompensa
              </h2>
              <p className="mt-1 text-sm text-[#747474]">
                Datos consultados en {data?.network.name ?? "red no configurada"}
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-[720px] w-full text-left text-sm">
                <thead className="bg-[#fafafa] text-xs uppercase text-[#777]">
                  <tr>
                    <th className="px-5 py-3">Parámetro</th>
                    <th className="px-5 py-3">Valor</th>
                    <th className="px-5 py-3">Ejemplo</th>
                    <th className="px-5 py-3">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {economicActions.map((action) => (
                    <tr key={action.id} className="border-t border-[#e8ece8]">
                      <td className="px-5 py-5 font-medium text-[#424242]">
                        {action.name}
                      </td>
                      <td className={`px-5 py-5 ${valueClassName(action.status)}`}>
                        {action.value}
                      </td>
                      <td className="px-5 py-5 text-[#747474]">
                        {action.example ?? "-"}
                      </td>
                      <td className="px-5 py-5">
                        <button
                          type="button"
                          onClick={() => setSelected(action)}
                          disabled={!action.explorerUrl}
                          className="disabled:cursor-not-allowed disabled:opacity-70"
                        >
                          <EditActionLabel action={action} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>
        ) : null}

        {showData ? (
          <div className="grid gap-4 lg:grid-cols-2">
            <article className="rounded-xl border border-[#dfe6df] bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-base font-semibold text-[#3f3f3f]">
                    Estado de recompensas
                  </h2>
                  <p className="mt-2 text-2xl font-bold text-[#287c36]">
                    {data?.rewardByVote.status === "error"
                      ? "No disponible"
                      : data?.rewardByVote.enabled === null ||
                          data?.rewardByVote.enabled === undefined
                      ? "Pendiente de consulta"
                      : data.rewardByVote.enabled
                        ? "Recompensas activas"
                        : "Recompensas desactivadas"}
                  </p>
                  {data?.rewardByVote.status === "error" ? (
                    <p className="mt-2 text-sm text-[#a45400]">
                      {data.rewardByVote.message ?? "No se pudo consultar este valor."}
                    </p>
                  ) : null}
                </div>
                <ReadOnlySwitch
                  checked={Boolean(data?.rewardByVote.enabled)}
                  disabled={data?.rewardByVote.status !== "available"}
                  label="Editar estado de recompensas"
                  onClick={() => setSelected(rewardStatusAction ?? null)}
                />
              </div>
              <button
                type="button"
                onClick={() => setSelected(rewardStatusAction ?? null)}
                disabled={!rewardStatusAction?.explorerUrl}
                className="mt-4 inline-flex items-center justify-center rounded-lg bg-[#287c36] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#1f642b] disabled:cursor-not-allowed disabled:bg-[#9aa79c]"
              >
                Editar
              </button>
            </article>

            <article className="rounded-xl border border-[#dfe6df] bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-base font-semibold text-[#3f3f3f]">
                    Campaña de incentivo inicial
                  </h2>
                  <p className="mt-2 text-2xl font-bold text-[#287c36]">
                    {campaignAction?.value ?? "Pendiente de consulta"}
                  </p>
                  {data?.campaign.status === "error" ? (
                    <p className="mt-2 text-sm text-[#a45400]">
                      {data.campaign.message ?? "No se pudo consultar este valor."}
                    </p>
                  ) : null}
                </div>
                <ReadOnlySwitch
                  checked={
                    data?.campaign.status === "available" &&
                    data.campaign.fields.some(
                      (field) => field.label === "Estado" && field.value === "Abierta",
                    )
                  }
                  disabled={data?.campaign.status !== "available"}
                  label="Editar campaña de incentivo inicial"
                  onClick={() => setSelected(campaignAction ?? null)}
                />
              </div>
              <button
                type="button"
                onClick={() => setSelected(campaignAction ?? null)}
                disabled={!campaignAction?.explorerUrl}
                className="mt-4 inline-flex items-center justify-center rounded-lg bg-[#287c36] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#1f642b] disabled:cursor-not-allowed disabled:bg-[#9aa79c]"
              >
                Editar
              </button>
            </article>
          </div>
        ) : null}

        <article className="rounded-2xl border border-[#dfe6df] bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-[#3f3f3f]">Valor del token</h2>
              <p className="mt-1 text-sm text-[#747474]">Valor vigente en bolivianos.</p>
            </div>
            <button
              type="button"
              onClick={openRateModal}
              className="inline-flex items-center justify-center rounded-lg bg-[#287c36] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#1f642b]"
            >
              Editar
            </button>
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-[#edf0ed] px-4 py-3">
              <p className="text-xs text-[#747474]">Valor actual</p>
              <p
                className={`mt-1 text-2xl font-bold ${
                  currentRate?.bobPerToken ? "text-[#287c36]" : "text-[#747474]"
                }`}
              >
                {isRateFetching
                  ? "Consultando..."
                  : currentRate?.bobPerToken
                    ? `${currentRate.bobPerToken} Bs por TVD`
                    : "No disponible"}
              </p>
            </div>
            {currentRate?.validFrom ? (
              <div className="rounded-lg border border-[#edf0ed] px-4 py-3">
                <p className="text-xs text-[#747474]">Vigente desde</p>
                <p className="mt-1 text-sm font-semibold text-[#3f3f3f]">
                  {formatDateTimeForUi(currentRate.validFrom)}
                </p>
              </div>
            ) : null}
          </div>
          {currentRateError ? (
            <div className="mt-4 rounded-lg border border-[#f3ca72] bg-[#fff8e8] px-4 py-3 text-sm text-[#a45400]">
              {getApiMessage(currentRateError, "No se pudo consultar el valor actual.")}
            </div>
          ) : null}
          {rateFeedback ? (
            <div className="mt-4 rounded-lg border border-[#c8e6c9] bg-[#f1f8f2] px-4 py-3 text-sm text-[#287c36]">
              {rateFeedback}
            </div>
          ) : null}
        </article>
      </div>

      <Modal2
        isOpen={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={selected?.name ?? "Abrir en blockchain"}
        type="plain"
        size="md"
      >
        <div className="space-y-5">
          <p className="text-sm text-[#555]">
            Este cambio se realiza desde el contrato con la cuenta autorizada.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="rounded-lg border border-[#dfe3df] px-4 py-3 text-sm font-medium text-[#444] transition-colors hover:bg-[#f7f8f7]"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={openContractAction}
              disabled={!selected?.explorerUrl}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#287c36] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#1f642b] disabled:cursor-not-allowed disabled:bg-[#9aa79c]"
            >
              <ExternalLink className="h-4 w-4" />
              Abrir en blockchain
            </button>
          </div>
        </div>
      </Modal2>

      <Modal2
        isOpen={rateModalOpen}
        onClose={() => {
          if (!createRateState.isLoading) setRateModalOpen(false);
        }}
        title="Editar valor del token"
        type="plain"
        size="md"
      >
        <form className="space-y-4" onSubmit={(event) => void handleRateSubmit(event)}>
          <p className="text-sm text-[#555]">
            Define cuántos bolivianos equivalen a un TVD para nuevas recargas.
          </p>
          <label className="block text-sm font-semibold text-[#424242]">
            Valor
            <div className="mt-2 flex items-center rounded-lg border border-[#dfe3df] px-3 py-2 focus-within:border-[#287c36] focus-within:ring-2 focus-within:ring-[#287c36]/15">
              <input
                value={rateValue}
                onChange={(event) => setRateValue(event.target.value)}
                inputMode="decimal"
                className="w-0 min-w-0 flex-1 border-0 bg-transparent text-lg font-semibold outline-none"
                placeholder="1.00"
                disabled={createRateState.isLoading}
              />
              <span className="ml-3 text-sm font-semibold text-[#747474]">Bs por TVD</span>
            </div>
          </label>
          <label className="block text-sm font-semibold text-[#424242]">
            Motivo
            <textarea
              value={rateReason}
              onChange={(event) => setRateReason(event.target.value)}
              rows={3}
              maxLength={240}
              className="mt-2 w-full rounded-lg border border-[#dfe3df] px-3 py-2 text-sm outline-none focus:border-[#287c36] focus:ring-2 focus:ring-[#287c36]/15"
              disabled={createRateState.isLoading}
            />
          </label>
          {rateError ? (
            <div className="rounded-lg border border-[#f3ca72] bg-[#fff8e8] px-4 py-3 text-sm text-[#a45400]">
              {rateError}
            </div>
          ) : null}
          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setRateModalOpen(false)}
              disabled={createRateState.isLoading}
              className="rounded-lg border border-[#dfe3df] px-4 py-3 text-sm font-medium text-[#444] transition-colors hover:bg-[#f7f8f7] disabled:opacity-60"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={createRateState.isLoading}
              className="rounded-lg bg-[#287c36] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#1f642b] disabled:cursor-not-allowed disabled:bg-[#9aa79c]"
            >
              {createRateState.isLoading ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </form>
      </Modal2>
      {showData && data?.updatedAt ? (
        <p className="mt-5 text-xs text-[#747474]">
          Última actualización: {formatDateTimeForUi(data.updatedAt)}
        </p>
      ) : null}
    </section>
  );
}
