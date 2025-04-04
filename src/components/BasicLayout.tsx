import React from "react";
import { Outlet } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import Menu from "./Menu";

const BasicLayout: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div>
      <header className="bg-primary text-black">
        {/* <nav className="flex">
          <div
            onClick={() => {
              navigate("/");
            }}
          >
            Yo participo
          </div>
          <div className="ml-auto px-2">
            <div className="flex gap-6"></div>
          </div>
        </nav> */}
        <Menu />
      </header>
      <main style={{ paddingTop: "65px" }}>
        <Outlet />
      </main>
    </div>
  );
};

export default BasicLayout;
