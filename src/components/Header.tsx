import React from "react";
import styles from "./Header.module.css";
import { useSelector, useDispatch } from "react-redux";
import { selectIsLoggedIn, selectAuth, logOut } from "../store/auth/authSlice";
import { Link } from "react-router-dom";

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

  const logout = () => {
    dispatch(logOut());
  };
  return (
    <header className={styles.header}>
      <button
        className={styles.menuToggle}
        onClick={toggleSidebar}
        aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
      >
        {isSidebarOpen ? (
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
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
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
      <a href="#" className={styles.logo}>
        Yo Participo
      </a>
      <div className={styles.headerActions}>
        {isLoggedIn ? (
          <>
            <span>{user?.name || "User"}!</span>
          </>
        ) : (
          <Link to="/login">Login</Link>
        )}
      </div>
    </header>
  );
};
