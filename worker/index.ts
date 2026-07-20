import { handleCreateBook } from "./routes/books";
import { handleGeneratePreview } from "./routes/preview";
import { handleGetAsset, handleGetFullAsset } from "./routes/assets";
import { handleCreateCheckout } from "./routes/checkout";
import { handleStripeWebhook } from "./routes/stripe-webhook";
import { handleGenerateNext } from "./routes/generate-next";
import { handleBuildPdfNext } from "./routes/build-pdf-next";
import { handleGetBookStatus } from "./routes/book-status";
import { handleGetPdf } from "./routes/pdf";
import { handleSignup, handleLogin, handleLogout, handleMe } from "./routes/auth";
import { handleGetMyBooks } from "./routes/me-books";
import { handleGetMyProfile } from "./routes/me-profile";
import { handleGetOrderDetail } from "./routes/order-detail";
import { handleOAuthStart, handleOAuthCallback } from "./routes/oauth";
import { handleCreateAvatar, handleGenerateAvatar, handleGetAvatarStatus, handleClaimAvatar } from "./routes/avatar";
import { handleSubscriptionInterest } from "./routes/subscription-interest";
import { handleTranscribe } from "./routes/transcribe";
import { handleScheduled } from "./scheduled";

export default {
  async scheduled(_event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(handleScheduled(env));
  },

  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const parts = url.pathname.split("/").filter(Boolean); // ["api", "books", ...]

    if (url.pathname === "/api/books" && request.method === "POST") {
      return handleCreateBook(request, env);
    }

    if (url.pathname === "/api/avatars" && request.method === "POST") {
      return handleCreateAvatar(request, env);
    }

    // /api/avatars/:id, /api/avatars/:id/generate, /api/avatars/:id/claim
    if (parts.length === 3 && parts[0] === "api" && parts[1] === "avatars" && request.method === "GET") {
      return handleGetAvatarStatus(parts[2], env);
    }
    if (parts.length === 4 && parts[0] === "api" && parts[1] === "avatars" && parts[3] === "generate" && request.method === "POST") {
      return handleGenerateAvatar(parts[2], env);
    }
    if (parts.length === 4 && parts[0] === "api" && parts[1] === "avatars" && parts[3] === "claim" && request.method === "POST") {
      return handleClaimAvatar(parts[2], request, env);
    }

    if (url.pathname === "/api/subscription-interest" && request.method === "POST") {
      return handleSubscriptionInterest(request, env);
    }

    if (url.pathname === "/api/transcribe" && request.method === "POST") {
      return handleTranscribe(request, env);
    }

    if (url.pathname === "/api/webhooks/stripe" && request.method === "POST") {
      return handleStripeWebhook(request, env);
    }

    if (url.pathname === "/api/auth/signup" && request.method === "POST") {
      return handleSignup(request, env);
    }
    if (url.pathname === "/api/auth/login" && request.method === "POST") {
      return handleLogin(request, env);
    }
    if (url.pathname === "/api/auth/logout" && request.method === "POST") {
      return handleLogout(request, env);
    }
    if (url.pathname === "/api/me" && request.method === "GET") {
      return handleMe(request, env);
    }
    if (url.pathname === "/api/me/books" && request.method === "GET") {
      return handleGetMyBooks(request, env);
    }
    if (url.pathname === "/api/me/profile" && request.method === "GET") {
      return handleGetMyProfile(request, env);
    }

    // /api/me/orders/:bookId
    if (parts.length === 4 && parts[0] === "api" && parts[1] === "me" && parts[2] === "orders" && request.method === "GET") {
      return handleGetOrderDetail(parts[3], request, env);
    }

    // /api/auth/:provider/start and /api/auth/:provider/callback
    if (parts.length === 4 && parts[0] === "api" && parts[1] === "auth" && (parts[2] === "google" || parts[2] === "facebook")) {
      if (parts[3] === "start" && request.method === "GET") return handleOAuthStart(parts[2], request, env);
      if (parts[3] === "callback" && request.method === "GET") return handleOAuthCallback(parts[2], request, env);
    }

    // /api/books/:id
    if (parts.length === 3 && parts[0] === "api" && parts[1] === "books" && request.method === "GET") {
      return handleGetBookStatus(parts[2], env);
    }

    // /api/books/:id/preview
    if (parts.length === 4 && parts[0] === "api" && parts[1] === "books" && parts[3] === "preview" && request.method === "POST") {
      return handleGeneratePreview(parts[2], env);
    }

    // /api/books/:id/checkout
    if (parts.length === 4 && parts[0] === "api" && parts[1] === "books" && parts[3] === "checkout" && request.method === "POST") {
      return handleCreateCheckout(parts[2], request, env);
    }

    // /api/books/:id/generate-next
    if (parts.length === 4 && parts[0] === "api" && parts[1] === "books" && parts[3] === "generate-next" && request.method === "POST") {
      return handleGenerateNext(parts[2], env);
    }

    // /api/books/:id/build-pdf-next
    if (parts.length === 4 && parts[0] === "api" && parts[1] === "books" && parts[3] === "build-pdf-next" && request.method === "POST") {
      return handleBuildPdfNext(parts[2], env);
    }

    // /api/books/:id/assets/:filename
    if (parts.length === 5 && parts[0] === "api" && parts[1] === "books" && parts[3] === "assets" && request.method === "GET") {
      return handleGetAsset(parts[2], parts[4], env);
    }

    // /api/books/:id/full-assets/:filename
    if (parts.length === 5 && parts[0] === "api" && parts[1] === "books" && parts[3] === "full-assets" && request.method === "GET") {
      return handleGetFullAsset(parts[2], parts[4], env);
    }

    // /api/books/:id/pdf
    if (parts.length === 4 && parts[0] === "api" && parts[1] === "books" && parts[3] === "pdf" && request.method === "GET") {
      return handleGetPdf(parts[2], env);
    }

    return env.ASSETS.fetch(request);
  },
};
