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


function AppRoutes() {
  return (
    <Routes>

      <Route element={<PublicLayout />}>
          <Route path="/" element={<Home /> } />
          <Route path="/properties" element={<Properties/>}/>
          <Route path="/properties/:id" element={<PropertyDetails />} />
          <Route path="/partners" element={<PartnersPage/>}/>
          <Route path="/partners/apply" element={<PartnerApply />} />

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
        <Route path="settings" element={<AdminSettings />} />



        

      </Route>

    </Routes>
  )
}

export default AppRoutes