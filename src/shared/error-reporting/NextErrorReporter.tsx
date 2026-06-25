"use client";

import { useEffect } from "react";
import { reportRuntimeError } from "./client";

interface NextErrorReporterProps {
  error: Error & { digest?: string };
  source?: "render" | "next-error";
}

export default function NextErrorReporter({
  error,
  source = "next-error",
}: NextErrorReporterProps) {
  useEffect(() => {
    reportRuntimeError({
      source,
      error,
      digest: error.digest,
    });
  }, [error, source]);

  return null;
}
