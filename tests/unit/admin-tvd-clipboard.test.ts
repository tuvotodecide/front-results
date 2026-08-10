import { afterEach, describe, expect, it, vi } from "vitest";
import { copyTextToClipboard } from "@/features/adminTvd/services/clipboard";

const clipboardDescriptor = Object.getOwnPropertyDescriptor(navigator, "clipboard");
const execCommandDescriptor = Object.getOwnPropertyDescriptor(document, "execCommand");

const restoreProperty = (
  target: object,
  key: string,
  descriptor: PropertyDescriptor | undefined,
) => {
  if (descriptor) {
    Object.defineProperty(target, key, descriptor);
    return;
  }
  delete (target as Record<string, unknown>)[key];
};

afterEach(() => {
  vi.restoreAllMocks();
  restoreProperty(navigator, "clipboard", clipboardDescriptor);
  restoreProperty(document, "execCommand", execCommandDescriptor);
});

describe("admin TVD clipboard", () => {
  it("copia con la API nativa cuando está disponible", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });

    await expect(copyTextToClipboard("0x1234")).resolves.toBe(true);
    expect(writeText).toHaveBeenCalledWith("0x1234");
  });

  it("usa el fallback cuando la API nativa no está disponible", async () => {
    const execCommand = vi.fn(() => true);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: undefined,
    });
    Object.defineProperty(document, "execCommand", {
      configurable: true,
      value: execCommand,
    });

    await expect(copyTextToClipboard("0x1234")).resolves.toBe(true);
    expect(execCommand).toHaveBeenCalledWith("copy");
    expect(document.querySelector("textarea")).not.toBeInTheDocument();
  });
});
