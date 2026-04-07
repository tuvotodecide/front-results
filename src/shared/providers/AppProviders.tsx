"use client";

import type { ReactNode } from "react";
import { useRef } from "react";
import { Provider } from "react-redux";
import AuthSessionBootstrap from "@/shared/auth/AuthSessionBootstrap";
import ElectionSessionBootstrap from "@/shared/auth/ElectionSessionBootstrap";
import { AppStore, makeStore } from "@/store";

export default function AppProviders({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const storeRef = useRef<AppStore | null>(null);

  if (!storeRef.current) {
    storeRef.current = makeStore();
  }

  return (
    <Provider store={storeRef.current}>
      <AuthSessionBootstrap />
      <ElectionSessionBootstrap />
      {children}
    </Provider>
  );
}
