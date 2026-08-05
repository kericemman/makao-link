import { FiCheckCircle, FiPhone, FiShield } from "react-icons/fi";

const badgeConfig = {
  listingVerified: {
    label: "RendaHomes verified",
    icon: FiShield,
    className: "bg-[#013E43] text-white"
  },
  listingReviewed: {
    label: "Admin reviewed",
    icon: FiCheckCircle,
    className: "bg-[#E9F8EF] text-[#137A38]"
  },
  availabilityConfirmed: {
    label: "Availability confirmed",
    icon: FiShield,
    className: "bg-[#EEF7F4] text-[#065A57]"
  },
  landlordKycVerified: {
    label: "KYC verified landlord",
    icon: FiShield,
    className: "bg-[#013E43] text-white"
  },
  directContact: {
    label: "Direct landlord contact",
    icon: FiPhone,
    className: "bg-white text-[#013E43]"
  }
};

const defaultOrder = [
  "listingVerified",
  "landlordKycVerified",
  "listingReviewed",
  "availabilityConfirmed",
  "directContact"
];

export default function TrustBadges({ trust = {}, compact = false, limit = 4, className = "" }) {
  const visibleBadges = defaultOrder
    .filter((key) => Boolean(trust?.[key]))
    .slice(0, limit)
    .map((key) => ({ key, ...badgeConfig[key] }));

  if (!visibleBadges.length) {
    return null;
  }

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {visibleBadges.map((badge) => {
        const Icon = badge.icon;

        return (
          <span
            key={badge.key}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-extrabold ${badge.className} ${
              compact ? "shadow-sm" : ""
            }`}
          >
            <Icon className="shrink-0" />
            {badge.label}
          </span>
        );
      })}
    </div>
  );
}

export function TrustPromise({ trust = {}, lastCheckedAt }) {
  const checkedDate = lastCheckedAt || trust?.lastCheckedAt;
  const formattedDate = checkedDate
    ? new Date(checkedDate).toLocaleDateString("en-KE", {
        month: "short",
        day: "numeric",
        year: "numeric"
      })
    : "";

  return (
    <div className="rounded-2xl border border-[#DDEBE4] bg-white p-5">
      <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-[#02BB31]">RendaHomes trust check</p>
      <div className="mt-4 space-y-3 text-sm font-semibold text-[#065A57]">
        <TrustLine active={trust?.listingReviewed} label="This listing was reviewed before going public." />
        <TrustLine active={trust?.listingVerified} label="RendaHomes admin has verified this listing." />
        <TrustLine active={trust?.availabilityConfirmed} label="The property is marked active and available." />
        <TrustLine active={trust?.directContact} label="A direct contact number is available for inquiries." />
        <TrustLine active={trust?.landlordKycVerified} label="The landlord has completed KYC verification." />
      </div>
      {formattedDate ? (
        <p className="mt-4 text-xs font-bold text-[#647C75]">Last listing update: {formattedDate}</p>
      ) : null}
    </div>
  );
}

function TrustLine({ active, label }) {
  return (
    <div className="flex gap-2">
      <FiCheckCircle className={`mt-0.5 shrink-0 ${active ? "text-[#02BB31]" : "text-[#A8D8C1]"}`} />
      <span className={active ? "text-[#065A57]" : "text-[#8AA69B]"}>{label}</span>
    </div>
  );
}
