import { useSelector } from "react-redux";
import { selectIsLoggedIn, selectTenantId } from "@/store/auth/authSlice";
import {
  useGetInstitutionalWalletMigrationGateQuery,
  type InstitutionalWalletMigrationGateReason,
} from "@/store/institutionalWalletMigration";

export type WalletMigrationGate = {
  /** true cuando no se pueden crear ni publicar votaciones hasta terminar la migración. */
  blocking: boolean;
  reason: InstitutionalWalletMigrationGateReason;
  institutionalRole: "PRIMARY" | "SECONDARY" | null;
  isChecking: boolean;
  recheck: () => void;
};

/**
 * Consulta, al montar la pantalla, si la institución activa sigue esperando la migración de
 * su billetera on-chain. No se actualiza sola: el estado nuevo se ve al recargar o con `recheck`.
 * Si la consulta falla no bloquea (la red rechazaría igualmente una publicación inválida).
 */
export function useWalletMigrationGate(): WalletMigrationGate {
  const isLoggedIn = useSelector(selectIsLoggedIn);
  const tenantId = useSelector(selectTenantId);
  const { data, isFetching, refetch } = useGetInstitutionalWalletMigrationGateQuery(
    { tenantId: tenantId ?? "" },
    { skip: !isLoggedIn || !tenantId, refetchOnMountOrArgChange: true },
  );

  return {
    blocking: Boolean(data?.blocking),
    reason: data?.reason ?? "NONE",
    institutionalRole: data?.institutionalRole ?? null,
    isChecking: isFetching,
    recheck: () => {
      if (isLoggedIn && tenantId) void refetch();
    },
  };
}
