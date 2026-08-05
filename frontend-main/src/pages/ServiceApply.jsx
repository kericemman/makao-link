import { FiArrowRight } from "react-icons/fi";
import { joinPortalUrl, portalLinks } from "../config/portals";

export default function ServiceApply() {
  const signupUrl = joinPortalUrl(portalLinks.user.href, "/signup");

  return (
    <main className="bg-[#F6FAF8]">
      <section className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6 lg:px-8">
        <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-[#02BB31]">Service partners</p>
        <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-[#013E43]">Apply through the user platform.</h1>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-[#065A57]">
          Moving, cleaning, repairs, internet, furniture, and other home service partners are managed inside the user platform so applications and profiles stay together.
        </p>
        <a href={signupUrl} className="mt-7 inline-flex items-center gap-2 rounded-full bg-[#013E43] px-5 py-3 text-sm font-extrabold text-white">
          Continue to user platform <FiArrowRight />
        </a>
      </section>
    </main>
  );
}
