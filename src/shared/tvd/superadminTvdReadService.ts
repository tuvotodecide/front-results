import {
  Contract,
  formatUnits,
  Interface,
  JsonRpcProvider,
  isAddress,
} from "ethers";
import type {
  HistoryContractsData,
  TvdAddressInfo,
  TvdContractsReadModel,
  TvdDeploymentDate,
  TvdEconomicValue,
  TvdParametersReadModel,
  TvdReadIssue,
  TvdReadStatus,
} from "./superadminTvdTypes";
import { getTvdServerBlockchainConfig } from "./tvdBlockchainConfig";
import {
  buildExplorerAddressUrl,
  buildExplorerTxUrl,
  convertBurnBpsToPercentage,
  formatTvdAmount,
  ZERO_ADDRESS,
} from "./tvdBlockchainFormatters";

const TOKEN_ABI = [
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "function balanceOf(address account) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
];
const MULTISIG_ABI = [
  "function required() view returns (uint256)",
  "function getOwners() view returns (address[])",
];
const ELECTORAL_CREDITS_ABI = [
  "function tvdPerCredit() view returns (uint256)",
  "function burnBps() view returns (uint256)",
  "function platformWallet() view returns (address)",
];
const VOTE_MANAGER_ABI = ["function rewardByVote() view returns (uint256)"];
const INCENTIVE_CAMPAIGNS_ABI = [
  "function campaignsCount() view returns (uint256)",
  "function campaignCount() view returns (uint256)",
  "function campaigns(uint256) view returns (tuple(uint256 incentivePerWallet,uint256 startTime,uint256 duration,bool paused,uint256 maxWallets,uint256 registeredWallets,address fundingWallet))",
  "function campaign(uint256) view returns (tuple(uint256 incentivePerWallet,uint256 startTime,uint256 duration,bool paused,uint256 maxWallets,uint256 registeredWallets,address fundingWallet))",
];

const toNullableString = (value: unknown) => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
};

const normalizeAddress = (value: unknown) => {
  const candidate = toNullableString(value);
  if (!candidate || !isAddress(candidate)) return null;
  return candidate.toLowerCase() === ZERO_ADDRESS ? null : candidate;
};

const normalizeHash = (value: unknown) => {
  const candidate = toNullableString(value);
  if (!candidate || !/^0x[a-fA-F0-9]{64}$/.test(candidate)) return null;
  return candidate;
};

const toBigIntValue = (value: unknown) => {
  if (typeof value === "bigint") return value;
  if (typeof value === "number" && Number.isSafeInteger(value)) return BigInt(value);
  if (typeof value === "string" && /^\d+$/.test(value)) return BigInt(value);
  return null;
};

const serverEnv = (key: string) =>
  typeof process !== "undefined" ? String(process.env[key] ?? "").trim() : "";

const readFirstServerEnv = (keys: readonly string[]) => {
  for (const key of keys) {
    const value = serverEnv(key);
    if (value) return value;
  }
  return "";
};

const getConfiguredAddress = (
  key: string | readonly string[],
  issues: TvdReadIssue[],
) => {
  const keys = Array.isArray(key) ? key : [key];
  const value = normalizeAddress(readFirstServerEnv(keys));
  if (!value) {
    issues.push({
      code: `${keys[0]}_MISSING`,
      message: `Falta configurar ${keys.join(" o ")}`,
    });
  }
  return value;
};

const getConfiguredHash = (
  key: string | readonly string[],
  issues: TvdReadIssue[],
) => {
  const keys = Array.isArray(key) ? key : [key];
  const value = normalizeHash(readFirstServerEnv(keys));
  if (!value) {
    issues.push({
      code: `${keys[0]}_MISSING`,
      message: `Falta configurar ${keys.join(" o ")}`,
    });
  }
  return value;
};

