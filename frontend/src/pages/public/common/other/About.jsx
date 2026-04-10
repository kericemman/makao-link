import { Link } from "react-router-dom"
import { 
  FiHome, 
  FiUsers, 
  FiStar, 
  FiTrendingUp,
  FiShield,
  FiClock,
  FiHeart,
  FiAward,
  FiMail,
  FiPhone,
  FiMapPin,
  FiArrowRight,
  FiCheckCircle, 
  FiEye
} from "react-icons/fi"
import { FaHandshake, FaBuilding, FaKey, FaWhatsapp, FaWhatsappSquare } from "react-icons/fa"
import { MdVerified, MdSecurity } from "react-icons/md"
import { useEffect } from "react"

function AboutUs() {

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);
  

  const values = [
    {
      title: "Transparency",
      description: "We believe in clear, honest communication between landlords and tenants with no hidden fees or surprises.",
      icon: FiEye
    },
    {
      title: "Trust",
      description: "Every property and landlord is verified to ensure a safe and secure renting experience.",
      icon: FiShield
    },
    {
      title: "Innovation",
      description: "We continuously improve our platform to make property management simpler and more efficient.",
      icon: FiTrendingUp
    },
    {
      title: "Community",
      description: "Building a community of trusted landlords and satisfied tenants across Kenya.",
      icon: FaHandshake
    }
  ]

  

 

  return (
    <div className="min-h-screen bg-[#F0F7F4]">
      {/* Hero Section with Background Image */}
      <div className="relative h-[400px] md:h-[350px] lg:h-[400px] overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80"
            alt="Modern city skyline"
            className="w-full h-full object-cover"
          />
          
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#013E43]/95 to-[#005C57]/90"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>
        </div>

        {/* Centered Hero Content */}
        <div className="relative h-full flex flex-col items-center justify-center text-center text-white px-4 sm:px-6 lg:px-8">
          {/* Badge */}
          <div className="inline-flex items-center space-x-2 bg-white/20 backdrop-blur-sm px-3 py-1.5 sm:px-4 sm:py-2 rounded-full mb-4 sm:mb-6">
            <FaBuilding className="text-[#02BB31] text-sm sm:text-base" />
            <span className="text-xs sm:text-sm font-medium">Kenya's Trusted Property Platform</span>
          </div>

          {/* Main Heading */}
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4 max-w-4xl px-4">
            Connecting Landlords & Tenants Across Kenya
          </h1>

          {/* Description */}
          <p className="text-base sm:text-lg md:text-xl text-[#A8D8C1] max-w-2xl mb-6 sm:mb-8 px-4">
            RendaHomes is on a mission to make property rental simple, transparent, and secure for everyone.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              to="/properties"
              className="px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-[#02BB31] to-[#0D915C] text-white rounded-xl font-light hover:shadow-lg transition-all transform hover:scale-105 flex items-center space-x-2"
            >
              <span>Find Rentals</span>
              <FiArrowRight />
            </Link>
            <Link
              to="/register"
              className="px-6 sm:px-8 py-3 sm:py-4 bg-white/10 backdrop-blur-sm text-white rounded-xl font-light hover:bg-white/20 transition-all border border-white/20 flex items-center space-x-2"
            >
              <FaKey />
              <span>List Your Property</span>
            </Link>
          </div>

          
        </div>

        
      </div>

     

      {/* Our Story Section */}
      <div className="max-w-9xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center space-x-2 bg-[#02BB31]/10 text-[#02BB31] px-4 py-2 rounded-full mb-4">
              
              <span className="text-sm font-medium">Our Story</span>
            </div>
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-[#013E43] mb-4">
              Making Property Rental
              <span className="block text-[#02BB31] mt-2">Simple & Transparent</span>
            </h2>
            <p className="text-sm md:text-lg text-[#065A57] mb-6 leading-relaxed">
              RendaHomes was born from a simple observation: finding a rental home in Kenya was 
              too complicated, and landlords struggled to connect with genuine tenants. We set 
              out to build a platform that eliminates the middleman and puts control back in 
              the hands of property owners and renters.
            </p>
            <p className="text-sm md:text-lg text-[#065A57] mb-8 leading-relaxed">
              Today, we're proud to be Kenya's fastest-growing property platform, helping thousands 
              of landlords find quality tenants and countless families find their perfect home.
            </p>
            
            
          </div>

          <div className="relative">
            <img
              src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
              alt="Modern apartment building"
              className="rounded-2xl shadow-2xl"
            />
            <div className="absolute -bottom-6 -left-6 bg-white rounded-2xl shadow-xl p-4 border border-[#A8D8C1]">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-[#02BB31]/10 rounded-lg">
                  <MdVerified className="text-2xl text-[#02BB31]" />
                </div>
                <div>
                  <p className="text-sm font-bold text-[#013E43]">Verified Platform</p>
                  <p className="text-xs text-[#065A57]">Trusted by thousands</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Our Values */}
      <div className="bg-white md:py-10 py-5">
        <div className="max-w-9xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center space-x-2 bg-[#02BB31]/10 text-[#02BB31] px-4 py-2 rounded-full mb-4">
           
              <span className="text-sm font-medium">Our Values</span>
            </div>
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-[#013E43] mb-4">
              What Drives Us Forward
            </h2>
            <p className="text-sm md:text-lg text-[#065A57] max-w-2xl mx-auto">
              These core principles guide every decision we make and shape the way we serve our community.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => {
              const Icon = value.icon
              return (
                <div
                  key={index}
                  className="bg-[#F0F7F4] rounded-2xl p-6 border border-[#A8D8C1] hover:shadow-xl transition-all group"
                >
                  <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Icon className="text-2xl text-[#02BB31]" />
                  </div>
                  <h3 className="text-xl font-bold text-[#013E43] mb-2">{value.title}</h3>
                  <p className="text-[#065A57] text-sm">{value.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      


      {/* Why Choose Us */}
      <div className="bg-gradient-to-r from-[#013E43] to-[#005C57] text-white py-5 md:py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4">Why Choose MakaoLink?</h2>
           
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="inline-flex p-4 bg-white/10 rounded-xl mb-4">
                <FiShield className="text-3xl text-[#02BB31]" />
              </div>
              <h3 className="text-xl font-bold mb-2">Verified Listings</h3>
              <p className="text-[#A8D8C1] text-sm">
                Every property is manually verified to ensure accuracy and prevent fraud.
              </p>
            </div>
            
            <div className="text-center">
              <div className="inline-flex p-4 bg-white/10 rounded-xl mb-4">
                <FaHandshake className="text-3xl text-[#02BB31]" />
              </div>
              <h3 className="text-xl font-bold mb-2">Direct Contact</h3>
              <p className="text-[#A8D8C1] text-sm">
                Connect directly with landlords. No middlemen, no commission fees.
              </p>
            </div>
            
            <div className="text-center">
              <div className="inline-flex p-4 bg-white/10 rounded-xl mb-4">
                <FiClock className="text-3xl text-[#02BB31]" />
              </div>
              <h3 className="text-xl font-bold mb-2">24/7 Support</h3>
              <p className="text-[#A8D8C1] text-sm">
                Our team is always ready to help with any questions or issues.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 md:py-10">
        <div className="bg-white rounded-3xl shadow-2xl border border-[#A8D8C1] p-8 md:p-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div>
              <h2 className="text-xl md:text-3xl text-center lg:text-4xl font-bold text-[#013E43] mb-2">
                Ready to Find Your Next Home?
              </h2>
              <p className="text-[#065A57] text-sm md:text-lg text-center mb-0">
                Join thousands of satisfied landlords and tenants on MakaoLink today.
              </p>
            </div>
            <div className="flex gap-2">
              <Link
                to="/properties"
                className="px-6 py-4 text-sm md:text-base  bg-gradient-to-r from-[#02BB31] to-[#0D915C] text-white rounded-xl font-light hover:shadow-lg transition-all transform hover:scale-105"
              >
                Find Rentals
              </Link>
              <Link
                to="/register"
                className="px-6 py-4 border-2 text-sm md:text-base border-[#A8D8C1] text-[#013E43] rounded-xl font-light hover:bg-[#F0F7F4] transition-all"
              >
                List Properties
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Info */}
      <div className="bg-white border-t border-[#A8D8C1] py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-[#F0F7F4] rounded-lg">
                <FaWhatsappSquare className="text-xl text-[#02BB31]" />
              </div>
              <div>
                <a href="https://wa.me/+254729353537">Send a Message</a>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-[#F0F7F4] rounded-lg">
                <FiMail className="text-xl text-[#02BB31]" />
              </div>
              <div>
                <p className="text-sm font-medium text-[#013E43]">Email Us</p>
                <a href="mailto:info@rendahomes.com" className="text-sm text-[#065A57] hover:text-[#02BB31]">
                  info@rendahomes.com
                </a>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-[#F0F7F4] rounded-lg">
                <FiPhone className="text-xl text-[#02BB31]" />
              </div>
              <div>
                <p className="text-sm font-medium text-[#013E43]">Call Us</p>
                <a href="tel:+254729353537" className="text-sm text-[#065A57] hover:text-[#02BB31]">
                  +254 (729) 353 537
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AboutUs