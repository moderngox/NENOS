# Kiddoverse / NENOS — Changelog (2026-07-15 → 2026-07-16)

Two days of work spanning the `poc-imagegen` validation prototype and the
real `nenosapp` product (React + Cloudflare Workers). Organized by day, then
by feature area.

## Day 3 — 2026-07-16 (cont'd): full generation, reader, PDF, accounts

### Full high-quality generation, slide/carousel reader, PDF export

- **`POST /api/books/:id/generate-next`**: the paid product's full-book
  generation, previously just a `TODO`. Relocks a fresh *high-quality*
  character sheet and regenerates all 13 assets (character sheet, front
  cover, 10 pages, back cover) from it — deliberately not reusing the
  low-quality sneak-peek assets, so a paying customer never sees a mix of
  qualities. One unit per call, resumable and idempotent (a `generating`
  lock in D1 prevents duplicate concurrent work), matching the sneak-peek's
  already-validated pattern. Stored under a separate `full/` R2 prefix.
  Verified against a real test book: all 13 assets generated, survived a
  dev-server crash mid-request and an OpenAI billing-limit interruption
  without losing progress or duplicating work.
- **Fixed a real timeout bug found during that test**: high-quality
  generations with reference images routinely took 170–210s, past
  `image-client.ts`'s 180s default — causing spurious timeouts and wasted
  retries against the real, billed API. Bumped to a 280s timeout for the
  full-quality path.
- **`GET /api/books/:id`**: a full snapshot (payment status, story text,
  generation progress, asset URLs) so the reader works from a fresh tab with
  no client-side state at all — a returning customer's browser won't have
  any.
- **Slide/carousel reader** at `/livre/:bookId` (`BookReader.tsx`): three
  states — not-paid gating message, live progress view while generating, and
  the finished carousel (front cover, 10 pages, back cover) with prev/next,
  dot navigation, and keyboard arrow support. Interior pages show narration
  in a panel below the image rather than overlaid on it, since the image
  prompt's reserved "safe zone" isn't guaranteed to land in a predictable
  spot. Found and fixed a real overlap bug where a two-line title collided
  with the subtitle on the front-cover slide (fixed positioning didn't
  account for wrapped text; switched to a flex column so they stack
  naturally).
- **PDF export** via `pdf-lib` + `@pdf-lib/fontkit` (`worker/pdf.ts`,
  `GET /api/books/:id/pdf`) — no `nodejs_compat` flag needed, contrary to
  the one open question going in. Same Baloo 2 / Poppins fonts as the image
  covers, bundled into the Worker as `Data` modules (`wrangler.jsonc`'s
  `rules`) rather than fetched from R2 at request time. Verified by
  rendering the generated PDF's pages to images (via a throwaway
  `pdfjs-dist` + `@napi-rs/canvas` script) and inspecting them directly —
  confirmed correct 12-page output, legible text, and no missing fonts or
  images.

### User accounts, deferred payment, background generation, email

- **Real accounts**: email/password (PBKDF2-SHA256 password hashing via Web
  Crypto, no bcrypt dependency) plus Google and Facebook OAuth
  (`worker/routes/oauth.ts`) — hand-rolled authorization-code-flow exchanges
  via `fetch`, no SDK, matching how this app already talks to Stripe/OpenAI.
  Sign in with Apple is deferred — it needs a paid Apple Developer account
  and a private-key-signed client secret, a real prerequisite only the user
  can set up; the code is structured so it slots into the same pattern
  later. Session state lives in an `HttpOnly` cookie backed by a new
  `sessions` table, not client-visible storage.
- **Signup/login moved to the payment step**, not the start of the wizard —
  no signup friction to try the wizard or sneak peek; an account is only
  required once the customer is ready to pay (`AuthForm.tsx`, embedded in
  `Payment.tsx` and on a new standalone `/connexion` page).
- **Deferred payment**: Stripe Checkout now authorizes the card
  (`capture_method: manual`) instead of charging immediately — verified via
  the real Stripe API that a created session's PaymentIntent actually came
  back with `capture_method: manual`. The webhook stores the PaymentIntent
  id and marks the book `authorized` (not `paid`); the real charge happens
  later, once the book is actually ready.