const OFFICIAL_WALLET_CONFIG = [
  {
    id: "treasury",
    name: "Tesorería multisig",
    keys: ["TVD_TREASURY_WALLET", "TREASURY_WALLET"],
  },
  {
    id: "ecosystem",
    name: "Ecosistema",
    keys: ["TVD_ECOSYSTEM_WALLET", "ECOSYSTEM_WALLET"],
  },
  {
    id: "liquidity",
    name: "Liquidez",
    keys: ["TVD_LIQUIDITY_WALLET", "LIQUIDITY_WALLET"],
  },
  {
    id: "core-team",
    name: "Equipo Core",
    keys: ["TVD_CORE_TEAM_WALLET", "CORE_TEAM_WALLET", "CORE_VESTING_ADDRESS"],
  },
] as const;

const addressInfo = (
  address: string | null,
  txHash: string | null,
  explorerBaseUrl: string | null,
): TvdAddressInfo => ({
  address,
  txHash,
  explorerUrl: buildExplorerAddressUrl(explorerBaseUrl, address),
  txExplorerUrl: buildExplorerTxUrl(explorerBaseUrl, txHash),
  status: address ? "available" : "not_configured",
});

const emptyEconomicValue = (
  status: TvdReadStatus,
  message: string,
): TvdEconomicValue => ({
  raw: null,
  formatted: null,
  status,
  message,
});

export const summarizeTvdReadStatus = (
  primaryConfigured: boolean,
  issues: TvdReadIssue[],
): TvdReadStatus => {
  if (!primaryConfigured) return "not_configured";
  return issues.length > 0 ? "partial" : "available";
};

export const readDeploymentDateFromReceipt = async (
  provider: Pick<
    JsonRpcProvider,
    "getTransactionReceipt" | "getTransaction" | "getBlock"
  >,
  txHash: string | null,
): Promise<TvdDeploymentDate> => {
  if (!txHash) {
    return {
      status: "not_configured",
      isoDate: null,
      message: "txHash no configurado",
    };
  }

  try {
    const receipt = await provider.getTransactionReceipt(txHash);
    if (!receipt) {
      const transaction = await provider.getTransaction(txHash);
      return {
        status: transaction ? "pending" : "not_available",
        isoDate: null,
        message: transaction
          ? "Transacción pendiente"
          : "Transacción no encontrada",
      };
    }
    if (receipt.status === 0) {
      return {
        status: "failed",
        isoDate: null,
        message: "Receipt fallido",
      };
    }
    if (receipt.blockNumber === null || receipt.blockNumber === undefined) {
      return {
        status: "pending",
        isoDate: null,
        message: "Transacción pendiente",
      };
    }
    const block = await provider.getBlock(receipt.blockNumber);
    if (!block) {
      return {
        status: "not_available",
        isoDate: null,
        message: "Bloque no encontrado",
      };
    }

    return {
      status: "available",
      isoDate: new Date(Number(block.timestamp) * 1000).toISOString(),
      message: null,
    };
  } catch {
    return {
      status: "error",
      isoDate: null,
      message: "Error al consultar la blockchain",
    };
  }
};

export async function getTxDateTime(
  provider: Pick<JsonRpcProvider, "getTransaction" | "getBlock">,
  txHash: string,
): Promise<Date | null> {
  const tx = await provider.getTransaction(txHash);

  if (!tx?.blockNumber) {
    return null;
  }

  const block = await provider.getBlock(tx.blockNumber);

  if (!block) {
    return null;
  }

  return new Date(Number(block.timestamp) * 1000);
}

export const readDeploymentDateFromTransaction = async (
  provider: Pick<JsonRpcProvider, "getTransaction" | "getBlock">,
  txHash: string | null,
): Promise<TvdDeploymentDate> => {
  if (!txHash) {
    return {
      status: "not_configured",
      isoDate: null,
      message: "txHash no configurado",
    };
  }

  try {
    const tx = await provider.getTransaction(txHash);
    if (!tx) {
      return {
        status: "not_available",
        isoDate: null,
        message: "Transacción no encontrada",
      };
    }
    if (!tx.blockNumber) {
      return {
        status: "pending",
        isoDate: null,
        message: "Transacción pendiente",
      };
    }
    const date = await getTxDateTime(provider, txHash);
    return date
      ? { status: "available", isoDate: date.toISOString(), message: null }
      : { status: "not_available", isoDate: null, message: "Bloque no encontrado" };
  } catch {
    return {
      status: "error",
      isoDate: null,
      message: "Error RPC al consultar fecha de registro",
    };
  }
};

