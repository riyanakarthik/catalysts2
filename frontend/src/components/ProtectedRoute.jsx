import { Navigate } from "react-router-dom";
import { getStoredToken, getStoredUser } from "../api/auth";

export default function ProtectedRoute({ children, allowedRoles }) {
  const token = getStoredToken();
  const user = getStoredUser();

  if (!token || !user) {
    return <Navigate to="/" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    if (user.role === 'ADMIN') return <Navigate to="/admin" replace />;
    return <Navigate to="/worker" replace />;
  }

  return children;
}