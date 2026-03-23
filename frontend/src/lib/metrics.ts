import client from 'prom-client';

declare global {
  // eslint-disable-next-line no-var
  var __metrics: {
    register: client.Registry;
    httpRequestDuration: client.Histogram;
    httpRequestTotal: client.Counter;
    httpActiveRequests: client.Gauge;
  } | undefined;
}

if (!global.__metrics) {
  const register = new client.Registry();
  client.collectDefaultMetrics({ register });

  global.__metrics = {
    register,
    httpRequestDuration: new client.Histogram({
      name: 'http_request_duration_seconds',
      help: 'Duration of HTTP requests in seconds',
      labelNames: ['method', 'route', 'status_code'],
      buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 2, 5],
      registers: [register],
    }),
    httpRequestTotal: new client.Counter({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status_code'],
      registers: [register],
    }),
    httpActiveRequests: new client.Gauge({
      name: 'http_active_requests',
      help: 'Number of requests currently being processed',
      labelNames: ['method'],
      registers: [register],
    }),
  };
}

export const { register, httpRequestDuration, httpRequestTotal, httpActiveRequests } =
  global.__metrics;