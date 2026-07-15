/**
 * Admin-only magic-link auth for map.eazpire.com
 * Same allowlist as admin.eazpire.com (ADMIN_OWNER_EMAILS / ADMIN_OWNER_IDS).
 */

import { json, getCorsHeaders } from "../../utils/response.js";
import {
  signAdminPartnerSession,
  sessionCookieHeader,
  clearSessionCookieHeader,
  adminPartnerCookieName,
  requireAdminPartnerSession,
  hashToken,
} from "../manufacturers/rbac.js";
import {
  readVerifyToken,
  renderMagicLinkConfirmPage,
  redirectWithHeaders,
  wantsJsonVerifyResponse,
} from "../manufacturers/partnerAuthVerifyUi.js";
import { isAdminEmail, resolveAdminActorId } from "../manufacturers/adminAllowlist.js";
import { sendMapMagicLinkEmail } from "../manufacturers/email.js";

const MAP_MAGIC_KV_PREFIX = "map_magic:";
const MAGIC_LINK_TTL_SEC = 15 * 60;

function mapBaseUrl(env) {
  return String(env.MAP_PORTAL_URL || "https://map.eazpire.com").replace(/\/$/, "");
}

function respondMapVerifyFailure(env, request, url, cors, errorCode) {
  if (wantsJsonVerifyResponse(request, url)) {
    return json(
      { ok: false, error: errorCode },
      errorCode === "token_required" ? 400 : 401,
      cors
    );
  }
  return redirectWithHeaders(
    `${mapBaseUrl(env)}/?auth_error=${encodeURIComponent(errorCode)}`,
    302,
    cors
  );
}

async function storeMapMagicToken(env, rawToken, email) {
  if (!env.JOBS?.put) return false;
  const tokenHash = await hashToken(rawToken);
  await env.JOBS.put(
    `${MAP_MAGIC_KV_PREFIX}${tokenHash}`,
    JSON.stringify({ email, used_at: null }),
    { expirationTtl: MAGIC_LINK_TTL_SEC }
  );
  return true;
}

async function lookupMapMagicToken(env, rawToken) {
  if (!env.JOBS?.get) return null;
  const tokenHash = await hashToken(rawToken);
  const raw = await env.JOBS.get(`${MAP_MAGIC_KV_PREFIX}${tokenHash}`);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function consumeMapMagicToken(env, rawToken) {
  const tokenHash = await hashToken(rawToken);
  const key = `${MAP_MAGIC_KV_PREFIX}${tokenHash}`;
  const row = await lookupMapMagicToken(env, rawToken);
  if (!row || row.used_at) return null;
  await env.JOBS.delete(key).catch(() => {});
  return row;
}

export async function issueMapMagicLink(env, email) {
  const normalized = String(email || "")
    .trim()
    .toLowerCase();
  if (!normalized || !normalized.includes("@")) {
    return { ok: false, reason: "invalid_email" };
  }
  if (!isAdminEmail(normalized, env)) {
    return { ok: false, reason: "not_allowed" };
  }

  const rawToken = crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "");
  const stored = await storeMapMagicToken(env, rawToken, normalized);
  if (!stored) {
    return { ok: false, reason: "kv_unavailable" };
  }

  const verifyUrl = `${mapBaseUrl(env)}/auth/verify?token=${encodeURIComponent(rawToken)}`;
  const mail = await sendMapMagicLinkEmail(env, { to: normalized, verifyUrl });
  if (!mail.ok) {
    console.error("[map-auth] magic link email failed", mail.error, mail.detail || "");
    return { ok: false, reason: mail.error || "email_failed", detail: mail.detail };
  }

  return { ok: true, sent: true, email: normalized };
}

/** POST ?op=map-auth-request */
export async function handleMapAuthRequest(request, env) {
  const cors = getCorsHeaders(request);
  const body = await request.json().catch(() => ({}));
  const result = await issueMapMagicLink(env, body.email);

  if (!result.ok && result.reason === "invalid_email") {
    return json({ ok: false, error: "invalid_email" }, 400, cors);
  }

  // Generic — no email enumeration
  return json({ ok: true, sent: true }, 200, cors);
}

/** GET/POST /auth/verify or ?op=map-auth-verify */
export async function handleMapAuthVerify(request, env) {
  const cors = getCorsHeaders(request);
  const url = new URL(request.url);
  const rawToken = await readVerifyToken(request, url);
  if (!rawToken) {
    return respondMapVerifyFailure(env, request, url, cors, "token_required");
  }

  const row = await lookupMapMagicToken(env, rawToken);
  if (!row) {
    return respondMapVerifyFailure(env, request, url, cors, "invalid_or_expired_token");
  }
  if (row.used_at) {
    return respondMapVerifyFailure(env, request, url, cors, "token_already_used");
  }

  const shouldConsume =
    request.method === "POST" ||
    (wantsJsonVerifyResponse(request, url) && url.searchParams.get("confirm") === "1");

  if (!shouldConsume) {
    const html = renderMagicLinkConfirmPage({
      actionPath: "/auth/verify",
      token: rawToken,
      title: "Confirm map sign-in",
      lead: "Click below to open the eazpire Ecosystem Map. This step stops email scanners from using your link early.",
      buttonLabel: "Sign in to Ecosystem Map",
    });
    return new Response(html, {
      status: 200,
      headers: { ...cors, "content-type": "text/html; charset=utf-8", "cache-control": "no-store" },
    });
  }

  const consumed = await consumeMapMagicToken(env, rawToken);
  if (!consumed?.email || !isAdminEmail(consumed.email, env)) {
    return respondMapVerifyFailure(env, request, url, cors, "invalid_or_expired_token");
  }

  const jwt = await signAdminPartnerSession(env, {
    email: consumed.email,
    owner_id: resolveAdminActorId(env),
  });

  const headers = {
    ...cors,
    "Set-Cookie": sessionCookieHeader(adminPartnerCookieName(), jwt),
  };

  if (wantsJsonVerifyResponse(request, url)) {
    return json({ ok: true, email: consumed.email }, 200, headers);
  }

  return redirectWithHeaders(`${mapBaseUrl(env)}/`, 302, headers);
}

