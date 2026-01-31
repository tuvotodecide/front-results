import React from "react";
import styles from "./Header.module.css";
import { useSelector, useDispatch } from "react-redux";
import { selectIsLoggedIn, selectAuth, logOut } from "../store/auth/authSlice";
import { resetResults } from "../store/resultados/resultadosSlice";
import { clearSelectedElection } from "../store/election/electionSlice";
import { apiSlice } from "../store/apiSlice";
import tuvotoDecideImage from "../assets/tuvotodecide.webp";
import { Link, useLocation } from "react-router-dom";

interface HeaderProps {
  toggleSidebar: () => void;
  isSidebarOpen: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  toggleSidebar,
  isSidebarOpen,
}) => {
  const isLoggedIn = useSelector(selectIsLoggedIn);
  const location = useLocation();
  const isLoginPage = location.pathname === "/login";
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
  };
  return (
    <header className={styles.header}>
      <a className={styles.logo}>
        <img
          src={tuvotoDecideImage}
          alt="Tu voto decide"
          className={styles.logoImage}
        />
        <span className={styles.logoText}>Tu voto decide</span>
      </a>
      <div className={styles.headerActions}>
        {isLoggedIn ? (
          <>
            {" "}
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
                className={`${styles.userMenu} ${
                  isMenuOpen ? styles.show : ""
                }`}
              >
                <div className={styles.menuHeader}>
                  <p className={styles.menuEmail}>{user?.email}</p>
                </div>
                <button data-cy="logout-button" onClick={logout} className={styles.menuItem}>
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
          </>
        ) : (
          <>
            {!isLoginPage && (
              <Link to="/login" className={styles.loginButton}>
                Iniciar Sesión
              </Link>
            )}
            
          </>
        )}
        <button
          className={styles.menuToggle}
          onClick={toggleSidebar}
          aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
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
      </div>
    </header>
  );
};
