// PayPal Orders v2, called via plain `fetch` — same "no SDK, direct REST"
// approach this app already uses for Stripe (worker/routes/checkout.ts,
// worker/scheduled.ts). Mirrors Stripe's authorize-now/capture-later flow:
// create an order (intent: AUTHORIZE) -> customer approves on PayPal's
// hosted page -> we authorize the approved order server-side (the
// equivalent of Stripe's webhook confirmation) -> capture later, once the
// book is ready.

async function getPayPalAccessToken(env: Env): Promise<string> {
  const credentials = btoa(`${env.PAYPAL_CLIENT_ID}:${env.PAYPAL_CLIENT_SECRET}`);
  const response = await fetch(`${env.PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  const body = (await response.json()) as { access_token?: string; error_description?: string };
  if (!response.ok || !body.access_token) {
    throw new Error(`PayPal OAuth token request failed: ${body.error_description ?? response.status}`);
  }
  return body.access_token;
}

export async function createPayPalOrder(
  env: Env,
  params: { bookId: string; amountCents: number; description: string; returnUrl: string; cancelUrl: string }
): Promise<{ orderId: string; approveUrl: string }> {
  const accessToken = await getPayPalAccessToken(env);
  const amountValue = (params.amountCents / 100).toFixed(2);

  const response = await fetch(`${env.PAYPAL_API_BASE}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      intent: "AUTHORIZE",
      purchase_units: [
        {
          custom_id: params.bookId,
          description: params.description,
          amount: { currency_code: "EUR", value: amountValue },
        },
      ],
      application_context: {
        return_url: params.returnUrl,
        cancel_url: params.cancelUrl,
        user_action: "PAY_NOW",
      },
    }),
  });

  const body = (await response.json()) as {
    id?: string;
    links?: { rel: string; href: string }[];
    message?: string;
  };
  const approveUrl = body.links?.find((l) => l.rel === "approve" || l.rel === "payer-action")?.href;
  if (!response.ok || !body.id || !approveUrl) {
    throw new Error(`PayPal order creation failed: ${body.message ?? response.status}`);
  }
  return { orderId: body.id, approveUrl };
}

// Called from the return-URL handler right after the customer approves on
// PayPal's hosted page — this server-to-server call is the authoritative
// "payment is now held" confirmation (this app's equivalent of trusting
// Stripe's checkout.session.completed webhook), not the client redirect
// itself.
export async function authorizePayPalOrder(env: Env, orderId: string): Promise<{ authorizationId: string; status: string }> {
  const accessToken = await getPayPalAccessToken(env);
  const response = await fetch(`${env.PAYPAL_API_BASE}/v2/checkout/orders/${orderId}/authorize`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });

  const body = (await response.json()) as {
    purchase_units?: { payments?: { authorizations?: { id: string; status: string }[] } }[];
    message?: string;
  };
  const authorization = body.purchase_units?.[0]?.payments?.authorizations?.[0];
  if (!response.ok || !authorization) {
    throw new Error(`PayPal order authorization failed: ${body.message ?? response.status}`);
  }
  return { authorizationId: authorization.id, status: authorization.status };
}

// Boolean-success shape deliberately mirrors worker/scheduled.ts's
// captureStripePayment, so the cron's captureAndNotify can branch on
// payment provider without changing its own control flow.
export async function capturePayPalAuthorization(env: Env, authorizationId: string): Promise<boolean> {
  const accessToken = await getPayPalAccessToken(env);
  const response = await fetch(`${env.PAYPAL_API_BASE}/v2/payments/authorizations/${authorizationId}/capture`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ final_capture: true }),
  });
  return response.ok;
}
