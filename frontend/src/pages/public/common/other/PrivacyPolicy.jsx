import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { 
  FiShield, 
  FiLock, 
  FiEye, 
  FiUsers,
  FiMail,
  FiPhone,
  FiDatabase,
  FiAlertCircle,
  FiCheckCircle,
  FiArrowLeft,
  FiDownload,
  FiPrinter,
  FiBookOpen,
  FiGlobe,
  FiSmartphone,
  FiShare2,
  FiTrash2,
  FiFileText
} from "react-icons/fi"
import { 
  FaWhatsapp, 
  FaFacebook, 
  FaTwitter, 
  FaGoogle, 
  FaCookie
} from "react-icons/fa"
import { MdPrivacyTip, MdSecurity, MdDataUsage } from "react-icons/md"

function PrivacyPolicy() {
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);
  const [activeSection, setActiveSection] = useState("introduction")
  const [accepted, setAccepted] = useState(false)

  const sections = [
    { id: "introduction", title: "Introduction", icon: FiBookOpen },
    { id: "information", title: "Information We Collect", icon: FiDatabase },
    { id: "usage", title: "How We Use Your Information", icon: MdDataUsage },
    { id: "sharing", title: "Information Sharing", icon: FiShare2 },
    { id: "cookies", title: "Cookies & Tracking", icon: FaCookie},
    { id: "security", title: "Data Security", icon: FiShield },
    { id: "rights", title: "Your Rights", icon: FiEye },
    { id: "retention", title: "Data Retention", icon: FiDatabase },
    { id: "children", title: "Children's Privacy", icon: FiUsers },
    { id: "changes", title: "Changes to Policy", icon: FiFileText }
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
    const content = document.getElementById('privacy-content')?.innerText || ''
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'MakaoLink-Privacy-Policy.txt'
    a.click()
    URL.revokeObjectURL(url)
  }

  const lastUpdated = "March 15, 2024"
  const effectiveDate = "March 22, 2024"

  return (
    <div className="min-h-screen bg-[#F0F7F4]">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-[#013E43] to-[#005C57] text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#02BB31] rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#A8D8C1] rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex items-center space-x-4 mb-6">
            <Link
              to="/"
              className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
            >
              <FiArrowLeft className="text-xl" />
            </Link>
            
            <div>
              <h1 className="text-3xl md:text-4xl font-bold">Privacy Policy</h1>
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
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

              {/* Quick Contact */}
              <div className="mt-6 pt-6 border-t border-[#A8D8C1]">
                <h4 className="text-sm font-semibold text-[#013E43] mb-3">Privacy Questions?</h4>
                <div className="space-y-2">
                  <a
                    href="mailto:privacy@makaolink.com"
                    className="flex items-center space-x-2 text-sm text-[#065A57] hover:text-[#02BB31] transition-colors"
                  >
                    <FiMail className="text-[#02BB31]" />
                    <span>privacy@makaolink.com</span>
                  </a>
                  <a
                    href="tel:+254712345678"
                    className="flex items-center space-x-2 text-sm text-[#065A57] hover:text-[#02BB31] transition-colors"
                  >
                    <FiPhone className="text-[#02BB31]" />
                    <span>+254 712 345 678</span>
                  </a>
                </div>
              </div>

              {/* Data Protection Badge */}
              <div className="mt-4 p-3 bg-[#F0F7F4] rounded-lg">
                <div className="flex items-center space-x-2">
                  <FiShield className="text-[#02BB31]" />
                  <span className="text-xs font-medium text-[#013E43]">GDPR Compliant</span>
                </div>
                <div className="flex items-center space-x-2 mt-1">
                  <FiLock className="text-[#02BB31]" />
                  <span className="text-xs font-medium text-[#013E43]">256-bit SSL Encrypted</span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:w-3/4" id="privacy-content">
            <div className="bg-white rounded-2xl shadow-lg border border-[#A8D8C1] p-8 space-y-8">
              
              {/* Effective Date Notice */}
              <div className="bg-[#F0F7F4] p-4 rounded-xl border border-[#A8D8C1] flex items-start space-x-3">
                <FiAlertCircle className="text-[#02BB31] text-xl mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-[#013E43] font-medium">Effective Date: {effectiveDate}</p>
                  <p className="text-xs text-[#065A57] mt-1">
                    This Privacy Policy describes how MakaoLink collects, uses, and protects your personal information.
                  </p>
                </div>
              </div>
              
              {/* Introduction */}
              <section id="introduction" className="scroll-mt-24">
                <h2 className="text-2xl font-bold text-[#013E43] mb-4 flex items-center">
                 
                  1. Introduction
                </h2>
                <div className="space-y-4 text-[#065A57] leading-relaxed">
                  <p>
                    At MakaoLink ("we," "our," "us"), we take your privacy seriously. This Privacy Policy 
                    explains how we collect, use, disclose, and safeguard your information when you visit 
                    our website, use our mobile applications, or engage with our services.
                  </p>
                  <p>
                    Please read this Privacy Policy carefully. By accessing or using our Platform, you 
                    acknowledge that you have read, understood, and agree to be bound by all terms of this 
                    Privacy Policy.
                  </p>
                  <p>
                    We are committed to protecting your personal information and being transparent about 
                    how we use it. If you have any questions or concerns, please contact us at 
                    privacy@makaolink.com.
                  </p>
                </div>
              </section>

              {/* Information We Collect */}
              <section id="information" className="scroll-mt-24">
                <h2 className="text-2xl font-bold text-[#013E43] mb-4 flex items-center">
                 
                  2. Information We Collect
                </h2>
                <div className="space-y-4 text-[#065A57] leading-relaxed">
                  <p className="font-semibold text-[#013E43]">Personal Information:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li><span className="font-medium">Contact Information:</span> Name, email address, phone number, physical address.</li>
                    <li><span className="font-medium">Account Information:</span> Username, password, profile picture, account preferences.</li>
                    <li><span className="font-medium">Identity Information:</span> Government-issued ID, passport number, KYC documents (for landlords).</li>
                    <li><span className="font-medium">Payment Information:</span> M-Pesa transaction details, credit card information (processed securely by third parties).</li>
                    <li><span className="font-medium">Property Information:</span> Property details, photos, location, pricing, amenities.</li>
                  </ul>

                  <p className="font-semibold text-[#013E43] mt-4">Automatically Collected Information:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li><span className="font-medium">Device Information:</span> IP address, browser type, operating system, device identifiers.</li>
                    <li><span className="font-medium">Usage Data:</span> Pages visited, time spent, clicks, search queries, property views.</li>
                    <li><span className="font-medium">Location Data:</span> General location based on IP address, precise location (with permission).</li>
                    <li><span className="font-medium">Cookies:</span> See our Cookies section for more details.</li>
                  </ul>
                </div>
              </section>

              {/* How We Use Your Information */}
              <section id="usage" className="scroll-mt-24">
                <h2 className="text-2xl font-bold text-[#013E43] mb-4 flex items-center">
               
                  3. How We Use Your Information
                </h2>
                <div className="space-y-4 text-[#065A57] leading-relaxed">
                  <p>We use your information for the following purposes:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li><span className="font-medium">Provide Services:</span> To operate and maintain your account, process property listings, and facilitate tenant-landlord communication.</li>
                    <li><span className="font-medium">Improve Platform:</span> To analyze usage patterns and enhance user experience.</li>
                    <li><span className="font-medium">Communications:</span> To send service updates, respond to inquiries, and provide customer support.</li>
                    <li><span className="font-medium">Marketing:</span> To send promotional materials (with your consent, which you can withdraw anytime).</li>
                    <li><span className="font-medium">Security:</span> To detect and prevent fraud, unauthorized access, and other illegal activities.</li>
                    <li><span className="font-medium">Legal Compliance:</span> To comply with applicable laws and regulations.</li>
                  </ul>
                </div>
              </section>

              {/* Information Sharing */}
              <section id="sharing" className="scroll-mt-24">
                <h2 className="text-2xl font-bold text-[#013E43] mb-4 flex items-center">
                  
                  4. Information Sharing
                </h2>
                <div className="space-y-4 text-[#065A57] leading-relaxed">
                  <p>We may share your information in the following circumstances:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li><span className="font-medium">With Other Users:</span> Landlord information is shared with potential tenants during inquiries.</li>
                    <li><span className="font-medium">Service Providers:</span> Third-party vendors who help us operate our platform (payment processors, hosting services).</li>
                    <li><span className="font-medium">Legal Requirements:</span> When required by law, court order, or government regulation.</li>
                    <li><span className="font-medium">Business Transfers:</span> In connection with a merger, acquisition, or sale of assets.</li>
                  </ul>
                  <p className="mt-4 font-medium">We do NOT sell your personal information to third parties.</p>
                </div>
              </section>

              {/* Cookies & Tracking */}
              <section id="cookies" className="scroll-mt-24">
                <h2 className="text-2xl font-bold text-[#013E43] mb-4 flex items-center">
                 
                  5. Cookies & Tracking Technologies
                </h2>
                <div className="space-y-4 text-[#065A57] leading-relaxed">
                  <p>We use cookies and similar tracking technologies to:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Remember your preferences and settings.</li>
                    <li>Understand how you use our platform.</li>
                    <li>Improve your user experience.</li>
                    <li>Provide personalized content.</li>
                  </ul>
                  <p className="mt-4">You can control cookies through your browser settings. However, disabling cookies may affect your ability to use certain features of our platform.</p>
                  
                  <div className="mt-4 p-4 bg-[#F0F7F4] rounded-lg">
                    <p className="font-medium text-[#013E43] mb-2">Types of Cookies We Use:</p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center space-x-2">
                        <FiCheckCircle className="text-[#02BB31]" />
                        <span>Essential Cookies</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <FiCheckCircle className="text-[#02BB31]" />
                        <span>Functional Cookies</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <FiCheckCircle className="text-[#02BB31]" />
                        <span>Analytics Cookies</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <FiCheckCircle className="text-[#02BB31]" />
                        <span>Marketing Cookies</span>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Data Security */}
              <section id="security" className="scroll-mt-24">
                <h2 className="text-2xl font-bold text-[#013E43] mb-4 flex items-center">
              
                  6. Data Security
                </h2>
                <div className="space-y-4 text-[#065A57] leading-relaxed">
                  <p>We implement industry-standard security measures to protect your information:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>256-bit SSL encryption for all data transmission.</li>
                    <li>Secure servers with firewall protection.</li>
                    <li>Regular security audits and penetration testing.</li>
                    <li>Access controls and authentication requirements.</li>
                    <li>Employee training on data protection.</li>
                  </ul>
                  <p className="mt-4">
                    While we strive to protect your information, no method of transmission over the Internet 
                    or electronic storage is 100% secure. We cannot guarantee absolute security.
                  </p>
                </div>
              </section>

              {/* Your Rights */}
              <section id="rights" className="scroll-mt-24">
                <h2 className="text-2xl font-bold text-[#013E43] mb-4 flex items-center">
                 
                  7. Your Rights
                </h2>
                <div className="space-y-4 text-[#065A57] leading-relaxed">
                  <p>Depending on your location, you may have the following rights:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li><span className="font-medium">Access:</span> Request a copy of your personal information.</li>
                    <li><span className="font-medium">Correction:</span> Update or correct inaccurate information.</li>
                    <li><span className="font-medium">Deletion:</span> Request deletion of your information (subject to legal requirements).</li>
                    <li><span className="font-medium">Restriction:</span> Limit how we use your information.</li>
                    <li><span className="font-medium">Portability:</span> Receive your information in a portable format.</li>
                    <li><span className="font-medium">Objection:</span> Object to certain processing activities.</li>
                    <li><span className="font-medium">Withdraw Consent:</span> Withdraw consent at any time.</li>
                  </ul>
                  <p className="mt-4">
                    To exercise these rights, please contact us at privacy@makaolink.com. We will respond within 30 days.
                  </p>
                </div>
              </section>

              {/* Data Retention */}
              <section id="retention" className="scroll-mt-24">
                <h2 className="text-2xl font-bold text-[#013E43] mb-4 flex items-center">
               
                  8. Data Retention
                </h2>
                <div className="space-y-4 text-[#065A57] leading-relaxed">
                  <p>
                    We retain your personal information for as long as necessary to provide our services 
                    and fulfill the purposes outlined in this Privacy Policy. When we no longer need your 
                    information, we will securely delete or anonymize it.
                  </p>
                  <p>
                    If you delete your account, we will delete your information within 30 days, except 
                    where we are required to retain it for legal, tax, or regulatory purposes.
                  </p>
                </div>
              </section>

              {/* Children's Privacy */}
              <section id="children" className="scroll-mt-24">
                <h2 className="text-2xl font-bold text-[#013E43] mb-4 flex items-center">
                  
                  9. Children's Privacy
                </h2>
                <div className="space-y-4 text-[#065A57] leading-relaxed">
                  <p>
                    MakaoLink is not intended for individuals under the age of 18. We do not knowingly 
                    collect personal information from children. If you become aware that a child has 
                    provided us with personal information, please contact us immediately.
                  </p>
                </div>
              </section>

              {/* Changes to Policy */}
              <section id="changes" className="scroll-mt-24">
                <h2 className="text-2xl font-bold text-[#013E43] mb-4 flex items-center">
              
                  10. Changes to This Privacy Policy
                </h2>
                <div className="space-y-4 text-[#065A57] leading-relaxed">
                  <p>
                    We may update this Privacy Policy from time to time. We will notify you of any material 
                    changes by posting the new policy on this page with an updated effective date.
                  </p>
                  <p>
                    You are advised to review this Privacy Policy periodically for any changes. Continued 
                    use of our platform after changes constitutes acceptance of the revised policy.
                  </p>
                </div>
              </section>

              {/* Contact Information */}
              <section className="pt-6 border-t border-[#A8D8C1]">
                <h2 className="text-xl font-bold text-[#013E43] mb-4 flex items-center">
                  <FiMail className="mr-2 text-[#02BB31]" />
                  Contact Us
                </h2>
                <p className="text-[#065A57] mb-4">
                  If you have questions or concerns about this Privacy Policy or our data practices, please contact us:
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-[#F0F7F4] p-4 rounded-lg">
                    <p className="font-semibold text-[#013E43] mb-2">Email</p>
                    <a href="mailto:privacy@makaolink.com" className="text-[#02BB31] hover:underline">
                      privacy@makaolink.com
                    </a>
                  </div>
                  
                  <div className="bg-[#F0F7F4] p-4 rounded-lg">
                    <p className="font-semibold text-[#013E43] mb-2">Phone</p>
                    <a href="tel:+254712345678" className="text-[#02BB31] hover:underline">
                      +254 712 345 678
                    </a>
                  </div>
                  
                  <div className="bg-[#F0F7F4] p-4 rounded-lg">
                    <p className="font-semibold text-[#013E43] mb-2">Address</p>
                    <p className="text-[#065A57]">Nairobi, Kenya</p>
                  </div>
                  
                  <div className="bg-[#F0F7F4] p-4 rounded-lg">
                    <p className="font-semibold text-[#013E43] mb-2">Data Protection Officer</p>
                    <p className="text-[#065A57]">dpo@makaolink.com</p>
                  </div>
                </div>
              </section>

              {/* Footer */}
              <div className="mt-8 p-4 bg-[#F0F7F4] rounded-xl border border-[#A8D8C1] flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center space-x-3">
                 
                  <div>
                    <p className="font-semibold text-[#013E43]">Your privacy matters to us</p>
                    <p className="text-xs text-[#065A57]">We're committed to protecting your data</p>
                  </div>
                </div>
                <Link
                  to="/"
                  className="px-4 py-2 bg-[#02BB31] text-white rounded-lg hover:bg-[#0D915C] transition-colors text-sm whitespace-nowrap"
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

export default PrivacyPolicy