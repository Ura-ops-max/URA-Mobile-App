# Google sign-in on the URA app

The backend's Google flow (`GET /api/v1/auth/google`) always finishes on the
website: `https://www.ura.com.ng/auth/oauth/success?accessToken=…&refreshToken=…`.
The app catches that address instead of letting the website open it:

- **iOS** — the sign-in sheet returns the address to the app (needs the
  `webcredentials:www.ura.com.ng` Associated Domain, already in `app.json`).
- **Android** — the address opens the app through an App Link (the intent filter
  for `/auth/oauth/success` is already in `app.json`) and lands on
  `src/app/auth/oauth/success.tsx`.

Both platforms only trust the link once the **website** publishes two files.
Nothing changes on the backend.

## 1. Get the two values

After the first EAS build:

- **Apple Team ID** — Apple Developer → Membership (10 characters, e.g. `AB12CD34EF`).
- **Android SHA-256 fingerprint** — `npx eas-cli@latest credentials -p android`
  → production keystore → "SHA256 Fingerprint". If the app is published on Google
  Play with Play App Signing, also add the fingerprint from
  Play Console → Setup → App integrity → App signing key certificate.

## 2. Publish on the website

Serve both at `https://www.ura.com.ng/.well-known/`, over HTTPS, with
`Content-Type: application/json`, no redirect, and not rewritten to the SPA's
`index.html`. In the Vite web app, put them in `public/.well-known/`.

`apple-app-site-association` (no file extension):

```json
{
  "webcredentials": { "apps": ["TEAMID.ng.com.ura.app"] },
  "applinks": {
    "details": [
      { "appIDs": ["TEAMID.ng.com.ura.app"], "components": [{ "/": "/auth/oauth/success*" }] }
    ]
  }
}
```

`assetlinks.json`:

```json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "ng.com.ura.app",
      "sha256_cert_fingerprints": ["AA:BB:…:FF"]
    }
  }
]
```

Only `/auth/oauth/success` opens the app, so normal website visits are unaffected.

## 3. Check

- `curl -I https://www.ura.com.ng/.well-known/assetlinks.json` → `200`, `application/json`
- `curl -I https://www.ura.com.ng/.well-known/apple-app-site-association` → `200`, `application/json`
- Rebuild the app (`eas build`) after changing `app.json`; Associated Domains and
  intent filters are native settings.

## iOS and App Store guideline 4.8

The Google button is shown on every platform (`GOOGLE_SIGN_IN_IOS` is `"true"`
in `eas.json`). Apps that offer Google sign-in on iOS are expected to also offer
an equivalent private option, normally **Sign in with Apple**, which the backend
doesn't have yet. If App Store review rejects the build for this, set
`GOOGLE_SIGN_IN_IOS` to `"false"` in `eas.json` to hide the button on iOS only.

## Until the two files are published

The button opens Google and the account picker works, but Google then returns
people to the website (still signed in there), not to the app, and the app shows
"Google sign-in was not completed". Email/password sign-in is unaffected.
