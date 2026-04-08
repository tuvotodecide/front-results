"use client";

import LoadingSkeleton from "@/components/LoadingSkeleton";
import { selectIsLoggedIn } from "@/store/auth/authSlice";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import VotacionPublicLandingPage from "./VotacionPublicLandingPage";

export default function LandingOrHomePage() {
  const isLoggedIn = useSelector(selectIsLoggedIn);
  const router = useRouter();
  const [isClientReady, setIsClientReady] = useState(false);

  useEffect(() => {
    setIsClientReady(true);
  }, []);

  useEffect(() => {
    if (isClientReady && isLoggedIn) {
      router.replace("/votacion/elecciones");
    }
  }, [isClientReady, isLoggedIn, router]);

  if (!isClientReady || isLoggedIn) {
    return <LoadingSkeleton />;
  }

  return <VotacionPublicLandingPage />;
}
