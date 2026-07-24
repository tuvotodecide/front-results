import { render, screen } from "@testing-library/react";
import { vi } from "vitest";
import ConfirmActivateModal from "@/features/electionConfig/components/ConfirmActivateModal";
import {
  formatTvdCapacityAmount,
  getCapacityRequestErrorMessage,
  getTvdCapacityReasonMessage,
} from "@/features/adminTvd/utils/tvdCapacityUi";

vi.mock("@/components/Modal2", () => ({
  default: ({ children, isOpen = true }: { children?: React.ReactNode; isOpen?: boolean }) =>
    isOpen ? <div>{children}</div> : null,
}));

describe("official publication final frontend UX", () => {
  it("FA-N00 muestra el texto movil en el modal existente de publicacion oficial", () => {
    render(
      <ConfirmActivateModal
        isOpen
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        isLoading={false}
      />,
    );

    expect(screen.getByText("Confirmar publicación oficial")).toBeInTheDocument();
    expect(
      screen.getByText(
        /utiliza la aplicación Tu Voto Decide en el teléfono vinculado a tu cuenta/i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /la wallet institucional dispone de los TVD requeridos/i,
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText(/backend/i)).not.toBeInTheDocument();
  });

  it("FA-N01 muestra capacidad insuficiente de TVD sin crear una solicitud", () => {
    expect(getTvdCapacityReasonMessage("INSUFFICIENT_TVD_BALANCE")).toBe(
      "Faltan TVD para cubrir esta elección.",
    );
    expect(formatTvdCapacityAmount("10")).toBe("10 TVD");
    expect(formatTvdCapacityAmount("3")).toBe("3 TVD");
  });

  it("FA-N02 muestra error recuperable cuando no se puede validar TVD", () => {
    expect(getCapacityRequestErrorMessage({ status: 503 })).toBe(
      "No se pudo validar la disponibilidad de TVD. Intenta nuevamente.",
    );
    expect(getCapacityRequestErrorMessage({ status: "FETCH_ERROR" })).toBe(
      "No se pudo validar la disponibilidad de TVD. Intenta nuevamente.",
    );
  });
});
