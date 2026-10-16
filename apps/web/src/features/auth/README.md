# Auth

Login, registration, email verification, and password reset - see
`api.ts` for the REST calls and `store.ts` for the session store.

## CAPTCHA

`components/Captcha.tsx` renders a reCAPTCHA v2 checkbox on the login
and register forms, using the plain reCAPTCHA JS API loaded at
runtime - not an npm package, one less dependency for something this
small.

**Works with zero setup**: if `VITE_CAPTCHA_SITE_KEY` isn't set, the
component renders nothing and immediately reports "no token needed" -
matching the backend's `CAPTCHA_PROVIDER=none` default (see
`services/api/.env.example`). Local dev and CI never need a real
reCAPTCHA account.

**To turn it on**: get a site key + secret key at
https://www.google.com/recaptcha/admin (reCAPTCHA v2, "I'm not a
robot" checkbox), then set:
- Frontend: `VITE_CAPTCHA_SITE_KEY` (the public one)
- Backend: `CAPTCHA_PROVIDER=recaptcha` and `CAPTCHA_SECRET_KEY` (the secret one)

hCaptcha works the same way (`CAPTCHA_PROVIDER=hcaptcha`), but the
frontend widget here is reCAPTCHA-specific - swapping providers on the
frontend would mean writing an equivalent hCaptcha version of
`Captcha.tsx` (same shape: load their script, render their widget,
call `onVerify` with the token). The backend already supports both
without any changes, since reCAPTCHA and hCaptcha's verify APIs share
the same request/response shape.

**Known limitation**: on a failed login/register (e.g. wrong
password), the token is cleared client-side so it can't be replayed,
but the reCAPTCHA widget itself isn't reset (it'll still show
"checked"). If the provider requires a fresh interaction before
issuing a new token, retrying immediately may fail again with a
stale token - the person would need to refresh the page. Worth fixing
by wiring up `grecaptcha.reset()` if this turns out to matter in
practice.
