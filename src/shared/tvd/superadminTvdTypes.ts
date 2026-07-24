export type TvdContractDeployment = {
  address: string | null;
  txHash: string | null;
  implementationAddress?: string | null;
};

export type HistoryContractsData = {
  tvdToken?: TvdContractDeployment;
  coreVesting?: TvdContractDeployment;
  multisigWallet?: TvdContractDeployment;
  institutionalVesting?: TvdContractDeployment;
  incentiveCampaigns?: TvdContractDeployment;
  electoralCredits?: TvdContractDeployment;
  voteManager?: TvdContractDeployment;
};

export type HistoryContractsResponse = {
  success?: boolean;
  data?: HistoryContractsData;
};

export type TvdReadStatus =
  | "loading"
  | "available"
  | "partial"
  | "not_configured"
  | "not_available"
  | "pending"
  | "failed"
  | "error";

export type TvdReadIssue = {
  code: string;
  message: string;
};

export type TvdDeploymentDate = {
  status: TvdReadStatus;
  isoDate: string | null;
  message: string | null;
};

export type TvdNetworkInfo = {
  chainId: number | null;
  name: string;
  explorerBaseUrl: string | null;
  actualChainId?: number | null;
  chainStatus?: TvdReadStatus;
  chainMessage?: string | null;
};

export type TvdAddressInfo = {
  address: string | null;
  txHash: string | null;
  explorerUrl: string | null;
  txExplorerUrl: string | null;
  status: TvdReadStatus;
};

export type TvdSignerInfo = {
  address: string;
  explorerUrl: string | null;
};

export type TvdContractsReadModel = {
  status: TvdReadStatus;
  network: TvdNetworkInfo;
  tvdToken: TvdAddressInfo & {
    deploymentDate: TvdDeploymentDate;
  };
  multisig: TvdAddressInfo & {
    required: string | null;
    ownersCount: number | null;
    thresholdLabel: string | null;
    owners: TvdSignerInfo[];
    warning: string | null;
    readStatus: TvdReadStatus;
    errorMessage: string | null;
  };
  officialWallets: Array<{
    id: "treasury" | "ecosystem" | "liquidity" | "core-team";
    name: string;
    address: string | null;
    explorerUrl: string | null;
    status: TvdReadStatus;
    configKey: string;
    initialDistribution: {
      txHash: string | null;
      txExplorerUrl: string | null;
      amount: string | null;
      status: TvdReadStatus;
      message: string | null;
    };
    currentDistribution: {
      amount: string | null;
      status: TvdReadStatus;
      message: string | null;
    };
  }>;
  updatedAt: string;
  issues: TvdReadIssue[];
};

export type TvdEconomicValue = {
  raw: string | null;
  formatted: string | null;
  status: TvdReadStatus;
  message: string | null;
};

export type TvdCampaignReadModel = {
  status: TvdReadStatus;
  message: string;
  count: string | null;
  fields: Array<{ label: string; value: string }>;
};

export type TvdParametersReadModel = {
  status: TvdReadStatus;
  network: TvdNetworkInfo;
  decimals: number | null;
  tvdPerCredit: TvdEconomicValue;
  burn: TvdEconomicValue & {
    burnBps: string | null;
    burnPercentage: string | null;
  };
  rewardByVote: TvdEconomicValue & {
    enabled: boolean | null;
  };
  campaign: TvdCampaignReadModel;
  contracts: {
    tvdToken: TvdAddressInfo;
    electoralCredits: TvdAddressInfo;
    voteManager: TvdAddressInfo;
    incentiveCampaigns: TvdAddressInfo;
  };
  updatedAt: string;
  issues: TvdReadIssue[];
};
