import { sql } from '@/app/lib/db';
import PromotionForm from './PromotionForm';

export const dynamic = 'force-dynamic';

export default async function PromotionsPage() {
  let promotions: {
    id: number;
    coupon_code: string;
    page_name: string;
    start_date: string;
    end_date: string;
    created_at: string;
  }[] = [];

  try {
    const rows = await sql`
      SELECT id, coupon_code, page_name,
             start_date::text AS start_date,
             end_date::text AS end_date,
             created_at
      FROM promotions
      ORDER BY created_at DESC
    `;
    promotions = rows as typeof promotions;
  } catch {
    // Table may not exist yet in dev — page renders empty
  }

  return (
    <div>
      <div style={{ marginTop: 24, marginBottom: 8 }}>
        <h2 style={{ margin: 0 }}>Control de Promociones</h2>
        <p className="subtle" style={{ margin: '4px 0 0' }}>
          Registra y monitorea los cupones de descuento aplicados a cada pagina de CookUnity.
        </p>
      </div>
      <PromotionForm initialPromotions={promotions} />
    </div>
  );
}
