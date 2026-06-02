// Netlify event function — fires automatically on every verified form submission
// (Netlify Forms). It emails the submission to info@maryjanesplace.co.uk so nothing
// is missed, independent of the dashboard notification setting.
//
// Setup (one env var): add RESEND_API_KEY in Netlify → Site config → Environment
// variables. Create a free key at resend.com and verify the maryjanesplace.co.uk
// domain so mail can be sent "from" info@maryjanesplace.co.uk. Optional override:
// MAIL_TO (defaults to info@maryjanesplace.co.uk).
//
// If RESEND_API_KEY is not set, the function no-ops gracefully (Netlify still stores
// every submission, and any dashboard email notification still applies).

const MAIL_TO = process.env.MAIL_TO || "info@maryjanesplace.co.uk";
const MAIL_FROM = process.env.MAIL_FROM || "Mary Jane's Place <info@maryjanesplace.co.uk>";

function escapeHtml(s) {
  return String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}

export async function handler(event) {
  try {
    const key = process.env.RESEND_API_KEY;
    const body = JSON.parse(event.body || "{}");
    const sub = body.payload || {};
    const formName = sub.form_name || "form";
    const data = sub.data || {};

    const fields = Object.entries(data).filter(([k]) => !["bot-field", "form-name"].includes(k));
    const rows = fields
      .map(([k, v]) => `<tr><td style="padding:6px 12px;font-weight:600;vertical-align:top">${escapeHtml(k)}</td><td style="padding:6px 12px">${escapeHtml(v)}</td></tr>`)
      .join("");
    const html = `<h2 style="font-family:sans-serif">New ${escapeHtml(formName)} submission</h2>
      <table style="font-family:sans-serif;border-collapse:collapse">${rows}</table>
      <p style="font-family:sans-serif;color:#666;font-size:12px">Sent from the maryjanesplace.co.uk website.</p>`;

    if (!key) {
      console.log(`[submission-created] ${formName}: no RESEND_API_KEY set; relying on Netlify's stored submission / dashboard notification.`);
      return { statusCode: 200, body: "stored (no mailer configured)" };
    }

    const replyTo = data.email && /@/.test(data.email) ? data.email : undefined;
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: MAIL_FROM,
        to: [MAIL_TO],
        reply_to: replyTo,
        subject: `New ${formName} enquiry — Mary Jane's Place`,
        html,
      }),
    });
    if (!res.ok) {
      const t = await res.text();
      console.error("[submission-created] Resend error", res.status, t);
      return { statusCode: 200, body: "stored; email send failed" };
    }
    return { statusCode: 200, body: "emailed " + MAIL_TO };
  } catch (e) {
    console.error("[submission-created] error", e);
    return { statusCode: 200, body: "error handled" };
  }
}
