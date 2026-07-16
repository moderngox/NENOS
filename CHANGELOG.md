# Kiddoverse / NENOS — Changelog (2026-07-15 → 2026-07-16)

Two days of work spanning the `poc-imagegen` validation prototype and the
real `nenosapp` product (React + Cloudflare Workers). Organized by day, then
by feature area.

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

- Full (10-page) high-quality generation trigger on payment success — the
  hook point is marked with a `TODO` in `worker/db.ts`'s `markBookPaid`.
- `Library.tsx` real persistence (still hardcoded example cards).
- Multi-currency Stripe Checkout (EUR only for now).
- The `satori`/`resvg-wasm` port of the text compositor for the real
  downloadable PDF (Cloudflare Workers can't run `@napi-rs/canvas`, which
  `poc-imagegen` uses — fine there since it's a Node-only prototype).
- Real Cloudflare deployment (`wrangler login` + real D1/R2 provisioning —
  everything so far has been validated against local `wrangler dev`
  emulation only).