export type TvdTokenTransfer = {
  tokenAddress: string;
  from: string;
  to: string;
  valueRaw: bigint;
};

export async function getTxTokenTransfers(
  provider: Pick<JsonRpcProvider, "getTransactionReceipt">,
  tokenAddress: string,
  txHash: string,
): Promise<TvdTokenTransfer[]> {
  const receipt = await provider.getTransactionReceipt(txHash);
  if (!receipt) return [];

  const erc20Interface = new Interface([
    "event Transfer(address indexed from, address indexed to, uint256 value)",
  ]);
  const transfers: TvdTokenTransfer[] = [];

  for (const log of receipt.logs) {
    if (log.address.toLowerCase() !== tokenAddress.toLowerCase()) {
      continue;
    }

    try {
      const parsed = erc20Interface.parseLog({
        topics: [...log.topics],
        data: log.data,
      });

      if (parsed?.name === "Transfer") {
        transfers.push({
          tokenAddress: log.address,
          from: parsed.args.from as string,
          to: parsed.args.to as string,
          valueRaw: parsed.args.value as bigint,
        });
      }
    } catch {
      // Ignorar logs no compatibles.
    }
  }

  return transfers;
}

export const readTvdContractsOverview = async (
  contracts: HistoryContractsData,
): Promise<TvdContractsReadModel> => {
  const config = getTvdServerBlockchainConfig();
  const issues: TvdReadIssue[] = [];
  const tvdAddress =
    getConfiguredAddress("TVD_TOKEN_ADDRESS", issues) ??
    normalizeAddress(contracts.tvdToken?.address);
  const tvdTxHash =
    getConfiguredHash(["TVD_TOKEN_TX_HASH", "TVD_TOKEN_DEPLOY_TX_HASH"], issues) ??
    normalizeHash(contracts.tvdToken?.txHash);
  const multisigAddress =
    getConfiguredAddress(["MULTISIG_WALLET_ADDRESS", "TVD_MULTISIG_ADDRESS"], issues) ??
    normalizeAddress(contracts.multisigWallet?.address);
  const multisigTxHash =
    getConfiguredHash(["MULTISIG_WALLET_TX_HASH", "TVD_MULTISIG_TX_HASH"], issues) ??
    normalizeHash(contracts.multisigWallet?.txHash);
  const initialDistributionTxHash = getConfiguredHash(
    ["TVD_INITIAL_DISTRIBUTION_TX_HASH", "TVD_TOKEN_TX_HASH", "TVD_TOKEN_DEPLOY_TX_HASH"],
    issues,
  );
  const coreDistributionTxHash = getConfiguredHash(
    ["TVD_CORE_DISTRIBUTION_TX_HASH", "CORE_DISTRIBUTION_TX_HASH"],
    issues,
  );

  const tvdToken: TvdContractsReadModel["tvdToken"] = {
    ...addressInfo(tvdAddress, tvdTxHash, config.explorerBaseUrl),
    deploymentDate: {
      status: tvdTxHash ? "loading" : "not_configured",
      isoDate: null,
      message: tvdTxHash ? null : "txHash no configurado",
    },
  };

  const multisig: TvdContractsReadModel["multisig"] = {
    ...addressInfo(multisigAddress, multisigTxHash, config.explorerBaseUrl),
    required: null,
    ownersCount: null,
    thresholdLabel: null,
    owners: [],
    warning: null,
    readStatus: multisigAddress ? "loading" : "not_configured",
    errorMessage: multisigAddress ? null : "Dirección multisig no configurada",
  };

  const officialWallets: TvdContractsReadModel["officialWallets"] =
    OFFICIAL_WALLET_CONFIG.map((fund) => {
      const address = getConfiguredAddress(fund.keys, issues);
      const txHash = fund.id === "core-team" ? coreDistributionTxHash : initialDistributionTxHash;
      return {
        id: fund.id,
        name: fund.name,
        address,
        explorerUrl: buildExplorerAddressUrl(config.explorerBaseUrl, address),
        status: address ? "loading" : "not_configured",
        configKey: fund.keys[0],
        initialDistribution: {
          txHash,
          txExplorerUrl: buildExplorerTxUrl(config.explorerBaseUrl, txHash),
          amount: null,
          status: address && txHash ? "loading" : "not_configured",
          message: address ? null : `Falta configurar ${fund.keys.join(" o ")}`,
        },
        currentDistribution: {
          amount: null,
          status: address ? "loading" : "not_configured",
          message: address ? null : `Falta configurar ${fund.keys.join(" o ")}`,
        },
      };
    });

  if (!config.rpcUrl || !tvdAddress) {
    if (!config.rpcUrl) {
      issues.push({
        code: "TVD_RPC_URL_MISSING",
        message: "Falta configurar TVD_RPC_URL",
      });
    }
    if (!tvdAddress) {
      issues.push({
        code: "TVD_TOKEN_ADDRESS_MISSING",
        message: "Falta configurar TVD_TOKEN_ADDRESS",
      });
    }
    tvdToken.deploymentDate = {
      status: tvdTxHash ? "error" : "not_configured",
      isoDate: null,
      message: tvdTxHash ? "Configuración incompleta" : "txHash no configurado",
    };
    multisig.readStatus = multisigAddress ? "error" : "not_configured";
    multisig.errorMessage = multisigAddress
      ? "Configuración incompleta"
      : multisig.errorMessage;
    return {
      status: summarizeTvdReadStatus(Boolean(tvdAddress), issues),
      network: config,
      tvdToken,
      multisig,
      officialWallets,
      updatedAt: new Date().toISOString(),
      issues,
    };
  }

  const provider = new JsonRpcProvider(config.rpcUrl, config.chainId ?? undefined);
  const network = { ...config };

  try {
    const providerNetwork = await provider.getNetwork();
    const actualChainId = Number(providerNetwork.chainId);
    network.actualChainId = actualChainId;
    if (config.expectedChainId && actualChainId !== config.expectedChainId) {
      network.chainStatus = "error";
      network.chainMessage = `ChainId incorrecto: configurado ${config.expectedChainId}, RPC devolvió ${actualChainId}`;
      issues.push({
        code: "TVD_CHAIN_ID_MISMATCH",
        message: network.chainMessage,
      });
    } else {
      network.chainStatus = "available";
      network.chainMessage = null;
    }
  } catch {
    network.chainStatus = "error";
    network.chainMessage = "Error RPC al validar chainId";
    issues.push({
      code: "TVD_CHAIN_ID_RPC_ERROR",
      message: network.chainMessage,
    });
  }

  const decimalsResult = await readTokenDecimals(provider, tvdAddress).catch(() => null);
  const symbolResult = await readTokenSymbol(provider, tvdAddress).catch(() => null);
  const decimals = decimalsResult ?? 18;
  const symbol = symbolResult ?? "$TVD";

  const distributionReads = officialWallets.map(async (fund) => {
    if (!fund.address || !fund.initialDistribution.txHash) return fund;
    try {
      const transfers = await getTxTokenTransfers(
        provider,
        tvdAddress,
        fund.initialDistribution.txHash,
      );
      const amountRaw = transfers
        .filter((transfer) => transfer.to.toLowerCase() === fund.address?.toLowerCase())
        .reduce((total, transfer) => total + transfer.valueRaw, 0n);
      fund.initialDistribution =
        amountRaw > 0n
          ? {
              ...fund.initialDistribution,
              amount: formatTokenAmount(amountRaw, decimals, symbol),
              status: "available",
              message: null,
            }
          : {
              ...fund.initialDistribution,
              amount: null,
              status: "not_available",
              message: "Transfer inicial no encontrado",
            };
    } catch {
      fund.initialDistribution = {
        ...fund.initialDistribution,
        amount: null,
        status: "error",
        message: "Error RPC al consultar distribución inicial",
      };
    }
    return fund;
  });

  const balanceReads = officialWallets.map(async (fund) => {
    if (!fund.address) return fund;
    try {
      const balance = await readTokenBalance(provider, tvdAddress, fund.address);
      fund.currentDistribution = {
        amount: formatTokenAmount(balance, decimals, symbol),
        status: "available",
        message: null,
      };
      fund.status = "available";
    } catch {
      fund.currentDistribution = {
        amount: null,
        status: "error",
        message: "Error RPC al consultar balance actual",
      };
      fund.status = "error";
    }
    return fund;
  });

  const [deploymentResult, multisigResult] =
    await Promise.allSettled([
      readDeploymentDateFromTransaction(provider, tvdTxHash),
      multisigAddress
        ? readMultisig(provider, multisigAddress, config.explorerBaseUrl)
        : Promise.resolve(null),
      Promise.allSettled(distributionReads),
      Promise.allSettled(balanceReads),
    ]);

  if (deploymentResult.status === "fulfilled") {
    tvdToken.deploymentDate = deploymentResult.value;
    if (deploymentResult.value.status === "error") {
      issues.push({
        code: "TVD_DEPLOYMENT_DATE_RPC_ERROR",
        message: deploymentResult.value.message ?? "Error RPC",
      });
    }
  } else {
    tvdToken.deploymentDate = {
      status: "error",
      isoDate: null,
      message: "Error al consultar la blockchain",
    };
    issues.push({
      code: "TVD_DEPLOYMENT_DATE_RPC_ERROR",
      message: "Error al consultar fecha de despliegue",
    });
  }

  if (multisigResult.status === "fulfilled" && multisigResult.value) {
    Object.assign(multisig, multisigResult.value);
  } else if (multisigAddress) {
    multisig.readStatus = "error";
    multisig.errorMessage = "Error al consultar la blockchain";
    issues.push({
      code: "TVD_MULTISIG_RPC_ERROR",
      message: "Error al consultar multisig",
    });
  }

  officialWallets.forEach((fund) => {
    if (fund.initialDistribution.status === "error") {
      issues.push({
        code: `TVD_${fund.id.toUpperCase().replace(/-/g, "_")}_INITIAL_TRANSFER_ERROR`,
        message: fund.initialDistribution.message ?? "Error en distribución inicial",
      });
    }
    if (fund.currentDistribution.status === "error") {
      issues.push({
        code: `TVD_${fund.id.toUpperCase().replace(/-/g, "_")}_BALANCE_ERROR`,
        message: fund.currentDistribution.message ?? "Error en balance actual",
      });
    }
  });

  return {
    status: summarizeTvdReadStatus(Boolean(tvdAddress), issues),
    network,
    tvdToken,
    multisig,
    officialWallets,
    updatedAt: new Date().toISOString(),
    issues,
  };
};

