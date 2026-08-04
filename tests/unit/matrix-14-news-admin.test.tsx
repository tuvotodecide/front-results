import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import CreateNewsModal from "@/features/electionConfig/components/CreateNewsModal";

const renderNewsModal = (options?: {
  isLoading?: boolean;
  onClose?: () => void;
  onSubmit?: (payload: {
    title: string;
    body: string;
    link?: string;
    imageUrl?: string;
  }) => Promise<void>;
}) => {
  const onClose = options?.onClose ?? vi.fn();
  const onSubmit = options?.onSubmit ?? vi.fn().mockResolvedValue(undefined);

  render(
    <CreateNewsModal
      isOpen
      onClose={onClose}
      onSubmit={onSubmit}
      isLoading={options?.isLoading}
    />,
  );

  return { onClose, onSubmit };
};

const fillRequiredFields = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.type(screen.getByLabelText("Título"), "Aviso de horario");
  await user.type(
    screen.getByLabelText("Descripción"),
    "La atención al votante cambia esta semana.",
  );
};

afterEach(() => {
  cleanup();
});

describe("MX-14 | noticias administrativas", () => {
  it("[MX-14][NOT-ADM-P1-001][UNITARIA] valida requeridos, URLs permitidas y bloquea el envío mientras publica", async () => {
    const user = userEvent.setup();
    const { onClose, onSubmit } = renderNewsModal();

    const publishButton = screen.getByRole("button", { name: "Publicar noticia" });
    const dialog = screen.getByRole("dialog", { name: /Crear noticia/i });
    const linkInput = within(dialog).getByRole("textbox", {
      name: /^Enlace opcional/i,
    });
    const imageUrlInput = within(dialog).getByRole("textbox", {
      name: /^URL de imagen \(opcional\)/i,
    });
    expect(publishButton).toBeDisabled();

    await user.type(screen.getByLabelText("Título"), "Aviso de horario");
    expect(publishButton).toBeDisabled();

    await user.type(
      screen.getByLabelText("Descripción"),
      "La atención al votante cambia esta semana.",
    );
    await user.type(linkInput, "ftp://admin.test/horarios");
    await user.click(publishButton);

    expect(onSubmit).not.toHaveBeenCalled();
    expect(
      screen.getByText("Ingresa un enlace válido que comience con http:// o https://."),
    ).toBeInTheDocument();

    await user.clear(linkInput);
    await user.type(linkInput, "https://admin.test/horarios");
    await user.type(imageUrlInput, "ftp://cdn.test/horarios.webp");
    await user.click(publishButton);

    expect(onSubmit).not.toHaveBeenCalled();
    expect(
      screen.getByText(
        "Ingresa una URL http(s) que apunte a una imagen válida, por ejemplo .png, .jpg o .webp.",
      ),
    ).toBeInTheDocument();

    await user.clear(imageUrlInput);
    await user.type(imageUrlInput, "https://cdn.test/horarios.webp?version=1");

    expect(publishButton).toBeEnabled();
    await user.click(publishButton);

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        title: "Aviso de horario",
        body: "La atención al votante cambia esta semana.",
        link: "https://admin.test/horarios",
        imageUrl: "https://cdn.test/horarios.webp?version=1",
      });
    });
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(screen.getByLabelText("Título")).toHaveValue("");
    expect(screen.getByLabelText("Descripción")).toHaveValue("");
    expect(screen.getByLabelText("Enlace opcional")).toHaveValue("");
    expect(screen.getByLabelText("URL de imagen (opcional)")).toHaveValue("");

    cleanup();
    renderNewsModal({ isLoading: true });

    expect(screen.getByRole("button", { name: "Publicando..." })).toBeDisabled();
    expect(screen.getByLabelText("Título")).toBeDisabled();
    expect(screen.getByLabelText("Descripción")).toBeDisabled();
    expect(screen.getByLabelText("Enlace opcional")).toBeDisabled();
    expect(screen.getByLabelText("URL de imagen (opcional)")).toBeDisabled();
  });

  it("[MX-14][NOT-ADM-P1-002][UNITARIA] muestra errores inline para protocolos o imágenes inválidas y mantiene los campos editables", async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderNewsModal();

    await fillRequiredFields(user);
    const link = screen.getByLabelText("Enlace opcional");
    const imageUrl = screen.getByLabelText("URL de imagen (opcional)");
    await user.type(link, "ftp://admin.test/horarios");
    await user.type(imageUrl, "https://cdn.test/horarios.pdf");
    await user.click(screen.getByRole("button", { name: "Publicar noticia" }));

    expect(
      screen.getByText("Ingresa un enlace válido que comience con http:// o https://."),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Ingresa una URL http(s) que apunte a una imagen válida, por ejemplo .png, .jpg o .webp.",
      ),
    ).toBeInTheDocument();
    expect(link).toBeEnabled();
    expect(imageUrl).toBeEnabled();

    await user.clear(link);
    await user.type(link, "http://admin.test/horarios");
    await user.clear(imageUrl);
    await user.type(imageUrl, "https://cdn.test/horarios.jpg");
    await user.click(screen.getByRole("button", { name: "Publicar noticia" }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        title: "Aviso de horario",
        body: "La atención al votante cambia esta semana.",
        link: "http://admin.test/horarios",
        imageUrl: "https://cdn.test/horarios.jpg",
      });
    });
  });

  it("[MX-14][NOT-SEC-P0-002][UNITARIA] renderiza solo los datos permitidos de la noticia y no expone secretos de mensajería", async () => {
    const user = userEvent.setup();
    renderNewsModal();

    await fillRequiredFields(user);
    await user.type(screen.getByLabelText("Enlace opcional"), "https://admin.test/horarios");
    await user.type(
      screen.getByLabelText("URL de imagen (opcional)"),
      "https://cdn.test/horarios.png",
    );

    expect(screen.getByRole("heading", { name: "Crear noticia" })).toBeInTheDocument();
    expect(screen.getByLabelText("Título")).toHaveValue("Aviso de horario");
    expect(screen.getByLabelText("Descripción")).toHaveValue(
      "La atención al votante cambia esta semana.",
    );
    expect(screen.getByLabelText("Enlace opcional")).toHaveValue(
      "https://admin.test/horarios",
    );
    expect(screen.getByLabelText("URL de imagen (opcional)")).toHaveValue(
      "https://cdn.test/horarios.png",
    );
    expect(screen.getByRole("button", { name: "Publicar noticia" })).toBeEnabled();

    for (const secretLabel of [
      /token fcm/i,
      /x-api-key/i,
      /authorization/i,
      /private key/i,
      /firebase/i,
      /secret/i,
    ]) {
      expect(screen.queryByText(secretLabel)).not.toBeInTheDocument();
      expect(screen.queryByLabelText(secretLabel)).not.toBeInTheDocument();
    }
  });
});
