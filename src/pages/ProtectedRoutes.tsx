import { selectAuth } from '../store/auth/authSlice';
import { useSelector } from 'react-redux';
import { Navigate, Outlet } from 'react-router-dom';

export default function ProtectedRoutes() {
  const { user } = useSelector(selectAuth);

  return user ? (
    <Outlet />
  ) : (
    <Navigate to="/login" state={{ from: 'ProtectedComponent' }} />
  );
}
