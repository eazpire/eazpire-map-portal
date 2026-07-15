#!/usr/bin/env node
/**
 * Copy RESEND_API_KEY + JWT_APP_SECRET from creator-engine to eazpire-map-portal
 * via internal-sync-partner-worker-secrets (script_name override).
 *
 * Usage: npm run map:secrets
 */
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const ROOT = path.join(__dirname, "../..");
const WRANGLER = path.join(ROOT, "wrangler.toml");
const DISPATCH_URL =
  process.env.CREATOR_DISPATCH_URL ||
  "https://creator-engine.eazpire.workers.dev/apps/creator-dispatch";

function readTomlVar(name) {
  if (!fs.existsSync(WRANGLER)) return "";
  const text = fs.readFileSync(WRANGLER, "utf8");
  const re = new RegExp(`^${name}\\s*=\\s*(.+)$`, "m");
  const m = text.match(re);
  if (!m) return "";
  let val = m[1].replace(/\s+#.*$/, "").trim();
  if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
    val = val.slice(1, -1);
  }
  return val;
}

function loadDotEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  for (const line of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim().replace(/\s+#.*$/, "");
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}

function loadCfAccountId() {
  const fromToml = readTomlVar("CLOUDFLARE_ACCOUNT_ID");
  if (fromToml) return fromToml;

  const r = spawnSync(
    process.execPath,
    [path.join(ROOT, "scripts/utils/wrangler-with-local-env.cjs"), "whoami"],
    { cwd: ROOT, encoding: "utf8" }
  );
  const out = `${r.stdout || ""}\n${r.stderr || ""}`;
  const m = out.match(/Account ID\s*\│\s*([a-f0-9]{32})/i) || out.match(/([a-f0-9]{32})/);
  return m ? m[1] : "";
}

async function main() {
  loadDotEnvFile(path.join(ROOT, ".dev.vars"));
  loadDotEnvFile(path.join(ROOT, ".env"));

  const cfToken =
    readTomlVar("CLOUDFLARE_API_TOKEN") ||
    process.env.CLOUDFLARE_API_TOKEN ||
    process.env.CF_API_TOKEN ||
    "";
  const adminKey =
    readTomlVar("INTERNAL_SHARED_SECRET") || process.env.INTERNAL_SHARED_SECRET || "";
  const accountId = loadCfAccountId();

  if (!cfToken) {
    console.error("❌ CLOUDFLARE_API_TOKEN fehlt.");
    process.exit(1);
  }
  if (!adminKey) {
    console.error("❌ INTERNAL_SHARED_SECRET fehlt.");
    process.exit(1);
  }
  if (!accountId) {
    console.error("❌ Cloudflare Account ID nicht ermittelbar.");
    process.exit(1);
  }

  const url = `${DISPATCH_URL}?op=internal-sync-partner-worker-secrets`;
  console.log("🔄 Sync map-worker secrets via creator-engine…");

  const resp = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-EAZ-ADMIN-KEY": adminKey,
    },
    body: JSON.stringify({
      account_id: accountId,
      cloudflare_api_token: cfToken,
      script_name: "eazpire-map-portal",
    }),
  });

  const data = await resp.json().catch(() => ({}));
  console.log(JSON.stringify(data, null, 2));
  if (!resp.ok || !data.ok) {
    process.exit(1);
  }
  console.log("✅ Map secrets synced (RESEND_API_KEY / JWT_APP_SECRET as available).");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
