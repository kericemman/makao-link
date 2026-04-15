import { Routes, Route } from "react-router-dom";

import PublicLayout from "../layouts/PublicLayout";
import LandlordLayout from "../layouts/LandlordLayout";
// import AdminLayout from "../layouts/AdminLayout";

import ProtectedRoute from "../routes/protextedRoute";
import RoleRoute from "../routes/RoleRoute";

import HomePage from "../pages/public/common/Home";
import PlansPage from "../pages/public/common/Pricing";
import LoginPage from "../pages/public/auth/Login";

import RegisterLandlordPage from "../pages/public/auth/Register";
import DashboardHome from "../pages/landlord/Dashboard";
import Listings from "../pages/landlord/Listings";
import CreateListing from "../pages/landlord/CreateListing";
import LandlordInquiries from "../pages/landlord/Inquiries";
import LandlordSubscription from "../pages/landlord/Subscription";
import PaymentCallbackPage from "../context/PaymentCallback";
import SubscriptionGuard from "../context/SubscriptionGuard";
import PendingListingsPage from "../pages/admin/AdminPendingPage";
import AdminDashboard from "../pages/admin/AdminDashboard";
import AdminLandlordsPage from "../pages/admin/AdminLandlord";
import AdminPaymentsPage from "../pages/admin/AdminPaymentPage";
import AdminLayout from "../layouts/AdminLayout";
import AdminInquiriesPage from "../pages/admin/AdminInquiriesPage";
import LandlordSupportPage from "../pages/landlord/Support";
import LandlordSupportDetailPage from "../pages/landlord/SupportDetails";
import AdminSupportPage from "../pages/admin/AdminSupport";
import AdminSupportDetailPage from "../pages/admin/AdminSupportdetails";
import BlogPage from "../pages/public/common/Blog";
import BlogDetails from "../pages/public/common/BlogDetails";
import AdminBlogs from "../pages/admin/blog/AdminBlog";
import CreateBlog from "../pages/admin/blog/CreateBlog";
import ListingsPage from "../pages/public/common/Listing";
import ListingDetailsPage from "../pages/public/common/ListingDetails";
import AdminServiceApplicationsPage from "../pages/admin/AdminApplicationPage";
import AdminServiceApplicationDetailPage from "../pages/admin/AdminApplicationDetails";
import ServicesPage from "../pages/public/common/ServicePage";
import PartnerApplicationPage from "../pages/public/partners/PartnerApply";
import PartnerApplicationCallbackPage from "../pages/public/partners/PartnerPage";
import ServiceCategoryPage from "../pages/public/common/ServiceCategory";
import AboutUs from "../pages/public/common/other/About";
import FAQ from "../pages/public/common/other/FAQ";
import TermsOfService from "../pages/public/common/other/TOS";
import PrivacyPolicy from "../pages/public/common/other/PrivacyPolicy";
import Contact from "../pages/public/common/Contact";
import Sitemap from "../pages/public/common/other/Sitemap";
import ForgotPasswordPage from "../pages/public/common/ForgotPassword";
import ResetPasswordPage from "../pages/public/common/ResetPassword";
import AdminContactMessagesPage from "../pages/admin/AdminContact";
import AdminContactMessageDetailPage from "../pages/admin/AdminContactDetails";



const AppRoutes = () => {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/landlord/register" element={<RegisterLandlordPage />} />
        <Route path="/pricing" element={<PlansPage />} />
        <Route path="/payment/callback" element={<PaymentCallbackPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
      

        <Route path="/articles" element={<BlogPage/>}/>
        <Route path="/articles/:id" element={<BlogDetails/>}/>
        <Route path="/about" element={<AboutUs/>}/>
        <Route path="/faqs" element={<FAQ/>}/>
        <Route path="/support" element={<Contact/>}/>
        <Route path="/sitemap" element={<Sitemap/>}/>
        <Route path="/terms-of-service" element={<TermsOfService/>}/>
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/properties" element={<ListingsPage/>}/>
        <Route path="/properties/:id" element={<ListingDetailsPage/>}/>
        <Route path="/services" element={<ServicesPage />} />
        <Route path="/services/apply" element={<PartnerApplicationPage />} />
        <Route path="/services/apply/callback" element={<PartnerApplicationCallbackPage />} />
        <Route path="/services/:category" element={<ServiceCategoryPage />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<RoleRoute allowedRole="landlord" />}>
          <Route element={<LandlordLayout />}>
            <Route path="landlord/dashboard" element={<DashboardHome/>} />
            <Route path="landlord/listings" element={<Listings />} />
            <Route path="/landlord/support" element={<LandlordSupportPage />} />
            <Route path="/landlord/support/:id" element={<LandlordSupportDetailPage />} />
           
            
            <Route path="/landlord/inquiries" element={<LandlordInquiries />} />
            <Route path="/landlord/subscription" element={<LandlordSubscription/>} />

            <Route element={<SubscriptionGuard requireListingAccess={true} />}>
              <Route path="/landlord/listings/new" element={<CreateListing/>} />
            </Route>
                
          </Route>
        </Route>

        <Route element={<RoleRoute allowedRole="admin" />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/listings/pending" element={<PendingListingsPage />} />
            <Route path="/admin/landlords" element={<AdminLandlordsPage/>} />
           <Route path="/admin/payments" element={<AdminPaymentsPage />} />
           <Route path="/admin/inquiries" element={<AdminInquiriesPage />} />
           <Route path="/admin/support" element={<AdminSupportPage />} />
            <Route path="/admin/support/:id" element={<AdminSupportDetailPage />} />
            <Route path="/admin/blogs" element={<AdminBlogs/>}/>
            <Route path="/admin/blog/create" element={<CreateBlog />}/>
            <Route path="/admin/services/applications" element={<AdminServiceApplicationsPage />} />
            <Route path="/admin/services/applications/:id" element={<AdminServiceApplicationDetailPage />} />
            <Route path="/admin/contact" element={<AdminContactMessagesPage />} />
            <Route path="/admin/contact/:id" element={<AdminContactMessageDetailPage />} />
          
          </Route>
        </Route>
      </Route>
    </Routes>
  );
};

export default AppRoutes;