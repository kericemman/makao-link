import { useState } from "react"
import { Link } from "react-router-dom"
import { 
  FiTruck, 
  FiPackage, 
  FiHome, 
  FiArrowRight,
  FiCheckCircle,
} from "react-icons/fi"
import { FaTruck } from "react-icons/fa"
import { MdCleaningServices } from "react-icons/md"

function RelocationSection() {
  
  const services = [
    {
      title: "Moving Services",
      description: "Professional movers to help you relocate safely and efficiently.",
      icon: FaTruck,
      color: "from-[#013E43] to-[#005C57]",
      bgColor: "bg-[#fff]",
      textColor: "text-[#013E43]",
      image: "https://images.unsplash.com/photo-1600585154526-990dced4db0d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
      features: ["Professional team", "Safe handling", "Insurance covered", "Quality materials", "Fragile handling", "Inventory list", "Experienced drivers"]
    },
    {
      title: "Cleaning Services",
      description: "Move-in and move-out cleaning for your new home or previous residence.",
      icon: MdCleaningServices,
      color: "from-purple-400 to-purple-500",
      bgColor: "bg-purple-100",
      textColor: "text-[#013E43]",
      image: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
      features: ["Deep cleaning", "Eco-friendly products", "Satisfaction guaranteed"]
    }
  ]

  // Additional cleaning service features
  const cleaningFeatures = [
    "Move-in/Move-out cleaning",
    "Deep cleaning",
    "Eco-friendly products",
    "Satisfaction guaranteed",
    "Carpet cleaning",
    "Window washing",
    "Kitchen sanitation",
    "Bathroom disinfection",
    "24-hour availability"
  ]

  return (
    <section className="relative bg-gradient-to-br from-[#F0F7F4] to-white py-10 overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#02BB31] opacity-5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#013E43] opacity-5 rounded-full blur-3xl"></div>
      </div>

      <div className="relative max-w-9xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">
          
          {/* LEFT SIDE - Content */}
          <div className="space-y-6">
            {/* Section Label */}
            <div className="inline-flex items-center space-x-2 bg-[#02BB31]/10 text-[#02BB31] px-4 py-2 rounded-full">
              <FiHome className="text-sm" />
              <span className="text-sm font-medium">Other Services</span>
            </div>

            {/* Heading */}
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-[#013E43] leading-tight">
              Relocation Made
              <span className="block text-[#02BB31] mt-2">Easy & Stress-Free</span>
            </h2>

            {/* Description */}
            <p className="text-lg text-[#065A57] leading-relaxed">
              Finding a home is only the first step. MakaoLink connects you with trusted 
              relocation partners who help you move smoothly and safely into your new home.
            </p>

            {/* Features */}
            <div className="space-y-3">
              {[
                "Professional moving services",
                "Competitive pricing",
                "Fully insured partners",
                "24/7 customer support"
              ].map((feature, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <FiCheckCircle className="text-[#02BB31] text-xl flex-shrink-0" />
                  <span className="text-[#013E43]">{feature}</span>
                </div>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-wrap gap-4 pt-4">
              <Link
                to="/partners"
                className="inline-flex items-center space-x-2 px-8 py-4 bg-gradient-to-r from-[#02BB31] to-[#0D915C] text-white rounded-xl font-semibold hover:shadow-lg transition-all transform hover:scale-105"
              >
                <span>Explore More Services</span>
                <FiArrowRight className="text-lg" />
              </Link>
              
              
            </div>
          </div>

          {/* RIGHT SIDE - Services Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {services.map((service, index) => {
              const Icon = service.icon
              return (
                <div
                  key={index}
                  className="group bg-white rounded-2xl shadow-lg border border-[#A8D8C1] overflow-hidden hover:shadow-xl transition-all transform hover:-translate-y-1"
                >
                  {/* Card Image */}
                  <div className="relative h-40 overflow-hidden">
                    <img
                      src={service.image}
                      alt={service.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                    
                    {/* Icon overlay */}
                    <div className={`absolute bottom-3 left-3 w-10 h-10 ${service.bgColor} rounded-lg flex items-center justify-center backdrop-blur-sm`}>
                      <Icon className={`text-lg ${service.textColor}`} />
                    </div>
                    
                    {/* Title overlay */}
                    <h3 className="absolute bottom-3 right-3 text-white font-bold text-lg drop-shadow-lg">
                      {service.title}
                    </h3>
                  </div>

                  <div className="p-6">
                    {/* Description */}
                    <p className="text-[#065A57] text-sm mb-4">
                      {service.description}
                    </p>

                    {/* Features */}
                    <div className="space-y-2">
                      {service.features.map((feature, idx) => (
                        <div key={idx} className="flex items-center space-x-2 text-xs text-[#065A57]">
                          <FiCheckCircle className="text-[#02BB31] flex-shrink-0" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>

                    {/* Additional Cleaning Features for the second card */}
                    {index === 1 && (
                      <div className="mt-4 pt-4 border-t border-[#A8D8C1]">
                        <p className="text-xs font-semibold text-[#013E43] mb-2">Also includes:</p>
                        <div className="grid grid-cols-2 gap-1">
                          {cleaningFeatures.slice(0, 4).map((feature, idx) => (
                            <div key={idx} className="flex items-center space-x-1 text-xs text-[#065A57]">
                              <FiCheckCircle className="text-[#02BB31] text-xs flex-shrink-0" />
                              <span className="truncate">{feature}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Learn More Link */}
                    <div className="mt-4 pt-4 border-t border-[#A8D8C1]">
                      <Link to="/partners" className="text-sm text-[#02BB31] hover:text-[#0D915C] font-medium flex items-center group/link">
                        Learn More
                        <FiArrowRight className="ml-2 group-hover/link:translate-x-1 transition-transform" />
                      </Link>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}

export default RelocationSection