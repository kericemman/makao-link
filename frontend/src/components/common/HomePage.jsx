import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  getPublicListings,
  getRecentListings
} from "../../services/listings.service";
import HomeListingSection from "../../components/home/HomeListingSection";
import { FiSearch, FiHome, FiMapPin, FiDollarSign, FiTrendingUp, FiShield, FiUsers, FiClock, FiArrowRight, FiCheckCircle, FiStar } from "react-icons/fi";
import { FaBuilding, FaHandshake, FaKey } from "react-icons/fa";

const HomePage = () => {
  const [recentListings, setRecentListings] = useState([]);
  const [studentListings, setStudentListings] = useState([]);
  const [officeListings, setOfficeListings] = useState([]);
  const [familyListings, setFamilyListings] = useState([]);
  const [luxuryListings, setLuxuryListings] = useState([]);
  const [latestListings, setLatestListings] = useState([]);
  const [stats, setStats] = useState({
    properties: 0,
    landlords: 0,
    tenants: 0
  });

  const fetchHomeListings = async () => {
    try {
      const recentIds = JSON.parse(localStorage.getItem("recentListings")) || [];

      const [
        recentRes,
        studentRes,
        officeRes,
        familyRes,
        luxuryRes,
        latestRes
      ] = await Promise.all([
        recentIds.length ? getRecentListings(recentIds) : Promise.resolve({ listings: [] }),
        getPublicListings({ category: "student", limit: 4 }),
        getPublicListings({ category: "office", limit: 4 }),
        getPublicListings({ category: "family", limit: 4 }),
        getPublicListings({ category: "luxury", limit: 4 }),
        getPublicListings({ limit: 8, sort: "latest" })
      ]);

      setRecentListings(recentRes.listings || []);
      setStudentListings(studentRes.listings || []);
      setOfficeListings(officeRes.listings || []);
      setFamilyListings(familyRes.listings || []);
      setLuxuryListings(luxuryRes.listings || []);
      setLatestListings(latestRes.listings || []);
      
      // Set stats from the listings count
      setStats({
        properties: latestRes.total || 1250,
        landlords: 850,
        tenants: 5000
      });
    } catch (error) {
      console.error("Failed to load homepage listings:", error);
    }
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchHomeListings();
  }, []);

  

  

  return (
    <div className="bg-[#F0F7F4]">
      {/* Hero Section */}
    

      {/* Homepage Listings */}
      <main className="mx-auto max-w-9xl px-4 py-5">
        <HomeListingSection
          title="Recently Viewed"
          subtitle="Pick up from where you left off."
          listings={recentListings}
          viewAllLink="/properties"
        />

        <HomeListingSection
          title="Student Rentals"
          listings={studentListings}
          viewAllLink="/properties?category=student"
        />

        <HomeListingSection
          title="Office Spaces"
          
          listings={officeListings}
          viewAllLink="/properties?category=office"
        />

        <HomeListingSection
          title="Family Houses for Sale"
          
          listings={familyListings}
          viewAllLink="/properties?category=family"
        />

        <HomeListingSection
          title="Luxury Apartments"
          
          listings={luxuryListings}
          viewAllLink="/properties?category=luxury"
        />

       

       

      

        {/* Landlord CTA */}
        <section className="my-12 rounded-3xl bg-gradient-to-r from-[#013E43] to-[#005C57] p-8 text-white shadow-xl">
          <div className="text-center">
            <h2 className="text-xl md:text-xl font-bold">Have a property to list?</h2>
            <p className="mt-2 max-w-2xl text-xs md:text-lg mx-auto text-[#A8D8C1]">
              Put your property in front of people actively looking for homes, offices, and spaces.
            </p>

            <Link
              to="/pricing"
              className="inline-flex items-center gap-2 mt-6 rounded-xl bg-gradient-to-r from-[#02BB31] to-[#0D915C] px-6 py-3 font-light text-sm md:text-lg text-white hover:shadow-lg transition-all transform hover:scale-105"
            >
              <FaKey />
              List Your Property
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
};

export default HomePage;