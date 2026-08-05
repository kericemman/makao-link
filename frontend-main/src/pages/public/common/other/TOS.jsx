import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { 
  FiFileText, 
  FiShield, 
  FiLock, 
  FiUsers,
  FiHome,
  FiCreditCard,
  FiAlertCircle,
  FiCheckCircle,
  FiArrowLeft,
  FiDownload,
  FiPrinter,
  FiBookOpen
} from "react-icons/fi"
import { FaGavel, FaHandshake, FaBuilding } from "react-icons/fa"
import { MdPrivacyTip, MdSecurity } from "react-icons/md"

function TermsOfService() {
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);
  const [activeSection, setActiveSection] = useState("introduction")
  const [accepted, setAccepted] = useState(false)

  const sections = [
    { id: "introduction", title: "Introduction", icon: FiBookOpen },
    { id: "definitions", title: "Definitions", icon: FiFileText },
    { id: "eligibility", title: "Eligibility", icon: FiUsers },
    { id: "accounts", title: "User Accounts", icon: FiLock },
    { id: "listings", title: "Property Listings", icon: FiHome },
    { id: "payments", title: "Payments & Fees", icon: FiCreditCard },
    { id: "conduct", title: "User Conduct", icon: FaGavel },
    { id: "liability", title: "Limitation of Liability", icon: FiAlertCircle },
    { id: "termination", title: "Termination", icon: FiShield },
    { id: "changes", title: "Changes to Terms", icon: FiFileText }
  ]

  const scrollToSection = (id) => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
      setActiveSection(id)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const handleDownload = () => {
    const content = document.getElementById('terms-content')?.innerText || ''
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'RendaHomes-Terms-of-Service.txt'
    a.click()
    URL.revokeObjectURL(url)
  }

  const lastUpdated = "March 15, 2026"

  return (
    <div className="min-h-screen bg-[#F0F7F4]">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-[#013E43] to-[#005C57] text-white overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://res.cloudinary.com/dhlz0p70t/image/upload/v1775824052/signing-contract_mjvlvs.jpg"
            alt="Help center background"
            className="w-full h-full object-cover opacity-20"
          />
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex align-center space-x-4 mb-6">
            <Link
              to="/"
              className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
            >
              <FiArrowLeft className="text-xl" />
            </Link>
           
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Terms of Service</h1>
              <p className="text-[#A8D8C1] mt-1">Last updated: {lastUpdated}</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 mt-6">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors flex items-center space-x-2"
            >
              <FiPrinter />
              <span>Print</span>
            </button>
            <button
              onClick={handleDownload}
              className="px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors flex items-center space-x-2"
            >
              <FiDownload />
              <span>Download</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-9xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Table of Contents - Sidebar */}
          <div className="lg:w-1/4">
            <div className="sticky top-24 bg-white rounded-2xl shadow-lg border border-[#A8D8C1] p-6">
              <h3 className="text-lg font-bold text-[#013E43] mb-4 flex items-center">
                <FiBookOpen className="mr-2 text-[#02BB31]" />
                Contents
              </h3>
              
              <nav className="space-y-2">
                {sections.map((section) => {
                  const Icon = section.icon
                  return (
                    <button
                      key={section.id}
                      onClick={() => scrollToSection(section.id)}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-all flex items-center space-x-3 ${
                        activeSection === section.id
                          ? 'bg-gradient-to-r from-[#02BB31] to-[#0D915C] text-white'
                          : 'text-[#065A57] hover:bg-[#F0F7F4] hover:text-[#013E43]'
                      }`}
                    >
                      <Icon className="text-lg flex-shrink-0" />
                      <span className="text-sm font-medium">{section.title}</span>
                    </button>
                  )
                })}
              </nav>

              {/* Acceptance Checkbox */}
              <div className="mt-6 pt-6 border-t border-[#A8D8C1]">
                <label className="flex items-start space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={accepted}
                    onChange={(e) => setAccepted(e.target.checked)}
                    className="mt-1 w-4 h-4 text-[#02BB31] border-[#A8D8C1] rounded focus:ring-[#02BB31]"
                  />
                  <span className="text-sm text-[#065A57]">
                    I have read and agree to the Terms of Service
                  </span>
                </label>
                
                {accepted && (
                  <div className="mt-4 p-3 bg-[#02BB31]/10 rounded-lg flex items-start space-x-2">
                    <FiCheckCircle className="text-[#02BB31] mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-[#065A57]">
                      Thank you for accepting our terms. You can now fully use our platform.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:w-3/4" id="terms-content">
            <div className="bg-white rounded-2xl shadow-lg border border-[#A8D8C1] p-8 space-y-8">
              
              {/* Introduction */}
              <section id="introduction" className="scroll-mt-24">
                <h2 className="text-2xl font-bold text-[#013E43] mb-4 flex items-center">
                  1. Introduction
                </h2>
                <div className="space-y-4 text-[#065A57] leading-relaxed">
                  <p>
                    Welcome to RendaHomes ("Company," "we," "our," "us"). These Terms of Service ("Terms") 
                    govern your use of our website, mobile applications, and services (collectively, the "Platform").
                  </p>
                  <p>
                    By accessing or using RendaHomes, you agree to be bound by these Terms. If you do not agree 
                    to any part of these Terms, you may not access or use our Platform.
                  </p>
                  <p>
                    RendaHomes is a property management platform that connects landlords with tenants in Kenya. 
                    We provide tools for listing properties, managing inquiries, and facilitating communication 
                    between property owners and potential renters.
                  </p>
                </div>
              </section>

              {/* Definitions */}
              <section id="definitions" className="scroll-mt-24">
                <h2 className="text-2xl font-bold text-[#013E43] mb-4 flex items-center">
                  2. Definitions
                </h2>
                <div className="space-y-4 text-[#065A57] leading-relaxed">
                  <ul className="list-disc pl-6 space-y-2">
                    <li><span className="font-semibold text-[#013E43]">"User"</span> means any person or entity that accesses or uses the Platform.</li>
                    <li><span className="font-semibold text-[#013E43]">"Landlord"</span> means a User who lists properties for rent on the Platform.</li>
                    <li><span className="font-semibold text-[#013E43]">"Tenant"</span> means a User who searches for and inquires about properties on the Platform.</li>
                    <li><span className="font-semibold text-[#013E43]">"Property Listing"</span> means any rental property information posted by a Landlord.</li>
                    <li><span className="font-semibold text-[#013E43]">"Content"</span> means all text, images, photos, videos, and other materials posted on the Platform.</li>
                    <li><span className="font-semibold text-[#013E43]">"Subscription"</span> means a paid plan that provides access to premium features.</li>
                  </ul>
                </div>
              </section>

              {/* Eligibility */}
              <section id="eligibility" className="scroll-mt-24">
                <h2 className="text-2xl font-bold text-[#013E43] mb-4 flex items-center">
                  3. Eligibility
                </h2>
                <div className="space-y-4 text-[#065A57] leading-relaxed">
                  <p>By using RendaHomes, you represent and warrant that:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>You are at least 18 years of age or the age of majority in your jurisdiction.</li>
                    <li>You have the legal capacity to enter into a binding contract.</li>
                    <li>You are not located in a country that is subject to a U.S. government embargo.</li>
                    <li>You will provide accurate and complete information when creating an account.</li>
                    <li>You will not use the Platform for any illegal or unauthorized purpose.</li>
                  </ul>
                </div>
              </section>

              {/* User Accounts */}
              <section id="accounts" className="scroll-mt-24">
                <h2 className="text-2xl font-bold text-[#013E43] mb-4 flex items-center">
                  4. User Accounts
                </h2>
                <div className="space-y-4 text-[#065A57] leading-relaxed">
                  <p>When you create an account with us, you are responsible for:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Maintaining the security of your account and password.</li>
                    <li>All activities that occur under your account.</li>
                    <li>Notifying us immediately of any unauthorized use of your account.</li>
                  </ul>
                  <p className="mt-4">
                    We reserve the right to suspend or terminate accounts that violate these Terms or 
                    are used for fraudulent activities.
                  </p>
                </div>
              </section>

              {/* Property Listings */}
              <section id="listings" className="scroll-mt-24">
                <h2 className="text-2xl font-bold text-[#013E43] mb-4 flex items-center">
                  5. Property Listings
                </h2>
                <div className="space-y-4 text-[#065A57] leading-relaxed">
                  <p>As a Landlord, you agree that:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>You have the legal right to list the property.</li>
                    <li>All information provided about the property is accurate and truthful.</li>
                    <li>Photos must be of the actual property and not misleading.</li>
                    <li>You will respond to tenant inquiries in a timely manner.</li>
                    <li>You will honor the rental terms advertised on the Platform.</li>
                  </ul>
                  <p className="mt-4">
                    We reserve the right to remove any listing that violates our policies or is reported 
                    as fraudulent. Approved listings will be reviewed within 24 hours.
                  </p>
                </div>
              </section>

              {/* Payments & Fees */}
              <section id="payments" className="scroll-mt-24">
                <h2 className="text-2xl font-bold text-[#013E43] mb-4 flex items-center">
                  6. Payments & Fees
                </h2>
                <div className="space-y-4 text-[#065A57] leading-relaxed">
                  <p>Our subscription plans and fees are as follows:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li><span className="font-semibold">Free Plan:</span> Basic listing features for up to 2 properties.</li>
                    <li><span className="font-semibold">Basic Plan:</span> KES 500/month for up to 6 properties with priority features.</li>
                    <li><span className="font-semibold">Premium Plan:</span> KES 1,500/month for up to 20 properties with featured listings.</li>
                    <li><span className="font-semibold">Pro Plan:</span> KES 2,500/month for 100+ properties with dedicated support.</li>
                  </ul>
                  <p className="mt-4">Payment terms:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>All payments are processed securely through our payment partners.</li>
                    <li>Subscriptions automatically renew unless cancelled.</li>
                    <li>14-day free trial available for paid plans.</li>
                    <li>No refunds for partial months of service.</li>
                    <li>We accept M-Pesa, credit cards, and bank transfers.</li>
                  </ul>
                </div>
              </section>

              {/* User Conduct */}
              <section id="conduct" className="scroll-mt-24">
                <h2 className="text-2xl font-bold text-[#013E43] mb-4 flex items-center">
                  7. User Conduct
                </h2>
                <div className="space-y-4 text-[#065A57] leading-relaxed">
                  <p>You agree not to:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Post false, misleading, or fraudulent information.</li>
                    <li>Harass, abuse, or harm other users.</li>
                    <li>Use the Platform for any illegal activities.</li>
                    <li>Attempt to gain unauthorized access to our systems.</li>
                    <li>Scrape or copy content without permission.</li>
                    <li>Interfere with the proper functioning of the Platform.</li>
                    <li>Impersonate any person or entity.</li>
                  </ul>
                </div>
              </section>

              {/* Limitation of Liability */}
              <section id="liability" className="scroll-mt-24">
                <h2 className="text-2xl font-bold text-[#013E43] mb-4 flex items-center">
                  8. Limitation of Liability
                </h2>
                <div className="space-y-4 text-[#065A57] leading-relaxed">
                  <p>
                    To the maximum extent permitted by law, RendaHomes shall not be liable for any 
                    indirect, incidental, special, consequential, or punitive damages, including 
                    without limitation, loss of profits, data, use, goodwill, or other intangible 
                    losses, resulting from:
                  </p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Your use or inability to use the Platform.</li>
                    <li>Any conduct or content of any third party on the Platform.</li>
                    <li>Any content obtained from the Platform.</li>
                    <li>Unauthorized access, use, or alteration of your transmissions or content.</li>
                  </ul>
                  <p className="mt-4">
                    Our total liability shall not exceed the amount you paid us during the twelve 
                    months preceding the event giving rise to liability.
                  </p>
                </div>
              </section>

              {/* Termination */}
              <section id="termination" className="scroll-mt-24">
                <h2 className="text-2xl font-bold text-[#013E43] mb-4 flex items-center">
                  9. Termination
                </h2>
                <div className="space-y-4 text-[#065A57] leading-relaxed">
                  <p>We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach these Terms.</p>
                  <p>Upon termination:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Your right to use the Platform will immediately cease.</li>
                    <li>We may delete your content and data from our servers.</li>
                    <li>You will not be entitled to any refunds for prepaid services.</li>
                  </ul>
                  <p className="mt-4">
                    You may terminate your account at any time by contacting us or using the account 
                    deletion feature in your settings.
                  </p>
                </div>
              </section>

              {/* Changes to Terms */}
              <section id="changes" className="scroll-mt-24">
                <h2 className="text-2xl font-bold text-[#013E43] mb-4 flex items-center">
                  10. Changes to Terms
                </h2>
                <div className="space-y-4 text-[#065A57] leading-relaxed">
                  <p>
                    We reserve the right to modify or replace these Terms at any time. If a revision is 
                    material, we will try to provide at least 30 days' notice prior to any new terms 
                    taking effect.
                  </p>
                  <p>
                    By continuing to access or use our Platform after those revisions become effective, 
                    you agree to be bound by the revised terms. If you do not agree to the new terms, 
                    please stop using the Platform.
                  </p>
                </div>
              </section>

              {/* Contact Information */}
              <section className="pt-6 border-t border-[#A8D8C1]">
                <h2 className="text-xl font-bold text-[#013E43] mb-4 flex items-center">
                  Contact Us
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[#065A57]">
                  <div>
                    <p className="font-semibold text-[#013E43]">Email:</p>
                    <p>legal@rendahomes.com</p>
                  </div>
                  <div>
                    <p className="font-semibold text-[#013E43]">Phone:</p>
                    <p>+254 729 353 537</p>
                  </div>
                  <div>
                    <p className="font-semibold text-[#013E43]">Address:</p>
                    <p>Nairobi, Kenya</p>
                  </div>
                  <div>
                    <p className="font-semibold text-[#013E43]">Hours:</p>
                    <p>Monday - Friday, 9am - 5pm EAT</p>
                  </div>
                </div>
              </section>

              {/* Acceptance Footer */}
              <div className="mt-8 p-4 bg-[#F0F7F4] rounded-xl border border-[#A8D8C1] flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div>
                    <p className="font-semibold text-[#013E43]">By using RendaHomes, you agree to these Terms</p>
                    <p className="text-xs text-[#065A57]">Last updated: {lastUpdated}</p>
                  </div>
                </div>
                <Link
                  to="/"
                  className="px-4 py-2 bg-[#02BB31] text-white rounded-lg hover:bg-[#0D915C] transition-colors text-sm"
                >
                  Return to Home
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TermsOfService