- **Cron-triggered background generation** (`worker/scheduled.ts`, a
  Cloudflare Cron Trigger firing every minute — available on the free plan,
  unlike Queues): drives `generate-next`'s same one-unit-per-call logic
  forward regardless of whether any browser tab is open. This is what makes
  "you'll get an email even if you close this tab" true rather than
  aspirational. Verified directly: triggered the scheduled handler with no
  browser involved at all, confirmed it advanced a real authorized test
  book's progress on its own.
- **Capture + notify on completion**: once a book's generation finishes, the
  scheduled handler captures the held PaymentIntent
  (`markBookCaptured`/`markBookCaptureFailed` — a failed capture leaves the
  book reachable rather than stranding a customer who already has a
  generated book) and emails the customer via Resend
  (`worker/email.ts`, plain `fetch`, no SDK). Currently a no-op with a
  logged warning until a real `RESEND_API_KEY` is provided.
- **Real order history**: `GET /api/me/books` + a rewritten `Library.tsx`
  replace what were previously two permanently-hardcoded example cards.
  Verified live: signed up, logged in, saw the real purchased book at its
  actual generation progress, logged out, confirmed the session was
  actually cleared (reverted to the signed-out view on reload).
- **Disclaimers added in both places that make sense**: a short one-liner
  on the pre-payment sneak-peek page (`Revelation.tsx`) and the full
  "up to 30 minutes, you'll be charged once it's ready" message on the
  post-checkout confirmation page (`OrderConfirmed.tsx`), replacing its
  previous vaguer copy.

## Day 1 — 2026-07-15: validating the AI generation pipeline (`poc-imagegen`)

Built as a standalone Node PoC before touching the real app, to prove the
image-generation approach cheaply before wiring it into a website.

- **System architecture proposal** for turning Kiddoverse into a real
  product: wizard → draft submission → story-beat planning → character-lock
  → per-page generation → text compositing → payment gate → full book
  export. Confirmed the image model in question is `gpt-image-2` (not the
  `gpt-image-1` the name initially suggested).
- **Character sheet + single-page generation**, validated end to end against
  the real OpenAI Images API — first with traits only, then with a real
  reference photo.
- **Fixed a "hangs forever" bug**: `openai-client.mjs`'s `fetch()` calls had
  no timeout, so a stalled connection would hang silently with zero output.
  Added an `AbortController`-based timeout with a clear error message.
- **Fixed a cloned-secondary-character bug**: side characters (e.g. Leo the
  lion cub) were rendering as a second copy of the main child instead of
  themselves, because each image call is stateless and most page prompts
  only said the companion's *name*, never what they actually looked like.
  Fixed by always injecting a persistent description of every secondary
  character into every page/cover prompt, plus an explicit "exactly one
  instance of the protagonist" instruction.
- **Unified page/cover dimensions** to one consistent portrait size
  (1024×1536) across covers, interior pages, and text pages.
- **Built the alternating page structure**: physical page `2N-1` is beat
  N's illustration, page `2N` is its narration — a dedicated
  `generate-text-page.mjs` renders narration onto a code-generated gradient
  background (`@napi-rs/canvas`, zero extra API cost).
- **Added real cover typography**: front-cover title/subtitle and back-cover
  synopsis are composited as actual typography (Baloo 2 / Poppins fonts)
  over the generated illustration — never AI-rendered text, per the Style
  Bible's own guidance that baked-in AI text is unreliable.
- **Generated a full 20-page book** (10 illustrations + 10 text pages, front
  + back cover) end to end at low quality to validate the whole pipeline
  cheaply; one transient failure retried successfully via `--only`.

## Day 2 — 2026-07-16: wiring it into the real website (`nenosapp`)

