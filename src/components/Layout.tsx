import React from "react";
import { Outlet } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { selectAuth, logOut } from "../store/auth/authSlice";

const Layout: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector(selectAuth);
  const logout = () => {
    dispatch(logOut());
    navigate("/login");
  };
  return (
    <div>
      <header className="bg-primary text-black p-4">
        <nav className="flex">
          {/* <ul className="flex gap-4">
            <li>
              <Link to="/panel">Panel de Control</Link>
            </li>
            <li>
              <Link to="/registroJurado">Registro de Jurado</Link>
            </li>
            <li>
              <Link to="/envioActa">Envío de Acta</Link>
            </li>
            <li>
              <Link to="/resultados">Resultados</Link>
            </li>
          </ul> */}
          <div
            onClick={() => {
              navigate("/panel");
            }}
          >
            Yo participo
          </div>
          <div className="ml-auto px-2">
            <div className="flex gap-6">
              <p>{user?.name}</p>
              <button onClick={logout}>cerrar sesión</button>
            </div>
          </div>
        </nav>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
