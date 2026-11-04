import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getMyOrganizations } from "../services/organization.service";

const RoleRoute = ({ allowedRole }) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [organizationAccess, setOrganizationAccess] = useState("checking");
  const next = `${location.pathname}${location.search || ""}`;
  const allowedRoles = Array.isArray(allowedRole) ? allowedRole : [allowedRole];
  const hasBaseRole = allowedRoles.includes(user?.role);

  useEffect(() => {
    if (loading || !user || hasBaseRole) {
      setOrganizationAccess(hasBaseRole ? "allowed" : "checking");
      return;
    }
    let active = true;
    getMyOrganizations()
      .then(({ organizations = [] }) => {
        const canAccessLeads = organizations.some(({ membership }) =>
          membership?.permissions?.includes("inquiries:read")
        );
        if (active) setOrganizationAccess(canAccessLeads ? "allowed" : "denied");
      })
      .catch(() => { if (active) setOrganizationAccess("denied"); });
    return () => { active = false; };
  }, [loading, user, hasBaseRole]);

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
  if (!hasBaseRole && organizationAccess === "checking") return <div className="p-6">Loading workspace...</div>;
  if (!hasBaseRole && organizationAccess !== "allowed") return <Navigate to="/" replace />;
  if (!hasBaseRole && location.pathname !== "/leads") return <Navigate to="/leads" replace />;

  return <Outlet />;
};

export default RoleRoute;
