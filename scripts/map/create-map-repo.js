#!/usr/bin/env node
/**
 * Creates eazpire-map-portal via GitHub API.
 * Token: MAP_REPO_PUSH_TOKEN, BRAND_REPO_PUSH_TOKEN, PARTNER_REPO_PUSH_TOKEN, ANDROID_REPO_PUSH_TOKEN, GITHUB_TOKEN, GH_TOKEN
 *
 * npm run map:create-repo
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "../..");

function loadLocalEnv() {
  for (const name of [".dev.vars", ".env", ".env.local"]) {
    const p = path.join(ROOT, name);
    if (!fs.existsSync(p)) continue;
    try {
      for (const line of fs.readFileSync(p, "utf8").split(/\r?\n/)) {
        const m = line.match(/^([^#=]+)=(.*)$/);
        if (!m) continue;
        const key = m[1].trim();
        if (process.env[key]) continue;
        let val = m[2].trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        process.env[key] = val;
      }
    } catch (_) {}
  }
}

loadLocalEnv();

const token = (
  process.env.MAP_REPO_PUSH_TOKEN ||
  process.env.BRAND_REPO_PUSH_TOKEN ||
  process.env.PARTNER_REPO_PUSH_TOKEN ||
  process.env.ANDROID_REPO_PUSH_TOKEN ||
  process.env.GITHUB_TOKEN ||
  process.env.GH_TOKEN ||
  ""
).trim();

if (!token) {
  console.error("❌ Kein GitHub-Token (MAP_REPO_PUSH_TOKEN / BRAND_REPO_PUSH_TOKEN / GITHUB_TOKEN).");
  console.error("   Setup: docs/setup/MAP_REPO_SETUP.md");
  process.exit(1);
}

async function createRepo() {
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "Content-Type": "application/json",
  };
  const body = {
    name: "eazpire-map-portal",
    description: "Eazpire Ecosystem Map Portal mirror (from eazpire/eazpire)",
    private: false,
    auto_init: true,
  };

  let res = await fetch("https://api.github.com/orgs/eazpire/repos", {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  if (res.status === 201) {
    console.log("✅ Repo eazpire/eazpire-map-portal erstellt.");
    return;
  }

  const data = await res.json().catch(() => ({}));
  if (res.status === 422 && data.errors?.[0]?.message?.includes("name already exists")) {
    console.log("ℹ️  Repo existiert bereits.");
    return;
  }

  // Fallback: user namespace
  if (res.status === 404 || res.status === 403) {
    res = await fetch("https://api.github.com/user/repos", {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });
    if (res.status === 201) {
      console.log("✅ Repo erstellt (user scope).");
      return;
    }
  }

  console.error("❌ Create failed:", res.status, data);
  process.exit(1);
}

createRepo().catch((e) => {
  console.error(e);
  process.exit(1);
});
