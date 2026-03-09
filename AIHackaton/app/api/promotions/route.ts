import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/app/lib/db';

export const runtime = 'nodejs';

export async function GET() {
  const rows = await sql`
    SELECT id, coupon_code, page_name, start_date, end_date, created_at
    FROM promotions
    ORDER BY created_at DESC
  `;
  return NextResponse.json({ promotions: rows });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { coupon_code, page_name, start_date, end_date } = body;

  if (!coupon_code || !page_name || !start_date || !end_date) {
    return NextResponse.json({ error: 'Todos los campos son requeridos.' }, { status: 400 });
  }

  if (new Date(end_date) < new Date(start_date)) {
    return NextResponse.json({ error: 'La fecha de fin debe ser posterior a la fecha de inicio.' }, { status: 400 });
  }

  const rows = await sql`
    INSERT INTO promotions (coupon_code, page_name, start_date, end_date)
    VALUES (${coupon_code}, ${page_name}, ${start_date}, ${end_date})
    RETURNING id, coupon_code, page_name, start_date, end_date, created_at
  `;

  return NextResponse.json({ promotion: rows[0] }, { status: 201 });
}