export async function handleMapAuthLogout(request, env) {
  const cors = getCorsHeaders(request);
  const url = new URL(request.url);
  const headers = {
    ...cors,
    "Set-Cookie": clearSessionCookieHeader(adminPartnerCookieName()),
  };
  if (url.searchParams.get("format") === "json" || request.headers.get("accept")?.includes("application/json")) {
    return json({ ok: true }, 200, headers);
  }
  return redirectWithHeaders(`${mapBaseUrl(env)}/`, 302, headers);
}

export async function handleMapAuthMe(request, env) {
  const cors = getCorsHeaders(request);
  const auth = await requireAdminPartnerSession(request, env);
  if (!auth.ok) return json({ ok: false, error: auth.error }, auth.status, cors);
  return json({ ok: true, session: auth }, 200, cors);
}

export function renderMapLoginPage({ authError } = {}) {
  const err = String(authError || "").trim();
  const errBlock = err
    ? `<p class="err">Sign-in failed (${escapeHtml(err)}). Request a new link.</p>`
    : "";
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>eazpire · Map — Sign in</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600&family=Outfit:wght@300;400;500&display=swap" rel="stylesheet" />
  <style>
    :root {
      --bg: #0d0f12;
      --card: #171a20;
      --border: rgba(255,255,255,0.08);
      --text: #e8e6e3;
      --muted: #9a968f;
      --dim: #6b6760;
      --ember: #c4845a;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0; min-height: 100vh; display: grid; place-items: center;
      font-family: Outfit, system-ui, sans-serif;
      background:
        radial-gradient(ellipse 70% 50% at 20% -10%, rgba(139,122,158,0.12), transparent 55%),
        radial-gradient(ellipse 50% 40% at 90% 10%, rgba(196,132,90,0.08), transparent 50%),
        var(--bg);
      color: var(--text);
    }
    .card {
      width: min(400px, calc(100vw - 32px));
      padding: 32px 28px;
      border-radius: 14px;
      border: 1px solid var(--border);
      background: linear-gradient(165deg, rgba(28,32,40,0.96), rgba(16,18,22,0.98));
      box-shadow: 0 24px 80px rgba(0,0,0,0.45);
    }
    .eyebrow {
      font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase;
      color: var(--ember); margin: 0 0 8px;
    }
    h1 {
      font-family: "Cormorant Garamond", Georgia, serif;
      font-size: 2rem; font-weight: 600; margin: 0 0 8px; letter-spacing: 0.02em;
    }
    .lead { margin: 0 0 22px; color: var(--muted); font-size: 0.92rem; line-height: 1.5; }
    label { display: block; font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; color: var(--dim); margin-bottom: 8px; }
    input[type=email] {
      width: 100%; padding: 11px 12px; border-radius: 8px;
      border: 1px solid var(--border); background: #12151a; color: var(--text);
      font: inherit; outline: none;
    }
    input[type=email]:focus { border-color: rgba(196,132,90,0.45); }
    button {
      margin-top: 14px; width: 100%; padding: 12px 16px; border: 0; border-radius: 8px;
      background: var(--ember); color: #1a120e; font: inherit; font-weight: 500; cursor: pointer;
    }
    button:hover { filter: brightness(1.06); }
    button:disabled { opacity: 0.55; cursor: wait; }
    .err { color: #d4a08a; font-size: 0.85rem; margin: 0 0 14px; }
    .ok { color: #8aaca0; font-size: 0.85rem; margin: 14px 0 0; display: none; }
    .ok.show { display: block; }
    .hint { margin-top: 18px; font-size: 11px; color: var(--dim); line-height: 1.4; }
  </style>
</head>
<body>
  <div class="card">
    <p class="eyebrow">Admin only</p>
    <h1>Ecosystem Map</h1>
    <p class="lead">Sign in with an allowlisted admin email. We’ll send a magic link.</p>
    ${errBlock}
    <form id="login-form">
      <label for="email">Email</label>
      <input id="email" name="email" type="email" autocomplete="email" required placeholder="you@eazpire.com" />
      <button type="submit" id="submit">Send magic link</button>
    </form>
    <p class="ok" id="ok">Check your inbox — open the link to continue.</p>
    <p class="hint">Same allowlist as admin.eazpire.com. Link expires in 15 minutes.</p>
  </div>
  <script>
    const form = document.getElementById('login-form');
    const ok = document.getElementById('ok');
    const btn = document.getElementById('submit');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      ok.classList.remove('show');
      btn.disabled = true;
      try {
        const email = document.getElementById('email').value.trim();
        const res = await fetch('/?op=map-auth-request', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ email }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.ok) {
          alert(data.error === 'invalid_email' ? 'Invalid email' : 'Could not send link. Try again.');
        } else {
          ok.classList.add('show');
        }
      } catch (_) {
        alert('Network error');
      } finally {
        btn.disabled = false;
      }
    });
  </script>
</body>
</html>`;
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