const readMultisig = async (
  provider: JsonRpcProvider,
  address: string,
  explorerBaseUrl: string | null,
) => {
  const contract = new Contract(address, MULTISIG_ABI, provider);
  const [requiredRaw, ownersRaw] = await Promise.all([
    contract.required(),
    contract.getOwners(),
  ]);
  const required = toBigIntValue(requiredRaw);
  const owners = Array.isArray(ownersRaw)
    ? ownersRaw.map(normalizeAddress).filter((owner): owner is string => Boolean(owner))
    : [];
  const requiredLabel = required?.toString() ?? null;
  const ownersCount = owners.length;
  const warning =
    required !== null && required > BigInt(ownersCount)
      ? "El umbral configurado supera la cantidad de firmantes."
      : null;

  return {
    required: requiredLabel,
    ownersCount,
    thresholdLabel:
      requiredLabel !== null ? `${requiredLabel} de ${ownersCount} firmas` : null,
    owners: owners.map((owner) => ({
      address: owner,
      explorerUrl: buildExplorerAddressUrl(explorerBaseUrl, owner),
    })),
    warning,
    readStatus: "available" as TvdReadStatus,
    errorMessage: null,
  };
};

export const readTvdEconomicParameters = async (
  contracts: HistoryContractsData,
): Promise<TvdParametersReadModel> => {
  const config = getTvdServerBlockchainConfig();
  const issues: TvdReadIssue[] = [];
  const tvdAddress = normalizeAddress(contracts.tvdToken?.address);
  const electoralCreditsAddress = normalizeAddress(
    contracts.electoralCredits?.address,
  );
  const voteManagerAddress = normalizeAddress(contracts.voteManager?.address);
  const incentiveCampaignsAddress = normalizeAddress(
    contracts.incentiveCampaigns?.address,
  );

  const baseContracts = {
    tvdToken: addressInfo(
      tvdAddress,
      normalizeHash(contracts.tvdToken?.txHash),
      config.explorerBaseUrl,
    ),
    electoralCredits: addressInfo(
      electoralCreditsAddress,
      normalizeHash(contracts.electoralCredits?.txHash),
      config.explorerBaseUrl,
    ),
    voteManager: addressInfo(
      voteManagerAddress,
      normalizeHash(contracts.voteManager?.txHash),
      config.explorerBaseUrl,
    ),
    incentiveCampaigns: addressInfo(
      incentiveCampaignsAddress,
      normalizeHash(contracts.incentiveCampaigns?.txHash),
      config.explorerBaseUrl,
    ),
  };

  const unavailable: TvdParametersReadModel = {
    status: "not_configured",
    network: config,
    decimals: null,
    tvdPerCredit: emptyEconomicValue("not_configured", "Token TVD no configurado"),
    burn: {
      ...emptyEconomicValue("not_configured", "ElectoralCredits no configurado"),
      burnBps: null,
      burnPercentage: null,
    },
    rewardByVote: {
      ...emptyEconomicValue("not_configured", "VoteManager no configurado"),
      enabled: null,
    },
    campaign: {
      status: "not_configured",
      message: "IncentiveCampaigns no configurado",
      count: null,
      fields: [],
    },
    contracts: baseContracts,
    updatedAt: new Date().toISOString(),
    issues,
  };

  if (!config.rpcUrl || !tvdAddress) {
    if (!config.rpcUrl) {
      issues.push({ code: "TVD_RPC_URL_MISSING", message: "RPC TVD no configurado" });
    }
    return unavailable;
  }

  const provider = new JsonRpcProvider(config.rpcUrl, config.chainId ?? undefined);
  const decimals = await readTokenDecimals(provider, tvdAddress).catch(() => null);
  if (decimals === null) {
    issues.push({
      code: "TVD_DECIMALS_UNAVAILABLE",
      message: "No se pudieron consultar los decimales del token TVD",
    });
  }

  const [tvdPerCreditResult, burnResult, rewardResult, campaignResult] =
    await Promise.allSettled([
      electoralCreditsAddress && decimals !== null
        ? readTvdPerCredit(provider, electoralCreditsAddress, decimals)
        : Promise.resolve(emptyEconomicValue("not_configured", "ElectoralCredits no configurado")),
      electoralCreditsAddress
        ? readBurnBps(provider, electoralCreditsAddress)
        : Promise.resolve({
            ...emptyEconomicValue("not_configured", "ElectoralCredits no configurado"),
            burnBps: null,
            burnPercentage: null,
          }),
      voteManagerAddress && decimals !== null
        ? readRewardByVote(provider, voteManagerAddress, decimals)
        : Promise.resolve({
            ...emptyEconomicValue("not_configured", "VoteManager no configurado"),
            enabled: null,
          }),
      incentiveCampaignsAddress
        ? readCampaign(provider, incentiveCampaignsAddress, decimals)
        : Promise.resolve({
            status: "not_configured" as TvdReadStatus,
            message: "IncentiveCampaigns no configurado",
            count: null,
            fields: [],
          }),
    ]);

  const tvdPerCredit =
    tvdPerCreditResult.status === "fulfilled"
      ? tvdPerCreditResult.value
      : emptyEconomicValue("error", "Error al consultar la blockchain");
  if (tvdPerCredit.status === "error") {
    issues.push({
      code: "TVD_PER_CREDIT_RPC_ERROR",
      message: "Error al consultar tvdPerCredit()",
    });
  }

  const burn =
    burnResult.status === "fulfilled"
      ? burnResult.value
      : {
          ...emptyEconomicValue("error", "Error al consultar la blockchain"),
          burnBps: null,
          burnPercentage: null,
        };
  if (burn.status === "error") {
    issues.push({
      code: "TVD_BURN_BPS_UNAVAILABLE",
      message: "burnBps() no disponible o falló",
    });
  }

  const rewardByVote =
    rewardResult.status === "fulfilled"
      ? rewardResult.value
      : {
          ...emptyEconomicValue("error", "Error al consultar la blockchain"),
          enabled: null,
        };
  if (rewardByVote.status === "error") {
    issues.push({
      code: "TVD_REWARD_BY_VOTE_RPC_ERROR",
      message: "Error al consultar rewardByVote()",
    });
  }

  const campaign =
    campaignResult.status === "fulfilled"
      ? campaignResult.value
      : {
          status: "error" as TvdReadStatus,
          message: "Error al consultar la blockchain",
          count: null,
          fields: [],
        };
  if (campaign.status === "error") {
    issues.push({
      code: "TVD_CAMPAIGN_RPC_ERROR",
      message: "Error al consultar campañas",
    });
  }

  return {
    status: summarizeTvdReadStatus(Boolean(tvdAddress), issues),
    network: config,
    decimals,
    tvdPerCredit,
    burn,
    rewardByVote,
    campaign,
    contracts: baseContracts,
    updatedAt: new Date().toISOString(),
    issues,
  };
};

