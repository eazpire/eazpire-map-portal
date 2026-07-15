export type NodeType = 'portal' | 'worker' | 'app' | 'infra' | 'external';
export type NodeStatus = 'live' | 'beta' | 'wip' | 'planned';

export interface EcosystemNode {
  id: string;
  type: NodeType;
  label: string;
  host?: string;
  url?: string;
  repoPath: string;
  summary: string;
  functions: string[];
  status: NodeStatus;
  features: string[];
  relatedIdeaIds?: string[];
  /** Fixed map position */
  position: { x: number; y: number };
}

export interface EcosystemEdge {
  id: string;
  from: string;
  to: string;
  label: string;
}

export const NODE_TYPE_META: Record<
  NodeType,
  { label: string; accent: string; soft: string }
> = {
  portal: { label: 'Portal', accent: '#c4845a', soft: 'rgba(196, 132, 90, 0.18)' },
  worker: { label: 'Worker', accent: '#5a9e9a', soft: 'rgba(90, 158, 154, 0.18)' },
  app: { label: 'App', accent: '#b89a5e', soft: 'rgba(184, 154, 94, 0.18)' },
  infra: { label: 'Infra', accent: '#8a919c', soft: 'rgba(138, 145, 156, 0.18)' },
  external: { label: 'External', accent: '#8b7a9e', soft: 'rgba(139, 122, 158, 0.18)' },
};

export const STATUS_LABEL: Record<NodeStatus, string> = {
  live: 'Live',
  beta: 'Beta',
  wip: 'In progress',
  planned: 'Planned',
};

/**
 * Layer layout (left → right):
 * External → Infra → Workers → Portals → Apps
 */
