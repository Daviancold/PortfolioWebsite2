import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import {
  httpRequestDuration,
  httpRequestTotal,
  httpActiveRequests,
} from '@/lib/metrics';

export async function proxy(request: NextRequest) {
  const start = Date.now();
  const method = request.method;
  const route = request.nextUrl.pathname;

  httpActiveRequests.labels(method).inc();

  const response = NextResponse.next();

  httpRequestDuration
    .labels(method, route, response.status.toString())
    .observe((Date.now() - start) / 1000);

  httpRequestTotal
    .labels(method, route, response.status.toString())
    .inc();

  httpActiveRequests.labels(method).dec();

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/metrics).*)',
  ],
};