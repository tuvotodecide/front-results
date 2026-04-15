"use client";

import { useEffect, useState } from "react";
import { Provider } from "react-redux";
import store from "../store";

interface ProvidersProps {
  children: React.ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  if (!isHydrated) {
    return (
      <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-3 text-[#2E6A38]">
          <div className="h-12 w-12 rounded-full border-4 border-[#459151] border-t-transparent animate-spin" />
          <p className="text-sm font-semibold text-gray-700">Cargando...</p>
        </div>
      </div>
    );
  }

  return <Provider store={store}>{children}</Provider>;
}
