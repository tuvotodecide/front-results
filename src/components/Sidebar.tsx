import React from 'react';
import { useScreenSize } from '../hooks/useScreenSize';
import styles from './Sidebar.module.css';
import { Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { selectIsLoggedIn, selectAuth, logOut } from '../store/auth/authSlice';

interface SidebarProps {
  isOpen: boolean;
  closeSidebar: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, closeSidebar }) => {
  const { isSmallScreen } = useScreenSize();
  const isLoggedIn = useSelector(selectIsLoggedIn);
  const { user } = useSelector(selectAuth);
  const dispatch = useDispatch();

  React.useEffect(() => {
    const handleMenuClick = () => {
      if (isSmallScreen) {
        closeSidebar();
      }
    };

    const menuLinks = document.querySelectorAll(`.${styles.menuLink}`);
    menuLinks.forEach((link) => {
      link.addEventListener('click', handleMenuClick);
    });

    return () => {
      menuLinks.forEach((link) => {
        link.removeEventListener('click', handleMenuClick);
      });
    };
  }, [closeSidebar, isSmallScreen]);

  return (
    <>
      <aside
        className={`${styles.sidebar} ${isOpen ? styles.open : styles.closed}`}
      >
        {isLoggedIn && (
          <div className={styles.section}>
            <h3 className={styles.title}>Admin</h3>
            <ul className={styles.menu}>
              {' '}
              <li className={styles.menuItem}>
                <Link to="/panel" className={styles.menuLink}>
                  <span className={styles.icon}>⚙️</span>Panel
                </Link>
              </li>
              <li className={styles.menuItem}>
                <Link to="/partidos" className={styles.menuLink}>
                  <span className={styles.icon}>🏛️</span>Partidos
                </Link>
              </li>
              <li className={styles.menuItem}>
                <Link to="/recintos" className={styles.menuLink}>
                  <span className={styles.icon}>🏫</span>Recintos
                </Link>
              </li>
              <li className={styles.menuItem}>
                <Link to="/actas" className={styles.menuLink}>
                  <span className={styles.icon}>📋</span>Actas
                </Link>
              </li>
            </ul>
          </div>
        )}

        <div className={styles.section}>
          <div className={styles.section}>
            <ul className={styles.menu}>
              <li className={styles.menuItem}>
                <Link to="/" className={styles.menuLink}>
                  <span className={styles.icon}>📚</span>Inicio
                </Link>
              </li>
            </ul>
          </div>
          <h3 className={styles.title}>Resultados</h3>
          <ul className={styles.menu}>
            {/* <li className={styles.menuItem}>
              <Link to="/resultados/generales" className={styles.menuLink}>
                <span className={styles.icon}>🔧</span>Resultados generales
              </Link>
            </li> */}
            <li className={styles.menuItem}>
              {' '}
              <Link to="/resultados" className={styles.menuLink}>
                <span className={styles.icon}>📊</span>Resultados generales
              </Link>
            </li>
            <li className={styles.menuItem}>
              <Link to="/resultados/mesa" className={styles.menuLink}>
                <span className={styles.icon}>🗳️</span>Resultados por mesa
              </Link>
            </li>
            <li className={styles.menuItem}>
              <Link to="/resultados/imagen" className={styles.menuLink}>
                <span className={styles.icon}>🖼️</span>Resultados por imagen
              </Link>
            </li>
          </ul>
        </div>
        {/* <div className={styles.section}>
          <h3 className={styles.title}>Actas</h3>
          <ul className={styles.menu}>
            <li className={styles.menuItem}>
              <Link to="/enviarActa" className={styles.menuLink}>
                <span className={styles.icon}>📚</span>Subir acta
              </Link>
            </li>
            <li className={styles.menuItem}>
              <Link to="/verActa" className={styles.menuLink}>
                <span className={styles.icon}>💬</span>Ver acta
              </Link>
            </li>
          </ul>
        </div> */}
      </aside>
      {isSmallScreen && (
        <div
          className={`${styles.overlay} ${isOpen ? styles.active : ''}`}
          onClick={closeSidebar}
        ></div>
      )}
    </>
  );
};
