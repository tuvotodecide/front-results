import { useState, useEffect } from "react";

const MOBILE_BREAKPOINT = 768;

const getIsSmallScreen = () =>
  typeof window !== "undefined" && window.innerWidth <= MOBILE_BREAKPOINT;

export const useScreenSize = () => {
  const [isSmallScreen, setIsSmallScreen] = useState(false);
  const [isScreenSizeReady, setIsScreenSizeReady] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsSmallScreen(getIsSmallScreen());
      setIsScreenSizeReady(true);
    };

    handleResize(); // Initial check
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return { isSmallScreen, isScreenSizeReady };
};