const readTokenDecimals = async (provider: JsonRpcProvider, address: string) => {
  const contract = new Contract(address, TOKEN_ABI, provider);
  const decimals = Number(await contract.decimals());
  return Number.isSafeInteger(decimals) && decimals >= 0 && decimals <= 36
    ? decimals
    : null;
};

const readTokenSymbol = async (provider: JsonRpcProvider, address: string) => {
  const contract = new Contract(address, TOKEN_ABI, provider);
  const symbol = String(await contract.symbol()).trim();
  return symbol || "$TVD";
};

const readTokenBalance = async (
  provider: JsonRpcProvider,
  tokenAddress: string,
  walletAddress: string,
) => {
  const contract = new Contract(tokenAddress, TOKEN_ABI, provider);
  const balance = toBigIntValue(await contract.balanceOf(walletAddress));
  if (balance === null) throw new Error("balance invalido");
  return balance;
};

const formatTokenAmount = (raw: bigint, decimals: number, symbol: string) => {
  const formatted = formatUnits(raw, decimals);
  const trimmed = formatted.includes(".")
    ? formatted.replace(/0+$/, "").replace(/\.$/, "")
    : formatted;
  return `${trimmed} ${symbol.startsWith("$") ? symbol : `$${symbol}`}`;
};

const readTvdPerCredit = async (
  provider: JsonRpcProvider,
  address: string,
  decimals: number,
): Promise<TvdEconomicValue> => {
  try {
    const contract = new Contract(address, ELECTORAL_CREDITS_ABI, provider);
    const raw = toBigIntValue(await contract.tvdPerCredit());
    if (raw === null) throw new Error("raw invalido");
    return {
      raw: raw.toString(),
      formatted: formatTvdAmount(raw, decimals),
      status: "available",
      message: null,
    };
  } catch {
    return emptyEconomicValue("error", "Error al consultar la blockchain");
  }
};

