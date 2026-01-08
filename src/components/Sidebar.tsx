import React, { useEffect } from "react";
import { useScreenSize } from "../hooks/useScreenSize";
import styles from "./Sidebar.module.css";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectIsLoggedIn } from "../store/auth/authSlice";
import {
  selectCurrentBallot,
  selectCurrentTable,
  selectQueryParamsResults,
} from "../store/resultados/resultadosSlice";

interface SidebarProps {
  isOpen: boolean;
  closeSidebar: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, closeSidebar }) => {
  const { isSmallScreen } = useScreenSize();
  const isLoggedIn = useSelector(selectIsLoggedIn);
  const currentTable = useSelector(selectCurrentTable);
  const currentBallot = useSelector(selectCurrentBallot);
  const queryParamsResults = useSelector(selectQueryParamsResults);

  React.useEffect(() => {
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

  useEffect(() => {
    console.log("Query Params Results changed:", queryParamsResults);
  }, [queryParamsResults]);

  return (
    <>
      <aside
        className={`${styles.sidebar} ${isOpen ? styles.open : styles.closed}`}
      >
        <div className={styles.section}>
          <div className={styles.section}>
            <ul className={styles.menu}>
              <li className={styles.menuItem}>
                <Link to="/" className={styles.menuLink}>
                  <span className={styles.icon}>📚</span>Inicio
                </Link>
              </li>
              {isLoggedIn && (
                <li className={styles.menuItem}>
                  <Link to="/panel" className={styles.menuLink}>
                    <span className={styles.icon}>⚙️</span>Panel
                  </Link>
                </li>
              )}
            </ul>
          </div>
          <h3 className={styles.title}>Resultados</h3>
          <ul className={styles.menu}>
            <li className={styles.menuItem}>
              {" "}
              <Link
                to={
                  queryParamsResults
                    ? `/resultados?${queryParamsResults}`
                    : "/resultados"
                }
                className={styles.menuLink}
              >
                <span className={styles.icon}>📊</span>Resultados generales
              </Link>
            </li>
            <li className={styles.menuItem}>
              <Link
                to={
                  currentTable
                    ? `/resultados/mesa/${currentTable}`
                    : "/resultados/mesa"
                }
                className={styles.menuLink}
              >
                <span className={styles.icon}>🗳️</span>Resultados por mesa
              </Link>
            </li>
            <li className={styles.menuItem}>
              <Link
                to={
                  currentBallot
                    ? `/resultados/imagen/${currentBallot}`
                    : "/resultados/imagen"
                }
                className={styles.menuLink}
              >
                <span className={styles.icon}>🖼️</span>Resultados por imagen
              </Link>
            </li>
            <li className={styles.menuItem}>
              <Link
                to={
                  queryParamsResults
                    ? `/control-personal?${queryParamsResults}`
                    : "/control-personal"
                }
                className={styles.menuLink}
              >
                <span className={styles.icon}>👥</span>Participación de personal
              </Link>
            </li>
            <li className={styles.menuItem}>
              <Link
                to={
                  queryParamsResults
                    ? `/auditoria-tse?${queryParamsResults}`
                    : "/auditoria-tse"
                }
                className={styles.menuLink}
              >
                <span className={styles.icon}>🔍</span>Auditoría TSE
              </Link>
            </li>
          </ul>
        </div>
        {isLoggedIn && (
          <>
            <div className={styles.section}>
              <h3 className={styles.title}>Ubicaciones geográficas</h3>
              <ul className={styles.menu}>
                {" "}
                <li className={styles.menuItem}>
                  <Link to="/departamentos" className={styles.menuLink}>
                    <span className={styles.icon}>⚙️</span>Departamentos
                  </Link>
                </li>
                <li className={styles.menuItem}>
                  <Link to="/provincias" className={styles.menuLink}>
                    <span className={styles.icon}>🏛️</span>Provincias
                  </Link>
                </li>
                <li className={styles.menuItem}>
                  <Link to="/municipios" className={styles.menuLink}>
                    <span className={styles.icon}>🏫</span>Municipios
                  </Link>
                </li>
                <li className={styles.menuItem}>
                  <Link to="/asientos-electorales" className={styles.menuLink}>
                    <span className={styles.icon}>📋</span>Asientos Electorales
                  </Link>
                </li>
                <li className={styles.menuItem}>
                  <Link to="/recintos-electorales" className={styles.menuLink}>
                    <span className={styles.icon}>📋</span>Recintos Electorales
                  </Link>
                </li>
                <li className={styles.menuItem}>
                  <Link to="/mesas" className={styles.menuLink}>
                    <span className={styles.icon}>📋</span>Mesas
                  </Link>
                </li>
              </ul>
            </div>
            <div className={styles.section}>
              <h3 className={styles.title}>Configuraciones</h3>
              <ul className={styles.menu}>
                <li className={styles.menuItem}>
                  <Link to="/configuraciones" className={styles.menuLink}>
                    <span className={styles.icon}>⚙️</span>Configuraciones
                  </Link>
                </li>
                <li className={styles.menuItem}>
                  <Link to="/partidos-politicos" className={styles.menuLink}>
                    <span className={styles.icon}>⚙️</span>Partidos Políticos
                  </Link>
                </li>
              </ul>
            </div>
          </>
        )}
      </aside>
      {isSmallScreen && (
        <div
          className={`${styles.overlay} ${isOpen ? styles.active : ""}`}
          onClick={closeSidebar}
        ></div>
      )}
    </>
  );
};
