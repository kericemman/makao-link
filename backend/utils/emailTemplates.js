const buildEmailLayout = require("./emailLayout");

const clientUrl = process.env.CLIENT_URL || "https://rendahomes.com";
const landlordClientUrl = process.env.LANDLORD_CLIENT_URL || "https://landlord.rendahomes.com";
const adminClientUrl = process.env.ADMIN_CLIENT_URL || clientUrl;
const userClientUrl = process.env.USER_CLIENT_URL || "https://user.rendahomes.com";
const landlordListingGuideUrl = "https://rendahomes.com/blog/how-to-list-your-property-on-renda-a-step-by-step-guide-for-landlords-and-property-owners-in-kenya";
const escapeHtml = (value = "") => String(value).replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);

exports.welcomeEmail = ({ name, planName, isFreePlan }) => {
  return buildEmailLayout({
    title: "Welcome to Renda Homes",
    greeting: `Hello ${escapeHtml(name)}`,
    intro: `Welcome to RendaHomes, a Kenyan property platform where people can discover homes for rent, properties for sale, and short stays. Your landlord dashboard lets you create and manage listings, update availability, review tenant inquiries, and manage your plan. RendaHomes helps you present your property to people searching online; listing does not guarantee an inquiry or a completed rental or sale.`,
    body: `
      <p style="padding:12px 14px;background:#F2F8F4;border-radius:10px;"><strong>Your selected plan:</strong> ${escapeHtml(planName || "Free")}</p>
      <p>${isFreePlan ? "Your Free plan currently includes up to two property listings. You can review your plan and listing allowance in your dashboard." : "Your account is ready. Complete the plan payment from your dashboard to activate its listing allowance and features."}</p>
      <h2 style="margin:26px 0 10px;color:#013E43;font-size:19px;line-height:26px;">Your first listing, step by step</h2>
      <ol style="padding-left:22px;">
        <li style="margin:0 0 9px;"><strong>Sign in</strong> to your landlord dashboard using the button below.</li>
        <li style="margin:0 0 9px;"><strong>Open Add Property</strong> and choose whether the property is for rent, sale, or a short stay.</li>
        <li style="margin:0 0 9px;"><strong>Add accurate details:</strong> title, property type, county and town, price, bedrooms, amenities, and a clear description.</li>
        <li style="margin:0 0 9px;"><strong>Upload clear property photos</strong> and check that your contact and location details are correct.</li>
        <li style="margin:0 0 9px;"><strong>Submit for review.</strong> Follow the listing status in your dashboard; approved listings can then appear on the public site.</li>
        <li><strong>Manage inquiries and availability</strong> from your dashboard as people contact you.</li>
      </ol>
      <p>For the full walkthrough, use the step-by-step guide linked below. If you get stuck, contact Renda Homes support at <a href="mailto:info@rendahomes.com" style="color:#0D915C;font-weight:700;">info@rendahomes.com</a>.</p>
    `,
    ctaText: "Open Your Landlord Dashboard",
    ctaUrl: `${landlordClientUrl}/login`,
    secondaryCtaText: "Read the step-by-step listing guide",
    secondaryCtaUrl: landlordListingGuideUrl,
    footerNote: "Never share your password or verification code by email. If you did not create this account, contact Renda Homes support."
  });
};

exports.passwordResetEmail = ({ name, resetUrl }) => {
  return buildEmailLayout({
    title: "Reset Your Password",
    greeting: `Hello ${name}`,
    intro: "We received a request to reset your password.",
    body: `
      <p>Use the button below to choose a new password.</p>
      <p>This reset link expires in 30 minutes.</p>
    `,
    ctaText: "Reset Password",
    ctaUrl: resetUrl,
    footerNote: "If you did not request a password reset, you can safely ignore this email."
  });
};

exports.adminManagerInvitationEmail = ({ name, setupUrl, loginUrl, permissions = [] }) => {
  const isNewAccount = Boolean(setupUrl);
  const safePermissions = permissions.map(escapeHtml).join(", ");
  return buildEmailLayout({
    title: "RendaHomes Admin Access",
    greeting: `Hello ${escapeHtml(name)}`,
    intro: isNewAccount
      ? "A RendaHomes super admin has invited you to a limited-access admin manager account."
      : "A RendaHomes super admin has granted admin manager access to your account.",
    body: `<p><strong>Your assigned access:</strong> ${safePermissions || "No admin areas assigned"}</p>${isNewAccount ? "<p>Use the single-use link below to create your password and verify your email. It expires in 30 minutes. After setup, sign in to the Admin Portal using this email address.</p>" : "<p>Sign in with your existing manager account. Your access is limited to the areas listed above.</p>"}`,
    ctaText: isNewAccount ? "Create Password & Verify Email" : "Open Admin Portal",
    ctaUrl: setupUrl || loginUrl,
    footerNote: "If you did not expect this access, contact a RendaHomes super admin."
  });
};

