import React from "react";
import styles from "./MainContent.module.css";

interface MainContentProps {
  children: React.ReactNode;
  isOpen?: boolean;
}

export const MainContent: React.FC<MainContentProps> = ({
  children,
  isOpen,
}) => (
  <main
    className={`${styles.mainContent} ${!isOpen ? styles.sidebarClosed : ""}`}
  >
    {children}
    {/* Uncomment the following section to add content to the main area */}
    {/* <div className={styles.contentHeader}>
      <h1>Welcome to Your Dashboard</h1>
      <p>Manage your projects and explore our powerful tools.</p>
    </div>
    <div className={styles.card}>
      <h3>Getting Started</h3>
      <p>
        This is a sample card in the main content area. The sidebar on the left
        provides navigation to different sections of your application.
      </p>
    </div>
    <div className={styles.card}>
      <h3>Responsive Design</h3>
      <p>
        The layout automatically adapts to different screen sizes. On mobile
        devices, the sidebar becomes a collapsible menu accessible via the
        hamburger button in the header.
      </p>
    </div>
    <div className={styles.card}>
      <h3>Features</h3>
      <p>
        • Fixed header that stays at the top
        <br />
        • Collapsible sidebar with organized sections
        <br />
        • Smooth animations and transitions
        <br />
        • Mobile-first responsive design
        <br />• Clean, modern styling
      </p>
    </div> */}
  </main>
);
