import React from "react";
import { Outlet } from "react-router-dom";
import Menu from "./Menu";

const Layout: React.FC = () => {
  return (
    <div className="min-h-screen grid grid-rows-[auto_1fr]">
      <header className="bg-primary text-black">
        <Menu />
      </header>
      <main className="bg-gray-100" style={{ paddingTop: "70px" }}>
        <div className="inline-block w-full h-full">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
