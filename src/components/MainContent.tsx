import React from 'react';
import styles from './MainContent.module.css';

interface MainContentProps {
  children: React.ReactNode;
}

export const MainContent: React.FC<MainContentProps> = ({ children }) => (
  <main className={styles.mainContent}>{children}</main>
);
