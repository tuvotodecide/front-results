import { useState, useEffect } from "react";

const MOBILE_BREAKPOINT = 768;

export const useScreenSize = () => {
  const [isSmallScreen, setIsSmallScreen] = useState(
    window.innerWidth <= MOBILE_BREAKPOINT
  );

  useEffect(() => {
    const handleResize = () => {
      setIsSmallScreen(window.innerWidth <= MOBILE_BREAKPOINT);
    };

    handleResize(); // Initial check
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return { isSmallScreen };
};
