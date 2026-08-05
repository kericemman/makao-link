import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = () => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const next = `${location.pathname}${location.search || ""}`;

  if (loading) return <div className="p-6">Loading...</div>;
  if (!user) {
    return (
      <Navigate
        to={`/login?next=${encodeURIComponent(next)}`}
        replace
        state={{ from: next }}
      />
    );
  }

  return <Outlet />;
};

export default ProtectedRoute;
