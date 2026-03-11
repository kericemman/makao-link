import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { 
  FiHome, 
  FiHelpCircle, 
  FiChevronDown, 
  FiChevronUp,
  FiSearch,
  FiMail,
  FiPhone,
  FiMessageSquare,
  FiShield,
  FiCreditCard,
  FiUser,
  FiKey,
  FiFileText,
  FiArrowRight
} from "react-icons/fi"
import { FaWhatsapp, FaBuilding, FaHandshake } from "react-icons/fa"

function FAQ() {
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);
  const [searchTerm, setSearchTerm] = useState("")
  const [activeCategory, setActiveCategory] = useState("all")
  const [openItems, setOpenItems] = useState({})

  const categories = [
    { id: "all", name: "All Questions", icon: FiHelpCircle },
    { id: "general", name: "General", icon: FiHome },
    { id: "landlords", name: "For Landlords", icon: FaBuilding },
    { id: "tenants", name: "For Tenants", icon: FiUser },
    { id: "payments", name: "Payments & Billing", icon: FiCreditCard },
    { id: "account", name: "Account & Security", icon: FiShield }
  ]

  const faqs = [
    // General Questions
    {
      id: 1,
      category: "general",
      question: "What is MakaoLink?",
      answer: "MakaoLink is Kenya's premier property management platform that connects landlords directly with tenants. We provide a secure, transparent platform for listing properties, managing inquiries, and facilitating direct communication between property owners and potential renters."
    },
    {
      id: 2,
      category: "general",
      question: "Is MakaoLink free to use?",
      answer: "Yes! MakaoLink offers a free plan that allows you to list up to 2 properties. For landlords with more properties, we offer affordable premium plans with additional features like priority listing, advanced analytics, and priority support."
    },
    {
      id: 3,
      category: "general",
      question: "How is MakaoLink different from other property platforms?",
      answer: "MakaoLink eliminates the middleman by connecting tenants directly with landlords. We verify all listings, provide secure communication channels, and offer transparent pricing with no hidden fees. Our platform is specifically designed for the Kenyan market with local payment options like M-Pesa."
    },

    // For Landlords
    {
      id: 4,
      category: "landlords",
      question: "How do I list my property on MakaoLink?",
      answer: "Listing your property is easy! Simply create a landlord account, click on 'Add Property' in your dashboard, and fill in the property details including title, description, price, location, and upload photos. Once submitted, our team will review and approve your listing within 24 hours."
    },
    {
      id: 5,
      category: "landlords",
      question: "How many photos can I upload for my property?",
      answer: "You can upload up to 10 high-quality photos per property listing. We recommend including photos of all rooms, exterior, and any special features to attract more tenants."
    },
    {
      id: 6,
      category: "landlords",
      question: "How do I receive inquiries from tenants?",
      answer: "When a tenant is interested in your property, they can send an inquiry through the platform. You'll receive notifications via email and SMS, and you can view and respond to all inquiries directly from your dashboard. We also provide WhatsApp integration for easy communication."
    },
    {
      id: 7,
      category: "landlords",
      question: "What happens after my property is approved?",
      answer: "Once approved, your property will be visible to thousands of potential tenants searching on MakaoLink. You'll start receiving inquiries and can manage them through your dashboard. You can also track views, update property details, or remove the listing at any time."
    },
    {
      id: 8,
      category: "landlords",
      question: "Can I list properties in multiple locations?",
      answer: "Absolutely! You can list properties anywhere in Kenya. Whether you have properties in Nairobi, Mombasa, Kisumu, or other counties, you can manage them all from a single dashboard."
    },

    // For Tenants
    {
      id: 9,
      category: "tenants",
      question: "How do I search for properties?",
      answer: "You can search for properties by location, price range, property type, and number of bedrooms. Use the search bar on the homepage or browse through our property listings. You can also save your favorite properties and get notifications when new listings match your criteria."
    },
    {
      id: 10,
      category: "tenants",
      question: "Do I need to create an account to contact landlords?",
      answer: "While you can browse properties without an account, you'll need to create a free tenant account to send inquiries and contact landlords directly. This helps us verify genuine tenants and reduce spam."
    },
    {
      id: 11,
      category: "tenants",
      question: "How do I contact a landlord?",
      answer: "Once you find a property you're interested in, click 'Send Inquiry' on the property page. Fill in your details and message, and we'll connect you directly with the landlord via WhatsApp. You can also call them directly using the phone number provided."
    },
    {
      id: 12,
      category: "tenants",
      question: "Are the properties on MakaoLink verified?",
      answer: "Yes! All properties on MakaoLink are verified by our team. We ensure that listings are genuine, photos are accurate, and landlords are legitimate before approving any property. This helps protect tenants from scams."
    },
    {
      id: 13,
      category: "tenants",
      question: "Can I save properties to view later?",
      answer: "Yes! When you create a tenant account, you can save your favorite properties to a wishlist. You can access this anytime from your dashboard and easily compare different properties."
    },

    // Payments & Billing
    {
      id: 14,
      category: "payments",
      question: "What payment methods do you accept?",
      answer: "We accept M-Pesa, credit/debit cards (Visa, Mastercard), and bank transfers. M-Pesa is our most popular payment method, offering instant confirmation and processing."
    },
    {
      id: 15,
      category: "payments",
      question: "How does the 14-day free trial work?",
      answer: "We don't have the 14-days trial, but we give you two listings for free."
    },
    {
      id: 16,
      category: "payments",
      question: "Can I upgrade or downgrade my plan?",
      answer: "Yes, you can change your plan at any time. Upgrades take effect immediately, while downgrades will be applied at the start of your next billing cycle. You'll only pay the prorated difference when upgrading."
    },
    {
      id: 17,
      category: "payments",
      question: "Is there a cancellation fee?",
      answer: "No, there are no cancellation fees. You can cancel your subscription at any time from your account settings. Your access will continue until the end of your current billing period."
    },
    {
      id: 18,
      category: "payments",
      question: "How do I get an invoice for my payments?",
      answer: "Invoices are automatically generated for all payments and can be downloaded from your dashboard under 'Billing History'. You'll also receive a copy via email for your records."
    },

    // Account & Security
    {
      id: 19,
      category: "account",
      question: "How do I reset my password?",
      answer: "Click on 'Forgot Password' on the login page and enter your email address. We'll send you a link to reset your password. The link expires in 1 hour for security reasons."
    },
    {
      id: 20,
      category: "account",
      question: "Is my personal information secure?",
      answer: "Absolutely! We use 256-bit SSL encryption to protect your data. Your personal information is never shared with third parties without your consent. We're committed to maintaining the highest security standards."
    },
    {
      id: 21,
      category: "account",
      question: "Can I delete my account?",
      answer: "Yes, you can delete your account at any time from your account settings. Please note that this action is permanent and cannot be undone. All your data will be removed from our systems within 30 days."
    },
    {
      id: 22,
      category: "account",
      question: "How do I update my contact information?",
      answer: "You can update your name, email, phone number, and other details from your profile settings in the dashboard. Changes are saved immediately."
    },
    {
      id: 23,
      category: "account",
      question: "What is KYC verification and why is it required?",
      answer: "KYC (Know Your Customer) verification helps us confirm the identity of our landlords. This involves submitting a valid ID document. This process helps build trust on our platform and protects tenants from fraudulent listings."
    }
  ]

  const toggleItem = (id) => {
    setOpenItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }))
  }

  const filteredFaqs = faqs.filter(faq => {
    const matchesSearch = faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         faq.answer.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = activeCategory === "all" || faq.category === activeCategory
    return matchesSearch && matchesCategory
  })

  const getCategoryIcon = (categoryId) => {
    const category = categories.find(c => c.id === categoryId)
    return category?.icon || FiHelpCircle
  }

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
            <FiHelpCircle className="text-[#02BB31]" />
            <span className="text-sm font-medium">Help Center</span>
          </div>
          
          <h1 className="text-2xl md:text-5xl font-bold mb-4">
            How Can We Help You?
          </h1>
          
          <p className="text-xl text-[#A8D8C1] max-w-2xl mx-auto mb-8">
            Find answers to commonly asked questions about MakaoLink
          </p>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#065A57] text-xl" />
              <input
                type="text"
                placeholder="Search for questions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-4 rounded-xl border-2 border-white/20 bg-white/10 backdrop-blur-sm text-white placeholder-[#A8D8C1] focus:outline-none focus:border-[#02BB31] transition-colors"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Category Filters */}
        <div className="flex flex-wrap gap-3 mb-8">
          {categories.map(category => {
            const Icon = category.icon
            return (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center space-x-2 ${
                  activeCategory === category.id
                    ? 'bg-gradient-to-r from-[#02BB31] to-[#0D915C] text-white shadow-lg'
                    : 'bg-white text-[#065A57] hover:bg-[#F0F7F4] border border-[#A8D8C1]'
                }`}
              >
                <Icon className="text-lg" />
                <span>{category.name}</span>
              </button>
            )
          })}
        </div>

        {/* Results Count */}
        <p className="text-sm text-[#065A57] mb-6">
          Showing {filteredFaqs.length} {filteredFaqs.length === 1 ? 'question' : 'questions'}
        </p>

        {/* FAQ Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredFaqs.map((faq) => {
            const CategoryIcon = getCategoryIcon(faq.category)
            const isOpen = openItems[faq.id]

            return (
              <div
                key={faq.id}
                className="bg-white rounded-xl shadow-lg border border-[#A8D8C1] overflow-hidden hover:shadow-xl transition-all"
              >
                <button
                  onClick={() => toggleItem(faq.id)}
                  className="w-full px-6 py-4 flex items-start justify-between text-left group"
                >
                  <div className="flex items-start space-x-3 flex-1">
                    <div className="p-2 bg-[#F0F7F4] rounded-lg group-hover:bg-[#02BB31]/10 transition-colors">
                      <CategoryIcon className="text-[#02BB31] text-lg" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-[#013E43] pr-8">
                        {faq.question}
                      </h3>
                      {isOpen && (
                        <p className="mt-3 text-[#065A57] text-sm leading-relaxed">
                          {faq.answer}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex-shrink-0 ml-4">
                    {isOpen ? (
                      <FiChevronUp className="text-[#02BB31] text-xl" />
                    ) : (
                      <FiChevronDown className="text-[#065A57] text-xl group-hover:text-[#02BB31] transition-colors" />
                    )}
                  </div>
                </button>
              </div>
            )
          })}
        </div>

        {/* No Results */}
        {filteredFaqs.length === 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center border border-[#A8D8C1]">
            <div className="w-20 h-20 bg-[#F0F7F4] rounded-full flex items-center justify-center mx-auto mb-4">
              <FiHelpCircle className="text-3xl text-[#A8D8C1]" />
            </div>
            <h3 className="text-lg font-semibold text-[#013E43] mb-2">No questions found</h3>
            <p className="text-sm text-[#065A57] mb-4">
              Try adjusting your search or filter to find what you're looking for.
            </p>
            <button
              onClick={() => {
                setSearchTerm("")
                setActiveCategory("all")
              }}
              className="px-6 py-3 bg-[#02BB31] text-white rounded-lg font-semibold hover:bg-[#0D915C] transition-colors"
            >
              Clear Filters
            </button>
          </div>
        )}

        {/* Still Have Questions */}
        <div className="mt-16 bg-gradient-to-r from-[#013E43] to-[#005C57] rounded-2xl p-8 text-white">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-[#02BB31]/20 rounded-xl">
                <FiMessageSquare className="text-3xl text-[#02BB31]" />
              </div>
              <div>
                <h3 className="text-xl font-light mb-1">Still have questions?</h3>
                <p className="text-[#A8D8C1]">
                  Can't find the answer you're looking for? Please contact our support team.
                </p>
              </div>
            </div>
            <div className="flex flex gap-3">
            
              <a
                href="tel:+254712345678"
                className="px-3 py-3 bg-[#02BB31] text-white rounded-lg font-light hover:bg-[#0D915C] transition-colors flex items-center space-x-2"
              >
                <FiPhone />
                <span>Call Now</span>
              </a>
              <a
                href="https://wa.me/254712345678"
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3 bg-[#25D366] text-white rounded-lg font-semibold hover:bg-[#128C7E] transition-colors flex items-center space-x-2"
              >
                <FaWhatsapp />
                <span>WhatsApp</span>
              </a>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link
            to="/about"
            className="bg-white p-4 rounded-xl shadow-lg border border-[#A8D8C1] text-center hover:shadow-xl transition-all group"
          >
            <FiHome className="text-2xl text-[#02BB31] mx-auto mb-2 group-hover:scale-110 transition-transform" />
            <p className="text-sm font-medium text-[#013E43]">About Us</p>
          </Link>
          
          <Link
            to="/contact"
            className="bg-white p-4 rounded-xl shadow-lg border border-[#A8D8C1] text-center hover:shadow-xl transition-all group"
          >
            <FiMail className="text-2xl text-[#02BB31] mx-auto mb-2 group-hover:scale-110 transition-transform" />
            <p className="text-sm font-medium text-[#013E43]">Contact Us</p>
          </Link>
          
          <Link
            to="/terms"
            className="bg-white p-4 rounded-xl shadow-lg border border-[#A8D8C1] text-center hover:shadow-xl transition-all group"
          >
            <FiFileText className="text-2xl text-[#02BB31] mx-auto mb-2 group-hover:scale-110 transition-transform" />
            <p className="text-sm font-medium text-[#013E43]">Terms of Service</p>
          </Link>
          
          <Link
            to="/privacy"
            className="bg-white p-4 rounded-xl shadow-lg border border-[#A8D8C1] text-center hover:shadow-xl transition-all group"
          >
            <FiShield className="text-2xl text-[#02BB31] mx-auto mb-2 group-hover:scale-110 transition-transform" />
            <p className="text-sm font-medium text-[#013E43]">Privacy Policy</p>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default FAQ