import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import RoleRoute from "./components/RoleRoute";
import LoadingScreen from "./components/LoadingScreen";
import AuthLayout from "./layouts/AuthLayout";
import DashboardLayout from "./layouts/DashboardLayout";
import AgentLayout from "./layouts/AgentLayout";

const Login = lazy(() => import("./pages/Login"));
const Signup = lazy(() => import("./pages/Signup"));
const VerifyEmail = lazy(() => import("./pages/VerifyEmail"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Inquiries = lazy(() => import("./pages/Inquiries"));
const SavedHomes = lazy(() => import("./pages/SavedHomes"));
const Profile = lazy(() => import("./pages/Profile"));
const Support = lazy(() => import("./pages/Support"));
const AgentDashboard = lazy(() => import("./pages/agent/AgentDashboard"));
const AgentReferralLinks = lazy(() => import("./pages/agent/AgentReferralLinks"));
const AgentLandlords = lazy(() => import("./pages/agent/AgentLandlords"));
const AgentInstructions = lazy(() => import("./pages/agent/AgentInstructions"));
const AgentProfile = lazy(() => import("./pages/agent/AgentProfile"));

const load = (node, label) => <Suspense fallback={<LoadingScreen label={label} />}>{node}</Suspense>;

export default function App() {
  return (
    <Routes>
      <Route element={<AuthLayout />}>
        <Route path="/login" element={load(<Login />, "Loading login")} />
        <Route path="/signup" element={load(<Signup />, "Loading signup")} />
        <Route path="/verify-email" element={load(<VerifyEmail />, "Loading verification")} />
        <Route path="/forgot-password" element={load(<ForgotPassword />, "Loading reset")} />
        <Route path="/reset-password/:token" element={load(<ResetPassword />, "Loading reset")} />
      </Route>

      <Route
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={load(<Dashboard />, "Loading dashboard")} />
        <Route path="/inquiries" element={load(<Inquiries />, "Loading inquiries")} />
        <Route path="/saved" element={load(<SavedHomes />, "Loading saved homes")} />
        <Route path="/profile" element={load(<Profile />, "Loading profile")} />
        <Route path="/support" element={load(<Support />, "Loading support")} />
      </Route>

      <Route
        element={
          <RoleRoute allowedRoles={["agent"]}>
            <AgentLayout />
          </RoleRoute>
        }
      >
        <Route path="/agent/dashboard" element={load(<AgentDashboard />, "Loading agent dashboard")} />
        <Route path="/agent/referrals" element={load(<AgentReferralLinks />, "Loading referral links")} />
        <Route path="/agent/landlords" element={load(<AgentLandlords />, "Loading landlords")} />
        <Route path="/agent/instructions" element={load(<AgentInstructions />, "Loading instructions")} />
        <Route path="/agent/profile" element={load(<AgentProfile />, "Loading profile")} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
