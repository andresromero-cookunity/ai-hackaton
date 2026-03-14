import { getCompetitorHealth } from '../lib/reports';

export const dynamic = 'force-dynamic';

export default async function CompetitorsPage() {
  const rows = await getCompetitorHealth();

  return (
    <section className="card" style={{ marginTop: 24 }}>
      <h2>Competitor Coverage</h2>
      <p className="subtle">Top 10 competitors from foodtechrace source, tracked on desktop and mobile.</p>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Competitor</th>
              <th>URL</th>
              <th>Last snapshot</th>
              <th>Snapshots (7d)</th>
              <th>Changes (7d)</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>{row.name}</td>
                <td>
                  <a href={row.url} target="_blank" rel="noreferrer">
                    {row.url}
                  </a>
                </td>
                <td>{row.last_snapshot_at ? new Date(row.last_snapshot_at).toLocaleString() : '-'}</td>
                <td>{row.snapshots_last_7d}</td>
                <td>{row.changes_last_7d}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
