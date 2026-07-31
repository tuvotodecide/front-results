import { useEffect, useMemo, useState } from "react";
import { Contract, JsonRpcProvider, isAddress } from "ethers";
import { useGetHistoryContractsQuery } from "@/store/contracts/contractsEndpoints";
import { useListHistoryOperationsQuery } from "@/store/history/historyEndpoints";
import { getTvdBlockchainReadConfig } from "@/shared/tvd/tvdBlockchainConfig";
import {
  buildExplorerAddressUrl,
  buildExplorerTxUrl,
  formatTvdAmount,
} from "@/shared/tvd/tvdBlockchainFormatters";
import { getTvdOperationMetadata } from "@/shared/tvd/tvdOperationMetadata";

const ELECTORAL_CREDITS_ABI = [
  "function getElection(uint256 electionId) view returns (address institution,uint256 creditBalance,uint256 lockedTVD,uint256 pendingTVD,uint256 startCreditBalance,uint256 startLockedTVD,bool liquidated,uint256 burnedTVD,uint256 consumedTVD,uint256 refundedTVD)",
] as const;
const TOKEN_ABI = ["function decimals() view returns (uint8)"] as const;

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

const isHexElectionId = (value: string) => /^[0-9a-fA-F]+$/.test(value);

const toElectionBigInt = (electionId: string) => {
  const trimmed = electionId.trim().replace(/^0x/i, "");
  if (!trimmed || !isHexElectionId(trimmed)) return null;
  return BigInt(`0x${trimmed}`);
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
  const [fields, setFields] = useState<ElectionTvdField[]>([]);
  const [readError, setReadError] = useState<string | null>(null);
  const [isReading, setIsReading] = useState(false);
  const { data: contractsResponse, isLoading: contractsLoading } =
    useGetHistoryContractsQuery();
  const { data: historyData, isFetching: historyLoading } =
    useListHistoryOperationsQuery(
      { electionId, page: 1, limit: 10 },
      { skip: !electionId },
    );
  const contracts = contractsResponse?.data;
  const configuredCreditsAddress = contracts?.electoralCredits?.address ?? null;
  const configuredTokenAddress = contracts?.tvdToken?.address ?? null;
  const creditsContractAddress =
    configuredCreditsAddress && isAddress(configuredCreditsAddress)
      ? configuredCreditsAddress
      : null;
  const tokenContractAddress =
    configuredTokenAddress && isAddress(configuredTokenAddress)
      ? configuredTokenAddress
      : null;

  useEffect(() => {
    let cancelled = false;

    const readElection = async () => {
      const electionBigInt = toElectionBigInt(electionId);
      if (!electionBigInt) {
        setFields([]);
        setReadError("No se pudo consultar el uso de TVD para esta votación.");
        return;
      }
      if (!config.rpcUrl || !creditsContractAddress) {
        setFields([]);
        setReadError("La consulta de TVD no está disponible en este momento.");
        return;
      }

      setIsReading(true);
      setReadError(null);
      try {
        const provider = new JsonRpcProvider(config.rpcUrl, config.chainId ?? undefined, {
          batchMaxCount: 1,
        });
        const contract = new Contract(
          creditsContractAddress,
          ELECTORAL_CREDITS_ABI,
          provider,
        );
        const tokenContract = tokenContractAddress
          ? new Contract(tokenContractAddress, TOKEN_ABI, provider)
          : null;
        const [result, decimalsResult] = await Promise.all([
          contract.getElection(electionBigInt),
          tokenContract?.decimals() ?? Promise.resolve(null),
        ]);
        if (cancelled) return;
        const decimals = decimalsResult === null ? NaN : Number(decimalsResult);
        if (!Number.isSafeInteger(decimals) || decimals < 0 || decimals > 36) {
          throw new Error("decimales invalidos");
        }
        setFields([
          {
            label: "Saldo inicial de créditos",
            value: formatTvdAmount(BigInt(result.startCreditBalance ?? 0), decimals, "$TVD"),
          },
          {
            label: "TVD bloqueado al inicio",
            value: formatTvdAmount(BigInt(result.startLockedTVD ?? 0), decimals, "$TVD"),
          },
          {
            label: "Créditos disponibles",
            value: formatTvdAmount(BigInt(result.creditBalance ?? 0), decimals, "$TVD"),
          },
          {
            label: "TVD pendiente",
            value: formatTvdAmount(BigInt(result.pendingTVD ?? 0), decimals, "$TVD"),
          },
          {
            label: "TVD bloqueado",
            value: formatTvdAmount(BigInt(result.lockedTVD ?? 0), decimals, "$TVD"),
          },
          {
            label: "TVD consumido",
            value: formatTvdAmount(BigInt(result.consumedTVD ?? 0), decimals, "$TVD"),
          },
          {
            label: "TVD quemado",
            value: formatTvdAmount(BigInt(result.burnedTVD ?? 0), decimals, "$TVD"),
          },
          {
            label: "TVD devuelto",
            value: formatTvdAmount(BigInt(result.refundedTVD ?? 0), decimals, "$TVD"),
          },
          {
            label: "Liquidación completada",
            value: Boolean(result.liquidated) ? "Sí" : "No",
          },
        ]);
      } catch {
        if (!cancelled) {
          setFields([]);
          setReadError("No se pudo consultar el uso de TVD para esta votación.");
        }
      } finally {
        if (!cancelled) setIsReading(false);
      }
    };

    void readElection();

    return () => {
      cancelled = true;
    };
  }, [
    config.chainId,
    config.rpcUrl,
    creditsContractAddress,
    electionId,
    tokenContractAddress,
  ]);

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
    isLoading: contractsLoading || isReading || historyLoading,
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
