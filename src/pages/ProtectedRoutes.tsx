import { useCallback, useEffect } from "react";
import { selectAuth, setAuth } from "../store/auth/authSlice";
import { useDispatch, useSelector } from "react-redux";
import { Navigate, Outlet } from "react-router-dom";

export default function ProtectedRoutes() {
  const { user } = useSelector(selectAuth);
  const dispatch = useDispatch();
  // const userHasLoggedIn = useCallback(() => {
  //   const usuario = JSON.parse(localStorage.getItem("usuario") ?? "{}");
  //   const token = localStorage.getItem("token");
  // }, [user]);

  return user ? (
    <Outlet />
  ) : (
    <Navigate to="/login" state={{ from: "ProtectedComponent" }} />
  );
}
