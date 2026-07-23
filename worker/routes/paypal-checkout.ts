import { getBook, markBookPayPalAuthorized } from "../db";
import { getUserById } from "../users-db";
import { authorizePayPalOrder } from "../paypal";
import { sendEmail, adminOrderPlacedEmailHtml, ADMIN_EMAIL } from "../email";
import { PRICES_CENTS } from "../pricing";

// PayPal redirects the browser here after the customer approves on its
// hosted page, with the order id in the `token` query param. This is the
// PayPal equivalent of worker/routes/stripe-webhook.ts's
// checkout.session.completed handler — the server-side "authorize" call
// below is the authoritative confirmation, not the redirect itself — but
// unlike Stripe's async webhook, this only fires if the browser actually
// makes it back here (see the approved plan's note on this trade-off).
export async function handlePayPalReturn(bookId: string, request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const orderId = url.searchParams.get("token");
  const origin = url.origin;

  if (!orderId) {
    return Response.redirect(`${origin}/paiement`, 302);
  }

  const book = await getBook(env.DB, bookId);
  if (!book) {
    return Response.redirect(`${origin}/paiement`, 302);
  }

  try {
    const { authorizationId } = await authorizePayPalOrder(env, orderId);
    await markBookPayPalAuthorized(env.DB, bookId, authorizationId);

    // Best-effort, mirrors stripe-webhook.ts's admin notification —
    // shouldn't block the customer's redirect over an email hiccup.
    try {
      const user = book.userId ? await getUserById(env.DB, book.userId) : null;
      if (user) {
        await sendEmail(env, {
          to: ADMIN_EMAIL,
          subject: "New order placed",
          html: adminOrderPlacedEmailHtml({
            bookTitle: book.story?.frontCover.title ?? book.draft.name,
            customerEmail: user.email,
            format: book.format,
            priceCents: book.format ? PRICES_CENTS[book.format] ?? null : null,
            adminOrderUrl: `${env.APP_BASE_URL}/admin/orders/${bookId}`,
          }),
        });
      }
    } catch (err) {
      console.error(`Admin order-placed email failed for book ${bookId}:`, err);
    }

    return Response.redirect(`${origin}/commande-confirmee?bookId=${bookId}`, 302);
  } catch (err) {
    console.error(`PayPal authorization failed for book ${bookId}:`, err);
    return Response.redirect(`${origin}/paiement`, 302);
  }
}
