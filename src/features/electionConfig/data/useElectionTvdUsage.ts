import { useMemo } from "react";
import { isAddress, parseUnits } from "ethers";
import { useGetHistoryContractsQuery } from "@/store/contracts/contractsEndpoints";
import { useListHistoryOperationsQuery } from "@/store/history/historyEndpoints";
import { useGetCurrentTvdExchangeRateQuery } from "@/store/tvd";
import { useGetElectionCreditsUsageQuery } from "@/store/votingEvents/votingEventsEndpoints";
import { getTvdBlockchainReadConfig } from "@/shared/tvd/tvdBlockchainConfig";
import {
  buildExplorerTxUrl,
  formatTvdAmount,
} from "@/shared/tvd/tvdBlockchainFormatters";
import { getTvdOperationMetadata } from "@/shared/tvd/tvdOperationMetadata";
import { getRuntimeEnv } from "@/shared/system/runtimeEnv";

export type ElectionTvdOperation = {
  id: string;
  type: string;
  amount: string | null;
  status: string;
  date: string;
  txHash: string | null;
  explorerUrl: string | null;
};

export type ElectionTvdField = {
  label: string;
  value: string;
};

export type ElectionTvdEconomicField = {
  label: string;
  tvd: string;
  bob: string | null;
};

export type ElectionTvdUsage = {
  isLoading: boolean;
  error: string | null;
  creditsContractAddress: string | null;
  registrationVerified: boolean;
  statusChecked: boolean;
  economicFields: ElectionTvdEconomicField[];
  operationalFields: ElectionTvdField[];
  liquidationStatus: string;
  operations: ElectionTvdOperation[];
};

const BOB_RATE_DECIMALS = 18;
const BOB_DISPLAY_DECIMALS = 2;

export const formatTvdToBob = (
  rawTvd: string | null | undefined,
  tvdDecimals: number,
  bobPerToken: string | null | undefined,
) => {
  if (!bobPerToken) return null;

  try {
    const tvd = BigInt(rawTvd || "0");
    const rate = parseUnits(bobPerToken, BOB_RATE_DECIMALS);
    const rawBob = tvd * rate;
    const scale = tvdDecimals + BOB_RATE_DECIMALS;
    const roundingFactor = 10n ** BigInt(scale - BOB_DISPLAY_DECIMALS);
    const roundedCents = (rawBob + roundingFactor / 2n) / roundingFactor;
    const whole = roundedCents / 100n;
    const fraction = (roundedCents % 100n).toString().padStart(2, "0");

    return `${whole.toString()}.${fraction} Bs`;
  } catch {
    return null;
  }
};

const getTvdDecimals = () => {
  const configured = Number(
    getRuntimeEnv("VITE_TVD_DECIMALS", "NEXT_PUBLIC_TVD_DECIMALS"),
  );
  return Number.isSafeInteger(configured) && configured >= 0 && configured <= 36
    ? configured
    : 18;
};

const formatDate = (value?: string | null) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("es-BO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatRelatedAmount = (value?: string | null) => {
  if (!value) return null;
  return `${value} $TVD`;
};

export const useElectionTvdUsage = (electionId: string): ElectionTvdUsage => {
  const config = useMemo(() => getTvdBlockchainReadConfig(), []);
  const decimals = useMemo(() => getTvdDecimals(), []);
  const { data: contractsResponse, isLoading: contractsLoading } =
    useGetHistoryContractsQuery();
  const { data: historyData, isFetching: historyLoading } =
    useListHistoryOperationsQuery(
      { electionId, page: 1, limit: 10 },
      { skip: !electionId },
    );
  const {
    data: creditsUsage,
    isFetching: creditsLoading,
    isError: creditsHasError,
  } = useGetElectionCreditsUsageQuery(electionId, { skip: !electionId });
  const { data: currentRate } = useGetCurrentTvdExchangeRateQuery();
  const contracts = contractsResponse?.data;
  const configuredCreditsAddress = contracts?.electoralCredits?.address ?? null;
  const creditsContractAddress =
    configuredCreditsAddress && isAddress(configuredCreditsAddress)
      ? configuredCreditsAddress
      : null;

  const economicFields = useMemo<ElectionTvdEconomicField[]>(() => {
    if (!creditsUsage) return [];
    const economicRows = [
      { label: "Reservado al inicio", value: creditsUsage.startLockedTVD },
      { label: "Consumido", value: creditsUsage.consumedTVD },
      { label: "Liberado / devuelto", value: creditsUsage.refundedTVD },
      { label: "Pendiente", value: creditsUsage.pendingTVD },
      { label: "Bloqueado actualmente", value: creditsUsage.lockedTVD },
      { label: "Quemado", value: creditsUsage.burnedTVD },
    ];

    return economicRows.map((row) => ({
      label: row.label,
      tvd: formatTvdAmount(BigInt(row.value || "0"), decimals, "$TVD"),
      bob: formatTvdToBob(row.value, decimals, currentRate?.bobPerToken),
    }));
  }, [creditsUsage, currentRate?.bobPerToken, decimals]);

  const operationalFields = useMemo<ElectionTvdField[]>(() => {
    if (!creditsUsage) return [];
    return [
      {
        label: "Saldo inicial de créditos",
        value: formatTvdAmount(BigInt(creditsUsage.startCreditBalance || "0"), 0, "Créditos"),
      },
      {
        label: "Créditos disponibles",
        value: formatTvdAmount(BigInt(creditsUsage.creditBalance || "0"), 0, "Créditos"),
      },
    ];
  }, [creditsUsage]);

  const readError =
    electionId && creditsHasError
      ? "No se pudo consultar el uso de TVD para esta votación."
      : null;

  const operations = useMemo(
    () =>
      (historyData?.items ?? []).map((operation) => ({
        id: operation.id,
        type: getTvdOperationMetadata(operation.operationName).label,
        amount: formatRelatedAmount(operation.relatedAmount),
        status: "Confirmada",
        date: formatDate(operation.registerDate),
        txHash: operation.txHash,
        explorerUrl: buildExplorerTxUrl(config.explorerBaseUrl, operation.txHash),
      })),
    [config.explorerBaseUrl, historyData?.items],
  );
  return {
    isLoading: contractsLoading || creditsLoading || historyLoading,
    error: readError,
    creditsContractAddress,
    registrationVerified: economicFields.length > 0,
    statusChecked: economicFields.length > 0,
    economicFields,
    operationalFields,
    liquidationStatus: creditsUsage?.liquidated ? "Liquidada" : "No liquidada",
    operations,
  };
};
