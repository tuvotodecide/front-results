"use client";

import Link from "next/link";
import React from "react";
import styles from "@/components/Header.module.css";
import { useDispatch, useSelector } from "react-redux";
import { apiSlice } from "@/store/apiSlice";
import { clearSelectedElection } from "@/store/election/electionSlice";
import { logOut, selectAuth, selectIsLoggedIn } from "@/store/auth/authSlice";
import { resetResults } from "@/store/resultados/resultadosSlice";
import tuvotoDecideImage from "@/assets/tuvotodecide.webp";
import { usePathname } from "next/navigation";

export default function VotacionPublicHeader() {
  const logoAsset = tuvotoDecideImage as string | { src: string };
  const logoSrc = typeof logoAsset === "string" ? logoAsset : logoAsset.src;
  const isLoggedIn = useSelector(selectIsLoggedIn);
  const pathname = usePathname();
  const isLoginPage = pathname === "/votacion/login";
  const { user } = useSelector(selectAuth);
  const dispatch = useDispatch();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
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
    setIsMenuOpen(false);
    window.location.replace("/");
  };

  return (
    <header className={styles.header}>
      <a className={styles.logo}>
        <img
          src={logoSrc}
          alt="Tu voto decide"
          className={styles.logoImage}
        />
        <span className={styles.logoText}>Tu voto decide</span>
      </a>
      <div className={styles.headerActions}>
        {isLoggedIn ? (
          <div className={styles.userMenuContainer} ref={menuRef}>
            <button
              className={`${styles.userButton} ${
                isMenuOpen ? styles.active : ""
              }`}
              onClick={() => setIsMenuOpen(!isMenuOpen)}
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
              <span className={styles.userNameText}>{user?.name}</span>

              <svg
                className={`${styles.chevron} ${
                  isMenuOpen ? styles.rotate : ""
                }`}
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
              className={`${styles.userMenu} ${isMenuOpen ? styles.show : ""}`}
            >
              <div className={styles.menuHeader}>
                <p className={styles.menuEmail}>{user?.email}</p>
              </div>
              <button
                data-cy="logout-button"
                onClick={logout}
                className={styles.menuItem}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ marginRight: "8px" }}
                >
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                  <polyline points="16 17 21 12 16 7"></polyline>
                  <line x1="21" y1="12" x2="9" y2="12"></line>
                </svg>
                Cerrar sesión
              </button>
            </div>
          </div>
        ) : (
          <>
            {!isLoginPage && (
              <Link href="/votacion/login" className={styles.loginButton}>
                Iniciar Sesión
              </Link>
            )}
          </>
        )}
      </div>
    </header>
  );
}
