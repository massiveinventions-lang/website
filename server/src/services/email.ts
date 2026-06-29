import { config } from "../config";
import { Resend } from "resend";

interface SendOtpArgs {
  email: string;
  code: string;
  expiresInMinutes: number;
}

/**
 * Brand colors — must match the rest of the site. Defined here so the
 * email template stays in sync if the brand palette ever changes.
 */
const BRAND = {
  primary: "#C07838",     // accent brown
  background: "#FAF8F5",  // soft cream
  text: "#1F1A14",       // foreground
  textMuted: "#6B5E52",
} as const;

/**
 * Build the HTML email body. Kept inline-styled so it renders correctly
 * in every mail client (Gmail, Outlook, Apple Mail) without relying on
 * <style> tags or external CSS.
 */
function buildOtpEmailHtml(args: SendOtpArgs): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:${BRAND.background};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:${BRAND.text};">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:${BRAND.background};padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width:480px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
          <!-- Header -->
          <tr>
            <td style="padding:32px 32px 16px 32px;text-align:center;border-bottom:1px solid #f0ebe4;">
              <h1 style="margin:0;font-size:24px;font-weight:900;color:${BRAND.text};letter-spacing:-0.02em;">
                Massive <span style="color:${BRAND.primary};">Inventions</span>
              </h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              <h2 style="margin:0 0 16px 0;font-size:20px;font-weight:700;color:${BRAND.text};">
                Your sign-in code
              </h2>
              <p style="margin:0 0 24px 0;font-size:15px;line-height:1.5;color:${BRAND.textMuted};">
                Enter this code in the browser to sign in. It expires in ${args.expiresInMinutes} minutes and can only be used once.
              </p>

              <!-- Code box — monospace, large, centered -->
              <div style="background:${BRAND.background};border:2px dashed ${BRAND.primary};border-radius:12px;padding:24px;text-align:center;margin-bottom:24px;">
                <div style="font-family:'SF Mono',Monaco,'Cascadia Code','Roboto Mono',Consolas,monospace;font-size:36px;font-weight:700;letter-spacing:0.3em;color:${BRAND.primary};">
                  ${args.code}
                </div>
              </div>

              <p style="margin:0 0 8px 0;font-size:13px;color:${BRAND.textMuted};">
                If you didn't request this code, you can safely ignore this email.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:16px 32px 24px 32px;text-align:center;border-top:1px solid #f0ebe4;">
              <p style="margin:0;font-size:11px;color:${BRAND.textMuted};">
                © ${new Date().getFullYear()} Massive Inventions · Handcrafted wooden audio from India
              </p>
            </td>
          </tr>
        </table>

        <p style="margin:24px 0 0 0;font-size:11px;color:${BRAND.textMuted};text-align:center;">
          This is a transactional email. Replies are not monitored.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();
}

function buildOtpEmailText(args: SendOtpArgs): string {
  return [
    `Massive Inventions — Your sign-in code`,
    ``,
    `Enter this code in your browser to sign in:`,
    ``,
    `    ${args.code}`,
    ``,
    `This code expires in ${args.expiresInMinutes} minutes and can only be used once.`,
    `If you didn't request this, you can safely ignore this email.`,
    ``,
    `— Massive Inventions`,
  ].join("\n");
}

/**
 * Send a one-time login code to the user's email address.
 *
 * Provider: Resend (https://resend.com) — 3,000/month free, 100/day free.
 * Sign up, verify your domain (or use the sandbox domain for dev), and
 * paste the API key into RESEND_API_KEY in server/.env.
 *
 * In dev (mock mode): logs the code to the server console so the
 * developer can verify locally without sending a real email. The dev
 * code is also returned via the HTTP response for the UI's optional
 * dev-mode display. NOT shown to production users.
 */
export async function sendLoginOtp(args: SendOtpArgs): Promise<void> {
  const subject = `Your Massive Inventions sign-in code: ${args.code}`;

  if (config.useMocks) {
    console.log(
      `\n[email/mock] OTP for ${args.email}: ${args.code}  (expires in ${args.expiresInMinutes}min)\n`
    );
    return;
  }

  const apiKey = process.env.RESEND_API_KEY ?? "";
  if (!apiKey) {
    // No key configured — fail loudly so this doesn't go unnoticed.
    throw new Error(
      "RESEND_API_KEY is not set. Add it to server/.env (sign up at https://resend.com) or set MOCK_INTEGRATIONS=true for dev."
    );
  }

  const fromAddress = process.env.RESEND_FROM ?? "Massive Inventions <no-reply@massiveinvention.in>";
  const resend = new Resend(apiKey);

  const { error } = await resend.emails.send({
    from: fromAddress,
    to: [args.email], // ← actual recipient, not WEB3FORMS_TO
    subject,
    text: buildOtpEmailText(args),
    html: buildOtpEmailHtml(args),
  });

  if (error) {
    throw new Error(`Resend failed: ${error.message ?? "unknown error"}`);
  }
}

