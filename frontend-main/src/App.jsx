import { lazy, Suspense, useDeferredValue } from "react";
import { Navigate, Route, Routes, useLocation, useParams } from "react-router-dom";
import PublicLayout from "./layouts/PublicLayout";
import LoadingScreen from "./components/common/LoadingScreen";

const Home = lazy(() => import("./pages/Home"));
const Listings = lazy(() => import("./pages/Listings"));
const ListingDetails = lazy(() => import("./pages/ListingDetails"));
const CategoryListings = lazy(() => import("./pages/CategoryListings"));
const ListYourProperty = lazy(() => import("./pages/ListYourProperty"));
const ServiceCategory = lazy(() => import("./pages/public/common/ServiceCategory"));
const ServicesPage = lazy(() => import("./pages/public/common/ServicePage"));
const PublicInfo = lazy(() => import("./pages/PublicInfo"));
const Blog = lazy(() => import("./pages/public/common/Blog"));
const BlogDetails = lazy(() => import("./pages/public/common/BlogDetails"));
const PrivacyPolicy = lazy(() => import("./pages/public/common/other/PrivacyPolicy"));
const TermsOfService = lazy(() => import("./pages/public/common/other/TOS"));
const Support = lazy(() => import("./pages/public/common/Contact"));
const Sitemap = lazy(() => import("./pages/public/common/other/Sitemap"));
const PartnerApply = lazy(() => import("./pages/public/partners/PartnerApply"));
const PartnerCallback = lazy(() => import("./pages/public/partners/PartnerPage"));
const PartnerPaymentCallback = lazy(() => import("./pages/public/partners/PartnerPaymentCallback"));

export default function App() {
  const location = useLocation();
  const deferredLocation = useDeferredValue(location);
  const isChangingPage = location !== deferredLocation;

  return (
    <>
      <Suspense fallback={<LoadingScreen />}>
        <Routes location={deferredLocation}>
          <Route element={<PublicLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/listings" element={<Listings />} />
            <Route path="/listings/:id" element={<ListingDetails />} />
            <Route path="/categories/:slug" element={<CategoryListings />} />
            <Route path="/list-your-property" element={<ListYourProperty />} />
            <Route path="/services" element={<ServicesPage />} />
            <Route path="/services/apply" element={<PartnerApply />} />
            <Route path="/services/apply/callback" element={<PartnerCallback />} />
            <Route path="/services/apply/payment/callback" element={<PartnerPaymentCallback />} />
            <Route path="/services/:category" element={<ServiceCategory />} />
            <Route path="/about" element={<PublicInfo type="about" />} />
            <Route path="/faqs" element={<PublicInfo type="faqs" />} />
            <Route path="/pricing" element={<PublicInfo type="pricing" />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/:slug" element={<BlogDetails />} />
            <Route path="/support" element={<Support />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/terms-of-service" element={<TermsOfService />} />
            <Route path="/sitemap" element={<Sitemap />} />
            <Route path="/find" element={<Navigate to="/listings" replace />} />
            <Route path="/properties" element={<Navigate to="/listings" replace />} />
            <Route path="/properties/:id" element={<LegacyPropertyRedirect />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </Suspense>
      {isChangingPage && <LoadingScreen />}
    </>
  );
}

function LegacyPropertyRedirect() {
  const { id } = useParams();
  return <Navigate to={`/listings/${id}`} replace />;
}