const readBurnBps = async (provider: JsonRpcProvider, address: string) => {
  try {
    const contract = new Contract(address, ELECTORAL_CREDITS_ABI, provider);
    const raw = toBigIntValue(await contract.burnBps());
    if (raw === null) throw new Error("raw invalido");
    const percentage = convertBurnBpsToPercentage(raw);
    return {
      raw: raw.toString(),
      formatted: percentage,
      status: "available" as TvdReadStatus,
      message: null,
      burnBps: raw.toString(),
      burnPercentage: percentage,
    };
  } catch {
    return {
      ...emptyEconomicValue("error", "No disponible"),
      burnBps: null,
      burnPercentage: null,
    };
  }
};

const readRewardByVote = async (
  provider: JsonRpcProvider,
  address: string,
  decimals: number,
) => {
  try {
    const contract = new Contract(address, VOTE_MANAGER_ABI, provider);
    const raw = toBigIntValue(await contract.rewardByVote());
    if (raw === null) throw new Error("raw invalido");
    return {
      raw: raw.toString(),
      formatted: formatTvdAmount(raw, decimals),
      status: "available" as TvdReadStatus,
      message: null,
      enabled: raw > 0n,
    };
  } catch {
    return {
      ...emptyEconomicValue("error", "Error al consultar la blockchain"),
      enabled: null,
    };
  }
};

