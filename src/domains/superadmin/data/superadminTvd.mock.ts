import type {
  InstitutionalRecoveryRequest,
  TvdContractStatus,
  TvdEconomicParameters,
  TvdInstitution,
  TvdOperation,
  WalletTvdBalance,
} from "../types";

export const BASE_EXPLORER_URL = "https://basescan.org";

export const tvdContractStatusMock: TvdContractStatus = {
  network: "Base L2",
  contractAddress: "0x4A3b8C1D7E9F10223344556677889900ABCDef01",
  deploymentTxHash:
    "0xdeadc0deff0011223344556677889900aabbccddeeff0011223344556789abcd",
  registeredAt: "12 Ene 2026, 14:32 UTC",
  explorerBaseUrl: BASE_EXPLORER_URL,
  multisigAddress: "0xMulti9F1A223344556677889900AAbbCcDDee67890A",
  approvalThreshold: "2 de 3 firmas requeridas",
  signers: [
    {
      label: "Firmante 1",
      address: "0xFirm1A2B3344556677889900AaBbCcDDee7890AB",
    },
    {
      label: "Firmante 2",
      address: "0xFirm2B3C44556677889900AaBbCcDDee7890BC",
    },
    {
      label: "Firmante 3",
      address: "0xFirm3C4D556677889900AaBbCcDDee890CDE",
    },
  ],
  funds: [
    {
      name: "Tesorería y Expansión B2B",
      initialDistribution: "35%",
      initialAmount: "9.450.000 $TVD",
      currentDistribution: "32%",
      currentAmount: "8.920.000 $TVD",
      address: "0xTeso7E8F3344556677889900ABCDef12345678",
    },
    {
      name: "Ecosistema y Votantes",
      initialDistribution: "30%",
      initialAmount: "8.100.000 $TVD",
      currentDistribution: "30%",
      currentAmount: "8.100.000 $TVD",
      address: "0xEcos1A2B3344556677889900ABCDef09876543",
    },
    {
      name: "Equipo Core y Asesores",
      initialDistribution: "20%",
      initialAmount: "5.400.000 $TVD",
      currentDistribution: "20%",
      currentAmount: "Congelado / vesting",
      address: "0xEqui2B3C44556677889900ABCDef77889900",
    },
    {
      name: "Liquidez",
      initialDistribution: "15%",
      initialAmount: "4.050.000 $TVD",
      currentDistribution: "--",
      currentAmount: "Consultar saldo",
      address: "0xLiqu3C4D556677889900ABCDef0011223344",
    },
  ],
};

export const tvdEconomicParametersMock: TvdEconomicParameters = {
  blockchainUrl: `${BASE_EXPLORER_URL}/address/${tvdContractStatusMock.contractAddress}`,
  parameters: [
    {
      id: "vote-consumption",
      name: "Consumo por voto válido",
      value: "1 $TVD",
      example: "Si participan 100 votantes válidos, se consume 100 $TVD.",
    },
    {
      id: "burn-percentage",
      name: "Porcentaje de quema",
      value: "10%",
      example:
        "Si se consumen 100 $TVD por votos válidos, el 10% se quema, es decir 10 $TVD.",
    },
    {
      id: "vote-reward",
      name: "Recompensa por voto válido",
      value: "0.5 $TVD",
      example:
        "Cada votante válido recibe 0.5 $TVD si la recompensa está activa.",
    },
  ],
  rewards: {
    enabled: true,
    title: "Activas",
    description: "Las recompensas a votantes están habilitadas",
  },
  initialCampaign: {
    enabled: false,
    title: "Pausada",
    description: "La campaña de incentivo inicial está detenida",
  },
};

export const tvdInstitutionsMock: TvdInstitution[] = [
  {
    id: "tse",
    name: "Tribunal Supremo Electoral",
    wallet: "0xWal111...890AB",
    status: "Validada",
  },
  {
    id: "municipio-la-paz",
    name: "Municipio de La Paz",
    wallet: "0xWal112...890BC",
    status: "Validada",
  },
  {
    id: "umsa",
    name: "Universidad Mayor de San Andrés",
    wallet: "0xWal113...890CD",
    status: "Pendiente",
  },
];

export const tvdAssignmentReasonsMock = [
  "REGALO INSTITUCIONAL",
  "RECOMPENSA PILOTO",
  "AJUSTE OPERATIVO",
  "INCENTIVO DE PRUEBA",
] as const;

export const tvdOperationsMock: TvdOperation[] = [
  {
    id: "op-1",
    createdAt: "2026-01-12 14:38 UTC",
    type: "Asignación manual",
    target: "Tribunal Supremo Electoral",
    amount: "1000 $TVD",
    status: "Confirmada",
    txHash: "0xresult1234567890abcdef",
  },
];

export const walletTvdBalanceMock: WalletTvdBalance = {
  wallet: "0xWal111...890AB",
  balance: "12.500 $TVD",
  network: "Base L2",
  updatedAt: "Dato mock preparado para backend",
};

export const institutionalRecoveryRequestsMock: InstitutionalRecoveryRequest[] = [
  {
    id: "rec-1",
    institutionName: "Tribunal Supremo Electoral",
    status: "Preparado para integración",
    requestedAt: "Pendiente de endpoint",
  },
];

export const mockAssignmentSourceWallet =
  "0xSupe9F1A2B3C4D556677889900AAbbCcDDee4567";

export const mockAssignmentSourceFund = "Ecosistema y Votantes / Vota y Gana";

export const mockAssignmentTxHash =
  "0xresult1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab";
