const buildEmailLayout = require("./emailLayout");

const appName = "Makao";
const clientUrl = process.env.CLIENT_URL || "https://rendahomes.com";

exports.welcomeEmail = ({ name, planName, isFreePlan }) => {
  return buildEmailLayout({
    title: "Welcome to RendaHomes",
    greeting: `Hello ${name},`,
    intro: `
      Finding the right tenants shouldn't feel like a gamble.

      RendaHomes is built to help landlords like you list properties faster, reach serious tenants, and reduce the time your units stay vacant. 
      Instead of relying on agents and uncertain referrals, you now have a direct platform to showcase your property and stay in control.
    `,
    body: `
      <p><strong>Selected plan:</strong> ${planName}</p>
      <p>
        ${
          isFreePlan
            ? "You can now log in and list your first property immediately. Start getting inquiries from potential tenants without delays."
            : "Your account is ready. Complete payment to activate your plan and unlock full access to list and manage your properties."
        }
      </p>
    `,
    ctaText: "Go to RendaHomes",
    ctaUrl: `${clientUrl}/login`,
    footerNote: "If you did not create this account, you can ignore this email."
  });
};

exports.passwordResetEmail = ({ name, resetUrl }) => {
  return buildEmailLayout({
    title: "Reset Your Password",
    greeting: `Hello ${name},`,
    intro: "We received a request to reset your password.",
    body: `
      <p>Use the button below to choose a new password.</p>
      <p>This reset link will expire in 30 minutes.</p>
    `,
    ctaText: "Reset Password",
    ctaUrl: resetUrl,
    footerNote: "If you did not request a password reset, you can safely ignore this email."
  });
};

exports.subscriptionActivatedEmail = ({ name, plan, billingEndDate }) => {
  return buildEmailLayout({
    title: "Subscription Activated",
    greeting: `Hello ${name},`,
    intro: `Your ${plan.toUpperCase()} plan is now active.`,
    body: `
      <p><strong>Billing period ends:</strong> ${billingEndDate}</p>
      <p>You can now continue listing properties under your plan benefits.</p>
    `,
    ctaText: "Open Dashboard",
    ctaUrl: `${clientUrl}/landlord/dashboard`
  });
};

exports.gracePeriodEmail = ({ name, graceEndDate }) => {
  return buildEmailLayout({
    title: "Payment Failed — Grace Period Started",
    greeting: `Hello ${name},`,
    intro: "We could not process your subscription payment.",
    body: `
      <p><strong>Grace period ends:</strong> ${graceEndDate}</p>
      <p>Your current listings remain visible for now, but you cannot add new ones until you renew.</p>
    `,
    ctaText: "Renew Subscription",
    ctaUrl: `${clientUrl}/landlord/subscription`
  });
};

exports.subscriptionExpiredEmail = ({ name }) => {
  return buildEmailLayout({
    title: "Subscription Expired",
    greeting: `Hello ${name},`,
    intro: "Your subscription grace period has ended.",
    body: `
      <p>Your public listings have been temporarily removed until you renew your plan.</p>
    `,
    ctaText: "Renew Now",
    ctaUrl: `${clientUrl}/landlord/subscription`
  });
};

exports.listingSubmittedEmail = ({ name, listingTitle }) => {
  return buildEmailLayout({
    title: "Listing Submitted for Review",
    greeting: `Hello ${name},`,
    intro: `Your property <strong>${listingTitle}</strong> has been submitted successfully.`,
    body: `
      <p>Our team will review it and notify you once it has been approved.</p>
    `,
    ctaText: "View My Listings",
    ctaUrl: `${clientUrl}/landlord/listings`
  });
};

exports.listingApprovedEmail = ({ name, listingTitle }) => {
  return buildEmailLayout({
    title: "Listing Approved",
    greeting: `Hello ${name},`,
    intro: `Your property <strong>${listingTitle}</strong> has been approved.`,
    body: `
      <p>Your listing is now live and visible to users on the platform.</p>
    `,
    ctaText: "Open Dashboard",
    ctaUrl: `${clientUrl}/landlord/dashboard`
  });
};

