import { Link } from "react-router-dom";

const UPDATED = "4 November 2026";

const documents = {
  privacy: {
    title: "Privacy Policy",
    intro: "This policy explains how RendaHomes handles personal information when you browse listings, create an account, manage properties, contact a landlord, use the services marketplace, or use Renda Assistant.",
    sections: [
      {
        id: "who-we-are",
        title: "1. Who we are and what this covers",
        paragraphs: [
          "RendaHomes operates a property discovery and management platform for people in Kenya. This policy applies to rendahomes.com, the landlord and user portals, our mobile app, and related services. Depending on the activity, RendaHomes may act as a data controller and third-party providers may process information for us.",
          "For privacy requests, contact privacy@rendahomes.com. This policy should be read with our Terms of Service."
        ]
      },
      {
        id: "information",
        title: "2. Information we handle",
        paragraphs: ["We collect information you give us, information created when you use a feature, and limited technical information needed to run and protect the service. What we handle depends on which features you choose."],
        bullets: [
          "Account and identity: name, email, phone number, password credentials, verification status, profile details and, when you choose Google sign-in, the account information Google shares for authentication.",
          "Property and organization information: listing details, images, location, ownership or advertising authority information, company and branch details, team roles, agent mandates and activity needed to manage the relevant workspace.",
          "Applications and verification: identity and professional documents, KYC details, proof-of-ownership material and review outcomes submitted by landlords or agent applicants.",
          "Communications and requests: inquiries, replies, saved homes, property requirements, stay requests, viewing dates and messages, support tickets, partner applications and contact details you submit.",
          "Payments and subscriptions: plan selection, transaction references, payment status and subscription metadata. Paystack processes payment transactions; payment details are handled according to its own terms and privacy information.",
          "Assistant conversations: prompts, responses, consent records and limited conversation state when you choose to use Renda Assistant.",
          "Technical/session information: security logs and essential browser storage used for sign-in, shared sessions and service preferences. We do not claim to use advertising or analytics trackers unless separately disclosed when introduced."
        ]
      },
      {
        id: "purposes",
        title: "3. Why we use information",
        paragraphs: ["We use information only as needed for the feature and purpose explained when it is collected, including to:"],
        bullets: [
          "create and secure accounts, verify email and phone details, and provide role- and organization-scoped access;",
          "publish and manage property listings, review KYC or agent applications, administer subscriptions and prevent misuse;",
          "deliver searches, saved homes, property requests, matching where selected, inquiries, stay requests, viewings and support;",
          "share an inquiry or viewing request with the relevant listing advertiser and any agent authorized to handle it;",
          "send necessary account, security, payment, inquiry, viewing and service communications, and send marketing or product updates where you have subscribed or otherwise opted in;",
          "meet legal obligations, keep appropriate business records, resolve disputes and protect users and the platform."
        ]
      },
      {
        id: "optional-search",
        title: "4. Browsing and Renda Assistant",
        paragraphs: [
          "You can browse public listings without creating an account. Renda Assistant search does not require your name or email. Before starting an assistant conversation, we ask for separate consent to process your messages for property search; you can decline and continue browsing the site.",
          "If you consent, your messages are sent to RendaHomes and OpenAI to generate responses and search public listing information. Do not enter passwords, payment details, identity numbers, KYC documents or other sensitive information in the assistant. Assistant conversation data is configured to be retained for up to 90 days, unless you reset the conversation sooner; retention settings may change and the active notice will state the applicable period.",
          "If you choose to save a property request, make an inquiry, request a viewing or contact a landlord, we may ask for account or contact details needed to complete that action. A request for matching or agent involvement is handled according to the choices and consent shown in that flow."
        ]
      },
      {
        id: "sharing",
        title: "5. When information is shared",
        paragraphs: ["We do not sell personal information. We share it only where needed to provide a feature, at your direction, or as permitted or required by law."],
        bullets: [
          "Public listing information, including property details, photos and any contact details the advertiser elects to publish, is visible to people browsing the site and app.",
          "When you submit an inquiry or viewing request, the information needed to respond, including your submitted contact details and message, is shared with the listing advertiser and authorized staff or agents assigned to that listing or request.",
          "Organization owners and members may access company, listing, lead and viewing information within the roles, branches and property assignments granted to them.",
          "We use providers for hosting and storage, email delivery, payments, authentication, AI processing and messaging where those features are enabled. Current integrations may include Cloudflare R2, legacy Cloudinary-hosted media, Resend, Paystack, Google and OpenAI. If you continue a conversation through WhatsApp or another third-party channel, that provider's own privacy terms also apply.",
          "We may disclose information to comply with law, respond to valid legal process, protect people or investigate suspected fraud or security incidents."
        ]
      },
      {
        id: "international",
        title: "6. Processing outside Kenya",
        paragraphs: ["Some service providers or infrastructure may process or store information outside Kenya. Where personal information is transferred across borders, RendaHomes will apply the safeguards required by applicable Kenyan data protection law. Provider locations and transfer arrangements can vary by service and configuration."]
      },
      {
        id: "storage",
        title: "7. Storage, cookies and security",
        paragraphs: [
          "Public property media and private verification documents are stored separately where supported. Private KYC or application documents are restricted and may be made available to authorized reviewers through time-limited access links. Do not share those links.",
          "We use technical and organizational safeguards, including account authentication, role-based access and restricted document access. No website, storage system or transmission method can be guaranteed completely secure. Please use a unique password, protect your device and tell us promptly if you suspect unauthorized access.",
          "The portals use essential browser storage and cookies for authentication and shared sign-in between relevant RendaHomes subdomains. You can control browser storage through your browser settings, although removing it may sign you out or affect portal features."
        ]
      },
      {
        id: "retention",
        title: "8. How long we keep information",
        paragraphs: ["We keep information for the time needed to provide the relevant service, maintain account and transaction records, address disputes, protect the platform and meet legal obligations. Retention differs by record type and feature. Assistant conversation retention is described in section 4. When information is no longer needed, we will take steps to delete, anonymize or restrict it as required by law and our operational retention processes."]
      },
      {
        id: "rights",
        title: "9. Your choices and rights",
        paragraphs: [
          "Under applicable Kenyan law, you may have rights to be informed about use of your personal data, access it, object to some processing, request correction of inaccurate or misleading information, and request deletion or erasure where legally available. You may withdraw consent for processing that relies on consent; withdrawal does not affect processing already carried out lawfully.",
          "You can unsubscribe from marketing or product-update emails using the available unsubscribe option. Service and security messages needed to operate your account may still be sent.",
          "To make a privacy request, email privacy@rendahomes.com and describe the account or information involved. We may need to verify your identity before acting. You may also raise a complaint with the Office of the Data Protection Commissioner of Kenya."
        ]
      },
      {
        id: "children",
        title: "10. Children",
        paragraphs: ["RendaHomes accounts and property transactions are intended for adults aged 18 or older. Do not submit a child's personal information unless you are legally authorized and the relevant feature requires it. Contact us if you believe a child has submitted personal information without appropriate authorization."]
      },
      {
        id: "updates",
        title: "11. Changes and contact",
        paragraphs: [
          "We may update this policy when our services, data practices or legal obligations change. We will publish the current version and update the date below; where required, we will provide additional notice or request fresh consent.",
          "Privacy contact: privacy@rendahomes.com. General contact: info@rendahomes.com."
        ]
      }
    ]
  },
  terms: {
    title: "Terms of Service",
    intro: "These Terms govern use of RendaHomes public property discovery, landlord and user portals, mobile app, services marketplace, agent tools, subscriptions and Renda Assistant.",
    sections: [
      {
        id: "agreement",
        title: "1. Agreement and eligibility",
        paragraphs: [
          "By accessing or using RendaHomes, you agree to these Terms and our Privacy Policy. Account registration requires you to confirm acceptance of both policies. If you do not agree, do not create an account or use account-only features.",
          "You must be at least 18 years old and able to enter into agreements. You agree to provide accurate information and keep your account details current."
        ]
      },
      {
        id: "roles",
        title: "2. Platform roles and accounts",
        paragraphs: [
          "RendaHomes supports people searching for homes, landlords and property advertisers, agents, service providers, and organizations with authorized members. One account may hold more than one approved role. Access to each role, organization, branch or property depends on current authorization and assignment.",
          "You are responsible for protecting your credentials and for activity under your account. Do not share credentials, bypass permissions, impersonate another person or use another person's documents. Tell us promptly if you suspect unauthorized use.",
          "Organization administrators are responsible for inviting appropriate people, assigning only the access they need, maintaining accurate branch and property assignments, and removing access when it is no longer appropriate. A platform role or agent account does not itself grant legal authority to market, manage, lease or sell a property; that authority must come from the property owner or other person legally entitled to grant it."
        ]
      },
      {
        id: "listings",
        title: "3. Property listings and advertiser duties",
        paragraphs: ["A landlord or advertiser who submits a property must have the ownership rights or documented authority needed to advertise it. You remain responsible for the accuracy and legality of your listing and for keeping availability, price, location, photos and material features current."],
        bullets: [
          "Use genuine images and descriptions that fairly represent the property and do not infringe another person's rights.",
          "Do not advertise a property without the owner's permission or a valid mandate, and do not misrepresent ownership, management authority, title, safety, condition, price or availability.",
          "Complete identity, KYC, ownership or professional verification when the relevant feature or review process requires it. Verification is a review step; it is not a guarantee of title, condition, suitability, safety or future performance.",
          "Remove or update a listing promptly when it is no longer available or its material information changes."
        ],
        closing: "RendaHomes may review, restrict, reject, suspend or remove listings that appear inaccurate, unauthorized, unsafe, unlawful or in breach of these Terms. We may request supporting information before publishing or restoring a listing."
      },
      {
        id: "marketplace",
        title: "4. Property discovery and third-party transactions",
        paragraphs: [
          "RendaHomes provides tools to discover properties and communicate with advertisers. Unless a separate written agreement says otherwise, RendaHomes is not the owner, landlord, tenant, buyer, seller, property manager or party to a rental, sale or short-stay agreement. We do not guarantee that a listing is accurate, available, lawful, suitable or free of title or condition issues.",
          "Before paying, signing, moving in or making a commitment, independently verify the advertiser's identity and authority, the property, price, terms and relevant documents. Any lease, sale, viewing or stay agreement is between the people who enter it, not RendaHomes.",
          "A request to stay or a pre-filled WhatsApp message is an inquiry, not a confirmed reservation. A stay is confirmed only when the host or advertiser clearly accepts it and the parties agree on the terms. Do not send money to an unverified person."
        ]
      },
      {
        id: "requests",
        title: "5. Inquiries, property requests and viewings",
        paragraphs: [
          "When you send an inquiry or request a viewing, you authorize RendaHomes to share the information needed to respond with the listing advertiser and any staff or agent authorized to handle the listing or request. A viewing request is not confirmed until the advertiser confirms the time. The parties should verify final arrangements directly.",
          "Property requests and matching tools help organize your stated preferences and identify possible listings. Results may be incomplete, change over time or include alternatives. Matching does not guarantee that a property is available, that an agent will contact you, or that a transaction will occur. Agent involvement is subject to the permissions and choices shown in the relevant flow."
        ]
      },
      {
        id: "organizations-agents",
        title: "6. Organizations, teams and agents",
        paragraphs: [
          "Organizations and their administrators are responsible for ensuring that membership, role, branch and property assignments reflect their actual instructions. Access may be restricted or revoked when a membership or mandate ends. Users must not use access outside its assigned scope.",
          "Agent invitations, referral tracking and commission eligibility are governed by the separate agent program terms or commission arrangement presented to the agent. A referral link or platform account alone does not promise a commission, establish an employment relationship, or authorize an agent to bind a landlord or RendaHomes."
        ]
      },
      {
        id: "assistant",
        title: "7. Renda Assistant",
        paragraphs: [
          "Renda Assistant is an optional AI-powered aid for property discovery and related information. Before starting a conversation, you must accept its separate data-processing notice. You can decline and continue to use public listings without the assistant.",
          "Assistant responses may be incomplete, inaccurate or out of date and are not legal, financial, property inspection or professional advice. Verify important listing details with the advertiser. Do not provide passwords, payment credentials, identity numbers or KYC documents in an assistant conversation. Conversation handling and retention are described in the Privacy Policy and the consent notice shown when the session begins."
        ]
      },
      {
        id: "services",
        title: "8. Services marketplace and partner applications",
        paragraphs: ["Service providers are independent businesses. Their descriptions, service areas, prices and work are their responsibility. RendaHomes does not guarantee a provider's licensing, availability, quality, safety, price or performance. Confirm scope, costs and any contract directly with the provider before engaging them. Partner applications are subject to review and approval; submitting an application does not guarantee acceptance or customers."]
      },
      {
        id: "subscriptions",
        title: "9. Plans, payments and add-ons",
        paragraphs: [
          "Landlord plans, listing limits, included features, add-ons, prices, renewal terms and cancellation options are shown in the relevant account or checkout flow before purchase. Those displayed terms apply to the purchase. Plan features may differ by tier and may change prospectively with notice where required.",
          "Payments and recurring subscriptions are processed through Paystack or another provider disclosed at checkout. RendaHomes receives transaction and subscription status needed to administer the service. Review the payment provider's terms before authorizing payment. Cancellation stops future renewal as described in the dashboard; access to paid features may continue until the paid period ends. Refunds and cancellation rights are subject to the terms shown at purchase and applicable law.",
          "Where available, WhatsApp listing assistance is either included in an eligible plan or offered as a separately billed add-on. The current eligibility, price, renewal and cancellation terms are presented inside the landlord account before activation; the public site does not set or promise a price for that add-on."
        ]
      },
      {
        id: "content",
        title: "10. Content, acceptable use and enforcement",
        paragraphs: [
          "You retain rights to content you submit. You grant RendaHomes a limited, non-exclusive permission to host, reproduce, display and transmit that content as necessary to operate the features you use, such as showing an authorized listing, reviewing an application or delivering a message. You confirm that you have the rights and permissions needed to provide it.",
          "Do not use the platform to deceive, harass, discriminate unlawfully, threaten, defraud, scrape or exploit other users; upload malware or unlawful content; misuse another person's personal data; interfere with platform security; or evade a suspension or access restriction.",
          "We may investigate reports and restrict content or accounts where reasonably necessary for safety, legal compliance, platform integrity or enforcement of these Terms. Where appropriate, we may provide an explanation and a way to contact support."
        ]
      },
      {
        id: "availability",
        title: "11. Availability and limitations",
        paragraphs: [
          "We work to keep RendaHomes available but do not promise uninterrupted or error-free operation. Features may be changed, suspended or discontinued for maintenance, security, legal or operational reasons.",
          "To the extent permitted by law, RendaHomes is not responsible for a third party's listing, message, payment-provider decision, service, property condition or agreement. Nothing in these Terms excludes a right or liability that cannot lawfully be excluded or limited."
        ]
      },
      {
        id: "termination",
        title: "12. Suspension and account closure",
        paragraphs: ["You may stop using the platform and request account closure by contacting support. We may suspend or restrict access where needed to protect users, investigate suspected misuse, comply with law, or enforce these Terms. Account closure does not automatically erase records that must or may lawfully be retained, and it may affect access to listings, organization workspaces, requests or subscription features."]
      },
      {
        id: "law",
        title: "13. Governing law and changes",
        paragraphs: [
          "These Terms are governed by the laws of Kenya, subject to mandatory consumer protections and any rights that cannot be waived. Disputes will be handled by the competent courts or other forums available under applicable law.",
          "We may update these Terms as the platform changes. We will publish the current version and update the date. If a change materially affects your rights or requires renewed acceptance, we will provide notice or request acceptance as required by law."
        ]
      },
      {
        id: "contact",
        title: "14. Contact",
        paragraphs: ["For questions about these Terms, contact legal@rendahomes.com. For privacy matters, contact privacy@rendahomes.com. General support is available at info@rendahomes.com."]
      }
    ]
  }
};

