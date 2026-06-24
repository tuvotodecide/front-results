import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { vi } from "vitest";
import CreateNewsModal, {
  resolveValidNewsImageUrl,
} from "@/features/electionConfig/components/CreateNewsModal";

vi.mock("@/components/Modal2", () => ({
  default: ({
    children,
    isOpen = true,
    title,
  }: {
    children?: ReactNode;
    isOpen?: boolean;
    title?: string;
  }) => (isOpen ? <div>{title ? <h2>{title}</h2> : null}{children}</div> : null),
}));

describe("CreateNewsModal", () => {
  it("requiere título y descripción antes de habilitar la publicación", () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(
      <CreateNewsModal
        isOpen
        onClose={vi.fn()}
        onSubmit={onSubmit}
      />,
    );

    expect(screen.getByRole("button", { name: "Publicar noticia" })).toBeDisabled();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("rechaza links de imagen que no parecen imagen real", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(
      <CreateNewsModal
        isOpen
        onClose={vi.fn()}
        onSubmit={onSubmit}
      />,
    );

    fireEvent.change(screen.getByLabelText("Título"), {
      target: { value: "Nueva noticia" },
    });
    fireEvent.change(screen.getByLabelText("Descripción"), {
      target: { value: "Contenido importante" },
    });
    fireEvent.change(screen.getByLabelText("URL de imagen (opcional)"), {
      target: { value: "https://example.com/page.html" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Publicar noticia" }));

    expect(
      await screen.findByText(
        "Ingresa una URL http(s) que apunte a una imagen válida, por ejemplo .png, .jpg o .webp.",
      ),
    ).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("acepta links de imagen válidos sin mostrar vista previa", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(
      <CreateNewsModal
        isOpen
        onClose={vi.fn()}
        onSubmit={onSubmit}
      />,
    );

    fireEvent.change(screen.getByLabelText("Título"), {
      target: { value: "Nueva noticia" },
    });
    fireEvent.change(screen.getByLabelText("Descripción"), {
      target: { value: "Contenido importante" },
    });
    fireEvent.change(screen.getByLabelText("URL de imagen (opcional)"), {
      target: { value: "https://example.com/news-image.png?token=1" },
    });

    expect(screen.queryByAltText("Vista previa de noticia")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Publicar noticia" }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          imageUrl: "https://example.com/news-image.png?token=1",
        }),
      );
    });
  });

  it("rechaza enlaces opcionales con protocolos no permitidos", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(
      <CreateNewsModal
        isOpen
        onClose={vi.fn()}
        onSubmit={onSubmit}
      />,
    );

    fireEvent.change(screen.getByLabelText("Título"), {
      target: { value: "Nueva noticia" },
    });
    fireEvent.change(screen.getByLabelText("Descripción"), {
      target: { value: "Contenido importante" },
    });
    fireEvent.change(screen.getByLabelText("Enlace opcional"), {
      target: { value: "ftp://example.com/noticia" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Publicar noticia" }));

    expect(
      screen.getByText("Ingresa un enlace válido que comience con http:// o https://."),
    ).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("muestra errores de API sin cerrar el modal", async () => {
    const onClose = vi.fn();
    const onSubmit = vi.fn().mockRejectedValue(new Error("No se pudo publicar"));

    render(
      <CreateNewsModal
        isOpen
        onClose={onClose}
        onSubmit={onSubmit}
      />,
    );

    fireEvent.change(screen.getByLabelText("Título"), {
      target: { value: "Nueva noticia" },
    });
    fireEvent.change(screen.getByLabelText("Descripción"), {
      target: { value: "Contenido importante" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Publicar noticia" }));

    expect(await screen.findByText("No se pudo publicar")).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("bloquea cierre y envío mientras está publicando", () => {
    const onClose = vi.fn();
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(
      <CreateNewsModal
        isOpen
        onClose={onClose}
        onSubmit={onSubmit}
        isLoading
      />,
    );

    expect(screen.getByRole("button", { name: "Publicando..." })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(onClose).not.toHaveBeenCalled();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("valida protocolo seguro y extensión conocida para imagen de noticia", () => {
    expect(resolveValidNewsImageUrl("https://example.com/news.webp")).toBe(
      "https://example.com/news.webp",
    );
    expect(resolveValidNewsImageUrl("http://example.com/news.jpeg")).toBe(
      "http://example.com/news.jpeg",
    );
    expect(resolveValidNewsImageUrl("ftp://example.com/news.png")).toBeNull();
    expect(resolveValidNewsImageUrl("https://example.com/news")).toBeNull();
  });
});