exports.listingRejectedEmail = ({ name, listingTitle }) => {
  return buildEmailLayout({
    title: "Listing Rejected",
    greeting: `Hello ${name},`,
    intro: `Your property <strong>${listingTitle}</strong> was not approved.`,
    body: `
      <p>Please review your submission and make any needed corrections before trying again.</p>
    `,
    ctaText: "Review Listings",
    ctaUrl: `${clientUrl}/landlord/properties`
  });
};

exports.inquiryReceivedEmail = ({ landlordName, listingTitle, senderName, senderEmail, senderPhone, message }) => {
  return buildEmailLayout({
    title: "New Property Inquiry",
    greeting: `Hello ${landlordName},`,
    intro: `You received a new inquiry for <strong>${listingTitle}</strong>.`,
    body: `
      <p><strong>Name:</strong> ${senderName}</p>
      <p><strong>Email:</strong> ${senderEmail}</p>
      <p><strong>Phone:</strong> ${senderPhone || "N/A"}</p>
      <p><strong>Message:</strong></p>
      <p>${message}</p>
    `,
    ctaText: "View Inquiries",
    ctaUrl: `${clientUrl}/landlord/inquiries`
  });
};

exports.inquiryConfirmationEmail = ({ name, listingTitle }) => {
  return buildEmailLayout({
    title: "Inquiry Sent Successfully",
    greeting: `Hello ${name},`,
    intro: `Your inquiry for <strong>${listingTitle}</strong> has been sent to the landlord.`,
    body: `
      <p>They should contact you using the details you provided if the property is still available.</p>
    `,
    ctaText: "Browse More Listings",
    ctaUrl: `${clientUrl}/properties`
  });
};

exports.contactReceivedEmail = ({ name, subject }) => {
  return buildEmailLayout({
    title: "We Received Your Message",
    greeting: `Hello ${name},`,
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
    greeting: "Hello Admin,",
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
    ctaUrl: `${clientUrl}/admin/contact`
  });
};

exports.supportReplyEmail = ({ name, subject, reply }) => {
  return buildEmailLayout({
    title: "Support Ticket Update",
    greeting: `Hello ${name},`,
    intro: `Our team has replied to your support ticket: <strong>${subject}</strong>.`,
    body: `
      <p><strong>Reply:</strong></p>
      <p>${reply}</p>
      <p>Please log in to your dashboard if you want to continue the conversation.</p>
    `,
    ctaText: "Open Support",
    ctaUrl: `${clientUrl}/landlord/support`
  });
};

exports.partnerPaymentConfirmedEmail = ({ contactPerson, companyName, category }) => {
  return buildEmailLayout({
    title: "Partner Application Payment Confirmed",
    greeting: `Hello ${contactPerson},`,
    intro: "Your payment for joining Makao as a service partner has been confirmed successfully.",
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
    greeting: `Hello ${contactPerson},`,
    intro: `Your company <strong>${companyName}</strong> has been approved as a Makao service partner.`,
    body: `
      <p>Your details can now be displayed under the <strong>${category}</strong> category on our platform.</p>
    `,
    ctaText: "View Services",
    ctaUrl: `${clientUrl}/services/${category}`
  });
};

exports.partnerRejectedEmail = ({ contactPerson, companyName }) => {
  return buildEmailLayout({
    title: "Partner Application Update",
    greeting: `Hello ${contactPerson},`,
    intro: `Your partner application for <strong>${companyName}</strong> was not approved at this time.`,
    body: `
      <p>If needed, our team may contact you with more details.</p>
    `,
    ctaText: "Visit RendaHomes",
    ctaUrl: clientUrl
  });
};

exports.blogPublishedEmail = ({ title, excerpt, slug }) => {
  return buildEmailLayout({
    title: "New Blog Post on RendaHomes",
    greeting: "Hi there,",
    intro: `We just published a new article: <strong>${title}</strong>.`,
    body: `
      <p>${excerpt}</p>
      <
    `,
    ctaText: "Read Article",
    ctaUrl: `${clientUrl}/blog/${slug}`
  });
};

exports.newsletterWelcomeEmail = () => {
  return buildEmailLayout({
    title: "Subscription Confirmed",
    greeting: "Hello,",
    intro: "Thanks for subscribing to Renda blog updates.",
    body: `
      <p>You’ll receive an email every time we publish a new article.</p>
    `,
    ctaText: "Visit Blog",
    ctaUrl: `${clientUrl}/blog`
  });
};