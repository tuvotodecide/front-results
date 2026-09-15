import { getRuntimeEnv } from "./runtimeEnv";

// wa.me expects digits only: country code + number, no "+" or spaces.
export const getWhatsappNumber = () =>
  (getRuntimeEnv("VITE_WHATSAPP_NUMBER", "NEXT_PUBLIC_WHATSAPP_NUMBER") ?? "").replace(
    /\D/g,
    "",
  );

// Empty lines are skipped, so optional data can be passed inline.
export const buildWhatsappLink = (
  number: string,
  lines: Array<string | null | undefined | false>,
) =>
  `https://wa.me/${number}?text=${encodeURIComponent(lines.filter(Boolean).join("\n"))}`;
