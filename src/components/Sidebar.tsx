import React from "react";
import { useScreenSize } from "../hooks/useScreenSize";
import styles from "./Sidebar.module.css";

interface SidebarProps {
  isOpen: boolean;
  closeSidebar: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, closeSidebar }) => {
  const { isSmallScreen } = useScreenSize();

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
          <h3 className={styles.title}>Products</h3>
          <ul className={styles.menu}>
            <li className={styles.menuItem}>
              <a href="#" className={styles.menuLink}>
                <span className={styles.icon}>🤖</span>AI Assistant
              </a>
            </li>
            <li className={styles.menuItem}>
              <a href="#" className={styles.menuLink}>
                <span className={styles.icon}>🔧</span>API Platform
              </a>
            </li>
            <li className={styles.menuItem}>
              <a href="#" className={styles.menuLink}>
                <span className={styles.icon}>📊</span>Analytics
              </a>
            </li>
            <li className={styles.menuItem}>
              <a href="#" className={styles.menuLink}>
                <span className={styles.icon}>🔐</span>Security
              </a>
            </li>
          </ul>
        </div>
        <div className={styles.section}>
          <h3 className={styles.title}>Resources</h3>
          <ul className={styles.menu}>
            <li className={styles.menuItem}>
              <a href="#" className={styles.menuLink}>
                <span className={styles.icon}>📚</span>Documentation
              </a>
            </li>
            <li className={styles.menuItem}>
              <a href="#" className={styles.menuLink}>
                <span className={styles.icon}>🎓</span>Tutorials
              </a>
            </li>
            <li className={styles.menuItem}>
              <a href="#" className={styles.menuLink}>
                <span className={styles.icon}>💬</span>Community
              </a>
            </li>
            <li className={styles.menuItem}>
              <a href="#" className={styles.menuLink}>
                <span className={styles.icon}>📝</span>Blog
              </a>
            </li>
          </ul>
        </div>
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
