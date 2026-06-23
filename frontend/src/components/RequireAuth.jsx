import { Navigate, Outlet } from "react-router-dom";
import { getAuthUser } from "../auth";

export default function RequireAuth({ allowedRoles }) {
  const user = getAuthUser();

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={`/${user.role}-login`} replace />;
  }

  return <Outlet />;
}