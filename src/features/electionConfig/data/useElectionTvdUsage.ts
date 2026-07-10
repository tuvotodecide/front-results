export type ElectionTvdOperation = {
  id: string;
  type: "Reserva" | "Consumo por voto" | "Liquidacion";
  amount: string;
  amountBs: string;
  status: "Confirmada";
  date: string;
  txHash: string;
  explorerUrl: string;
};

export type ElectionTvdAmount = {
  tvd: string;
  bs: string;
};

export type ElectionTvdUsage = {
  reserved: ElectionTvdAmount;
  consumed: ElectionTvdAmount;
  released: ElectionTvdAmount;
  currentStatus: string;
  closingNotice: string;
  operations: ElectionTvdOperation[];
};

const BASESCAN_TX_URL = "https://basescan.org/tx";

export const getElectionTvdUsage = (electionId: string): ElectionTvdUsage => ({
  reserved: { tvd: "500 $TVD", bs: "500 Bs" },
  consumed: { tvd: "320 $TVD", bs: "320 Bs" },
  released: { tvd: "180 $TVD", bs: "180 Bs" },
  currentStatus: "Liquidada",
  closingNotice:
    "La votacion fue cerrada economicamente. Se consumio lo correspondiente y se libero lo no utilizado.",
  operations: [
    {
      id: `${electionId}-reserve`,
      type: "Reserva",
      amount: "500 $TVD",
      amountBs: "500 Bs",
      status: "Confirmada",
      date: "29 Jun 2026, 07:45",
      txHash: "0xreserve1234567890abcdef",
      explorerUrl: `${BASESCAN_TX_URL}/0xreserve1234567890abcdef`,
    },
    {
      id: `${electionId}-consume`,
      type: "Consumo por voto",
      amount: "320 $TVD",
      amountBs: "320 Bs",
      status: "Confirmada",
      date: "29 Jun 2026, 17:03",
      txHash: "0xconsume1234567890abcdef",
      explorerUrl: `${BASESCAN_TX_URL}/0xconsume1234567890abcdef`,
    },
    {
      id: `${electionId}-settlement`,
      type: "Liquidacion",
      amount: "180 $TVD",
      amountBs: "180 Bs",
      status: "Confirmada",
      date: "30 Jun 2026, 12:45",
      txHash: "0xsettle1234567890abcdef",
      explorerUrl: `${BASESCAN_TX_URL}/0xsettle1234567890abcdef`,
    },
  ],
});

export const useElectionTvdUsage = (electionId: string): ElectionTvdUsage =>
  getElectionTvdUsage(electionId || "mock-election");
