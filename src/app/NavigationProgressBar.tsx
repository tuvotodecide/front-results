"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  emitNavigationStart,
  onNavigationStart,
} from "@/shared/system/navigationFeedback";

export default function NavigationProgressBar() {
  const pathname = usePathname() ?? "";
  const searchParams = useSearchParams();
  const currentUrl = `${pathname}${searchParams?.toString() ? `?${searchParams.toString()}` : ""}`;
  const [isVisible, setIsVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const progressIntervalRef = useRef<number | null>(null);
  const hideTimeoutRef = useRef<number | null>(null);
  const currentUrlRef = useRef(currentUrl);

  const clearTimers = useCallback(() => {
    if (progressIntervalRef.current !== null) {
      window.clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }

    if (hideTimeoutRef.current !== null) {
      window.clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
  }, []);

  const start = useCallback(() => {
    clearTimers();
    setIsVisible(true);
    setProgress(18);

    window.requestAnimationFrame(() => {
      setProgress(56);
    });

    progressIntervalRef.current = window.setInterval(() => {
      setProgress((value) => (value < 88 ? value + 6 : value));
    }, 160);
  }, [clearTimers]);

  const complete = useCallback(() => {
    if (!isVisible) {
      return;
    }

    clearTimers();
    setProgress(100);
    hideTimeoutRef.current = window.setTimeout(() => {
      setIsVisible(false);
      setProgress(0);
    }, 180);
  }, [clearTimers, isVisible]);

  useEffect(() => onNavigationStart(start), [start]);

  useEffect(() => {
    const handleDocumentClick = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      const target = event.target;
      if (!(target instanceof Element)) {
        return;
      }

      const anchor = target.closest("a");
      if (!(anchor instanceof HTMLAnchorElement)) {
        return;
      }

      if (
        anchor.target === "_blank" ||
        anchor.hasAttribute("download") ||
        anchor.getAttribute("rel")?.includes("external")
      ) {
        return;
      }

      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("mailto:")) {
        return;
      }

      const url = new URL(anchor.href, window.location.origin);
      if (url.origin !== window.location.origin) {
        return;
      }

      const destination = `${url.pathname}${url.search}`;
      if (destination === currentUrlRef.current) {
        return;
      }

      emitNavigationStart();
    };

    document.addEventListener("click", handleDocumentClick, true);
    return () => {
      document.removeEventListener("click", handleDocumentClick, true);
    };
  }, []);

  useEffect(() => {
    if (currentUrlRef.current === currentUrl) {
      return;
    }

    currentUrlRef.current = currentUrl;
    complete();
  }, [complete, currentUrl]);

  useEffect(() => {
    return () => {
      clearTimers();
    };
  }, [clearTimers]);

  return (
    <>
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          height: "3px",
          zIndex: 10000,
          pointerEvents: "none",
          opacity: isVisible ? 1 : 0,
          transition: "opacity 160ms ease",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${progress}%`,
            background:
              "linear-gradient(90deg, #1f6f3a 0%, #459151 45%, #8ed19a 100%)",
            boxShadow: "0 0 10px rgba(69,145,81,0.45)",
            transition: "width 180ms ease",
          }}
        />
      </div>
      {isVisible ? (
        <div
          role="status"
          aria-live="polite"
          aria-label="Cargando"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(255,255,255,0.72)",
            backdropFilter: "blur(2px)",
            pointerEvents: "auto",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "12px",
              border: "1px solid rgba(69,145,81,0.22)",
              background: "white",
              borderRadius: "8px",
              padding: "24px 28px",
              boxShadow: "0 20px 50px rgba(15, 23, 42, 0.18)",
            }}
          >
            <div
              className="animate-spin"
              aria-hidden="true"
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "999px",
                border: "4px solid #d6ead9",
                borderTopColor: "#459151",
              }}
            />
            <span style={{ color: "#1f2937", fontSize: "14px", fontWeight: 700 }}>
              Cargando...
            </span>
          </div>
        </div>
      ) : null}
    </>
  );
}
