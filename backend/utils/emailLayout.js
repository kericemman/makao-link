const buildEmailLayout = ({
  title,
  greeting = "",
  intro = "",
  body = "",
  ctaText = "",
  ctaUrl = "",
  footerNote = "",
  brandName = "RendaHomes",
  accentColor = "#013E43",
  highlightColor = "#02BB31",
  // New options
  preheader = "",
  logo = "",
  secondaryCtaText = "",
  secondaryCtaUrl = "",
  showSocialLinks = true,
  unsubscribeUrl = "",
  recipientName = "",
  year = new Date().getFullYear(),
  socialLinks = {
    facebook: "https://www.facebook.com/share/1KYNTYg9YZ/",
    twitter: "https://x.com/RendaHomes",
    instagram: "https://www.instagram.com/renda.homes?igsh=MW5hM2s3dHMyeHZlaQ==",
    linkedin: "https://www.linkedin.com/company/renda-homes/",

  }
}) => {
  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${title}</title>
        ${preheader ? `<meta name="description" content="${preheader}" />` : ""}
      </head>
      <body style="margin:0; padding:0; background-color:#f4f7f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color:#1f2937;">
        <!-- Preheader text (hidden) -->
        ${preheader ? `<div style="display:none; font-size:0; color:#f4f7f6; max-height:0; overflow:hidden;">${preheader}</div>` : ""}
        
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f4f7f6; margin:0; padding:40px 0;">
          <tr>
            <td align="center">
              <!-- Main Container -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px; background:#ffffff; border-radius:24px; overflow:hidden; box-shadow:0 8px 24px rgba(0,0,0,0.08);">
                
                <!-- Header with Logo -->
                <tr>
                  <td style="background:linear-gradient(135deg, ${accentColor}, #005C57); padding:40px 28px; text-align:center;">
                    ${logo ? `<img src="${logo}" alt="${brandName}" style="width:60px; height:auto; margin-bottom:16px;" />` : ""}
                    <h1 style="margin:0; font-size:32px; color:#ffffff; font-weight:800; letter-spacing:-0.5px;">${brandName}</h1>
                    <p style="margin:12px 0 0; font-size:14px; color:#d1fae5; font-weight:400;">Helping people move, settle, and manage property better.</p>
                  </td>
                </tr>

                <!-- Main Content -->
                <tr>
                  <td style="padding:40px 32px;">
                    ${recipientName ? `<p style="margin:0 0 24px; font-size:14px; color:#6b7280;">Dear ${recipientName},</p>` : ""}
                    
                    ${greeting ? `<h2 style="margin:0 0 16px; font-size:26px; line-height:1.3; color:${accentColor}; font-weight:700;">${greeting}</h2>` : ""}

                    ${title && !greeting ? `<h2 style="margin:0 0 16px; font-size:24px; line-height:1.3; color:${accentColor}; font-weight:700;">${title}</h2>` : ""}

                    ${intro ? `<p style="margin:0 0 20px; font-size:16px; line-height:1.7; color:#374151;">${intro}</p>` : ""}

                    ${body ? `<div style="margin:0 0 28px; font-size:16px; line-height:1.8; color:#374151;">${body}</div>` : ""}

                    <!-- Primary CTA Button -->
                    ${ctaText && ctaUrl ? `
                      <div style="margin:32px 0 24px; text-align:center;">
                        <a href="${ctaUrl}" target="_blank" rel="noreferrer" style="display:inline-block; padding:14px 28px; border-radius:12px; background:${highlightColor}; color:#ffffff; text-decoration:none; font-size:16px; font-weight:600; box-shadow:0 2px 8px rgba(2,187,49,0.2); transition:all 0.3s ease;">
                          ${ctaText}
                        </a>
                      </div>
                    ` : ""}

                    <!-- Secondary CTA Button -->
                    ${secondaryCtaText && secondaryCtaUrl ? `
                      <div style="margin:0 0 24px; text-align:center;">
                        <a href="${secondaryCtaUrl}" target="_blank" rel="noreferrer" style="display:inline-block; padding:12px 24px; border-radius:12px; background:transparent; border:2px solid ${highlightColor}; color:${highlightColor}; text-decoration:none; font-size:14px; font-weight:600;">
                          ${secondaryCtaText}
                        </a>
                      </div>
                    ` : ""}

                    ${footerNote ? `<p style="margin:32px 0 0; font-size:13px; line-height:1.7; color:#6b7280; border-left:3px solid ${highlightColor}; padding-left:16px; font-style:italic;">${footerNote}</p>` : ""}
                  </td>
                </tr>

                <!-- Divider -->
                <tr>
                  <td style="padding:0 32px;">
                    <hr style="border:none; border-top:1px solid #e5e7eb; margin:0;" />
                  </td>
                </tr>

                <!-- Social Links -->
                ${showSocialLinks ? `
                <tr>
                  <td style="padding:28px 32px 20px; text-align:center;">
                    <div style="display:inline-flex; gap:16px; justify-content:center;">
                      ${socialLinks.facebook ? `<a href="${socialLinks.facebook}" target="_blank" rel="noopener noreferrer" style="display:inline-block; width:36px; height:36px; text-align:center; line-height:36px; text-decoration:none;">
                        <img src="https://cdn-icons-png.flaticon.com/512/124/124010.png" alt="Facebook" style="width:18px; height:18px; vertical-align:middle;" />
                      </a>` : ""}
                      ${socialLinks.twitter ? `<a href="${socialLinks.twitter}" target="_blank" rel="noopener noreferrer" style="display:inline-block; width:36px; height:36px;  text-align:center; line-height:36px; text-decoration:none;">
                        <img src="https://cdn-icons-png.flaticon.com/512/124/124021.png" alt="Twitter" style="width:18px; height:18px; vertical-align:middle;" />
                      </a>` : ""}
                      ${socialLinks.instagram ? `<a href="${socialLinks.instagram}" target="_blank" rel="noopener noreferrer" style="display:inline-block; width:36px; height:36px; text-align:center; line-height:36px; text-decoration:none;">
                        <img src="https://cdn-icons-png.flaticon.com/512/2111/2111463.png" alt="Instagram" style="width:18px; height:18px; vertical-align:middle;" />
                      </a>` : ""}
                      ${socialLinks.linkedin ? `<a href="${socialLinks.linkedin}" target="_blank" rel="noopener noreferrer" style="display:inline-block; width:36px; height:36px;  text-align:center; line-height:36px; text-decoration:none;">
                        <img src="https://cdn-icons-png.flaticon.com/512/174/174857.png" alt="LinkedIn" style="width:18px; height:18px; vertical-align:middle;" />
                      </a>` : ""}
                    </div>
                  </td>
                </tr>
                ` : ""}

                <!-- Footer -->
                <tr>
                  <td style="padding:24px 32px 32px; background:#fafafa; text-align:center;">
                    <p style="margin:0 0 12px; font-size:12px; color:#6b7280; line-height:1.5;">
                      © ${year} ${brandName}. All rights reserved.
                    </p>
                    <p style="margin:0 0 16px; font-size:12px; color:#6b7280;">
                      Helping tenants find homes and landlords manage properties.
                    </p>
                    ${unsubscribeUrl ? `
                      <div style="margin-top:12px;">
                        <a href="${unsubscribeUrl}" style="font-size:11px; color:#9ca3af; text-decoration:underline;">Unsubscribe</a>
                      </div>
                    ` : ""}
                    <p style="margin:16px 0 0; font-size:11px; color:#9ca3af;">
                      This email was sent by ${brandName}. Please do not reply directly unless instructed.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
};

module.exports = buildEmailLayout;