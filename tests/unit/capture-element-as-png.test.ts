import { describe, expect, it, vi } from "vitest";
import { captureElementAsPng } from "@/features/electionConfig/captureElementAsPng";

describe("captureElementAsPng", () => {
  it("devuelve PNG usando fallback seguro si el canvas del foreignObject queda tainted", async () => {
    const element = document.createElement("div");
    element.setAttribute("data-testid", "participation-analytics-capture");
    element.innerHTML = `
      <div style="background: rgb(255, 255, 255); width: 320px; height: 220px;">
        <h2>Analíticas</h2>
        <div data-testid="analytics-donut" aria-label="Participación 70%" style="width: 100px; height: 100px;"></div>
        <p>No se muestra por quién votó ninguna persona.</p>
      </div>
    `;
    document.body.appendChild(element);
    Object.defineProperty(element, "getBoundingClientRect", {
      configurable: true,
      value: () => ({ left: 0, top: 0, width: 320, height: 220, right: 320, bottom: 220 }),
    });
    element.querySelectorAll<HTMLElement>("*").forEach((node) => {
      Object.defineProperty(node, "getBoundingClientRect", {
        configurable: true,
        value: () => ({ left: 10, top: 10, width: 100, height: 30, right: 110, bottom: 40 }),
      });
    });
    Object.defineProperty(element.querySelector('[data-testid="analytics-donut"]'), "getBoundingClientRect", {
      configurable: true,
      value: () => ({ left: 20, top: 60, width: 100, height: 100, right: 120, bottom: 160 }),
    });

    const originalCreateElement = document.createElement.bind(document);
    const toDataUrl = vi
      .fn()
      .mockImplementationOnce(() => {
        throw new DOMException("Tainted canvases may not be exported.", "SecurityError");
      })
      .mockReturnValueOnce("data:image/png;base64,fallback");
    vi.spyOn(document, "createElement").mockImplementation((tagName: any, options?: any) => {
      const created = originalCreateElement(tagName, options);
      if (String(tagName).toLowerCase() === "canvas") {
        vi.spyOn(created as HTMLCanvasElement, "getContext").mockReturnValue({
          setTransform: vi.fn(),
          fillRect: vi.fn(),
          drawImage: vi.fn(),
          beginPath: vi.fn(),
          moveTo: vi.fn(),
          lineTo: vi.fn(),
          quadraticCurveTo: vi.fn(),
          closePath: vi.fn(),
          fill: vi.fn(),
          stroke: vi.fn(),
          arc: vi.fn(),
          measureText: vi.fn(() => ({ width: 20 })),
          fillText: vi.fn(),
          font: "",
          fillStyle: "",
          strokeStyle: "",
          lineWidth: 1,
          lineCap: "butt",
          textBaseline: "top",
          textAlign: "left",
        } as any);
        vi.spyOn(created as HTMLCanvasElement, "toDataURL").mockImplementation(toDataUrl);
      }
      return created;
    });
    Object.defineProperty(window.URL, "createObjectURL", {
      configurable: true,
      value: vi.fn(() => "blob:modal"),
    });
    Object.defineProperty(window.URL, "revokeObjectURL", {
      configurable: true,
      value: vi.fn(),
    });
    vi.stubGlobal(
      "Image",
      class {
        onload: (() => void) | null = null;
        onerror: (() => void) | null = null;
        set src(_value: string) {
          this.onload?.();
        }
      },
    );

    await expect(captureElementAsPng(element)).resolves.toBe("data:image/png;base64,fallback");

    element.remove();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });
});
