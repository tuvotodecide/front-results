import { useMemo } from "react";
import { isAddress } from "ethers";
import { useGetHistoryContractsQuery } from "@/store/contracts/contractsEndpoints";
import { useListHistoryOperationsQuery } from "@/store/history/historyEndpoints";
import { useGetElectionCreditsUsageQuery } from "@/store/votingEvents/votingEventsEndpoints";
import { getTvdBlockchainReadConfig } from "@/shared/tvd/tvdBlockchainConfig";
import {
  buildExplorerAddressUrl,
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

export type ElectionTvdUsage = {
  isLoading: boolean;
  error: string | null;
  networkName: string;
  creditsContractAddress: string | null;
  creditsContractUrl: string | null;
  registrationVerified: boolean;
  statusChecked: boolean;
  publicationTxHash: string | null;
  publicationTxUrl: string | null;
  fields: ElectionTvdField[];
  operations: ElectionTvdOperation[];
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
  const contracts = contractsResponse?.data;
  const configuredCreditsAddress = contracts?.electoralCredits?.address ?? null;
  const creditsContractAddress =
    configuredCreditsAddress && isAddress(configuredCreditsAddress)
      ? configuredCreditsAddress
      : null;

  const fields = useMemo<ElectionTvdField[]>(() => {
    if (!creditsUsage) return [];
    return [
      {
        label: "Saldo inicial de créditos",
        value: formatTvdAmount(BigInt(creditsUsage.startCreditBalance || "0"), 0, "Créditos"),
      },
      {
        label: "TVD bloqueado al inicio",
        value: formatTvdAmount(BigInt(creditsUsage.startLockedTVD || "0"), decimals, "$TVD"),
      },
      {
        label: "Créditos disponibles",
        value: formatTvdAmount(BigInt(creditsUsage.creditBalance || "0"), 0, "Créditos"),
      },
      {
        label: "TVD pendiente",
        value: formatTvdAmount(BigInt(creditsUsage.pendingTVD || "0"), decimals, "$TVD"),
      },
      {
        label: "TVD bloqueado",
        value: formatTvdAmount(BigInt(creditsUsage.lockedTVD || "0"), decimals, "$TVD"),
      },
      {
        label: "TVD consumido",
        value: formatTvdAmount(BigInt(creditsUsage.consumedTVD || "0"), decimals, "$TVD"),
      },
      {
        label: "TVD quemado",
        value: formatTvdAmount(BigInt(creditsUsage.burnedTVD || "0"), decimals, "$TVD"),
      },
      {
        label: "TVD devuelto",
        value: formatTvdAmount(BigInt(creditsUsage.refundedTVD || "0"), decimals, "$TVD"),
      },
      {
        label: "Liquidación completada",
        value: creditsUsage.liquidated ? "Sí" : "No",
      },
    ];
  }, [creditsUsage, decimals]);

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
  const publicationOperation = useMemo(
    () =>
      (historyData?.items ?? []).find(
        (operation) => operation.operationName === "Elección creada",
      ) ?? null,
    [historyData?.items],
  );
  const publicationTxHash = publicationOperation?.txHash ?? null;

  return {
    isLoading: contractsLoading || creditsLoading || historyLoading,
    error: readError,
    networkName: config.name,
    creditsContractAddress,
    creditsContractUrl: buildExplorerAddressUrl(
      config.explorerBaseUrl,
      creditsContractAddress,
    ),
    registrationVerified: fields.length > 0,
    statusChecked: fields.length > 0,
    publicationTxHash,
    publicationTxUrl: buildExplorerTxUrl(config.explorerBaseUrl, publicationTxHash),
    fields,
    operations,
  };
};
