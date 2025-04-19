import React from "react";
import { Outlet } from "react-router-dom";
import Menu from "./Menu";

const Layout: React.FC = () => {
  return (
    <div className="min-h-screen grid grid-rows-[auto_1fr]">
      <header className="bg-primary text-black">
        <Menu />
      </header>
      <main
        className="bg-gray-100 flex items-center justify-center"
        style={{ paddingTop: "70px" }}
      >
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
