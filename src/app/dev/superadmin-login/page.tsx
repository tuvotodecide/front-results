import { notFound } from "next/navigation";
import DevSuperadminLoginPage from "@/domains/dev-auth/DevSuperadminLoginPage";
import { isDevAuthEnabled } from "@/domains/dev-auth/devAuth";

export default function Page() {
  if (!isDevAuthEnabled()) {
    notFound();
  }

  return <DevSuperadminLoginPage />;
}
