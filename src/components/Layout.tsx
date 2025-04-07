import React from "react";
import { Outlet } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { selectAuth, logOut } from "../store/auth/authSlice";
import Menu from "./Menu";

const Layout: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector(selectAuth);
  console.log("user", user);

  const logout = () => {
    console.log("Logout action triggered");
    dispatch(logOut());
    navigate("/login");
  };

  const navigationItems = [
    { title: "Resultados", path: "/resultados" },
    { title: "Subir acta", path: "/enviarActa" },
    {
      title: user?.name || "Usuario",
      path: "/panel",
      subItems: [{ title: "Cerrar sesión", method: logout }],
    },
  ];

  return (
    <div>
      <header className="bg-primary text-black">
        <Menu navigationItems={navigationItems} />
      </header>
      <main style={{ paddingTop: "70px" }}>
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
