import { useEffect, useState } from "react";
import { getAgentProfile } from "../../services/agent.service";

export default function AgentProfile() {
  const [agent, setAgent] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getAgentProfile()
      .then((data) => setAgent(data.agent))
      .catch(() => setError("Could not load profile."));
  }, []);

  return (
    <div className="max-w-3xl space-y-5">
      <div className="border-b border-[#DDEAE3] pb-5">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#17A56B]">Agent Profile</p>
        <h2 className="mt-2 text-2xl font-bold text-[#013E43]">{agent?.name || "Agent account"}</h2>
      </div>

      <section className="rounded-xl border border-[#DDEAE3] bg-white p-5">
        {error ? <p className="mb-4 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p> : null}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name" value={agent?.name} />
          <Field label="Email" value={agent?.email} />
          <Field label="Phone" value={agent?.phone} />
          <Field label="Agent code" value={agent?.agentCode} />
          <Field label="Status" value={agent?.status} />
          <Field label="Commission rate" value={`${agent?.commissionRate || 0}%`} />
        </div>
      </section>
    </div>
  );
}

function Field({ label, value }) {
  return (
    <div className="rounded-lg border border-[#DDEAE3] bg-[#F8FAF8] p-3">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#8A9C96]">{label}</p>
      <p className="mt-1 font-semibold text-[#013E43]">{value || "Not set"}</p>
    </div>
  );
}
