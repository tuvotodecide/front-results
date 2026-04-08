"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { selectAuth } from "@/store/auth/authSlice";

interface VotacionPrivateGuardProps {
  children: ReactNode;
}

export default function VotacionPrivateGuard({
  children,
}: VotacionPrivateGuardProps) {
  const router = useRouter();
  const { user, token } = useSelector(selectAuth);

  const status = user?.status ?? (user?.active ? "ACTIVE" : "PENDING");

  let redirectTo: string | null = null;

  if (!user || !token) {
    redirectTo = "/votacion/login";
  } else if (status === "PENDING") {
    redirectTo = "/votacion/pendiente";
  } else if (status === "REJECTED" || status === "INACTIVE") {
    redirectTo = "/votacion/rechazado";
  } else if (
    user.role !== "TENANT_ADMIN" &&
    user.role !== "SUPERADMIN"
  ) {
    redirectTo = "/";
  }

  useEffect(() => {
    if (redirectTo) {
      router.replace(redirectTo);
    }
  }, [redirectTo, router]);

  if (redirectTo) {
    return null;
  }

  return <>{children}</>;
}
