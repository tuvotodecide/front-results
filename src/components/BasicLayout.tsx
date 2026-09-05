import React, { useState } from 'react';
import { useScreenSize } from '../hooks/useScreenSize';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { MainContent } from './MainContent';
import { Outlet, useSearchParams } from 'react-router-dom';
import './BasicLayout.css'; // Assuming you have a CSS file for styles

interface BasicLayoutProps {
  children?: React.ReactNode;
}

const BasicLayout: React.FC<BasicLayoutProps> = ({ children }) => {
  const { isSmallScreen } = useScreenSize();
  const [isSidebarOpen, setSidebarOpen] = useState(!isSmallScreen);
  const [searchParams] = useSearchParams();
  // Con ?hideLogin=true la cabecera no se renderiza, así que no hay que compensar su altura
  const headerOffset =
    searchParams.get('hideLogin') === 'true' ? '0px' : '64px';

  const toggleSidebar = () => {
    setSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    if (isSmallScreen) {
      setSidebarOpen(false);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        overflow: 'hidden',
        ['--sidebar-width' as string]:
          !isSmallScreen && isSidebarOpen ? '280px' : '0px',
        ['--header-offset' as string]: headerOffset,
      }}
    >
      <Header toggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />
      <div
        style={{
          display: 'flex',
          flex: 1,
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <MainContent>
          {children || <Outlet />}
        </MainContent>
        <Sidebar isOpen={isSidebarOpen} closeSidebar={closeSidebar} />
      </div>
    </div>
  );
};

export default BasicLayout;
