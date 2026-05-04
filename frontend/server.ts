import { createServer, IncomingMessage, ServerResponse } from 'http';
import { parse } from 'url';
import next from 'next';
import { httpRequestDuration, httpRequestTotal, httpActiveRequests, register } from './src/lib/metrics';

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();
const IGNORED_PREFIXES = ['/_next/', '/favicon.ico', '/metrics'];

app.prepare().then(() => {
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
    const start = Date.now();
    const method = req.method || 'GET';
    const parsedUrl = parse(req.url || '/', true);
    const route = parsedUrl.pathname || '/';

    // Skip internal Next.js routes
    if (IGNORED_PREFIXES.some(prefix => route.startsWith(prefix))) {
      handle(req, res, parsedUrl);
      return;
    }

    httpActiveRequests.labels(method).inc();

    // Patch res.end — by the time Next.js calls this,
    // res.statusCode is already the real value (200, 404, 500 etc.)
    const originalEnd = res.end.bind(res);
    (res as any).end = function (...args: any[]) {
      const status = res.statusCode.toString();
      const duration = (Date.now() - start) / 1000;

      httpRequestDuration.labels(method, route, status).observe(duration);
      httpRequestTotal.labels(method, route, status).inc();
      httpActiveRequests.labels(method).dec();

      return originalEnd(...args);
    };

    handle(req, res, parsedUrl);
  }).listen(3000, () => {
    console.log('🚀 Next.js server on port 3000');
  });
});