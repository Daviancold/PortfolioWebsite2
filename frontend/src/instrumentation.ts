export async function register() {
  // We only want the side-car server running in the Node.js runtime (server-side)
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const http = await import('http');
    // Import the register you already created in src/lib
    const { register: promRegister } = await import('./lib/metrics');

    const METRICS_PORT = 9090;

    http.createServer(async (req, res) => {
      const url = new URL(req.url || '/', `http://${req.headers.host}`);
      
      if (url.pathname === '/metrics') {
        try {
          res.setHeader('Content-Type', promRegister.contentType);
          // This pulls all the data from your global.__metrics.register
          res.end(await promRegister.metrics());
        } catch (ex) {
          res.statusCode = 500;
          res.end(ex instanceof Error ? ex.message : 'Metrics error');
        }
      } else {
        res.statusCode = 404;
        res.end('Not Found');
      }
    }).listen(METRICS_PORT, () => {
      console.log(`📡 Prometheus metrics side-server active on port ${METRICS_PORT}`);
    });
  }
}