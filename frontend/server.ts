import { createServer, IncomingMessage, ServerResponse } from 'http';
import { parse } from 'url';
import next from 'next';
import fs from 'fs';
import path from 'path';
import { httpRequestDuration, httpRequestTotal, httpActiveRequests, register } from './src/lib/metrics';

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();
const IGNORED_PREFIXES = ['/_next/', '/favicon.ico', '/metrics', '/images/', '/__nextjs_'];

// Common bot/scanner patterns
const BOT_PATTERNS = [
  /\.env/, // Matches .env anywhere (including /.env)
  /\.git/,
  /wp-admin/,
  /wp-login/,
  /phpMyAdmin/,
  /\.php$/,
  /\/admin/, // Added slash for /admin specifically
  /\/config/, // Added slash for /config
  /\.xml$/,
  /\.sql$/,
  /\/backup/, // Added slash for /backup
  /\.zip$/,
];

function isBotPattern(pathname: string): boolean {
  return BOT_PATTERNS.some(pattern => pattern.test(pathname));
}

// Scan app directory for routes (dev mode only)
function scanAppDirectory(baseDir: string, currentDir: string, routes: Set<string>) {
  try {
    // Check if directory exists first
    if (!fs.existsSync(currentDir)) {
      console.warn(`⚠️ Directory not found: ${currentDir}`);
      return;
    }

    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        // Skip special Next.js directories
        if (entry.name.startsWith('_')) continue;
        const fullPath = path.join(currentDir, entry.name);
        scanAppDirectory(baseDir, fullPath, routes);
      } else if (entry.name === 'page.tsx' || entry.name === 'page.js') {
        // Convert file path to route
        const routePath = currentDir
          .replace(baseDir, '')
          .replace(/\\/g, '/') || '/';
        routes.add(routePath);
      }
    }
  } catch (error) {
    console.warn('⚠️ Error scanning directory:', error);
  }
}

// Dynamically load known routes from Next.js build manifest
function loadKnownRoutes(): Set<string> {
  const knownRoutes = new Set<string>(['/']); 

  if (!dev) {
    try {
      // Use prerender-manifest for clean, public-facing URLs
      const manifestPath = path.join(process.cwd(), '.next/prerender-manifest.json');
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
      
      // 1. Add Static Routes (e.g., /about, /gallery)
      if (manifest.routes) {
        Object.keys(manifest.routes).forEach(route => {
          knownRoutes.add(route);
        });
      }

      // 2. Add Dynamic Route Patterns (e.g., /blog/[slug])
      if (manifest.dynamicRoutes) {
        Object.keys(manifest.dynamicRoutes).forEach(route => {
          knownRoutes.add(route);
        });
      }

      console.log('📋 Loaded clean routes from Prerender Manifest:', Array.from(knownRoutes));
    } catch (error) {
      console.warn('⚠️ Could not load prerender-manifest.json. Metrics might bucket as /unknown.');
    }
  } else {
    // Keep your existing dev logic for filesystem scanning
    const possiblePaths = [
      path.join(process.cwd(), 'app'),
      path.join(process.cwd(), 'src', 'app'),
    ];
    
    const appDir = possiblePaths.find(p => fs.existsSync(p));
    
    if (appDir) {
      console.log(`📂 Scanning app directory: ${appDir}`);
      scanAppDirectory(appDir, appDir, knownRoutes);
      console.log('📋 Loaded routes from filesystem:', Array.from(knownRoutes));
    }
  }
  
  return knownRoutes;
}

// Initialize known routes (will be set after app.prepare())
let KNOWN_ROUTES_SET: Set<string>;

function normalizeRoute(pathname: string): string {
  // 1. Basic cleaning
  const cleanPath = pathname.length > 1 && pathname.endsWith('/') 
    ? pathname.slice(0, -1) 
    : pathname;

  // 2. Exact Match (Static pages like /about, /gallery)
  if (KNOWN_ROUTES_SET.has(cleanPath)) {
    return cleanPath;
  }

  // 3. Dynamic Pattern Validation (e.g., /work/capstone matching /work/[slug])
  for (const knownRoute of KNOWN_ROUTES_SET) {
    if (knownRoute.includes('[')) {
      const pattern = knownRoute
        .replace(/\[\.\.\.(\w+)\]/g, '(.+)')
        .replace(/\[(\w+)\]/g, '([^/]+)');
      
      const regex = new RegExp(`^${pattern}$`);
      
      if (regex.test(cleanPath)) {
        // ✅ Return the specific path (e.g., /work/capstone)
        // This gives you the high-granularity metrics you want.
        return cleanPath; 
      }
    }
  }

  // 4. Distinguish between legitimate 404s and bot traffic
  if (isBotPattern(cleanPath)) {
    return '/bot-scan';
  }

  // 5. Fallback for anything else
  return '/unknown';
}

