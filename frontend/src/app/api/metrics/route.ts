import { NextResponse } from 'next/server';
import { register } from '@/lib/metrics';

export async function GET() {
  return new NextResponse(await register.metrics(), {
    headers: { 'Content-Type': register.contentType },
  });
}