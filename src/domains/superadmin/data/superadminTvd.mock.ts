import type {
  InstitutionalRecoveryRequest,
  PublicInstitutionalRecoveryReceipt,
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
    type: "Asignación manual",
    institution: "Tribunal Supremo Electoral",
    amount: "500 $TVD",
    date: "15 Ene 2026",
    txHash: "0xabc1234567...cdef",
    explorerUrl: `${BASE_EXPLORER_URL}/tx/0xabc1234567abcdef`,
  },
  {
    id: "op-2",
    type: "Asignación manual",
    institution: "Municipio de La Paz",
    amount: "200 $TVD",
    date: "20 Ene 2026",
    txHash: "0xdef2345678...def2",
    explorerUrl: `${BASE_EXPLORER_URL}/tx/0xdef2345678def2`,
  },
  {
    id: "op-3",
    type: "Consumo por voto",
    institution: "Tribunal Supremo Electoral",
    amount: "1 $TVD",
    date: "26 Mar 2026",
    txHash: "0xghi3456789...def3",
    explorerUrl: `${BASE_EXPLORER_URL}/tx/0xghi3456789def3`,
  },
  {
    id: "op-4",
    type: "Quema",
    institution: "Municipio de La Paz",
    amount: "0.1 $TVD",
    date: "26 Jun 2026",
    txHash: "0xjkl4567890...def4",
    explorerUrl: `${BASE_EXPLORER_URL}/tx/0xjkl4567890def4`,
  },
  {
    id: "op-5",
    type: "Recompensa votante",
    institution: "Universidad Mayor de San Andrés",
    amount: "0.5 $TVD",
    date: "25 Jun 2026",
    txHash: "0xmn05678901...4ef5",
    explorerUrl: `${BASE_EXPLORER_URL}/tx/0xmn056789014ef5`,
  },
  {
    id: "op-6",
    type: "Asignación manual",
    institution: "Federación Sindical",
    amount: "1.200 $TVD",
    date: "10 Feb 2026",
    txHash: "0xpqr6789012...45f6",
    explorerUrl: `${BASE_EXPLORER_URL}/tx/0xpqr678901245f6`,
  },
  {
    id: "op-7",
    type: "Recarga",
    institution: "Tribunal Supremo Electoral",
    amount: "3.000 $TVD",
    date: "5 Mar 2026",
    txHash: "0xstu7890123...56g7",
    explorerUrl: `${BASE_EXPLORER_URL}/tx/0xstu789012356g7`,
  },
  {
    id: "op-8",
    type: "Asignación manual",
    institution: "Universidad Mayor de San Andrés",
    amount: "300 $TVD",
    date: "1 Ene 2026",
    txHash: "0xvwx8901234...67h8",
    explorerUrl: `${BASE_EXPLORER_URL}/tx/0xvwx890123467h8`,
  },
];

export const walletTvdBalanceMock: WalletTvdBalance = {
  wallet: "0x1234794723747832234792342341432231",
  shortWallet: "0x123479...432231",
  balance: "100 $TVD",
  network: "Base L2",
  belongsToEcosystem: true,
  explorerUrl: `${BASE_EXPLORER_URL}/address/0x1234794723747832234792342341432231`,
  updatedAt: "Consulta mock preparada para backend",
};

export const institutionalRecoveryRequestsMock: InstitutionalRecoveryRequest[] = [
  {
    id: "rec-1",
    institutionName: "Tribunal Supremo Electoral",
    reason: "Pérdida de acceso a wallet principal",
    previousAdminEmail: "juan.perez@tse.gob.bo",
    newAdminEmail: "ana.gomez@tse.gob.bo",
    requestedAt: "27 Jun 2026, 09:14",
    contactPhone: "78945612",
    status: "Pendiente",
  },
  {
    id: "rec-2",
    institutionName: "Municipio de La Paz",
    reason: "Cambio de administrador institucional",
    previousAdminEmail: "admin@lapaz.bo",
    newAdminEmail: "nuevo.admin@lapaz.bo",
    requestedAt: "25 Jun 2026, 16:40",
    contactPhone: "70112233",
    status: "Aprobada",
    reviewerNote: "Identidad validada con documento institucional.",
  },
  {
    id: "rec-3",
    institutionName: "Universidad Mayor de San Andrés",
    reason: "Correo administrativo sin acceso",
    previousAdminEmail: "voto@umsa.bo",
    newAdminEmail: "soporte.voto@umsa.bo",
    requestedAt: "22 Jun 2026, 11:05",
    contactPhone: "71234567",
    status: "Rechazada",
    reviewerNote: "Información insuficiente para validar la titularidad.",
  },
];

export const publicRecoveryReceiptMock = (
  institutionName: string,
  contactEmail: string,
): PublicInstitutionalRecoveryReceipt => ({
  id: "pub-rec-001",
  institutionName,
  contactEmail,
  status: "Pendiente de revisión",
  createdAt: "Solicitud registrada localmente",
});

export const mockAssignmentSourceWallet =
  "0xSupe9F1A2B3C4D556677889900AAbbCcDDee4567";

export const mockAssignmentSourceFund = "Ecosistema y Votantes / Vota y Gana";

export const mockAssignmentTxHash =
  "0xresult1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab";
