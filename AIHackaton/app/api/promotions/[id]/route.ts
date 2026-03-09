import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/app/lib/db';

export const runtime = 'nodejs';

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  if (isNaN(id)) {
    return NextResponse.json({ error: 'ID invalido.' }, { status: 400 });
  }

  await sql`DELETE FROM promotions WHERE id = ${id}`;
  return NextResponse.json({ success: true });
}
