import React from 'react';
import styles from './Header.module.css';
import { useSelector, useDispatch } from 'react-redux';
import { selectIsLoggedIn, selectAuth, logOut } from '../store/auth/authSlice';
import { Link } from 'react-router-dom';

interface HeaderProps {
  toggleSidebar: () => void;
  isSidebarOpen: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  toggleSidebar,
  isSidebarOpen,
}) => {
  const isLoggedIn = useSelector(selectIsLoggedIn);
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

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const logout = () => {
    dispatch(logOut());
    setIsMenuOpen(false);
  };
  return (
    <header className={styles.header}>
      <button
        className={styles.menuToggle}
        onClick={toggleSidebar}
        aria-label={isSidebarOpen ? 'Close sidebar' : 'Open sidebar'}
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
            <path d="M13 16l-4-4 4-4" strokeWidth="2.5" />
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
      <a className={styles.logo}>Tu voto decide</a>
      <div className={styles.headerActions}>
        {isLoggedIn ? (
          <>
            {' '}
            <div className={styles.userMenuContainer} ref={menuRef}>
              <span
                className={`${styles.userName} ${
                  isMenuOpen ? styles.active : ''
                }`}
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                {user?.name}
              </span>
              <div
                className={`${styles.userMenu} ${
                  isMenuOpen ? styles.show : ''
                }`}
              >
                <button onClick={logout} className={styles.menuItem}>
                  Cerrar sesión
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            <Link to="/login">Login</Link>
            {/* <Link to="/crearCuenta">Crear Cuenta</Link> */}
          </>
        )}
      </div>
    </header>
  );
};