const readCampaign = async (
  provider: JsonRpcProvider,
  address: string,
  decimals: number | null,
) => {
  const contract = new Contract(address, INCENTIVE_CAMPAIGNS_ABI, provider);
  const count = await readFirstAvailable<bigint>([
    () => contract.campaignsCount(),
    () => contract.campaignCount(),
  ]);
  const countValue = toBigIntValue(count);
  if (countValue === null) {
    return {
      status: "not_available" as TvdReadStatus,
      message: "ABI de campañas no confirmado",
      count: null,
      fields: [],
    };
  }
  if (countValue === 0n) {
    return {
      status: "available" as TvdReadStatus,
      message: "No existe una campaña configurada",
      count: "0",
      fields: [],
    };
  }

  const candidateIds = [countValue - 1n, 1n, 0n].filter((id, index, all) => {
    if (id < 0n) return false;
    return all.findIndex((item) => item === id) === index;
  });
  for (const id of candidateIds) {
    const campaign = await readFirstAvailable<unknown>([
      () => contract.campaigns(id),
      () => contract.campaign(id),
    ]).catch(() => null);
    const fields = campaignToFields(campaign, decimals);
    if (fields.length > 0) {
      return {
        status: "available" as TvdReadStatus,
        message: `Campaña ${id.toString()} configurada`,
        count: countValue.toString(),
        fields,
      };
    }
  }

  return {
    status: "partial" as TvdReadStatus,
    message: "Hay campañas registradas, pero el ABI de detalle no está confirmado",
    count: countValue.toString(),
    fields: [],
  };
};

