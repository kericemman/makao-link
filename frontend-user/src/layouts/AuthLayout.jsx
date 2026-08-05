import { Link, Outlet } from "react-router-dom";
import { FiArrowUpRight, FiBell, FiCheckCircle, FiHome, FiMapPin, FiMessageSquare, FiSearch } from "react-icons/fi";
import { portalLinks } from "../config/portals";

export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-[#F0F7F4]">
      <header className="border-b border-[#A8D8C1] bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link to="/" className="inline-flex items-center">
            <img src="/assets/rend.jpeg" alt="RendaHomes" className="h-10 w-auto rounded bg-white" />
          </Link>
          <a href={portalLinks.main.href} className="inline-flex items-center gap-2 rounded-full bg-[#013E43] px-4 py-2 text-sm font-extrabold text-white">
            <FiHome />
            Browse homes
          </a>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 lg:min-h-[calc(100vh-73px)] lg:grid-cols-[0.95fr_1.05fr] lg:items-center lg:px-8">
        <section className="relative hidden overflow-hidden rounded-[2rem] bg-[#013E43] p-8 text-white shadow-[0_28px_80px_rgba(1,62,67,0.22)] lg:block">
          <div className="absolute inset-x-0 top-0 h-36 bg-[linear-gradient(135deg,rgba(2,187,49,0.24),rgba(168,216,193,0.08),transparent)]" />
          <div className="relative">
            <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-[#02BB31]">User portal</p>
            <h1 className="mt-4 text-4xl font-extrabold tracking-tight">Manage your home search from one calm place.</h1>
            <p className="mt-4 max-w-md text-sm leading-7 text-[#A8D8C1]">
            Track inquiries, continue conversations, update your profile, and return to verified listings whenever you are ready.
            </p>

            <div className="mt-8 rounded-[1.5rem] bg-white p-4 text-[#013E43] shadow-2xl">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#0D915C]">Next viewing</p>
                  <p className="mt-1 text-lg font-extrabold">Two-bedroom apartment</p>
                  <p className="mt-1 flex items-center gap-1 text-sm font-semibold text-[#065A57]">
                    <FiMapPin className="text-[#02BB31]" />
                    Kilimani, Nairobi
                  </p>
                </div>
                <div className="grid h-14 w-14 place-items-center rounded-2xl bg-[#F0F7F4] text-2xl text-[#02BB31]">
                  <FiHome />
                </div>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2">
                <MiniMetric icon={FiSearch} label="Search" />
                <MiniMetric icon={FiMessageSquare} label="Chat" />
                <MiniMetric icon={FiCheckCircle} label="Ready" />
              </div>
            </div>

            
            <a href={portalLinks.main.href} className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-extrabold text-[#013E43]">
              Find a home
              <FiArrowUpRight />
            </a>
          </div>
        </section>

        <Outlet />
      </main>
    </div>
  );
}

function MiniMetric({ icon: Icon, label }) {
  return (
    <div className="rounded-2xl bg-[#F0F7F4] p-3 text-center">
      <Icon className="mx-auto text-[#02BB31]" />
      <p className="mt-1 text-xs font-extrabold text-[#065A57]">{label}</p>
    </div>
  );
}
