import type { ReactNode } from "react";
import AuthVotacionShell from "../../domains/auth-votacion/layout/AuthVotacionShell";

interface VotacionAuthLayoutProps {
  children: ReactNode;
}

export default function VotacionAuthLayout({
  children,
}: VotacionAuthLayoutProps) {
  return <AuthVotacionShell>{children}</AuthVotacionShell>;
}
