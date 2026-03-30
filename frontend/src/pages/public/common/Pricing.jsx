import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { 
  FiHome, 
  FiStar, 
  FiTrendingUp, 
  FiAward,
  FiCheckCircle,
  FiArrowRight,
  FiDollarSign,
  FiShield,
  FiUsers,
  FiClock
} from "react-icons/fi";
import { FaBuilding, FaKey, FaHandshake } from "react-icons/fa";

const plans = [
  { 
    key: "normal", 
    name: "Normal", 
    price: 0, 
    limit: 1,
    icon: FiHome,
    description: "Perfect for landlords with a single property",
    features: [
      "List up to 1 property",
      "Basic property listing",
      "Direct tenant contact",
      "Dashboard access",
      "Email support"
    ],
    popular: false,
    color: "from-gray-400 to-gray-500",
    bgColor: "bg-gray-100",
    textColor: "text-gray-600",
    borderColor: "border-gray-200"
  },
  { 
    key: "basic", 
    name: "Basic", 
    price: 500, 
    limit: 5,
    icon: FiStar,
    description: "Great for landlords with a few properties",
    features: [
      "List up to 5 properties",
      "Priority listing placement",
      "Email notifications",
      "Property analytics",
      "Inquiry management",
      "Standard support"
    ],
    popular: false,
    color: "from-[#02BB31] to-[#0D915C]",
    bgColor: "bg-[#02BB31]/10",
    textColor: "text-[#02BB31]",
    borderColor: "border-[#02BB31]/20"
  },
  { 
    key: "premium", 
    name: "Premium", 
    price: 1500, 
    limit: 15,
    icon: FiTrendingUp,
    description: "Ideal for growing property portfolios",
    features: [
      "List up to 15 properties",
      "Featured listings",
      "Priority support",
      "Advanced analytics",
      "Social media promotion",
      "SMS notifications"
    ],
    popular: true,
    color: "from-purple-400 to-purple-500",
    bgColor: "bg-purple-100",
    textColor: "text-purple-600",
    borderColor: "border-purple-200"
  },
  { 
    key: "pro", 
    name: "Pro", 
    price: 2500, 
    limit: 100,
    icon: FiAward,
    description: "For professional property managers",
    features: [
      "List up to 100+ properties",
      "Top marketplace visibility",
      "Dedicated account manager",
      "Bulk property import",
      "API access",
      "Custom branding",
      "24/7 priority support"
    ],
    popular: false,
    color: "from-[#013E43] to-[#005C57]",
    bgColor: "bg-[#013E43]/10",
    textColor: "text-[#013E43]",
    borderColor: "border-[#013E43]/20"
  }
];

