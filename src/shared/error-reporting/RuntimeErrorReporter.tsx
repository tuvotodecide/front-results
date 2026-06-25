"use client";

import { useEffect } from "react";
import { installRuntimeErrorReporting } from "./client";

export default function RuntimeErrorReporter() {
  useEffect(() => installRuntimeErrorReporting(), []);
  return null;
}
