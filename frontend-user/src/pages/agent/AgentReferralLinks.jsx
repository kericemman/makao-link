import { useEffect, useState } from "react";
import { FiCopy, FiExternalLink, FiMessageSquare } from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";
import { getAgentProfile } from "../../services/agent.service";

export default function AgentReferralLinks() {
  const [agent, setAgent] = useState(null);
  const [error, setError] = useState("");
  const [copiedLabel, setCopiedLabel] = useState("");

  useEffect(() => {
    getAgentProfile()
      .then((data) => setAgent(data.agent))
      .catch(() => setError("Could not load referral links."));
  }, []);

  const links = [
    { label: "Landlord onboarding", value: agent?.referralLinks?.landlord },
    { label: "Service provider onboarding", value: agent?.referralLinks?.serviceProvider }
  ];
  const pitches = [
    { label: "First message", value: agent?.pitchKit?.landlordPitch },
    { label: "Follow up", value: agent?.pitchKit?.followUpPitch }
  ];

  return (
    <div className="space-y-5">
      <div className="border-b border-[#DDEAE3] pb-5">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#17A56B]">Referral Links</p>
        <h2 className="mt-2 text-2xl font-bold text-[#013E43]">Share your agent links</h2>
        <p className="mt-1 text-sm text-[#647C75]">Any landlord who signs up through your link is attached to your agent account.</p>
      </div>

      <div className="grid gap-4">
        {error ? <p className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p> : null}
        {links.map((link) => (
          <div key={link.label} className="rounded-xl border border-[#DDEAE3] bg-white p-5">
            <p className="text-sm font-semibold text-[#013E43]">{link.label}</p>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <input readOnly value={link.value || ""} className="min-w-0 flex-1 rounded-lg border border-[#DDEAE3] bg-[#F8FAF8] px-3 py-2 text-sm text-[#647C75] outline-none" />
              <button type="button" onClick={() => copy(link.label, link.value, setCopiedLabel)} className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#013E43] px-4 py-2 text-sm font-semibold text-white">
                <FiCopy />
                {copiedLabel === link.label ? "Copied" : "Copy"}
              </button>
              <a href={link.value || "#"} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#DDEAE3] px-4 py-2 text-sm font-semibold text-[#013E43]">
                <FiExternalLink />
                Open
              </a>
            </div>
          </div>
        ))}
      </div>

      <section className="rounded-xl border border-[#DDEAE3] bg-white p-5">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-lg bg-[#EAF6EF] text-[#17A56B]">
            <FiMessageSquare />
          </span>
          <div>
            <h3 className="text-lg font-bold text-[#013E43]">Ready-to-send landlord scripts</h3>
            <p className="mt-1 text-sm text-[#647C75]">Use these for WhatsApp, Facebook groups, or direct outreach.</p>
          </div>
        </div>

        <div className="mt-4 grid gap-3">
          {pitches.map((pitch) => (
            <div key={pitch.label} className="rounded-lg border border-[#DDEAE3] bg-[#F8FAF8] p-4">
              <p className="text-sm font-bold text-[#013E43]">{pitch.label}</p>
              <p className="mt-2 text-sm leading-6 text-[#647C75]">{pitch.value || "Loading script..."}</p>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <button type="button" onClick={() => copy(pitch.label, pitch.value, setCopiedLabel)} className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#013E43] px-4 py-2 text-sm font-semibold text-white">
                  <FiCopy />
                  {copiedLabel === pitch.label ? "Copied" : "Copy script"}
                </button>
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(pitch.value || "")}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#02BB31] px-4 py-2 text-sm font-semibold text-white"
                >
                  <FaWhatsapp />
                  Share WhatsApp
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

async function copy(label, value, setCopiedLabel) {
  if (!value) return;
  await navigator.clipboard.writeText(value);
  setCopiedLabel(label);
  window.setTimeout(() => setCopiedLabel(""), 1500);
}
