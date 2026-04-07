"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import tuvotoDecideImage from "@/assets/tuvotodecide.webp";
import { logOut, selectAuth, selectIsLoggedIn } from "@/store/auth/authSlice";
import { resetResults } from "@/store/resultados/resultadosSlice";
import { clearSelectedElection } from "@/store/election/electionSlice";
import { apiSlice } from "@/store/apiSlice";
import styles from "./PublicLandingHeader.module.css";

interface PublicLandingHeaderProps {
  showMenuToggle?: boolean;
  isSidebarOpen?: boolean;
  onToggleMenu?: () => void;
}

export default function PublicLandingHeader({
  showMenuToggle = false,
  isSidebarOpen = false,
  onToggleMenu,
}: Readonly<PublicLandingHeaderProps>) {
  const dispatch = useDispatch();
  const isLoggedIn = useSelector(selectIsLoggedIn);
  const { user } = useSelector(selectAuth);
  const pathname = usePathname();
  const isLoginPage = pathname === "/login";
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const logout = () => {
    dispatch(logOut());
    dispatch(resetResults());
    dispatch(clearSelectedElection());
    dispatch(apiSlice.util.resetApiState());
    setIsUserMenuOpen(false);
  };

  return (
    <>
      <header className={styles.header}>
        <Link href="/" className={styles.logo}>
          <Image
            src={tuvotoDecideImage}
            alt="Tu voto decide"
            className={styles.logoImage}
            priority
          />
          <span className={styles.logoText}>Tu voto decide</span>
        </Link>

        <div className={styles.headerActions}>
          {isLoggedIn ? (
            <div className={styles.userMenuContainer} ref={menuRef}>
              <button
                className={`${styles.userButton} ${isUserMenuOpen ? styles.userButtonActive : ""}`}
                onClick={() => setIsUserMenuOpen((value) => !value)}
                type="button"
              >
                <div className={styles.avatar}>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                </div>
                <span className={styles.userNameText}>{user?.name ?? "Usuario"}</span>
                <svg
                  className={`${styles.chevron} ${isUserMenuOpen ? styles.chevronRotate : ""}`}
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </button>
              <div
                className={`${styles.userMenu} ${isUserMenuOpen ? styles.userMenuShow : ""}`}
              >
                <div className={styles.menuHeader}>
                  <p className={styles.menuEmail}>{user?.email}</p>
                </div>
                <button onClick={logout} className={styles.menuItem}>
                  Cerrar sesión
                </button>
              </div>
            </div>
          ) : (
            !isLoginPage && (
              <Link href="/login" className={styles.loginButton}>
                Iniciar Sesión
              </Link>
            )
          )}

          {showMenuToggle && onToggleMenu && (
            <button
              className={styles.menuToggle}
              onClick={onToggleMenu}
              aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
              type="button"
            >
              {isSidebarOpen ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="26"
                  height="26"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect
                    x="2"
                    y="2"
                    width="20"
                    height="20"
                    rx="4"
                    ry="4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    opacity="0.3"
                  />
                  <path d="M11 16l4-4-4-4" strokeWidth="2.5" />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </svg>
              )}
            </button>
          )}
        </div>
      </header>
      <div className={styles.spacer} aria-hidden="true" />
    </>
  );
}
