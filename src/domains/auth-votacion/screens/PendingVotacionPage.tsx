"use client";

import { useEffect, useMemo, useState } from "react";
import tuvotoDecideImage from "../../../assets/tuvotodecide.webp";
import { Link, useNavigate } from "../navigation/compat";
import { useSelector } from "react-redux";
import {
  selectAuth,
  selectIsLoggedIn,
} from "../../../store/auth/authSlice";
import {
  readStorage,
} from "../../../shared/system/browserStorage";
import { resolveAuthVotacionRedirect } from "../utils/resolveAuthRedirect";
import { MailCheck } from "lucide-react";

const getLogoSrc = () => {
  const logoAsset = tuvotoDecideImage as string | { src: string };
  return typeof logoAsset === "string" ? logoAsset : logoAsset.src;
};

const PendingVotacionPage = () => {
  const logoSrc = getLogoSrc();
  const navigate = useNavigate();
  const { user, token } = useSelector(selectAuth);
  const isLoggedIn = useSelector(selectIsLoggedIn);
  const [pendingEmail, setPendingEmail] = useState("");
  const [pendingReason, setPendingReason] = useState("SUPERADMIN_APPROVAL");
  const [isStorageReady, setIsStorageReady] = useState(false);

  useEffect(() => {
    setPendingEmail(readStorage("pendingEmail") || "");
    setPendingReason(readStorage("pendingReason") || "SUPERADMIN_APPROVAL");
    setIsStorageReady(true);
  }, []);

  useEffect(() => {
    if (!isStorageReady) {
      return;
    }

    const target = resolveAuthVotacionRedirect(user, token);
    if (target && target !== "/votacion/pendiente") {
      navigate(target, { replace: true });
      return;
    }

    if (!isLoggedIn && !pendingEmail) {
      navigate("/votacion/login", { replace: true });
    }
  }, [isLoggedIn, user, token, pendingEmail, navigate, isStorageReady]);

  const content = useMemo(() => {
    if (pendingReason === "VERIFY_EMAIL") {
      return {
        title: "Revisa tu correo electrónico",
        paragraphs: [
          "Debes verificar tu correo antes de poder continuar con el proceso.",
        ],
      };
    }

    return {
      title: "En espera de aprobación",
      paragraphs: [
        "Tu solicitud ya fue recibida y ahora está en proceso de revisión.",
      ].filter(Boolean),
    };
  }, [pendingReason]);

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-64px)] bg-[#459151] px-4">
      <div className="w-full max-w-[460px] p-8 sm:p-10 bg-white rounded-3xl shadow-xl border border-gray-100 text-center">
        <div className="flex flex-col items-center mb-6">
          <img src={logoSrc} alt="Logo" className="h-20 w-auto mb-6" />

          <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-5 border border-green-100 shadow-sm">
            <MailCheck className="w-10 h-10 text-[#459151]" strokeWidth={1.8} />
          </div>

          <h1 className="text-2xl sm:text-[2rem] font-bold text-gray-900 leading-tight mb-2">
            {content.title}
          </h1>

          <div className="space-y-3 w-full mt-3">
            {content.paragraphs.map((paragraph, index) => (
              <p
                key={index}
                className="bg-[#f7faf7] border border-green-100 rounded-2xl px-5 py-4 text-[#459151] font-semibold text-base leading-relaxed"
              >
                {paragraph}
              </p>
            ))}
          </div>
        </div>

        <div className="pt-6 border-t border-gray-100 space-y-3">
          <Link
            to="/votacion"
            className="block w-full py-3 border-2 border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-50 transition-all active:scale-[0.98]"
          >
            Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PendingVotacionPage;