exports.landlordOnboardingFollowupEmail = ({ name, whatsappUrl = "" }) => {
  const help = whatsappUrl
    ? `<p>Questions or stuck somewhere? <a href="${escapeHtml(whatsappUrl)}" style="color:#0D915C;font-weight:700;">Chat with RendaHomes on WhatsApp</a>.</p>`
    : "<p>Questions or stuck somewhere? Reply to this email and our team will help.</p>";
  return buildEmailLayout({
    title: "Your first property listing is a few steps away",
    greeting: `Hello ${escapeHtml(name)}`,
    intro: "You created a RendaHomes landlord account, but it looks like you have not added a property yet.",
    body: `<p>Your dashboard is ready whenever you are. You can add a property, save a draft, and return to finish it later.</p>${help}<p>This is a one-time setup reminder. You can ignore it if you have already started with our team.</p>`,
    ctaText: "Continue in your landlord dashboard",
    ctaUrl: `${landlordClientUrl}/dashboard`,
    footerNote: "You received this service message because you created a RendaHomes landlord account."
  });
};

exports.landlordManualOnboardingEmail = ({ name, subject, message }) => {
  const body = String(message || "")
    .split(/\n{2,}/)
    .map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, "<br />")}</p>`)
    .join("");
  return buildEmailLayout({
    title: escapeHtml(subject || "A note from RendaHomes"),
    greeting: `Hello ${escapeHtml(name || "")}`,
    intro: "A member of the RendaHomes team sent you a message about your landlord account.",
    body,
    ctaText: "Open your landlord dashboard",
    ctaUrl: `${landlordClientUrl}/login`,
    footerNote: "You received this service message about your RendaHomes landlord account."
  });
};

exports.assistedLandlordSetupEmail = ({ name, planName, setupUrl, loginUrl, isPaidPlan = false }) => {
  return buildEmailLayout({
    title: "Your RendaHomes landlord account is ready",
    greeting: `Hello ${escapeHtml(name)}`,
    intro: "RendaHomes has prepared your landlord account and property listing with your approval.",
    body: `<p><strong>Selected package:</strong> ${escapeHtml(planName)}</p><p>Set your password using the secure link below. The link is single-use and expires in 30 minutes. Your property listing will remain under review until it is approved.</p>${isPaidPlan ? "<p>For a paid package, complete subscription payment from your landlord dashboard to activate your listing limit.</p>" : ""}`,
    ctaText: "Set Your Password",
    ctaUrl: setupUrl,
    footerNote: `After setting your password, sign in to your landlord portal at ${escapeHtml(loginUrl)}.`
  });
};

exports.emailVerificationOtpEmail = ({ name, otp }) => {
  return buildEmailLayout({
    title: "Verify Your Email",
    greeting: `Hello ${name}`,
    intro: "Use this code to verify your RendaHomes account.",
    body: `
      <p style="font-size: 28px; font-weight: 700; letter-spacing: 8px; margin: 16px 0;">
        ${otp}
      </p>
      <p>This code expires in 10 minutes.</p>
    `,
    ctaText: "Open RendaHomes",
    ctaUrl: `${landlordClientUrl}/login`,
    footerNote: "If you did not create this account, you can safely ignore this email."
  });
};

exports.subscriptionActivatedEmail = ({ name, plan, billingEndDate }) => {
  return buildEmailLayout({
    title: "Subscription Activated",
    greeting: `Hello ${name}`,
    intro: `Your ${plan.toUpperCase()} plan is now active.`,
    body: `
      <p><strong>Billing period ends:</strong> ${billingEndDate}</p>
      <p>You can now continue listing properties under your plan benefits.</p>
    `,
    ctaText: "Continue Listing Properties",
    ctaUrl: `${landlordClientUrl}/dashboard`
  });
};

exports.gracePeriodEmail = ({ name, graceEndDate }) => {
  return buildEmailLayout({
    title: "Payment Failed — Grace Period Started",
    greeting: `Hello ${name}`,
    intro: "We could not process your subscription payment.",
    body: `
      <p><strong>Grace period ends:</strong> ${graceEndDate}</p>
      <p>Your current listings remain visible for now, but you cannot add new ones until you renew.</p>
    `,
    ctaText: "Renew Subscription",
    ctaUrl: `${landlordClientUrl}/subscription`
  });
};

exports.subscriptionExpiredEmail = ({ name }) => {
  return buildEmailLayout({
    title: "Subscription Expired",
    greeting: `Hello ${name}`,
    intro: "Your subscription grace period has ended.",
    body: `
      <p>Your public listings have been temporarily removed until you renew your plan.</p>
    `,
    ctaText: "Renew Now",
    ctaUrl: `${landlordClientUrl}/subscription`
  });
};

exports.listingSubmittedEmail = ({ name, listingTitle }) => {
  return buildEmailLayout({
    title: "Listing Submitted for Review",
    greeting: `Hello ${name}`,
    intro: `Your property <strong>${listingTitle}</strong> has been submitted successfully.`,
    body: `
      <p>Our team will review it and notify you once it has been approved.</p>
    `,
    ctaText: "View My Listings",
    ctaUrl: `${landlordClientUrl}/listings`
  });
};

exports.listingApprovedEmail = ({ name, listingTitle }) => {
  return buildEmailLayout({
    title: "Listing Approved",
    greeting: `Hi there ${name}`,
    intro: `Your property <strong>${listingTitle}</strong> has been approved.`,
    body: `
      <p>Your listing is now live and visible to users on the platform.</p>
    `,
    ctaText: "Open Dashboard",
    ctaUrl: `${landlordClientUrl}/dashboard`
  });
};

exports.listingRejectedEmail = ({ name, listingTitle }) => {
  return buildEmailLayout({
    title: "Listing Rejected",
    greeting: `Hello ${name}`,
    intro: `Your property <strong>${listingTitle}</strong> was not approved.`,
    body: `
      <p>Please review your submission and make any needed corrections before trying again.</p>
    `,
    ctaText: "Review Listings",
    ctaUrl: `${landlordClientUrl}/listings`
  });
};

exports.inquiryReceivedEmail = ({ landlordName, listingTitle, senderName, senderEmail, senderPhone, message }) => {
  return buildEmailLayout({
    title: "New Property Inquiry",
    greeting: `Hello ${landlordName}`,
    intro: `You received a new inquiry for <strong>${listingTitle}</strong>.`,
    body: `
      <p><strong>Name:</strong> ${senderName}</p>
      <p><strong>Email:</strong> ${senderEmail}</p>
      <p><strong>Phone:</strong> ${senderPhone || "N/A"}</p>
      <p><strong>Message:</strong></p>
      <p>${message}</p>
    `,
    ctaText: "View Inquiries",
    ctaUrl: `${landlordClientUrl}/inquiries`
  });
};

exports.inquiryConfirmationEmail = ({ name, listingTitle }) => {
  return buildEmailLayout({
    title: "Inquiry Sent Successfully",
    greeting: `Hello ${name}`,
    intro: `Your inquiry for <strong>${listingTitle}</strong> has been sent to the landlord.`,
    body: `
      <p>They should contact you using the details you provided if the property is still available.</p>
    `,
    ctaText: "Browse More Listings",
    ctaUrl: `${clientUrl}/listings`
  });
};

exports.stayRequestReceivedEmail = ({ landlordName, listingTitle, guestName, guestEmail, guestPhone, requestCode, checkIn, checkOut, guests, message }) => {
  const safe = (value) => escapeHtml(value || "");
  const formatDate = (value) => new Intl.DateTimeFormat("en-KE", {
    day: "numeric", month: "short", year: "numeric", timeZone: "UTC"
  }).format(new Date(value));
  return buildEmailLayout({
    title: "New Short-Stay Request",
    greeting: `Hello ${safe(landlordName || "Host")}`,
    intro: `A guest has requested a stay at <strong>${safe(listingTitle)}</strong>. The dates are not reserved until you confirm them.`,
    body: `
      <p><strong>Request code:</strong> ${safe(requestCode)}</p>
      <p><strong>Dates:</strong> ${safe(formatDate(checkIn))} – ${safe(formatDate(checkOut))}</p>
      <p><strong>Guests:</strong> ${safe(guests)}</p>
      <p><strong>Guest:</strong> ${safe(guestName)}</p>
      <p><strong>Email:</strong> ${safe(guestEmail)}</p>
      <p><strong>Phone:</strong> ${safe(guestPhone)}</p>
      ${message ? `<p><strong>Message:</strong><br />${safe(message).replace(/\r?\n/g, "<br />")}</p>` : ""}
      <p>Review the request and confirm availability in your landlord dashboard. You can then contact the guest directly.</p>
    `,
    ctaText: "Review stay requests",
    ctaUrl: `${landlordClientUrl}/stay-requests`,
    footerNote: "This is a request, not a confirmed reservation. Do not consider the dates booked until you confirm them."
  });
};

exports.contactReceivedEmail = ({ name, subject }) => {
  return buildEmailLayout({
    title: "We Received Your Message",
    greeting: `Hello ${name}`,
    intro: "Thanks for contacting us.",
    body: `
      <p><strong>Subject:</strong> ${subject}</p>
      <p>Our team will get back to you as soon as possible.</p>
    `,
    ctaText: "Visit RendaHomes",
    ctaUrl: clientUrl
  });
};

exports.adminContactNotificationEmail = ({ name, email, phone, subject, message }) => {
  return buildEmailLayout({
    title: "New Contact Message",
    greeting: "Hello Admin",
    intro: "A new contact message has been submitted.",
    body: `
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Phone:</strong> ${phone}</p>
      <p><strong>Subject:</strong> ${subject}</p>
      <p><strong>Message:</strong></p>
      <p>${message}</p>
    `,
    ctaText: "Open Admin Inbox",
    ctaUrl: `${adminClientUrl}/admin/contact`
  });
};

exports.supportReplyEmail = ({ name, subject, reply }) => {
  return buildEmailLayout({
    title: "Support Ticket Update",
    greeting: `Hello ${name}`,
    intro: `Our team has replied to your support ticket: <strong>${subject}</strong>.`,
    body: `
      <p><strong>Reply:</strong></p>
      <p>${reply}</p>
      <p>Please log in to your dashboard if you want to continue the conversation.</p>
    `,
    ctaText: "Open Support",
    ctaUrl: `${landlordClientUrl}/support`
  });
};

exports.partnerPaymentConfirmedEmail = ({ contactPerson, companyName, category }) => {
  return buildEmailLayout({
    title: "Partner Application Payment Confirmed",
    greeting: `Hello ${contactPerson}`,
    intro: "Your payment for joining RendaHomes as a service partner has been confirmed successfully.",
    body: `
      <p><strong>Company:</strong> ${companyName}</p>
      <p><strong>Category:</strong> ${category}</p>
      <p>Your application is now pending admin review.</p>
    `,
    ctaText: "Explore Services",
    ctaUrl: `${clientUrl}/services`
  });
};

exports.partnerApprovedEmail = ({ contactPerson, companyName, category }) => {
  return buildEmailLayout({
    title: "Partner Application Approved",
    greeting: `Hello ${contactPerson}`,
    intro: `Your company <strong>${companyName}</strong> has been approved as a RendaHomes service partner.`,
    body: `
      <p>Your details can now be displayed under the <strong>${category}</strong> category on our platform.</p>
    `,
    ctaText: "View Our Services",
    ctaUrl: `${clientUrl}/services/${category}`
  });
};

exports.partnerRejectedEmail = ({ contactPerson, companyName }) => {
  return buildEmailLayout({
    title: "Partner Application Update",
    greeting: `Hello ${contactPerson}`,
    intro: `Your partner application for <strong>${companyName}</strong> was not approved at this time.`,
    body: `
      <p>If needed, our team may contact you with more details.</p>
    `,
    ctaText: "Visit RendaHomes",
    ctaUrl: clientUrl
  });
};

exports.blogPublishedEmail = ({ title, excerpt, slug, coverImage = "", coverImageAlt = "" }) => {
  const articleUrl = `${clientUrl}/blog/${encodeURIComponent(String(slug || ""))}`;
  let safeCoverImage = "";
  try {
    const parsedImageUrl = new URL(String(coverImage || ""));
    if (parsedImageUrl.protocol === "https:") safeCoverImage = parsedImageUrl.href;
  } catch {
    safeCoverImage = "";
  }

  return buildEmailLayout({
    title: escapeHtml(title || "New article from Renda Homes"),
    intro: "",
    preheader: escapeHtml(excerpt || title || "Read the latest from Renda Homes."),
    body: `
      ${safeCoverImage ? `<p style="margin:0 0 20px;"><a href="${escapeHtml(articleUrl)}" target="_blank"><img src="${escapeHtml(safeCoverImage)}" alt="${escapeHtml(coverImageAlt || title || "Renda Homes article cover")}" style="display:block;width:100%;max-width:560px;height:auto;max-height:360px;object-fit:cover;border-radius:12px;" /></a></p>` : ""}
      ${excerpt ? `<p style="margin:0 0 18px;">${escapeHtml(excerpt)}</p>` : ""}
      <p style="margin:0;"><a href="${escapeHtml(articleUrl)}" target="_blank" style="color:#0D915C;font-weight:700;text-decoration:underline;">Read More</a></p>
    `
  });
};

exports.newsletterWelcomeEmail = () => {
  return buildEmailLayout({
    title: "Subscription Confirmed",
    greeting: "Hello",
    intro: "Thanks for subscribing to Renda blog updates.",
    body: `
      <p>You’ll receive an email every time we publish a new article.</p>
    `,
    ctaText: "Check Out Our Latest Articles",
    ctaUrl: `${clientUrl}/blog`
  });
};

exports.appSubscriptionConfirmedEmail = ({ source = "mobile_app" } = {}) => {
  const isWebsite = source === "website";
  return buildEmailLayout({
    title: "RendaHomes Updates Subscription Confirmed",
    greeting: "Hello",
    intro: `Thanks for subscribing to RendaHomes ${isWebsite ? "website" : "mobile app"} updates.`,
    body: `
      <p>You’ll receive email when we post relevant ${isWebsite ? "website" : "mobile app"} service updates, announcements, and maintenance notices. Article newsletter emails are managed separately.</p>
    `,
    ctaText: "Open RendaHomes",
    ctaUrl: clientUrl
  });
};

exports.appUpdatePublishedEmail = ({ title, body, category, audience = "mobile_app" }) => {
  const isWebsite = audience === "website";
  const isBoth = audience === "all";
  const updateChannel = isBoth
    ? "RendaHomes website and mobile app"
    : isWebsite
      ? "RendaHomes website"
      : "RendaHomes mobile app";

  return buildEmailLayout({
    title: "New RendaHomes Update",
    greeting: "Hello",
    intro: `We just posted a new ${category || "platform"} update for ${updateChannel}: <strong>${title}</strong>.`,
    body: body || "",
    ctaText: isWebsite ? "Visit RendaHomes" : "Open RendaHomes",
    ctaUrl: clientUrl,
    footerNote: isWebsite || isBoth
      ? "Website service updates are sent to verified landlord accounts and people subscribed to website updates. Article newsletter emails are separate and optional. To request an email preference change, contact privacy@rendahomes.com."
      : undefined
  });
};

exports.agentInviteEmail = ({ name, agentCode, landlordLink, loginUrl, setupUrl }) => {
  const safeName = escapeHtml(name);
  const safeAgentCode = escapeHtml(agentCode);
  const safeLandlordLink = escapeHtml(landlordLink);
  const destination = setupUrl || loginUrl || `${userClientUrl}/login`;
  return buildEmailLayout({
    title: "Your RendaHomes Agent Account",
    greeting: `Hello ${safeName}`,
    intro: setupUrl ? "Your agent account has been approved. Set a password securely to finish activating your access." : "Your RendaHomes agent access is ready. Sign in to onboard landlords and track your referrals.",
    body: `
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 20px;">
        <tr>
          <td style="padding:12px 14px; border-radius:10px; background:#F8FAF8;">
            <p style="margin:0 0 8px; color:#647C75; font-size:13px;">Agent code</p>
            <p style="margin:0; color:#013E43; font-size:20px; font-weight:800; letter-spacing:1px;">${safeAgentCode}</p>
          </td>
        </tr>
      </table>
      ${setupUrl ? "<p>This single-use setup link expires in 30 minutes.</p>" : ""}
      <p><strong>Landlord referral link:</strong><br /><a href="${safeLandlordLink}" style="color:#013E43; font-weight:700;">${safeLandlordLink}</a></p>
      <p>After signing in, open your instructions page to read onboarding guides shared by admin.</p>
    `,
    ctaText: setupUrl ? "Set Your Password" : "Open Agent Portal",
    ctaUrl: destination,
    footerNote: "If you did not expect this invitation, contact RendaHomes support."
  });
};

exports.agentApplicationRejectedEmail = ({ name, reviewNote = "" }) => buildEmailLayout({
  title: "RendaHomes Agent Application Update",
  greeting: `Hello ${escapeHtml(name)}`,
  intro: "Thank you for your interest in joining the RendaHomes agent network.",
  body: `<p>We are unable to approve your application at this time.</p>${reviewNote ? `<p><strong>Admin note:</strong> ${escapeHtml(reviewNote)}</p>` : ""}<p>You may contact RendaHomes support if you have questions.</p>`,
  ctaText: "Visit RendaHomes",
  ctaUrl: clientUrl,
  footerNote: "This decision applies to the agent application only; it does not affect any existing RendaHomes account."
});

exports.agentInstructionEmail = ({ name, title, content }) => {
  return buildEmailLayout({
    title: "New Agent Update",
    greeting: `Hello ${name}`,
    intro: `<strong>${title}</strong>`,
    body: content,
    ctaText: "Read in Agent Portal",
    ctaUrl: `${userClientUrl}/agent/instructions`
  });
};
