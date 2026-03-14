'use client';

import { useState } from 'react';

interface Promotion {
  id: number;
  coupon_code: string;
  page_name: string;
  start_date: string;
  end_date: string;
  created_at: string;
}

interface Props {
  initialPromotions: Promotion[];
}

function getStatus(start: string, end: string): { label: string; color: string } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const s = new Date(start);
  const e = new Date(end);
  if (today < s) return { label: 'Programada', color: '#92400e' };
  if (today > e) return { label: 'Expirada', color: '#6b7280' };
  return { label: 'Activa', color: '#065f46' };
}

export default function PromotionForm({ initialPromotions }: Props) {
  const [promotions, setPromotions] = useState<Promotion[]>(initialPromotions);
  const [form, setForm] = useState({ coupon_code: '', page_name: '', start_date: '', end_date: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/promotions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Error al guardar la promocion.');
      } else {
        setPromotions([data.promotion, ...promotions]);
        setForm({ coupon_code: '', page_name: '', start_date: '', end_date: '' });
      }
    } catch {
      setError('Error de red. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('¿Eliminar esta promocion?')) return;
    await fetch(`/api/promotions/${id}`, { method: 'DELETE' });
    setPromotions(promotions.filter((p) => p.id !== id));
  }

  return (
    <>
      <section className="card" style={{ marginTop: 24, marginBottom: 24 }}>
        <h2>Nueva Promocion</h2>
        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 14, maxWidth: 520 }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 14, fontWeight: 600 }}>
            Codigo de Cupon
            <input
              type="text"
              placeholder="ej. WELCOME20"
              value={form.coupon_code}
              onChange={(e) => setForm({ ...form, coupon_code: e.target.value })}
              required
              style={inputStyle}
            />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 14, fontWeight: 600 }}>
            Nombre de Pagina
            <input
              type="text"
              placeholder="ej. Homepage, Landing Black Friday"
              value={form.page_name}
              onChange={(e) => setForm({ ...form, page_name: e.target.value })}
              required
              style={inputStyle}
            />
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 14, fontWeight: 600 }}>
              Fecha de Inicio
              <input
                type="date"
                value={form.start_date}
                onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                required
                style={inputStyle}
              />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 14, fontWeight: 600 }}>
              Fecha de Fin
              <input
                type="date"
                value={form.end_date}
                onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                required
                style={inputStyle}
              />
            </label>
          </div>
          {error && <p style={{ color: '#dc2626', fontSize: 14, margin: 0 }}>{error}</p>}
          <button
            type="submit"
            disabled={loading}
            style={{
              background: 'var(--accent)',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              padding: '10px 20px',
              fontWeight: 700,
              fontSize: 14,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              width: 'fit-content',
            }}
          >
            {loading ? 'Guardando...' : 'Guardar Promocion'}
          </button>
        </form>
      </section>

      <section className="card">
        <h2>Promociones Registradas</h2>
        {promotions.length === 0 ? (
          <p className="subtle">No hay promociones registradas aun.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Codigo de Cupon</th>
                  <th>Pagina</th>
                  <th>Fecha Inicio</th>
                  <th>Fecha Fin</th>
                  <th>Estado</th>
                  <th>Registrada</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {promotions.map((p) => {
                  const status = getStatus(p.start_date, p.end_date);
                  return (
                    <tr key={p.id}>
                      <td>
                        <code
                          style={{
                            background: '#f1f5f9',
                            borderRadius: 6,
                            padding: '2px 8px',
                            fontFamily: 'monospace',
                            fontSize: 13,
                          }}
                        >
                          {p.coupon_code}
                        </code>
                      </td>
                      <td>{p.page_name}</td>
                      <td>{formatDate(p.start_date)}</td>
                      <td>{formatDate(p.end_date)}</td>
                      <td>
                        <span
                          style={{
                            display: 'inline-block',
                            borderRadius: 999,
                            padding: '2px 10px',
                            fontSize: 12,
                            fontWeight: 700,
                            background: `${status.color}18`,
                            color: status.color,
                            border: `1px solid ${status.color}40`,
                          }}
                        >
                          {status.label}
                        </span>
                      </td>
                      <td className="subtle">{new Date(p.created_at).toLocaleDateString('es-AR')}</td>
                      <td>
                        <button
                          onClick={() => handleDelete(p.id)}
                          style={{
                            background: 'none',
                            border: '1px solid #fca5a5',
                            color: '#dc2626',
                            borderRadius: 6,
                            padding: '3px 10px',
                            fontSize: 12,
                            cursor: 'pointer',
                            fontWeight: 600,
                          }}
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('T')[0].split('-');
  return `${day}/${month}/${year}`;
}

const inputStyle: React.CSSProperties = {
  padding: '9px 12px',
  borderRadius: 8,
  border: '1px solid var(--border)',
  fontSize: 14,
  fontWeight: 400,
  width: '100%',
};
