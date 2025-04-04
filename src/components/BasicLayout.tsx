import React from "react";
import { Outlet } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import Menu from "./Menu";

const BasicLayout: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-primary text-black">
        <Menu />
      </header>
      <main
        className="flex-1 flex items-center justify-center bg-gray-100"
        style={{ paddingTop: "70px" }}
      >
        <Outlet />
      </main>
    </div>
  );
};

export default BasicLayout;
