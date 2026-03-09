import { NextRequest, NextResponse } from 'next/server';
import { runCaptureJob } from '@/app/lib/capture';

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;

  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace(/^Bearer\s+/i, '') ?? request.nextUrl.searchParams.get('key');
  return token === secret;
}

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const force = request.nextUrl.searchParams.get('force') === 'true';
  const runKey = request.nextUrl.searchParams.get('runKey') ?? undefined;

  try {
    const result = await runCaptureJob({ force, runKey });
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
