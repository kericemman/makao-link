import { Routes, Route } from "react-router-dom"



import Home from "../pages/public/common/Home"
import Login from "../pages/public/auth/Login"
import Register from "../pages/public/auth/Register"
import ForgotPassword from "../pages/public/auth/ForgetPassword"
import ResetPassword from "../pages/public/auth/ResetPassword"
import LandlordLayout from "../layouts/LandlordLayout"
import DashboardHome from "../pages/landlord/Dashboard"
import ProtectedRoute from "./protextedRoute"
import AddProperty from "../pages/landlord/AddProperty"
import MyProperties from "../pages/landlord/MyProperty"
import AdminLayout from "../layouts/AdminLayout"
import AdminDashboard from "../pages/admin/AdminDashboard"
import AdminRoute from "./AdminRoute"
import AdminProperties from "../pages/admin/AdminProperties"
import AdminUsers from "../pages/admin/AdminUsers"
import AdminKYC from "../pages/admin/AdminKYC"
import PublicLayout from "../layouts/PublicLayout"
import Properties from "../pages/public/common/Properties"
import PropertyDetails from "../pages/public/common/PropertyDetails"
import AdminPartners from "../pages/admin/AdminPartners"
import PartnersPage from "../pages/public/partners/PartnerPage"
import PartnerApply from "../pages/public/partners/PartnerApply"
import AdminSettings from "../pages/admin/AdminSetting"
import AdminBlogs from "../pages/admin/blog/AdminBlog"
import CreateBlog from "../pages/admin/blog/CreateBlog"
import BlogPage from "../pages/public/common/Blog"
import BlogDetails from "../pages/public/common/BlogDetails"
import Pricing from "../pages/public/common/Pricing"
import FAQ from "../pages/public/common/other/FAQ"
import TermsOfService from "../pages/public/common/other/TOS"
import PrivacyPolicy from "../pages/public/common/other/PrivacyPolicy"
import AboutUs from "../pages/public/common/other/About"
import Contact from "../pages/public/common/Contact"
import AdminContacts from "../pages/admin/AdminContact"
import MyTickets from "../pages/landlord/Support"
import CreateTicket from "../pages/landlord/CreateSupport"
import TicketDetails from "../pages/landlord/SupportDetails"
import AdminTickets from "../pages/admin/AdminSupport"


function AppRoutes() {
  return (
    <Routes>

      <Route element={<PublicLayout />}>
          <Route path="/" element={<Home /> } />
          <Route path="/properties" element={<Properties/>}/>
          <Route path="/properties/:id" element={<PropertyDetails />} />
          <Route path="/partners" element={<PartnersPage/>}/>
          <Route path="/partners/apply" element={<PartnerApply />} />
          <Route path="/articles" element={<BlogPage />} />
          <Route path="/blogs/:slug" element={<BlogDetails />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/faqs" element={<FAQ/>}/>
          <Route path="/terms-of-service" element={<TermsOfService/>}/>
          <Route path="/privacy" element={<PrivacyPolicy/>}/>
          <Route path="/about" element={<AboutUs/>}/>
          <Route path="/support" element={<Contact/>}/>
          
      </Route>


      <Route path="/login" element={<Login/>} />
      <Route path="/register" element={<Register/>}/>
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password/:token" element={<ResetPassword />} />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <LandlordLayout />
          </ProtectedRoute>
        }
      >

        <Route index element={<DashboardHome />} />
        <Route path="add-property" element={<AddProperty/>}/>
        <Route path="properties" element={<MyProperties/>}/>
        <Route path="support" element={<MyTickets/>}/>
        <Route path="support/new" element={<CreateTicket />} />
        <Route path="support/:id" element={<TicketDetails />} />
        

        

      </Route>
 

      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminLayout />
          </AdminRoute>
        }
      >

        <Route index element={<AdminDashboard />} />
        <Route path="properties" element={<AdminProperties />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="kyc" element={<AdminKYC />} />
        <Route path="partners" element={<AdminPartners />} />
        <Route path="blogs" element={<AdminBlogs />} />
        <Route path="blog/create" element={<CreateBlog />} />
        <Route path="blog/edit/:id" element={<CreateBlog/>}/>
        <Route path="settings" element={<AdminSettings />} />
        <Route path="contacts" element={<AdminContacts />} />
        <Route path="tickets" element={<AdminTickets/>}/> 



        

      </Route>

    </Routes>
  )
}

export default AppRoutes