- **Stood up the backend from scratch**: `nenosapp` had no server at all
  (static-assets-only Cloudflare Workers config). Added a real Worker
  (`worker/index.ts`), D1 database, R2 bucket, and the first endpoint,
  `POST /api/books` — takes the wizard's draft + photo, calls an LLM to turn
  the free-text story idea into 10 structured story beats (matching the
  `poc-imagegen` beat shape exactly), persists everything.
- **Wired `CreateWizard.tsx`'s submit** to actually call that endpoint
  instead of just navigating to a static page — added loading/error states.
  Along the way, fixed a real bug: Cloudflare's static-assets serving had no
  SPA fallback, so refreshing on `/creer` 404'd instead of loading the app.
- **Sneak-peek generation**: `POST /api/books/:id/preview` generates a
  character sheet + front cover + page 1 (low quality, ~3 paid image calls)
  right after story beats are ready. `Revelation.tsx` now shows the real
  generated cover/title/page instead of hardcoded mock images, with a
  loading state during the ~1-4 minute generation window.
- **Payment module**: real Stripe Checkout session creation and webhook
  handling, built with zero new npm dependencies (direct `fetch()` calls,
  hand-rolled webhook signature verification via Web Crypto). Verified the
  signature-verification logic without needing any real Stripe account, and
  the Checkout session creation against the real Stripe API once test-mode
  keys were provided (caught and fixed a key accidentally pasted into the
  wrong env var).
- **Fixed `Payment.tsx` showing stale hardcoded data**: it had its own
  separate `TITLES`/static-cover logic that never got updated when
  `Revelation.tsx` was wired to real data. Now reads the same real
  `story`/`preview` state from context, confirmed to auto-update live via
  React context reactivity (no reload needed).
- **Story language now matches the UI language**: the generated story text
  was always coming back in English regardless of the French UI. Fixed by
  threading the selected language through to the story-beat prompt, with an
  explicit rule that only reader-facing text (narration, title, subtitle,
  synopsis) follows the UI language — the internal image-generation `scene`
  prompts stay in English on purpose, since that's a different, never-shown
  pipeline.
- **Fixed the photo-upload preview bug**: the child's photo displayed almost
  entirely blank after upload. Root cause: mixing the CSS `background`
  shorthand with individual `backgroundImage`/`backgroundSize`/
  `backgroundPosition` longhand properties in the same style object — a
  known React/CSS gotcha where the shorthand resets the longhands. Fixed in
  both `StepPhoto.tsx` and the sidebar `LivePreview.tsx`; also fixed a
  related resource leak (both were calling `URL.createObjectURL` fresh on
  every render, never revoking) via a new shared `useObjectUrl` hook.
- **Added skin color** as a choice on the physical-appearance step, wired
  all the way through to the character-sheet generation prompt.
- **Added skin color and real photo support for secondary/accompanying
  characters**: previously their uploaded photo was captured in the UI but
  silently dropped before reaching the backend. Now each secondary
  character's photo (if provided) is uploaded and passed as an *additional*
  reference image alongside the main character sheet during generation, so
  their real likeness is used — verified with a real test book (one
  companion with a photo, one text-only), confirming both produce
  well-differentiated, correctly-styled characters with no bleed between
  them or the protagonist.

## What's still explicitly deferred

- **Sign in with Apple** — needs a paid Apple Developer account and a
  private-key-signed client secret; only the user can set this up.
- **Real Google/Facebook/Resend credentials** — all three integrations are
  fully wired but return a clear "not configured" response (or, for email,
  a logged warning) until real API keys/app credentials are provided, the
  same way `OPENAI_API_KEY`/`STRIPE_SECRET_KEY` were handled earlier.
- **No "forgot password" flow** and **no email verification on signup** —
  both real gaps, not silently pretended away.
- **No admin UI for `capture_failed` orders** — the book stays reachable
  (it was already generated, real cost incurred) but a failed Stripe capture
  currently needs a manual Dashboard follow-up.
- Multi-currency Stripe Checkout (EUR only for now).
- Real Cloudflare deployment of this round's work (`wrangler login` + real
  D1/R2 provisioning — validated against local `wrangler dev` emulation
  only so far; the *previous* round, up through the payment module, was
  already verified live in production).
