"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import PublicLandingPage from "@/features/publicLanding/PublicLandingPage";
import { selectIsLoggedIn } from "@/store/auth/authSlice";

export default function PublicRootPage() {
  const router = useRouter();
  const isLoggedIn = useSelector(selectIsLoggedIn);

  useEffect(() => {
    if (isLoggedIn) {
      router.replace("/elections");
    }
  }, [isLoggedIn, router]);

  if (isLoggedIn) {
    return <LoadingSkeleton tone="brand" />;
  }

  return <PublicLandingPage />;
}
