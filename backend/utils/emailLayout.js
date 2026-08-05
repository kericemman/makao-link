const defaultLogo =
  process.env.EMAIL_LOGO_URL ||
  "https://res.cloudinary.com/dhlz0p70t/image/upload/v1776431303/Renda_Homes_Logo_rmf8hj.jpg";

const defaultSocials = {
  facebook: "https://www.facebook.com/share/1KYNTYg9YZ/",
  instagram: "https://www.instagram.com/renda.homes?igsh=MW5hM2s3dHMyeHZlaQ==",
  linkedin: "https://www.linkedin.com/company/renda-homes/",
  x: "https://x.com/RendaHomes"
};

const normalizeText = (value = "") =>
  String(value)
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const buildEmailLayout = ({
  title,
  greeting = "",
  intro = "",
  body = "",
  ctaText = "",
  ctaUrl = "",
  secondaryCtaText = "",
  secondaryCtaUrl = "",
  footerNote = "",
  preheader = "",
  brandName = "RendaHomes",
  logo = defaultLogo,
  accentColor = "#013E43",
  highlightColor = "#0D915C",
  mutedColor = "#647C75",
  showSocialLinks = false,
  unsubscribeUrl = "",
  year = new Date().getFullYear(),
  socialLinks = defaultSocials
}) => {
  const preview = preheader || normalizeText(intro || body || title).slice(0, 150);

  return `
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="color-scheme" content="light" />
    <meta name="supported-color-schemes" content="light" />
    <title>${title || brandName}</title>
    <style>
      @media only screen and (max-width: 640px) {
        .rh-wrapper { padding: 18px 10px !important; }
        .rh-card { width: 100% !important; border-radius: 18px !important; }
        .rh-content { padding: 26px 20px !important; }
        .rh-header { padding: 22px 20px !important; }
        .rh-title { font-size: 24px !important; line-height: 31px !important; }
        .rh-button { display: block !important; width: 100% !important; box-sizing: border-box !important; }
      }
    </style>
  </head>
  <body style="margin:0; padding:0; background:#EEF6F1; font-family:Arial, Helvetica, sans-serif; color:#173B3C;">
    <div style="display:none; max-height:0; overflow:hidden; opacity:0; color:transparent; line-height:1px; font-size:1px;">
      ${preview}
    </div>

    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#EEF6F1; margin:0; padding:0;">
      <tr>
        <td align="center" class="rh-wrapper" style="padding:40px 16px;">
          <table role="presentation" width="640" cellspacing="0" cellpadding="0" border="0" class="rh-card" style="width:640px; max-width:640px; background:#ffffff; border:1px solid #DDEAE3; border-radius:24px; overflow:hidden;">
            <tr>
              <td class="rh-header" style="padding:26px 34px; background:${accentColor};">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                  <tr>
                    <td align="left" style="vertical-align:middle;">
                      ${
                        logo
                          ? `<img src="${logo}" width="136" alt="${brandName}" style="display:block; width:136px; max-width:136px; height:auto; border:0; border-radius:8px; background:#ffffff;" />`
                          : `<span style="font-size:22px; font-weight:700; color:#ffffff;">${brandName}</span>`
                      }
                    </td>
                    <td align="right" style="vertical-align:middle;">
                      <span style="display:inline-block; padding:7px 11px; border:1px solid rgba(255,255,255,0.2); border-radius:999px; color:#DFF4E8; font-size:11px; font-weight:700; letter-spacing:1.2px; text-transform:uppercase;">
                        Find. Rent. Live.
                      </span>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <tr>
              <td class="rh-content" style="padding:36px 42px 32px;">
                ${
                  title
                    ? `<h1 class="rh-title" style="margin:0 0 12px; color:${accentColor}; font-size:30px; line-height:38px; font-weight:800; letter-spacing:-0.02em;">${title}</h1>`
                    : ""
                }
                ${greeting ? `<p style="margin:0 0 18px; color:${accentColor}; font-size:17px; line-height:26px; font-weight:700;">${greeting},</p>` : ""}
                ${intro ? `<div style="margin:0 0 22px; color:#334B4B; font-size:16px; line-height:27px;">${intro}</div>` : ""}
                ${body ? `<div style="margin:0; color:#334B4B; font-size:15px; line-height:26px;">${body}</div>` : ""}

                ${
                  ctaText && ctaUrl
                    ? `
                      <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:30px 0 0;">
                        <tr>
                          <td align="center" bgcolor="${highlightColor}" style="border-radius:12px;">
                            <a href="${ctaUrl}" target="_blank" class="rh-button" style="display:inline-block; padding:14px 22px; color:#ffffff; font-size:15px; line-height:20px; font-weight:700; text-decoration:none; border-radius:12px;">
                              ${ctaText}
                            </a>
                          </td>
                        </tr>
                      </table>
                    `
                    : ""
                }

                ${
                  secondaryCtaText && secondaryCtaUrl
                    ? `<p style="margin:18px 0 0; font-size:14px; line-height:22px;"><a href="${secondaryCtaUrl}" target="_blank" style="color:${accentColor}; font-weight:700; text-decoration:underline;">${secondaryCtaText}</a></p>`
                    : ""
                }

                ${
                  footerNote
                    ? `<div style="margin:30px 0 0; padding:14px 16px; border-left:4px solid ${highlightColor}; background:#F5FAF7; border-radius:10px; color:${mutedColor}; font-size:13px; line-height:21px;">${footerNote}</div>`
                    : ""
                }
              </td>
            </tr>

            ${
              showSocialLinks
                ? `
                  <tr>
                    <td style="padding:0 42px 24px;">
                      <p style="margin:0; color:${mutedColor}; font-size:12px; line-height:20px;">
                        Follow RendaHomes:
                        ${socialLinks.facebook ? `<a href="${socialLinks.facebook}" style="color:${accentColor}; font-weight:700; text-decoration:none;">Facebook</a>` : ""}
                        ${socialLinks.instagram ? ` &nbsp; <a href="${socialLinks.instagram}" style="color:${accentColor}; font-weight:700; text-decoration:none;">Instagram</a>` : ""}
                        ${socialLinks.linkedin ? ` &nbsp; <a href="${socialLinks.linkedin}" style="color:${accentColor}; font-weight:700; text-decoration:none;">LinkedIn</a>` : ""}
                        ${socialLinks.x ? ` &nbsp; <a href="${socialLinks.x}" style="color:${accentColor}; font-weight:700; text-decoration:none;">X</a>` : ""}
                      </p>
                    </td>
                  </tr>
                `
                : ""
            }

            <tr>
              <td style="padding:24px 42px 30px; background:#F8FAF8; border-top:1px solid #DDEAE3;">
                <p style="margin:0 0 8px; color:${mutedColor}; font-size:12px; line-height:19px;">
                  © ${year} ${brandName}. All rights reserved.
                </p>
                <p style="margin:0; color:#8A9C96; font-size:11px; line-height:18px;">
                  You received this email because you use RendaHomes or contacted our team.
                  ${unsubscribeUrl ? `<br /><a href="${unsubscribeUrl}" style="color:${mutedColor}; text-decoration:underline;">Unsubscribe</a>` : ""}
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
