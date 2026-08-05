import { Navigate, Route, Routes } from "react-router-dom";

import AdminLayout from "../layouts/AdminLayout";
import ProtectedRoute from "./protextedRoute";
import RoleRoute from "./RoleRoute";

import LoginPage from "../pages/public/auth/Login";
import AdminDashboard from "../pages/admin/AdminDashboard";
import PendingListingsPage from "../pages/admin/AdminPendingPage";
import AdminAllListingsPage from "../pages/admin/AdminListingPage";
import AdminListingReportsPage from "../pages/admin/AdminListingReportsPage";
import AdminLandlordsPage from "../pages/admin/AdminLandlord";
import AdminPaymentsPage from "../pages/admin/AdminPaymentPage";
import AdminInquiriesPage from "../pages/admin/AdminInquiriesPage";
import AdminSupportPage from "../pages/admin/AdminSupport";
import AdminSupportDetailPage from "../pages/admin/AdminSupportdetails";
import AdminServiceApplicationsPage from "../pages/admin/AdminApplicationPage";
import AdminServiceApplicationDetailPage from "../pages/admin/AdminApplicationDetails";
import AdminContactMessagesPage from "../pages/admin/AdminContact";
import AdminContactMessageDetailPage from "../pages/admin/AdminContactDetails";
import AdminBlogsPage from "../pages/admin/blog/AdminBlog";
import AdminBlogEditorPage from "../pages/admin/blog/CreateBlog";
import AdminNewsletterSubscribersPage from "../pages/admin/AdminSubscribersPage";
import AdminSubscriptionsPage from "../pages/admin/AdminSubscriptionPage";
import AdminAgentsPage from "../pages/admin/AdminAgentsPage";
import AdminKycPage from "../pages/admin/AdminKycPage";
import SupportCategoriesPage from "../pages/admin/app/SupportCategoriesPage";
import ContactInfoPage from "../pages/admin/app/ContactInfoPage";
import PolicyPagesPage from "../pages/admin/app/PolicyPage";
import SubscribersPage from "../pages/admin/app/SubscriberPage";
import AppUpdatesPage from "../pages/admin/app/AppPage";
import SupportHelpPage from "../pages/admin/app/SupportHelpPage";

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
      <Route path="/login" element={<LoginPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<RoleRoute allowedRole="admin" />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/listings" element={<AdminAllListingsPage />} />
            <Route path="/admin/listings/pending" element={<PendingListingsPage />} />
            <Route path="/admin/listings/reports" element={<AdminListingReportsPage />} />
            <Route path="/admin/landlords" element={<AdminLandlordsPage />} />
            <Route path="/admin/kyc" element={<AdminKycPage />} />
            <Route path="/admin/agents" element={<AdminAgentsPage />} />
            <Route path="/admin/payments" element={<AdminPaymentsPage />} />
            <Route path="/admin/inquiries" element={<AdminInquiriesPage />} />
            <Route path="/admin/inquiries/:id" element={<AdminInquiriesPage />} />
            <Route path="/admin/inquiry" element={<Navigate to="/admin/inquiries" replace />} />
            <Route path="/admin/messages" element={<Navigate to="/admin/inquiries" replace />} />
            <Route path="/admin/subscriptions" element={<AdminSubscriptionsPage />} />
            <Route path="/admin/support" element={<AdminSupportPage />} />
            <Route path="/admin/support/:id" element={<AdminSupportDetailPage />} />
            <Route path="/admin/contact" element={<AdminContactMessagesPage />} />
            <Route path="/admin/contact/:id" element={<AdminContactMessageDetailPage />} />
            <Route path="/admin/services/applications" element={<AdminServiceApplicationsPage />} />
            <Route path="/admin/services/applications/:id" element={<AdminServiceApplicationDetailPage />} />
            <Route path="/admin/services/partners" element={<AdminServiceApplicationsPage />} />
            <Route path="/admin/blog" element={<AdminBlogsPage />} />
            <Route path="/admin/blogs" element={<AdminBlogsPage />} />
            <Route path="/admin/blog/new" element={<AdminBlogEditorPage />} />
            <Route path="/admin/blog/create" element={<AdminBlogEditorPage />} />
            <Route path="/admin/blog/:id" element={<AdminBlogEditorPage />} />
            <Route path="/admin/subscribers" element={<AdminNewsletterSubscribersPage />} />
            <Route path="/admin/app/categories" element={<SupportCategoriesPage />} />
            <Route path="/admin/app/support-help" element={<SupportHelpPage />} />
            <Route path="/admin/contact-info" element={<ContactInfoPage />} />
            <Route path="/admin/app/updates" element={<AppUpdatesPage />} />
            <Route path="/admin/app/subscribers" element={<SubscribersPage />} />
            <Route path="/admin/app/policies" element={<PolicyPagesPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
    </Routes>
  );
};

export default AppRoutes;