const PlanCard = ({ plan, onSelect, isPopular }) => {
  const Icon = plan.icon;
  const formattedPrice = plan.price === 0 ? "Free" : `KES ${plan.price.toLocaleString()}`;
  const priceSubtext = plan.price > 0 ? "/month" : "forever";

  return (
    <div className={`relative bg-white rounded-2xl shadow-xl border-2 transition-all transform hover:-translate-y-2 hover:shadow-2xl cursor-pointer ${
      isPopular ? 'border-[#02BB31] scale-105 z-10' : 'border-[#A8D8C1]'
    }`}>
      {/* Popular Badge */}
      {isPopular && (
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
        <h3 className="text-xl font-bold text-[#013E43] mb-2">{plan.name}</h3>

        {/* Description */}
        <p className="text-sm text-[#065A57] mb-4">{plan.description}</p>

        {/* Price */}
        <div className="mb-4">
          <span className="text-3xl font-bold text-[#013E43]">{formattedPrice}</span>
          {plan.price > 0 && (
            <span className="text-sm text-[#065A57] ml-1">{priceSubtext}</span>
          )}
        </div>

        {/* Properties Limit */}
        <div className="mb-4">
          <span className="inline-flex items-center px-3 py-1 bg-[#F0F7F4] text-[#013E43] text-sm font-medium rounded-full">
            {plan.limit === 1 ? "1 property" : `Up to ${plan.limit} properties`}
          </span>
        </div>

        {/* Features List */}
        <ul className="space-y-3 mb-6">
          {plan.features.map((feature, i) => (
            <li key={i} className="text-sm text-[#065A57] flex items-start">
              <FiCheckCircle className="text-[#02BB31] mr-2 mt-0.5 flex-shrink-0" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>

        {/* Select Button */}
        <button
          onClick={onSelect}
          className={`w-full py-3 rounded-xl font-semibold transition-all flex items-center justify-center ${
            plan.price === 0
              ? 'border-2 border-[#A8D8C1] text-[#013E43] hover:bg-[#F0F7F4]'
              : 'bg-gradient-to-r from-[#02BB31] to-[#0D915C] text-white hover:shadow-lg hover:scale-105'
          }`}
        >
          {plan.price === 0 ? "Get Started" : "Select Plan"}
          <FiArrowRight className="ml-2" />
        </button>
      </div>
    </div>
  );
};

const Pricing = () => {
  const navigate = useNavigate();
  const [billingCycle, setBillingCycle] = useState("monthly"); // monthly or yearly

  const stats = [
    { icon: FiUsers, value: "850+", label: "Happy Landlords" },
    { icon: FiHome, value: "1,200+", label: "Verified Properties" },
    { icon: FiShield, value: "100%", label: "Secure Platform" },
    { icon: FiClock, value: "24/7", label: "Support" }
  ];

  const handleSelectPlan = (plan) => {
    navigate(`/landlord/register?plan=${plan}`);
  };

  const savings = {
    basic: { monthly: 500, yearly: 5000, save: "Save KES 1,000/year" },
    premium: { monthly: 1500, yearly: 15000, save: "Save KES 3,000/year" },
    pro: { monthly: 2500, yearly: 25000, save: "Save KES 5,000/year" }
  };

  return (
    <div className="min-h-screen bg-[#F0F7F4]">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-[#013E43] to-[#005C57] text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#02BB31] rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#A8D8C1] rounded-full blur-3xl"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <div className="inline-flex items-center space-x-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
            <FiDollarSign className="text-[#02BB31]" />
            <span className="text-sm font-medium">Simple & Transparent Pricing</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Choose Your Perfect Plan
          </h1>
          
          <p className="text-xl text-[#A8D8C1] max-w-2xl mx-auto">
            Start free or pick a paid plan to list more properties and grow your reach.
          </p>
        </div>
      </div>

      <div className="max-w-9xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
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

        {/* Plans Grid */}
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {plans.map((plan) => {
            const yearlyPrice = savings[plan.key]?.yearly;
            const isPopular = plan.key === "premium";
            
            return (
              <PlanCard
                key={plan.key}
                plan={{
                  ...plan,
                  price: billingCycle === "yearly" && yearlyPrice ? yearlyPrice : plan.price
                }}
                isPopular={isPopular}
                onSelect={() => handleSelectPlan(plan.key)}
              />
            );
          })}
        </div>

        {/* Savings Note */}
        {billingCycle === "yearly" && (
          <div className="mt-8 text-center">
            <p className="text-sm text-[#02BB31] bg-[#02BB31]/10 inline-block px-4 py-2 rounded-full">
              Save up to KES 5,000 per year with yearly billing
            </p>
          </div>
        )}

        {/* Stats Section */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="bg-white rounded-xl shadow-lg p-6 text-center border border-[#A8D8C1]">
                <Icon className="text-3xl text-[#02BB31] mx-auto mb-3" />
                <p className="text-2xl font-bold text-[#013E43]">{stat.value}</p>
                <p className="text-sm text-[#065A57]">{stat.label}</p>
              </div>
            );
          })}
        </div>

        {/* FAQ Section */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-[#013E43] text-center mb-8">
            Frequently Asked Questions
          </h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-lg border border-[#A8D8C1] p-6">
              <h3 className="font-semibold text-[#013E43] mb-2">Can I change plans later?</h3>
              <p className="text-sm text-[#065A57]">
                Yes, you can upgrade or downgrade your plan at any time. Changes will be reflected in your next billing cycle.
              </p>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg border border-[#A8D8C1] p-6">
              <h3 className="font-semibold text-[#013E43] mb-2">Is there a free trial?</h3>
              <p className="text-sm text-[#065A57]">
                Yes! All paid plans come with a 14-day free trial. No credit card required.
              </p>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg border border-[#A8D8C1] p-6">
              <h3 className="font-semibold text-[#013E43] mb-2">What payment methods do you accept?</h3>
              <p className="text-sm text-[#065A57]">
                We accept M-Pesa, credit/debit cards, and bank transfers for your convenience.
              </p>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg border border-[#A8D8C1] p-6">
              <h3 className="font-semibold text-[#013E43] mb-2">Can I cancel anytime?</h3>
              <p className="text-sm text-[#065A57]">
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
            <FaHandshake className="text-[#02BB31] text-xl" />
            <span className="text-sm text-[#065A57]">No Hidden Fees</span>
          </div>
          <div className="flex items-center space-x-2">
            <FiClock className="text-[#02BB31] text-xl" />
            <span className="text-sm text-[#065A57]">Cancel Anytime</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pricing;