/**
 * eazpire-map-portal — map.eazpire.com
 *
 * Deploy: npm run deploy:map (wrangler-map.toml)
 * Admin-only: magic link (ADMIN_OWNER_EMAILS), same allowlist as admin portal.
 */

import { json, getCorsHeaders } from "./utils/response.js";
import { handleMapPortalRequest } from "./features/map/mapPortalHost.js";
import {
  handleMapAuthRequest,
  handleMapAuthVerify,
  handleMapAuthLogout,
  handleMapAuthMe,
} from "./features/map/mapAuth.js";

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      const cors = getCorsHeaders(request);
      return new Response(null, { status: 204, headers: cors });
    }

    const url = new URL(request.url);
    const op = url.searchParams.get("op");

    if (op === "map-auth-request") return handleMapAuthRequest(request, env);
    if (op === "map-auth-verify") return handleMapAuthVerify(request, env);
    if (op === "map-auth-logout") return handleMapAuthLogout(request, env);
    if (op === "map-auth-me") return handleMapAuthMe(request, env);

    const portalResp = await handleMapPortalRequest(request, env);
    if (portalResp) return portalResp;

    const cors = getCorsHeaders(request);
    return json({ ok: false, error: "not_found" }, 404, cors);
  },
};