// function normalizeRoute(pathname: string): string {
//   // 1. Basic cleaning
//   const cleanPath = pathname.length > 1 && pathname.endsWith('/') 
//     ? pathname.slice(0, -1) 
//     : pathname;

//   console.log(`🔍 Normalizing: "${pathname}" → cleaned: "${cleanPath}"`);

//   // 2. Exact Match (Static pages like /about, /gallery)
//   if (KNOWN_ROUTES_SET.has(cleanPath)) {
//     console.log(`✅ Exact match found: ${cleanPath}`);
//     return cleanPath;
//   }

//   // 3. Dynamic Pattern Validation (e.g., /work/capstone matching /work/[slug])
//   for (const knownRoute of KNOWN_ROUTES_SET) {
//     if (knownRoute.includes('[')) {
//       const pattern = knownRoute
//         .replace(/\[\.\.\.(\w+)\]/g, '(.+)')
//         .replace(/\[(\w+)\]/g, '([^/]+)');
      
//       const regex = new RegExp(`^${pattern}$`);
      
//       if (regex.test(cleanPath)) {
//         console.log(`✅ Dynamic match: "${cleanPath}" matched pattern "${knownRoute}"`);
//         return cleanPath; 
//       }
//     }
//   }

//   // 4. Distinguish between legitimate 404s and bot traffic
//   if (isBotPattern(cleanPath)) {
//     console.log(`🤖 Bot pattern: ${cleanPath}`);
//     return '/bot-scan';
//   }

//   // 5. Fallback for anything else
//   console.log(`❌ Unknown route: ${cleanPath}`);
//   return '/unknown';
// }

app.prepare().then(() => {
  // Load routes after Next.js is ready
  KNOWN_ROUTES_SET = loadKnownRoutes();

  // Metrics endpoint on sidecar port
  createServer(async (req, res) => {
    if (req.url === '/metrics') {
      res.setHeader('Content-Type', register.contentType);
      res.end(await register.metrics());
    } else {
      res.statusCode = 404;
      res.end('Not found');
    }
  }).listen(9090, () => {
    console.log('📡 Prometheus metrics on port 9090');
  });

  // Main Next.js server
  createServer((req: IncomingMessage, res: ServerResponse) => {
    const parsedUrl = parse(req.url || '/', true);
    const route = parsedUrl.pathname || '/';

    const isPrefetch = 
    req.headers['purpose'] === 'prefetch' || 
    req.headers['sec-purpose'] === 'prefetch' ||
    req.headers['next-router-prefetch'];

    if (isPrefetch) {
      // Return 204 (No Content). This stops the prefetch immediately.
      // Because the browser gets no data, it's forced to make a 
      // real request when the user actually clicks the link.
      res.statusCode = 204;
      res.end();
      return;
    }

    const start = Date.now();
    const method = req.method || 'GET';

    // Skip internal Next.js routes and static files
    if (IGNORED_PREFIXES.some(prefix => route.startsWith(prefix))) {
      handle(req, res, parsedUrl);
      return;
    }

    // --- STEP 2: CACHE-CONTROL NUCLEAR OPTION ---
    // Apply this to all non-static asset requests to ensure 
    // every "Click" or "Refresh" hits your server.
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    console.log(JSON.stringify({
      route,
      headers: {
        'next-router-prefetch': req.headers['next-router-prefetch'],
        'next-router-state-tree': req.headers['next-router-state-tree'],
        'purpose': req.headers['purpose'],
        'sec-purpose': req.headers['sec-purpose'],
        'rsc': req.headers['rsc'],
      }
    }));

    // ✅ Normalize the route: known routes stay as-is, unknown → '/unknown'
    const normalizedRoute = normalizeRoute(route);

    httpActiveRequests.labels(method).inc();

    // Patch res.end — by the time Next.js calls this,
    // res.statusCode is already the real value (200, 404, 500 etc.)
    const originalEnd = res.end.bind(res);
    (res as any).end = function (...args: any[]) {
      const status = res.statusCode.toString();
      const duration = (Date.now() - start) / 1000;

      httpRequestDuration.labels(method, normalizedRoute, status).observe(duration);
      httpRequestTotal.labels(method, normalizedRoute, status).inc();
      httpActiveRequests.labels(method).dec();

      // ✅ Log suspicious bot traffic for analysis
      if (normalizedRoute === '/bot-scan' || normalizedRoute === '/unknown') {
        console.log(JSON.stringify({
          timestamp: new Date().toISOString(),
          type: normalizedRoute === '/bot-scan' ? 'bot_scan' : 'unknown_route',
          method,
          path: route,
          normalizedRoute,
          status,
          ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
          userAgent: req.headers['user-agent'],
        }));
      }
      return originalEnd(...args);
    };
    handle(req, res, parsedUrl);
  }).listen(3000, () => {
    console.log('🚀 Next.js server on port 3000');
  });
}); 