const readFirstAvailable = async <T>(
  reads: Array<() => Promise<T>>,
): Promise<T> => {
  let lastError: unknown;
  for (const read of reads) {
    try {
      return await read();
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
};

const campaignToFields = (campaign: unknown, decimals: number | null) => {
  if (!campaign || typeof campaign !== "object") return [];
  const values = campaign as Record<string, unknown>;
  const incentive = toBigIntValue(values.incentivePerWallet ?? values[0]);
  const start = toBigIntValue(values.startTime ?? values[1]);
  const duration = toBigIntValue(values.duration ?? values[2]);
  const paused = values.paused ?? values[3];
  const maxWallets = toBigIntValue(values.maxWallets ?? values[4]);
  const registeredWallets = toBigIntValue(values.registeredWallets ?? values[5]);
  const fundingWallet = normalizeAddress(values.fundingWallet ?? values[6]);
  const fields: Array<{ label: string; value: string }> = [];
  if (incentive !== null) {
    fields.push({
      label: "Incentivo por wallet",
      value: decimals === null ? incentive.toString() : formatTvdAmount(incentive, decimals),
    });
  }
  if (start !== null) {
    fields.push({
      label: "Fecha de inicio",
      value: new Date(Number(start) * 1000).toISOString(),
    });
  }
  if (duration !== null) {
    fields.push({ label: "Duración", value: `${duration.toString()} segundos` });
    if (start !== null) {
      fields.push({
        label: "Fecha final",
        value: new Date(Number(start + duration) * 1000).toISOString(),
      });
    }
  }
  if (typeof paused === "boolean") {
    fields.push({ label: "Estado", value: paused ? "Pausada" : "Activa" });
  }
  if (maxWallets !== null) {
    fields.push({ label: "Máximo de wallets", value: maxWallets.toString() });
  }
  if (registeredWallets !== null) {
    fields.push({ label: "Wallets registradas", value: registeredWallets.toString() });
  }
  if (fundingWallet) {
    fields.push({ label: "Wallet financiadora", value: fundingWallet });
  }
  return fields;
};
