import { handleCreateBook } from "./routes/books";
import { handleGeneratePreview } from "./routes/preview";
import { handleGetAsset } from "./routes/assets";
import { handleCreateCheckout } from "./routes/checkout";
import { handleStripeWebhook } from "./routes/stripe-webhook";

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const parts = url.pathname.split("/").filter(Boolean); // ["api", "books", ...]

    if (url.pathname === "/api/books" && request.method === "POST") {
      return handleCreateBook(request, env);
    }

    if (url.pathname === "/api/webhooks/stripe" && request.method === "POST") {
      return handleStripeWebhook(request, env);
    }

    // /api/books/:id/preview
    if (parts.length === 4 && parts[0] === "api" && parts[1] === "books" && parts[3] === "preview" && request.method === "POST") {
      return handleGeneratePreview(parts[2], env);
    }

    // /api/books/:id/checkout
    if (parts.length === 4 && parts[0] === "api" && parts[1] === "books" && parts[3] === "checkout" && request.method === "POST") {
      return handleCreateCheckout(parts[2], request, env);
    }

    // /api/books/:id/assets/:filename
    if (parts.length === 5 && parts[0] === "api" && parts[1] === "books" && parts[3] === "assets" && request.method === "GET") {
      return handleGetAsset(parts[2], parts[4], env);
    }

    return env.ASSETS.fetch(request);
  },
};
