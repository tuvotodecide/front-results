import {
  rechargePackages,
  tvdToBolivianosRate,
} from "../data/adminTvd.mock";
import type { RechargeIntent, RechargePackage } from "../types";

export const getRechargePackages = async (): Promise<RechargePackage[]> => {
  return rechargePackages;
};

export const calculateBolivianosAmount = (amountTvd: number): number => {
  if (!Number.isFinite(amountTvd) || amountTvd <= 0) return 0;
  return Math.round(amountTvd * tvdToBolivianosRate);
};

export const calculateRechargeBolivianosAmount = (
  amountTvd: number,
  packages: RechargePackage[] = rechargePackages,
): number => {
  if (!Number.isFinite(amountTvd) || amountTvd <= 0) return 0;

  const matchingPackage = packages.find(
    (pkg) => pkg.tvdAmount === Math.floor(amountTvd),
  );

  return matchingPackage?.bsAmount ?? calculateBolivianosAmount(amountTvd);
};

export const createRechargeIntent = async (
  amountTvd: number,
  amountBsOverride?: number,
): Promise<RechargeIntent> => {
  const safeAmount = Math.max(0, Math.floor(amountTvd));
  const amountBs =
    typeof amountBsOverride === "number" && Number.isFinite(amountBsOverride)
      ? Math.max(0, Math.floor(amountBsOverride))
      : calculateRechargeBolivianosAmount(safeAmount);

  return {
    id: `mock-recharge-${safeAmount || "custom"}`,
    amountTvd: safeAmount,
    amountBs,
    reference: `REC-${safeAmount || 0}-2026`,
    expiresInMinutes: 15,
    qrPayload: `tvd-recharge:${safeAmount}:${amountBs}`,
  };
};

export const getRechargeQr = async (intent: RechargeIntent): Promise<string> => {
  return intent.qrPayload;
};

export const verifyRechargePayment = async (): Promise<{ ok: true }> => {
  await new Promise((resolve) => window.setTimeout(resolve, 350));
  return { ok: true };
};
