import { lazy, Suspense } from "react";
import { Navigate, Route, Routes, useParams } from "react-router-dom";
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

const load = (children, label) => (
  <Suspense fallback={<LoadingScreen label={label} />}>{children}</Suspense>
);

export default function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={load(<Home />, "Loading home")} />
        <Route path="/listings" element={load(<Listings />, "Loading listings")} />
        <Route path="/listings/:id" element={load(<ListingDetails />, "Loading listing")} />
        <Route path="/categories/:slug" element={load(<CategoryListings />, "Loading category")} />
        <Route path="/list-your-property" element={load(<ListYourProperty />, "Loading landlord page")} />
        <Route path="/services" element={load(<ServicesPage />, "Loading services")} />
        <Route path="/services/apply" element={load(<PartnerApply />, "Loading partner application")} />
        <Route path="/services/apply/callback" element={load(<PartnerCallback />, "Loading partner application")} />
        <Route path="/services/apply/payment/callback" element={load(<PartnerPaymentCallback />, "Verifying partner payment")} />
        <Route path="/services/:category" element={load(<ServiceCategory />, "Loading service providers")} />
        <Route path="/about" element={load(<PublicInfo type="about" />, "Loading about")} />
        <Route path="/faqs" element={load(<PublicInfo type="faqs" />, "Loading FAQs")} />
        <Route path="/pricing" element={load(<PublicInfo type="pricing" />, "Loading pricing")} />
        <Route path="/blog" element={load(<Blog />, "Loading articles")} />
        <Route path="/blog/:slug" element={load(<BlogDetails />, "Loading article")} />
        <Route path="/support" element={load(<Support />, "Loading support")} />
        <Route path="/privacy-policy" element={load(<PrivacyPolicy />, "Loading privacy policy")} />
        <Route path="/terms-of-service" element={load(<TermsOfService />, "Loading terms")} />
        <Route path="/sitemap" element={load(<Sitemap />, "Loading sitemap")} />
        <Route path="/find" element={<Navigate to="/listings" replace />} />
        <Route path="/properties" element={<Navigate to="/listings" replace />} />
        <Route path="/properties/:id" element={<LegacyPropertyRedirect />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

function LegacyPropertyRedirect() {
  const { id } = useParams();
  return <Navigate to={`/listings/${id}`} replace />;
}
