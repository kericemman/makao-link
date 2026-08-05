import { Link } from "react-router-dom";
import { FaTiktok, FaWhatsapp } from "react-icons/fa";
import { FiArrowUpRight, FiChevronRight, FiFacebook, FiInstagram, FiLinkedin, FiMail, FiMapPin, FiPhone } from "react-icons/fi";
import { portalLinks } from "../../config/portals";

const socialLinks = [
  { icon: FiFacebook, href: "https://www.facebook.com/share/1CYY4uVPTy/", label: "Facebook", color: "hover:text-[#1877F2]" },
  { icon: FiInstagram, href: "https://www.instagram.com/renda.homes?igsh=MW5hM2s3dHMyeHZlaQ==", label: "Instagram", color: "hover:text-[#E4405F]" },
  { icon: FiLinkedin, href: "https://www.linkedin.com/company/renda-homes/", label: "LinkedIn", color: "hover:text-[#0A66C2]" },
  { icon: FaWhatsapp, href: "https://wa.me/2547388000", label: "WhatsApp", color: "hover:text-[#25D366]" },
  { icon: FaTiktok, href: "https://www.tiktok.com/@rendahomes", label: "TikTok", color: "hover:text-white" }
];

export default function Footer() {
  return (
    <footer className="relative overflow-hidden bg-gradient-to-b from-[#013E43] to-[#001A1C] text-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-9 sm:grid-cols-2 lg:grid-cols-[1.25fr_0.8fr_0.8fr_0.8fr_0.8fr]">
          <div className="space-y-4">
           
            <p className="max-w-sm text-sm leading-6 text-[#A8D8C1]">
              Discover verified homes, rentals, office spaces, and move-in services across Kenya.
            </p>
            <div className="space-y-2 pt-2 text-sm text-[#A8D8C1]">
              <ContactLink icon={FiMapPin} label="Nairobi, Kenya" />
              <ContactLink icon={FiPhone} label="+254 738 388 000" href="tel:+254738388000" />
              <ContactLink icon={FiMail} label="info@rendahomes.com" href="mailto:info@rendahomes.com" />
            </div>
          </div>

          <FooterGroup
            title="Discover"
            links={[
              ["Home", "/"],
              ["Properties", "/listings"],
              ["Rentals", "/categories/rentals"],
              ["For sale", "/categories/for-sale"],
              ["Recent listings", "/listings?sort=recent"],
              ["Featured listings", "/listings?sort=popular"]
            ]}
          />

          <FooterGroup
            title="Categories"
            links={[
              ["Apartments", "/categories/apartments"],
              ["Office spaces", "/categories/office"],
              ["Family homes", "/categories/family"],
              ["Luxury rentals", "/categories/luxury"],
              ["Services", "/services"],
              ["Become a partner", "/services/apply"]
            ]}
          />

          <FooterGroup
            title="Company"
            links={[
              ["About", "/about"],
              ["List your property", "/list-your-property"],
              ["Blog", "/blog"],
              ["Pricing", "/pricing"],
              ["FAQs", "/faqs"],
              ["Support", "/support"],
              ["Sitemap", "/sitemap"]
            ]}
          />

          <div>
            <h3 className="relative inline-block text-base font-semibold text-white">
              Portals
              <span className="absolute -bottom-1 left-0 h-0.5 w-10 rounded-full bg-[#02BB31]" />
            </h3>
            <div className="mt-5 flex flex-col gap-3 text-sm text-[#A8D8C1]">
              <Link to="/list-your-property" title={portalLinks.landlord.purpose} className="inline-flex items-center gap-2 transition hover:text-white">
                List property <FiArrowUpRight />
              </Link>
              <a href={portalLinks.landlord.href} title={portalLinks.landlord.purpose} className="inline-flex items-center gap-2 transition hover:text-white">
                Landlord dashboard <FiArrowUpRight />
              </a>
              <a href={portalLinks.user.href} title={portalLinks.user.purpose} className="inline-flex items-center gap-2 transition hover:text-white">
                User portal <FiArrowUpRight />
              </a>
              <a href={`${portalLinks.user.href.replace(/\/$/, "")}/agent/dashboard`} title="For RendaHomes agents to track onboarding activity." className="inline-flex items-center gap-2 transition hover:text-white">
                Agent dashboard <FiArrowUpRight />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-5 border-t border-[#065A57] pt-7 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm text-[#A8D8C1]">Follow us:</span>
            <div className="flex items-center gap-2">
              {socialLinks.map((social) => {
                const Icon = social.icon;
                return (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`grid h-10 w-10 place-items-center rounded-lg bg-white/10 text-[#A8D8C1] transition-all hover:bg-white/20 ${social.color}`}
                    aria-label={social.label}
                  >
                    <Icon className="text-lg" />
                  </a>
                );
              })}
            </div>
          </div>
          <p className="text-xs font-semibold text-[#A8D8C1]">
            © {new Date().getFullYear()} RendaHomes. All rights reserved.
          </p>
          <div className="flex flex-wrap gap-4 text-xs font-semibold text-[#A8D8C1]">
            <Link to="/privacy-policy" className="transition hover:text-white">Privacy</Link>
            <Link to="/terms-of-service" className="transition hover:text-white">Terms</Link>
            <Link to="/sitemap" className="transition hover:text-white">Sitemap</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterGroup({ title, links }) {
  return (
    <div>
      <h3 className="relative inline-block text-base font-semibold text-white">
        {title}
        <span className="absolute -bottom-1 left-0 h-0.5 w-10 rounded-full bg-[#02BB31]" />
      </h3>
      <ul className="mt-5 space-y-2">
        {links.map(([label, href]) => (
          <li key={href}>
            <Link to={href} className="group flex items-center text-sm text-[#A8D8C1] transition hover:text-white">
              <FiChevronRight className="mr-2 text-[#02BB31] opacity-0 transition group-hover:opacity-100" />
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ContactLink({ icon: Icon, label, href }) {
  const content = (
    <>
      <Icon className="shrink-0 text-[#02BB31]" />
      <span>{label}</span>
    </>
  );

  if (href) {
    return (
      <a href={href} className="flex items-center gap-3 transition hover:text-white">
        {content}
      </a>
    );
  }

  return <div className="flex items-center gap-3">{content}</div>;
}
