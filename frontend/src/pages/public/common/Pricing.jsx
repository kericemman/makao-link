import { useNavigate } from "react-router-dom"
import { useState } from "react"
import { 
  FiHome, 
  FiCheckCircle, 
  FiStar, 
  FiTrendingUp,
  FiShield,
  FiUsers,
  FiMessageSquare,
  FiClock,
  FiAward,
  FiArrowRight
} from "react-icons/fi"
import { FaBuilding, FaKey, FaHandshake } from "react-icons/fa"
import toast from "react-hot-toast"

function Pricing() {
  const navigate = useNavigate()
  const [billingCycle, setBillingCycle] = useState("monthly") // monthly or yearly

  const plans = [
    {
      name: "Normal",
      price: "Free",
      yearlyPrice: "Free",
      priceSubtext: "forever",
      properties: "List up to 2 properties",
      icon: FiHome,
      color: "from-gray-400 to-gray-500",
      textColor: "text-gray-600",
      bgColor: "bg-gray-100",
      borderColor: "border-gray-200",
      features: [
        "Basic property listing",
        "Direct tenant contact",
        "Dashboard access",
        "Standard support",
        "Basic analytics"
      ],
      popular: false,
      path: "/register"
    },
    {
      name: "Basic",
      price: "KES 500",
      yearlyPrice: "KES 5,000",
      priceSubtext: "/month",
      properties: "List up to 6 properties",
      icon: FiStar,
      color: "from-[#02BB31] to-[#0D915C]",
      textColor: "text-[#02BB31]",
      bgColor: "bg-[#02BB31]/10",
      borderColor: "border-[#02BB31]/20",
      features: [
        "All Normal features",
        "Priority listing placement",
        "Email notifications",
        "Property analytics",
        "Inquiry management"
      ],
      popular: false,
      path: "/register"
    },
    {
      name: "Premium",
      price: "KES 1,500",
      yearlyPrice: "KES 15,000",
      priceSubtext: "/month",
      properties: "List up to 20 properties",
      icon: FiTrendingUp,
      color: "from-purple-400 to-purple-500",
      textColor: "text-purple-600",
      bgColor: "bg-purple-100",
      borderColor: "border-purple-200",
      features: [
        "All Basic features",
        "Featured listings",
        "Priority support",
        "Advanced analytics",
        "Social media promotion"
      ],
      popular: true,
      path: "/register"
    },
    {
      name: "MakaoPro",
      price: "KES 2,500",
      yearlyPrice: "KES 25,000",
      priceSubtext: "/month",
      properties: "List up to 100+ properties",
      icon: FiAward,
      color: "from-[#013E43] to-[#005C57]",
      textColor: "text-[#013E43]",
      bgColor: "bg-[#013E43]/10",
      borderColor: "border-[#013E43]/20",
      features: [
        "All Premium features",
        "Top marketplace visibility",
        "Dedicated account manager",
        "Bulk property import",
        "API access",
        "Custom branding"
      ],
      popular: false,
      path: "/register"
    }
  ]

  const handleSelectPlan = (planName, path) => {
    const token = localStorage.getItem("token")

    if (!token) {
      toast.success(`Choose ${planName} plan! Please register to continue.`, {
        style: { background: "#02BB31", color: "#fff" }
      })
      navigate(path)
      return
    }

    toast.success(`Selected ${planName} plan! Redirecting to dashboard...`, {
      style: { background: "#02BB31", color: "#fff" }
    })
    navigate("/dashboard")
  }

  const currentPrice = (plan) => {
    return billingCycle === "monthly" ? plan.price : plan.yearlyPrice
  }

  const savingsText = (plan) => {
    if (billingCycle === "yearly" && plan.price !== "Free") {
      const monthly = parseInt(plan.price.replace(/[^0-9]/g, ''))
      const yearly = parseInt(plan.yearlyPrice.replace(/[^0-9]/g, ''))
      const savings = (monthly * 12) - yearly
      return `Save KES ${savings.toLocaleString()}/year`
    }
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F0F7F4] to-white">
      {/* Hero Section with Background Image */}
      <div className="relative h-[300px] md:h-[350px] lg:h-[400px] overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80"
            alt="Modern apartment building"
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
            <FaKey className="text-[#02BB31] text-sm sm:text-base" />
            <span className="text-xs sm:text-sm font-medium">Simple & Transparent Pricing</span>
          </div>

          {/* Main Heading */}
          

          {/* Description */}
          <p className="text-base sm:text-lg md:text-xl text-[#A8D8C1] max-w-2xl mb-6 sm:mb-8 px-4">
            Select the plan that fits your property management needs. List up-to 2 properties for free
          </p>

          {/* Stats Row */}
          <div className="hidden sm:flex items-center space-x-6 mt-6 sm:mt-8 text-sm text-[#A8D8C1]">
            <span className="flex items-center">
              <FiUsers className="mr-2" />
              Join Landlords
            </span>
            <span className="flex items-center">
              <FiHome className="mr-2" />
              Easy Listing
            </span>
            <span className="flex items-center">
              <FiClock className="mr-2" />
              24/7 Support
            </span>
          </div>
        </div>

    
      </div>

      <div className="max-w-10xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Billing Toggle */}
        <div className="flex justify-center mb-12">
          <div className="bg-white p-1 rounded-xl shadow-lg border border-[#A8D8C1] inline-flex">
            <button
              onClick={() => setBillingCycle("monthly")}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
                billingCycle === "monthly"
                  ? 'bg-gradient-to-r from-[#02BB31] to-[#0D915C] text-white'
                  : 'text-[#065A57] hover:text-[#013E43]'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle("yearly")}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
                billingCycle === "yearly"
                  ? 'bg-gradient-to-r from-[#02BB31] to-[#0D915C] text-white'
                  : 'text-[#065A57] hover:text-[#013E43]'
              }`}
            >
              Yearly
              <span className="ml-2 text-xs bg-[#02BB31]/20 text-[#02BB31] px-2 py-0.5 rounded-full">
                Save 20%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards - Clickable */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan, index) => {
            const Icon = plan.icon
            const savings = savingsText(plan)

            return (
              <div
                key={index}
                onClick={() => handleSelectPlan(plan.name, plan.path)}
                className={`relative bg-white rounded-2xl shadow-xl border-2 transition-all transform hover:-translate-y-2 hover:shadow-2xl cursor-pointer ${
                  plan.popular ? 'border-[#02BB31] scale-105 z-10' : 'border-[#A8D8C1]'
                }`}
              >
                {/* Popular Badge */}
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-gradient-to-r from-[#02BB31] to-[#0D915C] text-white px-4 py-1 rounded-full text-sm font-medium flex items-center">
                      <FiStar className="mr-1" />
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="p-6">
                  {/* Icon */}
                  <div className={`w-14 h-14 ${plan.bgColor} rounded-xl flex items-center justify-center mb-4`}>
                    <Icon className={`text-2xl ${plan.textColor}`} />
                  </div>

                  {/* Plan Name */}
                  <h3 className="text-xl font-bold text-[#013E43] mb-2">
                    {plan.name}
                  </h3>

                  {/* Price */}
                  <div className="mb-2">
                    <span className="text-3xl font-bold text-[#013E43]">
                      {currentPrice(plan)}
                    </span>
                    {plan.priceSubtext && plan.price !== "Free" && (
                      <span className="text-sm text-[#065A57] ml-1">
                        {plan.priceSubtext}
                      </span>
                    )}
                  </div>

                  {/* Properties Count */}
                  <p className="text-sm text-[#02BB31] font-medium mb-4">
                    {plan.properties}
                  </p>

                  {/* Savings Badge */}
                  {savings && (
                    <div className="mb-4">
                      <span className="bg-[#02BB31]/10 text-[#02BB31] text-xs px-2 py-1 rounded-full">
                        {savings}
                      </span>
                    </div>
                  )}

                  {/* Features List */}
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, i) => (
                      <li
                        key={i}
                        className="text-sm text-[#065A57] flex items-start"
                      >
                        <FiCheckCircle className="text-[#02BB31] mr-2 mt-0.5 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Click Indicator */}
                  <div className="text-center text-[#02BB31] text-sm font-medium flex items-center justify-center group">
                    <span>Select Plan</span>
                    <FiArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Features Comparison */}
        <div className="mt-16 bg-white rounded-2xl shadow-xl border border-[#A8D8C1] p-8">
          <h2 className="text-2xl font-bold text-[#013E43] mb-8 text-center">
            Compare All Features
          </h2>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#A8D8C1]">
                  <th className="py-4 text-left text-[#013E43] font-semibold">Feature</th>
                  {plans.map((plan, index) => (
                    <th key={index} className="py-4 text-center">
                      <span className={`px-3 py-1 ${plan.bgColor} ${plan.textColor} rounded-full text-sm font-medium`}>
                        {plan.name}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-[#A8D8C1]">
                  <td className="py-4 text-[#065A57]">Property Listings</td>
                  {plans.map((plan, index) => (
                    <td key={index} className="py-4 text-center font-medium text-[#013E43]">
                      {plan.properties.split(' ')[3]}
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-[#A8D8C1]">
                  <td className="py-4 text-[#065A57]">Direct Tenant Contact</td>
                  {plans.map((_, index) => (
                    <td key={index} className="py-4 text-center">
                      <FiCheckCircle className="mx-auto text-[#02BB31]" />
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-[#A8D8C1]">
                  <td className="py-4 text-[#065A57]">Dashboard Access</td>
                  {plans.map((_, index) => (
                    <td key={index} className="py-4 text-center">
                      <FiCheckCircle className="mx-auto text-[#02BB31]" />
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-[#A8D8C1]">
                  <td className="py-4 text-[#065A57]">Priority Listing Placement</td>
                  {plans.map((plan, index) => (
                    <td key={index} className="py-4 text-center">
                      {index >= 1 ? (
                        <FiCheckCircle className="mx-auto text-[#02BB31]" />
                      ) : (
                        <span className="text-[#A8D8C1]">—</span>
                      )}
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-[#A8D8C1]">
                  <td className="py-4 text-[#065A57]">Featured Listings</td>
                  {plans.map((plan, index) => (
                    <td key={index} className="py-4 text-center">
                      {index >= 2 ? (
                        <FiCheckCircle className="mx-auto text-[#02BB31]" />
                      ) : (
                        <span className="text-[#A8D8C1]">—</span>
                      )}
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-[#A8D8C1]">
                  <td className="py-4 text-[#065A57]">Priority Support</td>
                  {plans.map((plan, index) => (
                    <td key={index} className="py-4 text-center">
                      {index >= 2 ? (
                        <FiCheckCircle className="mx-auto text-[#02BB31]" />
                      ) : (
                        <span className="text-[#A8D8C1]">—</span>
                      )}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-4 text-[#065A57]">Dedicated Account Manager</td>
                  {plans.map((plan, index) => (
                    <td key={index} className="py-4 text-center">
                      {index === 3 ? (
                        <FiCheckCircle className="mx-auto text-[#02BB31]" />
                      ) : (
                        <span className="text-[#A8D8C1]">—</span>
                      )}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-[#013E43] mb-8 text-center">
            Frequently Asked Questions
          </h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-lg border border-[#A8D8C1] p-6">
              <h3 className="font-semibold text-[#013E43] mb-2">Can I change plans later?</h3>
              <p className="text-[#065A57] text-sm">
                Yes, you can upgrade or downgrade your plan at any time. Changes will be reflected in your next billing cycle.
              </p>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg border border-[#A8D8C1] p-6">
              <h3 className="font-semibold text-[#013E43] mb-2">Is there a free trial?</h3>
              <p className="text-[#065A57] text-sm">
                Yes! All paid plans come with a 14-day free trial. No credit card required.
              </p>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg border border-[#A8D8C1] p-6">
              <h3 className="font-semibold text-[#013E43] mb-2">What payment methods do you accept?</h3>
              <p className="text-[#065A57] text-sm">
                We accept M-Pesa, credit/debit cards, and bank transfers for your convenience.
              </p>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg border border-[#A8D8C1] p-6">
              <h3 className="font-semibold text-[#013E43] mb-2">Can I cancel anytime?</h3>
              <p className="text-[#065A57] text-sm">
                Absolutely! You can cancel your subscription at any time with no hidden fees.
              </p>
            </div>
          </div>
        </div>

        {/* Trust Badges */}
        <div className="mt-16 flex flex-wrap items-center justify-center gap-8">
          <div className="flex items-center space-x-2">
            <FiShield className="text-[#02BB31] text-xl" />
            <span className="text-sm text-[#065A57]">Secure Payments</span>
          </div>
          <div className="flex items-center space-x-2">
            <FiUsers className="text-[#02BB31] text-xl" />
            <span className="text-sm text-[#065A57]">850+ Happy Landlords</span>
          </div>
          <div className="flex items-center space-x-2">
            <FiClock className="text-[#02BB31] text-xl" />
            <span className="text-sm text-[#065A57]">24/7 Support</span>
          </div>
          <div className="flex items-center space-x-2">
            <FaHandshake className="text-[#02BB31] text-xl" />
            <span className="text-sm text-[#065A57]">No Hidden Fees</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Pricing