export const ECOSYSTEM_NODES: EcosystemNode[] = [
  // ── External ──────────────────────────────────────────────
  {
    id: 'ext-shopify',
    type: 'external',
    label: 'Shopify',
    host: 'Shopify Admin / Storefront',
    url: 'https://www.shopify.com',
    repoPath: '— (SaaS)',
    summary:
      'Commerce backbone: storefront hosting, checkout, customer accounts, Admin API, and Markets.',
    functions: [
      'Hosts theme & product catalogue',
      'Customer accounts & checkout',
      'Admin / Storefront APIs consumed by workers',
      'GitHub theme sync via eazpire-theme',
    ],
    status: 'live',
    features: ['Online Store 2.0', 'Customer Account API', 'Markets / locales'],
    position: { x: 0, y: 180 },
  },
  {
    id: 'ext-printify',
    type: 'external',
    label: 'Printify',
    host: 'Printify API',
    url: 'https://printify.com',
    repoPath: '— (SaaS)',
    summary:
      'Print-on-demand fulfilment partner: blueprints, print providers, order routing, mockups.',
    functions: [
      'Catalog / blueprint sync',
      'Product publish & order fulfilment',
      'Print provider selection',
    ],
    status: 'live',
    features: ['POD catalogue', 'Order webhooks', 'Mockup generation'],
    position: { x: 0, y: 380 },
  },

  // ── Infra ─────────────────────────────────────────────────
  {
    id: 'infra-d1',
    type: 'infra',
    label: 'Cloudflare D1',
    host: 'Multiple D1 databases',
    repoPath: 'migrations/, database/',
    summary:
      'Relational stores for creators, catalogue, billing, analytics, community, brand, admin, and more.',
    functions: [
      'creator-db, catalog-db, billing-db',
      'analytics-db, customer-db, admin-db',
      'community / eazy / mascot / prizes / artifacts / discovery / brand',
      'UI & product translations (catalog-db)',
    ],
    status: 'live',
    features: ['SQL schema migrations', 'Translation rows (ui + product)', 'Admin todos'],
    position: { x: 280, y: 80 },
  },
  {
    id: 'infra-r2',
    type: 'infra',
    label: 'Cloudflare R2',
    host: 'Object storage buckets',
    repoPath: 'src/utils/ (R2 helpers)',
    summary:
      'Asset storage for uploads, mockups, shop media, design-studio files, and customer content.',
    functions: [
      'creator-uploads',
      'product-mockups / shop-assets',
      'customer-uploads / design-studio-mockups',
    ],
    status: 'live',
    features: ['Public/private object URLs', 'Pipeline image storage'],
    position: { x: 280, y: 280 },
  },
  {
    id: 'infra-kv',
    type: 'infra',
    label: 'KV · JOBS',
    host: 'Cloudflare KV',
    repoPath: 'src/pipeline/, src/features/jobs/',
    summary:
      'Job queue state and short-lived operational keys for the creator image/publish pipeline.',
    functions: [
      'JOBS namespace for pipeline state',
      'Translation KV cache (proxy)',
      'Transient ops flags',
    ],
    status: 'live',
    features: ['Job lifecycle', 'Cache for translate-proxy'],
    position: { x: 280, y: 480 },
  },

  // ── Workers ───────────────────────────────────────────────
  {
    id: 'worker-engine',
    type: 'worker',
    label: 'creator-engine',
    host: 'join. / account. / __eaz',
    repoPath: 'src/worker.js, src/features/, src/pipeline/',
    summary:
      'Core API worker: design generation, products, Printify, Shopify, taxonomy, admin ops, jobs.',
    functions: [
      'Image / design pipeline',
      'Product publish & Printify',
      'Admin panel APIs',
      'Creator dispatch tunnel (__eaz)',
      'Translations import & coverage ops',
    ],
    status: 'live',
    features: [
      'Jobs + Queues',
      'Design Studio / Video Studio backends',
      'Admin analytics & readiness audits',
    ],
    relatedIdeaIds: ['IDEA-025', 'IDEA-026', 'IDEA-028'],
    position: { x: 580, y: 220 },
  },
  {
    id: 'worker-proxy',
    type: 'worker',
    label: 'eaz-translate-proxy',
    host: 'www.eazpire.com/*',
    repoPath: 'src/translate-proxy.js, wrangler-proxy.toml',
    summary:
      'Edge proxy that strips language prefixes, fetches English Shopify HTML, overlays D1 UI/product copy.',
    functions: [
      'URL prefix routing (/de/, /ar/, …)',
      'HTMLRewriter data-t overlays',
      'CreatorI18n / locale injection',
    ],
    status: 'live',
    features: ['D1 translation layer', 'Bypass Shopify Markets limits'],
    position: { x: 580, y: 40 },
  },
  {
    id: 'worker-creator',
    type: 'worker',
    label: 'creator-worker',
    host: 'creator.eazpire.com',
    repoPath: 'src/creator-worker.js, creator-web/, wrangler-creator.toml',
    summary: 'Hosts the Creator Hub portal — desktop/mobile creator shells and journey surfaces.',
    functions: ['Serve creator-web static/partials', 'Auth bridge to creator-engine', 'Portal routing'],
    status: 'wip',
    features: ['Creator dashboard shells', 'Journey modal hosting'],
    relatedIdeaIds: ['IDEA-024', 'IDEA-002'],
    position: { x: 580, y: 420 },
  },
  {
    id: 'worker-wear',
    type: 'worker',
    label: 'wear-worker',
    host: 'wear.eazpire.com',
    repoPath: 'src/wear-worker.js, wear-web/, wrangler-wear.toml',
    summary: 'Wear Player web hub for move-to-earn / character journey surfaces.',
    functions: ['Serve wear-web', 'API proxy to engine', 'Player journey pages'],
    status: 'beta',
    features: ['Move-to-earn hub', 'Character craft'],
    relatedIdeaIds: ['IDEA-011', 'IDEA-012', 'IDEA-013'],
    position: { x: 580, y: 580 },
  },
  {
    id: 'worker-brand',
    type: 'worker',
    label: 'brand-worker',
    host: 'brand.eazpire.com',
    repoPath: 'src/brand-worker.js, brand-portal/, brand-static/, brand-ui/',
    summary: 'Brand Portal for brand partners — overview, assets, and brand-scoped ops.',
    functions: ['Serve brand static SPA', 'Brand API routes', 'Auth for brand users'],
    status: 'beta',
    features: ['Brand overview', 'Partner brand workflows'],
    relatedIdeaIds: ['IDEA-029'],
    position: { x: 580, y: 720 },
  },
  {
    id: 'worker-partner',
    type: 'worker',
    label: 'partner-worker',
    host: 'partner.eazpire.com · admin.eazpire.com',
    repoPath: 'src/partner-worker.js, partner-*/ , admin-*-portal/',
    summary:
      'Hosts Partner Portal and Admin islands (admin creations, partner manufacturer network).',
    functions: [
      'Partner manufacturer catalogue',
      'Admin portal shell',
      'Admin creations island',
    ],
    status: 'beta',
    features: ['Manufacturer network', 'Admin islands'],
    relatedIdeaIds: ['IDEA-010', 'IDEA-014'],
    position: { x: 580, y: 860 },
  },
  {
    id: 'worker-play',
    type: 'worker',
    label: 'play-worker',
    host: 'play.eazpire.com',
    repoPath: 'src/play-worker.js, play-portal/, play-static/, play-ui/',
    summary: 'Community Games Platform — playable experiences and invite loops.',
    functions: ['Serve play SPA', 'Game session APIs', 'Invite / friends hooks'],
    status: 'beta',
    features: ['Dashboard SPA', 'Community games'],
    relatedIdeaIds: ['IDEA-018', 'IDEA-006'],
    position: { x: 580, y: 1000 },
  },
  {
    id: 'worker-ads',
    type: 'worker',
    label: 'ads-worker',
    host: 'ads.eazpire.com',
    repoPath: 'src/ads-worker.js, ads-portal/, ads-static/, wrangler-ads.toml',
    summary: 'Sponsored Loot Ads surface for branded loot drops and campaigns.',
    functions: ['Serve ads portal', 'Campaign / loot routing'],
    status: 'wip',
    features: ['Sponsored loot', 'Advertiser-facing UI'],
    relatedIdeaIds: ['IDEA-019'],
    position: { x: 580, y: 1140 },
  },
  {
    id: 'worker-map',
    type: 'worker',
    label: 'map-worker',
    host: 'map.eazpire.com',
    repoPath: 'src/map-worker.js, map-portal/, map-static/, wrangler-map.toml',
    summary: 'Serves the ecosystem architecture map SPA (static graph + filters).',
    functions: ['Serve map-static SPA', 'SPA fallback routing'],
    status: 'wip',
    features: ['React Flow map', 'Mirror repo sync'],
    relatedIdeaIds: ['IDEA-032'],
    position: { x: 580, y: 1280 },
  },

  // ── Portals ───────────────────────────────────────────────
  {
    id: 'portal-storefront',
    type: 'portal',
    label: 'Shopify Storefront',
    host: 'www.eazpire.com',
    url: 'https://www.eazpire.com',
    repoPath: 'theme/',
    summary:
      'Primary commerce & Creator UI: Horizon-based theme with eaz redesign, creator widgets, shop studio.',
    functions: [
      'Product browse & checkout',
      'Creator dashboard / my creations',
      'Design Studio & Video Studio UIs',
      'Admin panel (Shopify page)',
      'Language switch + dialect loader',
    ],
    status: 'live',
    features: [
      'eaz-* redesign shells',
      'Creator I18n + data-t keys',
      'Quick Inspirations / Shop Design Studio',
    ],
    relatedIdeaIds: ['IDEA-026', 'IDEA-030', 'IDEA-031'],
    position: { x: 920, y: 80 },
  },
  {
    id: 'portal-creator',
    type: 'portal',
    label: 'Creator Portal',
    host: 'creator.eazpire.com',
    url: 'https://creator.eazpire.com',
    repoPath: 'creator-web/',
    summary: 'Dedicated Creator Hub separate from the Shopify theme shells.',
    functions: [
      'Desktop & mobile creator dashboards',
      'Journey / unlock surfaces',
      'Creator overview routing',
    ],
    status: 'wip',
    features: ['Partial HTML shells', 'Journey modal'],
    relatedIdeaIds: ['IDEA-024', 'IDEA-002'],
    position: { x: 920, y: 320 },
  },
  {
    id: 'portal-wear',
    type: 'portal',
    label: 'Wear Web Hub',
    host: 'wear.eazpire.com',
    url: 'https://wear.eazpire.com',
    repoPath: 'wear-web/',
    summary: 'Web companion for Wear Player / move-to-earn journeys.',
    functions: ['Player hub pages', 'Links Wear apps to engine'],
    status: 'beta',
    features: ['Move-to-earn web', 'Character journey'],
    relatedIdeaIds: ['IDEA-011'],
    position: { x: 920, y: 500 },
  },
  {
    id: 'portal-brand',
    type: 'portal',
    label: 'Brand Portal',
    host: 'brand.eazpire.com',
    url: 'https://brand.eazpire.com',
    repoPath: 'brand-portal/, brand-static/, brand-ui/',
    summary: 'Brand partner workspace — overview, assets, brand-scoped management.',
    functions: ['Brand overview route', 'Brand workflows'],
    status: 'beta',
    features: ['Brand SPA', 'Asset views'],
    relatedIdeaIds: ['IDEA-029'],
    position: { x: 920, y: 660 },
  },
  {
    id: 'portal-partner',
    type: 'portal',
    label: 'Partner Portal',
    host: 'partner.eazpire.com',
    url: 'https://partner.eazpire.com',
    repoPath: 'partner-portal/, partner-static/, partner-ui/',
    summary: 'Manufacturer / partner network: catalogue and collaboration surfaces.',
    functions: ['Partner catalogue', 'Manufacturer onboarding UI'],
    status: 'beta',
    features: ['Manufacturer network'],
    relatedIdeaIds: ['IDEA-010'],
    position: { x: 920, y: 820 },
  },
  {
    id: 'portal-admin',
    type: 'portal',
    label: 'Admin Portal',
    host: 'admin.eazpire.com',
    url: 'https://admin.eazpire.com',
    repoPath: 'admin-partner-portal/, admin-creations-portal/, theme/assets/admin-page-*.js',
    summary:
      'Ops & admin surfaces: standalone admin islands plus in-theme admin panel pages.',
    functions: [
      'Admin creations island',
      'Theme admin: dashboard, analytics, translations, DBs, logs',
      'Publish readiness audits',
    ],
    status: 'beta',
    features: ['Translations coverage UI', 'Ops cron/queue controls'],
    relatedIdeaIds: ['IDEA-014', 'IDEA-015'],
    position: { x: 920, y: 980 },
  },
  {
    id: 'portal-play',
    type: 'portal',
    label: 'Play Portal',
    host: 'play.eazpire.com',
    url: 'https://play.eazpire.com',
    repoPath: 'play-portal/, play-static/, play-ui/',
    summary: 'Community games — dashboard SPA and invite/friends experiences.',
    functions: ['Game dashboard', 'Invite / bonus rounds'],
    status: 'beta',
    features: ['#/ dashboard routing', 'Community games'],
    relatedIdeaIds: ['IDEA-018', 'IDEA-006'],
    position: { x: 920, y: 1140 },
  },
  {
    id: 'portal-ads',
    type: 'portal',
    label: 'Ads Portal',
    host: 'ads.eazpire.com',
    url: 'https://ads.eazpire.com',
    repoPath: 'ads-portal/, ads-static/',
    summary: 'Sponsored loot advertising portal for brands and campaigns.',
    functions: ['Campaign management UI', 'Loot drop presentation'],
    status: 'wip',
    features: ['Sponsored loot ads'],
    relatedIdeaIds: ['IDEA-019'],
    position: { x: 920, y: 1280 },
  },
  {
    id: 'portal-map',
    type: 'portal',
    label: 'Ecosystem Map',
    host: 'map.eazpire.com',
    url: 'https://map.eazpire.com',
    repoPath: 'map-portal/, map-static/, src/map-worker.js',
    summary:
      'Architecture map of the eazpire ecosystem — portals, workers, apps, and infrastructure relationships.',
    functions: [
      'Interactive React Flow map',
      'Node detail modals',
      'Type filters + search',
    ],
    status: 'wip',
    features: ['Static ecosystem graph', 'Own Worker + mirror repo'],
    relatedIdeaIds: ['IDEA-032'],
    position: { x: 920, y: 1420 },
  },

  // ── Apps ──────────────────────────────────────────────────
  {
    id: 'app-android',
    type: 'app',
    label: 'Creator Android',
    host: 'Android app',
    repoPath: 'android/, android/benchmark/',
    summary: 'Native Creator experience — Eazy chat parity, notifications, creator flows.',
    functions: [
      'Creator mobile client',
      'Eazy chat',
      'TranslationStore for locked strings',
      'Macrobenchmark module',
    ],
    status: 'wip',
    features: ['Eazy chat parity', 'installDebug workflow'],
    relatedIdeaIds: ['IDEA-004'],
    position: { x: 1280, y: 200 },
  },
  {
    id: 'app-wear-phone',
    type: 'app',
    label: 'Wear Player Phone',
    host: 'Android companion',
    repoPath: 'wear-android/, wear-core/',
    summary: 'Phone hub for Wear Player — connects watch companion and web journey.',
    functions: ['Phone hub UI', 'Shared wear-core logic', 'Sync with wear-os'],
    status: 'beta',
    features: ['Move-to-earn phone'],
    relatedIdeaIds: ['IDEA-012'],
    position: { x: 1280, y: 400 },
  },
  {
    id: 'app-wear-os',
    type: 'app',
    label: 'Wear OS Watch',
    host: 'Wear OS',
    repoPath: 'wear-os/',
    summary: 'Watch companion for Wear Player — activity, AR hooks, companion sync.',
    functions: ['Watch UI', 'Sensor / activity signals', 'Companion pairing'],
    status: 'beta',
    features: ['Wear companion', 'AR canvas hooks'],
    relatedIdeaIds: ['IDEA-013', 'IDEA-020'],
    position: { x: 1280, y: 560 },
  },
  {
    id: 'app-creator-watch',
    type: 'app',
    label: 'Creator Watch',
    host: 'Wear OS',
    repoPath: 'creator-watch/',
    summary: 'Creator-oriented watch app companion for creator notifications / glances.',
    functions: ['Creator watch surfaces', 'Glanceable creator status'],
    status: 'wip',
    features: ['Watch Gradle module'],
    position: { x: 1280, y: 720 },
  },
  {
    id: 'app-shopify-remix',
    type: 'app',
    label: 'Shopify Remix App',
    host: 'Shopify embedded app',
    repoPath: 'eazpire-app/eazpire-creator/',
    summary:
      'Remix + Vite Shopify app with discount function extensions (quantity, creator, shipping).',
    functions: [
      'Embedded merchant app',
      'Discount extensions',
      'Checkout UX extension',
    ],
    status: 'live',
    features: ['eaz-quantity-discount', 'eaz-creator-discount', 'eaz-shipping-discount'],
    position: { x: 1280, y: 40 },
  },
  {
    id: 'app-web-ar',
    type: 'app',
    label: 'Web AR Try-on',
    host: 'Local / WebAR lab',
    repoPath: 'web-ar-tryon/',
    summary: 'Vite + React + MediaPipe lab for AR try-on and canvas drawings experiments.',
    functions: ['AR try-on prototype', 'MediaPipe vision'],
    status: 'wip',
    features: ['MediaPipe', 'AR canvas'],
    relatedIdeaIds: ['IDEA-020', 'IDEA-021'],
    position: { x: 1280, y: 880 },
  },
];

