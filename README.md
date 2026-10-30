# URA Mobile

Native mobile app for URA — Nigeria's social marketplace. Built with **Expo SDK 57 + Expo Router + TypeScript**, with full feature parity to the URA web app.

Runs entirely on **dummy data** today, structured so switching to the real backend is a **single flag flip**.

## Run it

```bash
npx expo install        # install deps (SDK-compatible)
npx expo start          # dev server (press i / a, or scan QR)
npx tsc --noEmit        # typecheck (clean)
```

Demo login is pre-filled on the sign-in screen (any credentials work in mock mode).

## The single flag

Everything is wired through [`src/constants/config.ts`](src/constants/config.ts):

```ts
export const USE_MOCKS = true;                          // ← flip to false for the real backend
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? '…';
```

- When `true`, every `src/api/*` function returns rich mock data after `await sleep(...)` and mutates an in-memory store (`src/mocks/store.ts`).
- When `false`, the **same functions** (same names, args, return shapes) hit the real axios client (`src/lib/axios-client.ts`) using the exact endpoints and payloads the web app / backend use.

Screens and hooks never branch on the flag — they only call the `api/*` functions, so nothing above the API layer changes when you switch.

## Architecture

```
src/
  app/            Expo Router routes (see below)
  api/            One module per domain — mock ⇄ real behind USE_MOCKS
  mocks/          Typed fixtures (data.ts), mutable store (store.ts), image helpers
  components/     Shared components (FeedCard, ProfileView, ReviewsSection, ProductForm, …)
    ui/           Design-system primitives (Text, Button, Input, Card, Avatar, Sheet, Toast, …)
  context/        Providers (query, auth, cart)
  hooks/          use-realtime (store events in mock; swap for Socket.IO when live)
  lib/            axios clients, token storage, formatting, category colours
  theme/          Colours, spacing, radii, typography — no hardcoded hex in screens
  types/          Domain types matching the backend response shapes
```

### Routes

- **Public**: `(public)/` — landing, marketplace, about, contact, faq, terms, privacy
- **Auth**: `(auth)/` — login, register (live username check), verify-email (6-digit), forgot/reset password, Google OAuth success/failure
- **Tabs**: `(tabs)/` — Home feed · Search · Sell (+) · Chat · Profile
- **Stack**: product/[id], post/[id], user/[id], business/[id], cart, checkout, orders, order/[id], deals, bookmarks, image-search, notifications, create-product, edit-product/[id], chat/[id], chat/new, menu, payluk-setup, payment-complete
- **Wallet**: `wallet/` — overview, transactions, buyer/seller transactions, claim-funds, withdraw (bank verify + OTP), dispute, respond-dispute, confirm-payment
- **Settings**: `settings/` — home, profile, security, activities

## Going live

1. Set `USE_MOCKS = false` and `EXPO_PUBLIC_API_BASE_URL`.
2. Start the URA backend (Payluk proxy served under `{base}/payluk`).
3. Replace the mock branch of `useRealtime` with a Socket.IO subscription (chat/notifications) — the topic names already match.

No screen changes required.
