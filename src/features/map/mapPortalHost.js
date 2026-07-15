/**
 * Serve map.eazpire.com SPA (ecosystem architecture map)
 */

let MAP_STATIC_BUNDLE = null;
async function loadBundle() {
  if (MAP_STATIC_BUNDLE) return MAP_STATIC_BUNDLE;
  try {
    const mod = await import("./mapStaticBundle.js");
    MAP_STATIC_BUNDLE = mod.MAP_STATIC_BUNDLE || {};
  } catch {
    MAP_STATIC_BUNDLE = {};
  }
  return MAP_STATIC_BUNDLE;
}

function assetKeyForPath(pathname) {
  let p = pathname || "/";
  if (p === "/" || p === "") return "index.html";
  if (p.startsWith("/")) p = p.slice(1);
  if (p.startsWith("assets/") || p.endsWith(".css") || p.endsWith(".js") || p.endsWith(".svg") || p.endsWith(".ico")) {
    return p;
  }
  if (!p.includes(".")) return "index.html";
  return p;
}

async function serveAsset(env, key) {
  if (env.MAP_ASSETS?.fetch) {
    const assetReq = new Request(`https://assets.local/${key}`);
    const res = await env.MAP_ASSETS.fetch(assetReq);
    if (res.ok) {
      const headers = new Headers(res.headers);
      if (key === "index.html") headers.set("cache-control", "no-cache");
      return new Response(res.body, { status: res.status, headers });
    }
  }

  const bundle = await loadBundle();
  if (bundle[key]) {
    return new Response(bundle[key].body, {
      status: 200,
      headers: {
        "content-type": bundle[key].contentType || "application/octet-stream",
        "cache-control": key === "index.html" ? "no-cache" : "public, max-age=300",
      },
    });
  }

  return null;
}

export async function handleMapPortalRequest(request, env) {
  const url = new URL(request.url);
  if (url.searchParams.get("op")) return null;

  const key = assetKeyForPath(url.pathname);
  const asset = await serveAsset(env, key);
  if (asset) return asset;

  if (!url.pathname.includes(".")) {
    const index = await serveAsset(env, "index.html");
    if (index) return index;
  }

  return new Response("Not found", { status: 404 });
}
