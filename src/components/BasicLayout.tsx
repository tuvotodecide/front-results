import React, { useState } from 'react';
import { useScreenSize } from '../hooks/useScreenSize';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { MainContent } from './MainContent';
import { Outlet } from 'react-router-dom';
import './BasicLayout.css'; // Assuming you have a CSS file for styles

const BasicLayout: React.FC = () => {
  const { isSmallScreen } = useScreenSize();
  const [isSidebarOpen, setSidebarOpen] = useState(!isSmallScreen);

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
          <Outlet />
        </MainContent>
        <Sidebar isOpen={isSidebarOpen} closeSidebar={closeSidebar} />
      </div>
    </div>
  );
};

export default BasicLayout;
