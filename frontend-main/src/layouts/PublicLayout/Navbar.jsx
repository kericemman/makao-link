import { useEffect, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { FiArrowUpRight, FiGrid, FiLogIn, FiMenu, FiSearch, FiX } from "react-icons/fi";
import { joinPortalUrl, portalLinks } from "../../config/portals";

const USER_TOKEN_KEY = "renda_user_token";

const navigationItems = [
  { label: "Home", to: "/" },
  { label: "Browse listings", to: "/listings" }
];

const navLinkClass = ({ isActive }) =>
  `rounded-full px-4 py-2 text-sm font-bold transition ${
    isActive
      ? "bg-[#013E43] text-white"
      : "text-[#065A57] hover:bg-[#F0F7F4] hover:text-[#013E43]"
  }`;

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(() => Boolean(localStorage.getItem(USER_TOKEN_KEY)));

  const closeMenu = () => setMenuOpen(false);
  const userLoginUrl = joinPortalUrl(portalLinks.user.href, "/login");
  const userDashboardUrl = portalLinks.user.href;
  const accountLink = isSignedIn
    ? { label: "Dashboard", href: userDashboardUrl, icon: FiGrid }
    : { label: "Account", href: userLoginUrl, icon: FiLogIn };

  useEffect(() => {
    const syncAuthState = () => {
      setIsSignedIn(Boolean(localStorage.getItem(USER_TOKEN_KEY)));
    };

    window.addEventListener("storage", syncAuthState);
    window.addEventListener("renda-user-auth", syncAuthState);

    return () => {
      window.removeEventListener("storage", syncAuthState);
      window.removeEventListener("renda-user-auth", syncAuthState);
    };
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-[#A8D8C1] bg-white backdrop-blur-xl">
      <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link to="/" onClick={closeMenu} className="flex items-center gap-3">
          <span className="grid h-12 w-24 place-items-center rounded-2xl ">
            <img src="/assets/rend.jpeg" alt="RendaHomes Logo" className="h-10 w-auto object-contain" />
          </span>
        </Link>

        <nav className="hidden items-center gap-2 lg:flex">
          {navigationItems.map((item) => (
            <NavItem key={item.label} item={item} className={navLinkClass} onClick={closeMenu} />
          ))}
          <a
            href={accountLink.href}
            title={portalLinks.user.purpose}
            className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold text-[#065A57] transition hover:bg-[#F0F7F4] hover:text-[#013E43]"
          >
            <accountLink.icon />
            {accountLink.label}
          </a>
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Link
            to="/list-your-property"
            title={portalLinks.landlord.purpose}
            className="inline-flex items-center gap-2 rounded-full border border-[#02BB31] bg-white px-4 py-2 text-sm font-extrabold text-[#013E43] shadow-sm transition hover:border-[#013E43]"
          >
            List property
            <FiArrowUpRight />
          </Link>
          <Link
            to="/listings"
            className="inline-flex items-center gap-2 rounded-full bg-[#013E43] px-4 py-2 text-sm font-extrabold text-white shadow-sm transition hover:bg-[#005C57]"
          >
            <FiSearch />
            Find a home
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setMenuOpen((value) => !value)}
          className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[#013E43] text-white md:hidden"
          aria-label="Toggle navigation"
          aria-expanded={menuOpen}
        >
          {menuOpen ? <FiX /> : <FiMenu />}
        </button>
      </div>

      {menuOpen ? (
        <div className="bg-white px-4 pb-5 pt-2 md:hidden">
          <div className="space-y-1">
            {navigationItems.map((item) => (
              <NavItem
                key={item.label}
                item={item}
                onClick={closeMenu}
                className={({ isActive }) =>
                  `block rounded-xl px-4 py-3 text-sm font-extrabold transition ${
                    isActive ? "bg-[#F0F7F4] text-[#013E43]" : "text-[#065A57] hover:bg-[#F0F7F4] hover:text-[#013E43]"
                  }`
                }
              />
            ))}
            <Link
              to="/list-your-property"
              title={portalLinks.landlord.purpose}
              className="block rounded-xl px-4 py-3 text-sm font-extrabold text-[#065A57] transition hover:bg-[#F0F7F4] hover:text-[#013E43]"
              onClick={closeMenu}
            >
              List property
            </Link>
            <a
              href={accountLink.href}
              title={portalLinks.user.purpose}
              className="block rounded-xl px-4 py-3 text-sm font-extrabold text-[#065A57] transition hover:bg-[#F0F7F4] hover:text-[#013E43]"
              onClick={closeMenu}
            >
              {accountLink.label}
            </a>
          </div>
        </div>
      ) : null}
    </header>
  );
}

function NavItem({ item, className, onClick }) {
  const Icon = item.icon;

  if (item.href) {
    return (
      <a href={item.href} className={typeof className === "function" ? className({ isActive: false }) : className} onClick={onClick}>
        {item.label}
      </a>
    );
  }

  return (
    <NavLink to={item.to} className={className} onClick={onClick}>
      {item.label}
    </NavLink>
  );
}
