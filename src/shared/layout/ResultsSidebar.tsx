"use client";

import { useEffect } from "react";
import { useSelector } from "react-redux";
import BrowserNavLink from "@/shared/routing/BrowserNavLink";
import {
  selectAuth,
  selectIsLoggedIn,
} from "@/store/auth/authSlice";
import {
  selectCurrentBallot,
  selectCurrentTable,
  selectQueryParamsResults,
} from "@/store/resultados/resultadosSlice";
import { useScreenSize } from "@/hooks/useScreenSize";
import styles from "./ResultsSidebar.module.css";

interface ResultsSidebarProps {
  isOpen: boolean;
  closeSidebar: () => void;
}

export default function ResultsSidebar({
  isOpen,
  closeSidebar,
}: Readonly<ResultsSidebarProps>) {
  const { isSmallScreen } = useScreenSize();
  const { user } = useSelector(selectAuth);
  const isLoggedIn = useSelector(selectIsLoggedIn);
  const currentTable = useSelector(selectCurrentTable);
  const currentBallot = useSelector(selectCurrentBallot);
  const queryParamsResults = useSelector(selectQueryParamsResults);
  const role = user?.role || "publico";
  const isApproved = !!user?.active;

  const sidebarClassName = `${styles.sidebar} ${
    isOpen ? styles.sidebarOpen : styles.sidebarClosed
  }`;

  const overlayClassName = `${styles.overlay} ${
    isOpen ? styles.overlayActive : ""
  }`;

  useEffect(() => {
    const handleMenuClick = () => {
      if (isSmallScreen) {
        closeSidebar();
      }
    };

    const menuLinks = document.querySelectorAll(`.${styles.menuLink}`);
    menuLinks.forEach((link) => {
      link.addEventListener("click", handleMenuClick);
    });

    return () => {
      menuLinks.forEach((link) => {
        link.removeEventListener("click", handleMenuClick);
      });
    };
  }, [closeSidebar, isSmallScreen]);

  const handleNavigate = () => {
    if (isSmallScreen) {
      closeSidebar();
    }
  };

  return (
    <>
      <aside className={sidebarClassName}>
        <div className={styles.section}>
          <ul className={styles.menu}>
            <li className={styles.menuItem}>
              <BrowserNavLink href="/" className={styles.menuLink} onClick={handleNavigate}>
                <span className={styles.icon}>📚</span>
                Inicio
              </BrowserNavLink>
            </li>
            {isLoggedIn && role === "SUPERADMIN" && (
              <li className={styles.menuItem}>
                <BrowserNavLink href="/panel" className={styles.menuLink} onClick={handleNavigate}>
                  <span className={styles.icon}>⚙️</span>
                  Panel
                </BrowserNavLink>
              </li>
            )}
          </ul>
        </div>

        <div className={styles.section}>
          <h3 className={styles.title}>Resultados</h3>
          <ul className={styles.menu}>
            <li className={styles.menuItem}>
              <BrowserNavLink
                href={queryParamsResults ? `/resultados?${queryParamsResults}` : "/resultados"}
                className={styles.menuLink}
                onClick={handleNavigate}
              >
                <span className={styles.icon}>📊</span>
                Resultados generales
              </BrowserNavLink>
            </li>
            <li className={styles.menuItem}>
              <BrowserNavLink
                href={
                  currentTable
                    ? queryParamsResults
                      ? `/resultados/mesa/${currentTable}?${queryParamsResults}`
                      : `/resultados/mesa/${currentTable}`
                    : queryParamsResults
                      ? `/resultados/mesa?${queryParamsResults}`
                      : "/resultados/mesa"
                }
                className={styles.menuLink}
                onClick={handleNavigate}
              >
                <span className={styles.icon}>🗳️</span>
                Resultados por mesa
              </BrowserNavLink>
            </li>
            <li className={styles.menuItem}>
              <BrowserNavLink
                href={
                  currentBallot
                    ? queryParamsResults
                      ? `/resultados/imagen/${currentBallot}?${queryParamsResults}`
                      : `/resultados/imagen/${currentBallot}`
                    : queryParamsResults
                      ? `/resultados/imagen?${queryParamsResults}`
                      : "/resultados/imagen"
                }
                className={styles.menuLink}
                onClick={handleNavigate}
              >
                <span className={styles.icon}>🖼️</span>
                Resultados por imagen
              </BrowserNavLink>
            </li>
            {isLoggedIn && isApproved && (role === "MAYOR" || role === "GOVERNOR") && (
              <>
                <li className={styles.menuItem}>
                  <BrowserNavLink
                    href={queryParamsResults ? `/control-personal?${queryParamsResults}` : "/control-personal"}
                    className={styles.menuLink}
                    onClick={handleNavigate}
                  >
                    <span className={styles.icon}>👥</span>
                    Participación de personal
                  </BrowserNavLink>
                </li>
                <li className={styles.menuItem}>
                  <BrowserNavLink
                    href={queryParamsResults ? `/auditoria-tse?${queryParamsResults}` : "/auditoria-tse"}
                    className={styles.menuLink}
                    onClick={handleNavigate}
                  >
                    <span className={styles.icon}>🔍</span>
                    Auditoría TSE
                  </BrowserNavLink>
                </li>
              </>
            )}
          </ul>
        </div>

        {isLoggedIn && role === "SUPERADMIN" && (
          <>
            <div className={styles.section}>
              <h3 className={styles.title}>Ubicaciones geográficas</h3>
              <ul className={styles.menu}>
                <li className={styles.menuItem}>
                  <BrowserNavLink href="/departamentos" className={styles.menuLink} onClick={handleNavigate}>
                    <span className={styles.icon}>⚙️</span>
                    Departamentos
                  </BrowserNavLink>
                </li>
                <li className={styles.menuItem}>
                  <BrowserNavLink href="/provincias" className={styles.menuLink} onClick={handleNavigate}>
                    <span className={styles.icon}>🏛️</span>
                    Provincias
                  </BrowserNavLink>
                </li>
                <li className={styles.menuItem}>
                  <BrowserNavLink href="/municipios" className={styles.menuLink} onClick={handleNavigate}>
                    <span className={styles.icon}>🏫</span>
                    Municipios
                  </BrowserNavLink>
                </li>
                <li className={styles.menuItem}>
                  <BrowserNavLink href="/asientos-electorales" className={styles.menuLink} onClick={handleNavigate}>
                    <span className={styles.icon}>📋</span>
                    Asientos Electorales
                  </BrowserNavLink>
                </li>
                <li className={styles.menuItem}>
                  <BrowserNavLink href="/recintos-electorales" className={styles.menuLink} onClick={handleNavigate}>
                    <span className={styles.icon}>📋</span>
                    Recintos Electorales
                  </BrowserNavLink>
                </li>
                <li className={styles.menuItem}>
                  <BrowserNavLink href="/mesas" className={styles.menuLink} onClick={handleNavigate}>
                    <span className={styles.icon}>📋</span>
                    Mesas
                  </BrowserNavLink>
                </li>
              </ul>
            </div>

            <div className={styles.section}>
              <h3 className={styles.title}>Configuraciones</h3>
              <ul className={styles.menu}>
                <li className={styles.menuItem}>
                  <BrowserNavLink href="/configuraciones" className={styles.menuLink} onClick={handleNavigate}>
                    <span className={styles.icon}>⚙️</span>
                    Configuraciones
                  </BrowserNavLink>
                </li>
                <li className={styles.menuItem}>
                  <BrowserNavLink href="/partidos-politicos" className={styles.menuLink} onClick={handleNavigate}>
                    <span className={styles.icon}>⚙️</span>
                    Partidos Políticos
                  </BrowserNavLink>
                </li>
              </ul>
            </div>
          </>
        )}
      </aside>

      <div className={overlayClassName} onClick={closeSidebar} />
    </>
  );
}