export const ECOSYSTEM_EDGES: EcosystemEdge[] = [
  // External ↔ engine
  { id: 'e1', from: 'ext-shopify', to: 'worker-engine', label: 'Admin / Storefront API' },
  { id: 'e2', from: 'ext-printify', to: 'worker-engine', label: 'POD API' },
  { id: 'e3', from: 'ext-shopify', to: 'portal-storefront', label: 'Hosts theme' },
  { id: 'e4', from: 'ext-shopify', to: 'app-shopify-remix', label: 'Embedded app' },

  // Infra ↔ engine / proxy
  { id: 'e5', from: 'worker-engine', to: 'infra-d1', label: 'SQL' },
  { id: 'e6', from: 'worker-engine', to: 'infra-r2', label: 'Assets' },
  { id: 'e7', from: 'worker-engine', to: 'infra-kv', label: 'Jobs' },
  { id: 'e8', from: 'worker-proxy', to: 'infra-d1', label: 'Translations' },
  { id: 'e9', from: 'worker-proxy', to: 'infra-kv', label: 'Cache' },

  // Proxy ↔ storefront
  { id: 'e10', from: 'worker-proxy', to: 'portal-storefront', label: 'HTML overlay' },
  { id: 'e11', from: 'ext-shopify', to: 'worker-proxy', label: 'Origin HTML' },

  // Storefront ↔ engine
  { id: 'e12', from: 'portal-storefront', to: 'worker-engine', label: 'Creator API' },

  // Hub workers ↔ portals
  { id: 'e13', from: 'worker-creator', to: 'portal-creator', label: 'Serves' },
  { id: 'e14', from: 'worker-wear', to: 'portal-wear', label: 'Serves' },
  { id: 'e15', from: 'worker-brand', to: 'portal-brand', label: 'Serves' },
  { id: 'e16', from: 'worker-partner', to: 'portal-partner', label: 'Serves' },
  { id: 'e17', from: 'worker-partner', to: 'portal-admin', label: 'Serves' },
  { id: 'e18', from: 'worker-play', to: 'portal-play', label: 'Serves' },
  { id: 'e19', from: 'worker-ads', to: 'portal-ads', label: 'Serves' },
  { id: 'e33', from: 'worker-map', to: 'portal-map', label: 'Serves' },

  // Hub workers ↔ engine
  { id: 'e20', from: 'worker-creator', to: 'worker-engine', label: 'CREATOR_ENGINE' },
  { id: 'e21', from: 'worker-wear', to: 'worker-engine', label: 'CREATOR_ENGINE' },
  { id: 'e22', from: 'worker-brand', to: 'worker-engine', label: 'CREATOR_ENGINE' },
  { id: 'e23', from: 'worker-partner', to: 'worker-engine', label: 'CREATOR_ENGINE' },
  { id: 'e24', from: 'worker-play', to: 'worker-engine', label: 'CREATOR_ENGINE' },
  { id: 'e25', from: 'worker-ads', to: 'worker-engine', label: 'CREATOR_ENGINE' },

  // Apps ↔ engine / portals
  { id: 'e26', from: 'app-android', to: 'worker-engine', label: 'API' },
  { id: 'e27', from: 'app-wear-phone', to: 'worker-engine', label: 'API' },
  { id: 'e28', from: 'app-wear-phone', to: 'portal-wear', label: 'Companion' },
  { id: 'e29', from: 'app-wear-os', to: 'app-wear-phone', label: 'Pairing' },
  { id: 'e30', from: 'app-creator-watch', to: 'app-android', label: 'Companion' },
  { id: 'e31', from: 'app-shopify-remix', to: 'worker-engine', label: 'Discount / API' },
  { id: 'e32', from: 'app-web-ar', to: 'portal-wear', label: 'AR experiments' },
];

export function getNodeById(id: string): EcosystemNode | undefined {
  return ECOSYSTEM_NODES.find((n) => n.id === id);
}

export function getConnections(nodeId: string): {
  outbound: EcosystemEdge[];
  inbound: EcosystemEdge[];
} {
  return {
    outbound: ECOSYSTEM_EDGES.filter((e) => e.from === nodeId),
    inbound: ECOSYSTEM_EDGES.filter((e) => e.to === nodeId),
  };
}
