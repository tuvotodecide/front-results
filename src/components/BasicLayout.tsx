import React, { useState } from "react";
import { useScreenSize } from "../hooks/useScreenSize";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { MainContent } from "./MainContent";
import { Outlet } from "react-router-dom";
import "./BasicLayout.css"; // Assuming you have a CSS file for styles

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
      style={{ display: "flex", flexDirection: "column", minHeight: "100%" }}
    >
      <Header toggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />
      <Sidebar isOpen={isSidebarOpen} closeSidebar={closeSidebar} />
      <MainContent isOpen={isSidebarOpen}>
        <Outlet />
      </MainContent>
    </div>
  );
};

export default BasicLayout;
