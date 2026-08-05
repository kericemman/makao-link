import { useEffect, useState } from "react";
import { getAgentInstructions } from "../../services/agent.service";

const defaultGuide = [
  "Lead with the free offer: landlords can list 2 active properties free.",
  "Ask for photos, price, county, town, area, property type, and contact phone before sharing the signup link.",
  "Explain that RendaHomes reviews listings before they go public to protect tenants and improve trust.",
  "Tell paid landlords to complete KYC so admin can strengthen their trust profile.",
  "Follow up after signup and confirm the landlord created their account through your referral link."
];

export default function AgentInstructions() {
  const [instructions, setInstructions] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    getAgentInstructions()
      .then((data) => setInstructions(data.instructions || []))
      .catch(() => setError("Could not load instructions."));
  }, []);

  return (
    <div className="space-y-5">
      <div className="border-b border-[#DDEAE3] pb-5">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#17A56B]">Agent Instructions</p>
        <h2 className="mt-2 text-2xl font-bold text-[#013E43]">Admin updates and onboarding guides</h2>
        <p className="mt-1 text-sm text-[#647C75]">Read the latest instructions from the RendaHomes admin team.</p>
      </div>

      <div className="grid gap-4">
        {error ? <p className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p> : null}
        <article className="rounded-xl border border-[#DDEAE3] bg-[#013E43] p-5 text-white">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#02BB31]">Field guide</p>
          <h3 className="mt-2 text-lg font-bold">How to onboard landlords</h3>
          <div className="mt-4 space-y-2">
            {defaultGuide.map((item) => (
              <p key={item} className="text-sm leading-6 text-[#CFE7DC]">• {item}</p>
            ))}
          </div>
        </article>
        {instructions.map((item) => (
          <article key={item._id} className="rounded-xl border border-[#DDEAE3] bg-white p-5">
            <p className="text-xs font-semibold text-[#8A9C96]">{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : ""}</p>
            <h3 className="mt-1 text-lg font-bold text-[#013E43]">{item.title}</h3>
            <div className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[#647C75]">{item.content}</div>
          </article>
        ))}
        {!instructions.length ? <p className="rounded-xl border border-[#DDEAE3] bg-white px-4 py-10 text-center text-sm text-[#647C75]">No instructions posted yet.</p> : null}
      </div>
    </div>
  );
}
