// TSiD — contact form handler (Vercel Function). Replaces contact.php from the Hostinger site.
// Sends enquiries through Resend (https://resend.com). Set these in Vercel → Project → Settings → Environment Variables:
//   RESEND_API_KEY  (required)  your Resend API key
//   CONTACT_TO      (optional)  where enquiries go — defaults to hello@tsid.digital
//   CONTACT_FROM    (optional)  sender, on a domain verified in Resend — defaults to "TSiD Website <no-reply@tsid.digital>"
// If the key is missing or sending fails, the site falls back to email / WhatsApp links, so no lead is lost.

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json; charset=utf-8" } });

const clean = (v) => String(v ?? "").trim();
const noBreaks = (v) => clean(v).replace(/[\r\n]+/g, " ");

export async function POST(request) {
  let form;
  try { form = await request.formData(); } catch { return json({ success: false, error: "Invalid form data." }, 400); }

  // Honeypot: bots fill this hidden field; humans never see it
  if (clean(form.get("website"))) return json({ success: true });

  const name = noBreaks(form.get("name"));
  const company = clean(form.get("company"));
  const email = noBreaks(form.get("email"));
  const phone = clean(form.get("phone"));
  const interest = clean(form.get("interest"));
  const message = clean(form.get("message"));

  if (!name || !email || !message) return json({ success: false, error: "Please complete the required fields." }, 422);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ success: false, error: "Please provide a valid email address." }, 422);
  if (message.length > 6000) return json({ success: false, error: "Message is too long." }, 422);

  const to = process.env.CONTACT_TO || "hello@tsid.digital";
  const from = process.env.CONTACT_FROM || "TSiD Website <no-reply@tsid.digital>";
  const key = process.env.RESEND_API_KEY;
  if (!key) return json({ success: false, error: "Email is not configured yet. Please email " + to }, 503);

  const sent = new Date().toLocaleString("en-SG", { timeZone: "Asia/Singapore", dateStyle: "medium", timeStyle: "short" });
  const text =
    `New enquiry submitted on tsid.digital\n-------------------------------------------\n\n` +
    `Name:     ${name}\nCompany:  ${company || "—"}\nEmail:    ${email}\nPhone:    ${phone || "—"}\nInterest: ${interest || "—"}\n\n` +
    `Message:\n${message}\n\n-------------------------------------------\nSent ${sent} (Singapore time)\n`;

  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: [to], reply_to: `${name} <${email}>`, subject: `New enquiry from tsid.digital — ${name}`, text })
    });
    if (!r.ok) {
      console.error("Resend error", r.status, await r.text());
      return json({ success: false, error: "Mail could not be sent. Please email us directly at " + to }, 502);
    }
    return json({ success: true });
  } catch (e) {
    console.error("Resend request failed", e);
    return json({ success: false, error: "Mail could not be sent. Please email us directly at " + to }, 502);
  }
}

export function GET() {
  return json({ success: false, error: "Method not allowed." }, 405);
}