interface OrderConfirmationArgs {
  email: string;
  orderId: string;
  total: number;
  trackingUrl?: string;
  awb?: string;
}

function buildOrderEmailHtml(args: OrderConfirmationArgs): string {
  const trackButton = args.trackingUrl 
    ? `
      <tr>
        <td align="center" style="padding-top:24px;">
          <a href="${args.trackingUrl}" style="display:inline-block;padding:14px 32px;background-color:${BRAND.primary};color:#ffffff;text-decoration:none;font-weight:600;font-size:16px;border-radius:8px;box-shadow:0 4px 12px rgba(192, 120, 56, 0.25);">Track Your Order</a>
          <p style="margin-top:16px;font-size:14px;color:${BRAND.textMuted};">AWB: <strong>${args.awb}</strong></p>
        </td>
      </tr>
    `
    : `
      <tr>
        <td align="center" style="padding-top:24px;">
          <p style="margin-top:16px;font-size:14px;color:${BRAND.textMuted};">Your tracking details will be updated shortly.</p>
        </td>
      </tr>
    `;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:${BRAND.background};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:${BRAND.text};">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:${BRAND.background};padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width:480px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
          <tr>
            <td style="padding:32px 32px 16px 32px;text-align:center;border-bottom:1px solid #f0ebe4;">
              <h1 style="margin:0;font-size:24px;font-weight:900;color:${BRAND.text};letter-spacing:-0.02em;">
                Massive <span style="color:${BRAND.primary};">Inventions</span>
              </h1>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <h2 style="margin:0 0 16px 0;font-size:20px;font-weight:700;text-align:center;">Order Confirmed!</h2>
              <p style="margin:0 0 16px 0;font-size:16px;line-height:1.5;color:${BRAND.textMuted};text-align:center;">
                Thank you for your purchase. We have received your order and are preparing it for shipment.
              </p>
              <div style="background:#FAF8F5;border-radius:12px;padding:24px;margin-bottom:24px;text-align:center;">
                <p style="margin:0 0 8px 0;font-size:14px;color:${BRAND.textMuted};">Order ID</p>
                <p style="margin:0 0 16px 0;font-size:16px;font-weight:600;">${args.orderId.split("-")[0].toUpperCase()}</p>
                <p style="margin:0 0 8px 0;font-size:14px;color:${BRAND.textMuted};">Total Paid</p>
                <p style="margin:0;font-size:18px;font-weight:700;color:${BRAND.primary};">₹${args.total.toLocaleString("en-IN")}</p>
              </div>
              ${trackButton}
            </td>
          </tr>
          <tr>
            <td style="background:#faf8f5;padding:24px 32px;text-align:center;border-top:1px solid #f0ebe4;">
              <p style="margin:0;font-size:13px;color:#a89f91;line-height:1.5;">
                Need help? Reply to this email.<br>
                &copy; ${new Date().getFullYear()} Massive Inventions. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function sendOrderConfirmationEmail(args: OrderConfirmationArgs): Promise<void> {
  const subject = `Order Confirmed: #${args.orderId.split("-")[0].toUpperCase()}`;

  if (config.useMocks) {
    console.log(`\n[email/mock] Order Confirmed for ${args.email} (AWB: ${args.awb || "pending"})\n`);
    return;
  }

  const apiKey = process.env.RESEND_API_KEY ?? "";
  if (!apiKey) {
    console.warn("[email] RESEND_API_KEY missing, skipping order email");
    return;
  }

  const fromAddress = process.env.RESEND_FROM ?? "Massive Inventions <no-reply@massiveinvention.in>";
  const resend = new Resend(apiKey);

  const { error } = await resend.emails.send({
    from: fromAddress,
    to: [args.email],
    subject,
    html: buildOrderEmailHtml(args),
  });

  if (error) {
    console.error(`[email] Failed to send order email: ${error.message}`);
  }
}