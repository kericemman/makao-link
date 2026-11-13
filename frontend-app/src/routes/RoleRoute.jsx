import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { canAccessAdminPath, getAdminHomePath } from "../utils/adminPermissions";

const RoleRoute = ({ allowedRole }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div className="p-6">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRole === "admin") {
    if (!canAccessAdminPath(user, location.pathname)) {
      const homePath = getAdminHomePath(user);
      return <Navigate to={homePath !== location.pathname ? homePath : "/login"} replace />;
    }
  } else if (![user.role, ...(user.roles || [])].includes(allowedRole)) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default RoleRoute;
