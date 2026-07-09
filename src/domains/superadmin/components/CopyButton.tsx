"use client";

import { useState } from "react";
import { Copy } from "lucide-react";
import { copyTextToClipboard } from "../services/clipboard";

export default function CopyButton({
  value,
  label = "Copiar",
}: {
  value: string;
  label?: string;
}) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await copyTextToClipboard(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  };

  return (
    <button
      type="button"
      onClick={() => void copy()}
      className="inline-flex items-center gap-1.5 rounded-md border border-[#dfe6df] px-2.5 py-1.5 text-xs font-medium text-[#4b4b4b] transition-colors hover:border-[#287c36] hover:text-[#287c36]"
    >
      <Copy className="h-3.5 w-3.5" />
      {copied ? "Copiado" : label}
    </button>
  );
}
