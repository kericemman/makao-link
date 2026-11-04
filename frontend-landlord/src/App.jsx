import { Navigate, Route, Routes } from "react-router-dom";
import LoginPage from "./pages/auth/Login";
import RegisterLandlordPage from "./pages/auth/Register";
import VerifyLandlordEmail from "./pages/auth/VerifyEmail";
import ForgotPasswordPage from "./pages/auth/ForgetPassword";
import ResetPasswordPage from "./pages/auth/ResetPassword";
import PaymentCallbackPage from "./context/PaymentCallback";
import ProtectedRoute from "./routes/protextedRoute";
import RoleRoute from "./routes/RoleRoute";
import SubscriptionGuard from "./context/SubscriptionGuard";
import LandlordLayout from "./layouts/LandlordLayout";
import DashboardHome from "./pages/landlord/Dashboard";
import Listings from "./pages/landlord/Listings";
import CreateListing from "./pages/landlord/CreateListing";
import EditListingPage from "./pages/landlord/EditProperty";
import LandlordInquiries from "./pages/landlord/Inquiries";
import LandlordSubscription from "./pages/landlord/Subscription";
import LandlordSupportPage from "./pages/landlord/Support";
import LandlordSupportDetailPage from "./pages/landlord/SupportDetails";
import LandlordProfilePage from "./pages/landlord/LandlordProfile";
import LandlordKycPage from "./pages/landlord/Kyc";
import CompanyWorkspace from "./pages/landlord/CompanyWorkspace";
import StayRequests from "./pages/landlord/StayRequests";
import Leads from "./pages/landlord/Leads";
import Viewings from "./pages/landlord/Viewings";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterLandlordPage />} />
      <Route path="/verify-email" element={<VerifyLandlordEmail />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
      <Route path="/payment/callback" element={<PaymentCallbackPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<RoleRoute allowedRole={["landlord", "landlord_staff"]} />}>
          <Route element={<LandlordLayout />}>
            <Route path="/dashboard" element={<DashboardHome />} />
            <Route path="/listings" element={<Listings />} />
            <Route path="/listings/:id/edit" element={<EditListingPage />} />
            <Route path="/inquiries" element={<LandlordInquiries />} />
            <Route path="/leads" element={<Leads />} />
            <Route path="/viewings" element={<Viewings />} />
            <Route path="/stay-requests" element={<StayRequests />} />
            <Route path="/team" element={<CompanyWorkspace />} />
            <Route path="/subscription" element={<LandlordSubscription />} />
            <Route path="/support" element={<LandlordSupportPage />} />
            <Route path="/support/:id" element={<LandlordSupportDetailPage />} />
            <Route path="/profile" element={<LandlordProfilePage />} />
            <Route path="/kyc" element={<LandlordKycPage />} />

            <Route element={<SubscriptionGuard requireListingAccess={true} />}>
              <Route path="/listings/new" element={<CreateListing />} />
            </Route>
          </Route>
        </Route>
      </Route>
    </Routes>
  );
}
