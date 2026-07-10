import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import EstimateVotersModal from "@/features/adminTvd/components/EstimateVotersModal";
import InsufficientTvdBalanceModal from "@/features/adminTvd/components/InsufficientTvdBalanceModal";
import { estimateTvdConsumption } from "@/features/adminTvd/services/adminTvdBalanceApi";

describe("Admin tenant estimate and insufficient balance modals", () => {
  it("calcula consumo estimado con 1 $TVD por votante", async () => {
    const user = userEvent.setup();
    const onContinue = vi.fn();
    render(
      <EstimateVotersModal
        isOpen
        availableBalance={1000}
        onClose={vi.fn()}
        onContinue={onContinue}
        onInsufficientBalance={vi.fn()}
      />,
    );

    await user.type(screen.getByLabelText("Cantidad estimada de votantes"), "120");

    expect(screen.getByText("Consumo por voto válido")).toBeInTheDocument();
    expect(screen.getByText("1 $TVD")).toBeInTheDocument();
    expect(screen.getByText("120 $TVD")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Continuar" }));
    expect(onContinue).toHaveBeenCalledWith(120);
  });

  it("bloquea cantidades vacías, cero, negativas y no numéricas", async () => {
    const user = userEvent.setup();
    render(
      <EstimateVotersModal
        isOpen
        availableBalance={1000}
        onClose={vi.fn()}
        onContinue={vi.fn()}
        onInsufficientBalance={vi.fn()}
      />,
    );

    const input = screen.getByLabelText("Cantidad estimada de votantes");
    const continueButton = screen.getByRole("button", { name: "Continuar" });

    expect(continueButton).toBeDisabled();

    await user.type(input, "0");
    expect(continueButton).toBeDisabled();

    await user.clear(input);
    await user.type(input, "-1");
    expect(continueButton).toBeDisabled();

    await user.clear(input);
    await user.type(input, "abc");
    expect(continueButton).toBeDisabled();
  });

  it("abre saldo insuficiente si el saldo mock no alcanza", async () => {
    const user = userEvent.setup();
    const onInsufficientBalance = vi.fn();
    render(
      <EstimateVotersModal
        isOpen
        availableBalance={0}
        onClose={vi.fn()}
        onContinue={vi.fn()}
        onInsufficientBalance={onInsufficientBalance}
      />,
    );

    await user.type(screen.getByLabelText("Cantidad estimada de votantes"), "50");
    await user.click(screen.getByRole("button", { name: "Continuar" }));

    expect(onInsufficientBalance).toHaveBeenCalledWith(50);
  });

  it("modal de saldo insuficiente navega por acciones sin crear borrador real", async () => {
    const user = userEvent.setup();
    const onRecharge = vi.fn();
    const onSaveDraft = vi.fn();
    const onClose = vi.fn();
    render(
      <InsufficientTvdBalanceModal
        isOpen
        estimatedAmount={75}
        onClose={onClose}
        onRecharge={onRecharge}
        onSaveDraft={onSaveDraft}
      />,
    );

    expect(screen.getByRole("dialog", { name: "Necesitas recargar $TVD" })).toBeInTheDocument();
    expect(screen.getByText(/Tu institución no tiene saldo suficiente/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Recargar mediante QR/i }));
    expect(onRecharge).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole("button", { name: "Guardar como borrador" }));
    expect(onSaveDraft).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("servicio de estimación no llama backend y devuelve cálculo local", () => {
    expect(estimateTvdConsumption(33)).toEqual({
      voters: 33,
      consumptionPerValidVote: 1,
      total: 33,
    });
  });
});
