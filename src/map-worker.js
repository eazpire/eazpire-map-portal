/**
 * eazpire-map-portal — map.eazpire.com
 *
 * Deploy: npm run deploy:map (wrangler-map.toml)
 */

import { json, getCorsHeaders } from "./utils/response.js";
import { handleMapPortalRequest } from "./features/map/mapPortalHost.js";

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      const cors = getCorsHeaders(request);
      return new Response(null, { status: 204, headers: cors });
    }

    const portalResp = await handleMapPortalRequest(request, env);
    if (portalResp) return portalResp;

    const cors = getCorsHeaders(request);
    return json({ ok: false, error: "not_found" }, 404, cors);
  },
};