export default function LegalDocument({ type = "privacy" }) {
  const document = documents[type] || documents.privacy;

  const download = () => {
    const text = [document.title, `Last updated: ${UPDATED}`, document.intro,
      ...document.sections.flatMap((section) => [section.title, ...(section.paragraphs || []), ...(section.bullets || []).map((item) => `- ${item}`), section.closing || ""])
    ].filter(Boolean).join("\n\n");
    const url = URL.createObjectURL(new Blob([text], { type: "text/plain;charset=utf-8" }));
    const anchor = window.document.createElement("a");
    anchor.href = url;
    anchor.download = `RendaHomes-${type === "terms" ? "Terms-of-Service" : "Privacy-Policy"}.txt`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main className="min-h-screen bg-white text-[#173b37]">
      <header className="border-b border-[#dce9e2] bg-[#f7faf8]">
        <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
          <p className="text-sm font-semibold text-[#13834f]">Legal</p>
          <div className="mt-3 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-[#013e43] sm:text-4xl">{document.title}</h1>
              <p className="mt-2 text-sm text-[#55716a]">Last updated {UPDATED}</p>
              <p className="mt-5 max-w-3xl text-base leading-7 text-[#365851]">{document.intro}</p>
            </div>
            <div className="flex shrink-0 gap-2 print:hidden">
              <button type="button" onClick={() => window.print()} className="min-h-10 rounded-md border border-[#cdded5] px-4 text-sm font-medium text-[#174f42] hover:bg-white">Print</button>
              <button type="button" onClick={download} className="min-h-10 rounded-md bg-[#137c4b] px-4 text-sm font-medium text-white hover:bg-[#0d633b]">Download</button>
            </div>
          </div>
        </div>
      </header>
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-10 sm:px-8 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-16">
        <nav aria-label="On this page" className="h-fit border-b border-[#dce9e2] pb-5 lg:sticky lg:top-6 lg:border-b-0">
          <h2 className="text-xs font-bold uppercase text-[#55716a]">On this page</h2>
          <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3 lg:grid-cols-1">
            {document.sections.map((section) => (
              <li key={section.id}><a href={`#${section.id}`} className="text-sm text-[#25675a] hover:text-[#0d633b] hover:underline">{section.title.replace(/^\d+\. /, "")}</a></li>
            ))}
          </ul>
        </nav>
        <article className="min-w-0 divide-y divide-[#e5eee9]">
          {document.sections.map((section) => (
            <section key={section.id} id={section.id} className="scroll-mt-6 py-7 first:pt-0">
              <h2 className="text-xl font-semibold text-[#013e43]">{section.title}</h2>
              <div className="mt-3 space-y-4 text-[15px] leading-7 text-[#385c55]">
                {(section.paragraphs || []).map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                {section.bullets && <ul className="list-disc space-y-2 pl-6">{section.bullets.map((item) => <li key={item}>{item}</li>)}</ul>}
                {section.closing && <p>{section.closing}</p>}
              </div>
            </section>
          ))}
          <p className="pt-6 text-sm text-[#55716a]">Also read our <Link className="font-medium text-[#137c4b] underline" to={type === "terms" ? "/privacy-policy" : "/terms-of-service"}>{type === "terms" ? "Privacy Policy" : "Terms of Service"}</Link>.</p>
        </article>
      </div>
    </main>
  );
}
