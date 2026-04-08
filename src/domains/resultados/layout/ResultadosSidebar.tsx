"use client";

import React from "react";
import { useScreenSize } from "../../../hooks/useScreenSize";
import styles from "../../../components/Sidebar.module.css";
import { Link } from "../navigation/compat";
import { useSelector } from "react-redux";
import {
  selectAuth,
  selectIsLoggedIn,
} from "../../../store/auth/authSlice";
import useElectionConfig from "../hooks/useElectionConfig";
import useElectionId from "../hooks/useElectionId";
import {
  selectCurrentBallot,
  selectCurrentTable,
  selectQueryParamsResults,
} from "../../../store/resultados/resultadosSlice";
import { buildResultsTableLink } from "../../../utils/resultsTableLink";

interface SidebarProps {
  isOpen: boolean;
  closeSidebar: () => void;
}

const ResultadosSidebar: React.FC<SidebarProps> = ({ isOpen, closeSidebar }) => {
  const { isSmallScreen } = useScreenSize();
  const { user } = useSelector(selectAuth);
  const isLoggedIn = useSelector(selectIsLoggedIn);
  const currentTable = useSelector(selectCurrentTable);
  const currentBallot = useSelector(selectCurrentBallot);
  const queryParamsResults = useSelector(selectQueryParamsResults);
  const electionId = useElectionId();
  const { election } = useElectionConfig();

  const role = user?.role || "publico";
  const isApproved = !!user?.active;

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

  return (
    <>
      <aside
        className={`${styles.sidebar} ${isOpen ? styles.open : styles.closed}`}
      >
        <div className={styles.section}>
          <div className={styles.section}>
            <ul className={styles.menu}>
              <li className={styles.menuItem}>
                <Link to="/resultados" className={styles.menuLink}>
                  <span className={styles.icon}>📚</span>Inicio
                </Link>
              </li>
              {isLoggedIn && role === "SUPERADMIN" && (
                <li className={styles.menuItem}>
                  <Link to="/resultados/panel" className={styles.menuLink}>
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
                data-cy="res-gen"
              >
                <span className={styles.icon}>📊</span>Resultados generales
              </Link>
            </li>
            <li className={styles.menuItem}>
              <Link
                to={
                  currentTable
                    ? buildResultsTableLink(currentTable, {
                        electionId,
                        electionType: election?.type,
                      })
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
            {isLoggedIn &&
              isApproved &&
              (role === "MAYOR" || role === "GOVERNOR") && (
                <>
                  <li className={styles.menuItem}>
                    <Link
                      to={
                        queryParamsResults
                          ? `/resultados/control-personal?${queryParamsResults}`
                          : "/resultados/control-personal"
                      }
                      className={styles.menuLink}
                    >
                      <span className={styles.icon}>👥</span>Participación de
                      personal
                    </Link>
                  </li>
                  <li className={styles.menuItem}>
                    <Link
                      to={
                        queryParamsResults
                          ? `/resultados/auditoria-tse?${queryParamsResults}`
                          : "/resultados/auditoria-tse"
                      }
                      className={styles.menuLink}
                    >
                      <span className={styles.icon}>🔍</span>Auditoría TSE
                    </Link>
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
                {" "}
                <li className={styles.menuItem}>
                  <Link to="/resultados/departamentos" className={styles.menuLink}>
                    <span className={styles.icon}>⚙️</span>Departamentos
                  </Link>
                </li>
                <li className={styles.menuItem}>
                  <Link to="/resultados/provincias" className={styles.menuLink}>
                    <span className={styles.icon}>🏛️</span>Provincias
                  </Link>
                </li>
                <li className={styles.menuItem}>
                  <Link to="/resultados/municipios" className={styles.menuLink}>
                    <span className={styles.icon}>🏫</span>Municipios
                  </Link>
                </li>
                <li className={styles.menuItem}>
                  <Link to="/resultados/asientos-electorales" className={styles.menuLink}>
                    <span className={styles.icon}>📋</span>Asientos Electorales
                  </Link>
                </li>
                <li className={styles.menuItem}>
                  <Link to="/resultados/recintos-electorales" className={styles.menuLink}>
                    <span className={styles.icon}>📋</span>Recintos Electorales
                  </Link>
                </li>
                <li className={styles.menuItem}>
                  <Link to="/resultados/mesas" className={styles.menuLink}>
                    <span className={styles.icon}>📋</span>Mesas
                  </Link>
                </li>
              </ul>
            </div>
            <div className={styles.section}>
              <h3 className={styles.title}>Configuraciones</h3>
              <ul className={styles.menu}>
                <li className={styles.menuItem}>
                  <Link to="/resultados/configuraciones" className={styles.menuLink}>
                    <span className={styles.icon}>⚙️</span>Configuraciones
                  </Link>
                </li>
                <li className={styles.menuItem}>
                  <Link to="/resultados/partidos-politicos" className={styles.menuLink}>
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

export default ResultadosSidebar;
