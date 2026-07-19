// Resend's REST API via plain fetch — no SDK, matching how this app already
// talks to Stripe/OpenAI directly. moderngox.com is verified in Resend
// (SPF/DKIM confirmed), so sending from it delivers to any real recipient —
// unlike the shared onboarding@resend.dev sender this used to default to,
// which only reliably delivered to the Resend account's own address.
const FROM_ADDRESS = "Nenos <hello@moderngox.com>";

export async function sendEmail(env: Env, params: { to: string; subject: string; html: string }): Promise<void> {
  if (!env.RESEND_API_KEY) {
    console.warn(`RESEND_API_KEY not configured — skipping email "${params.subject}" to ${params.to}.`);
    return;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: FROM_ADDRESS,
      to: [params.to],
      subject: params.subject,
      html: params.html,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    console.error(`Resend email failed (${response.status}): ${body}`);
  }
}

export function bookReadyEmailHtml(params: { bookTitle: string; readerUrl: string }): string {
  return `
    <div style="font-family: -apple-system, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
      <h1 style="font-size: 22px; color: #1a1a2e;">Your book is ready! ✨</h1>
      <p style="font-size: 15px; color: #333; line-height: 1.6;">
        "<strong>${params.bookTitle}</strong>" has finished printing in your account.
        You've now been charged for your order.
      </p>
      <p style="margin: 28px 0;">
        <a href="${params.readerUrl}" style="background: #1a1a2e; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
          Read your book
        </a>
      </p>
    </div>
  `;
}
