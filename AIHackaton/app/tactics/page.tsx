import Link from 'next/link';
import { getTactics } from '../lib/reports';

export const dynamic = 'force-dynamic';

export default async function TacticsPage({
  searchParams
}: {
  searchParams: { q?: string };
}) {
  const query = searchParams.q ?? '';
  const rows = await getTactics(query);

  return (
    <section className="card" style={{ marginTop: 24 }}>
      <h2>Tactic Library</h2>
      <p className="subtle">
        Search by competitor, category, or messaging pattern. Mandatory fields: competitor, date range, category,
        description, screenshot, intent, experiment suggestion.
      </p>

      <form action="/tactics" method="get" style={{ marginBottom: 12 }}>
        <input defaultValue={query} name="q" type="search" placeholder="Search tactics..." />
      </form>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Competitor</th>
              <th>Category</th>
              <th>Description</th>
              <th>Intent</th>
              <th>Experiment suggestion</th>
              <th>Date range</th>
              <th>Screenshot</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="subtle">
                  No tactics found.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id}>
                  <td>{row.competitor_name}</td>
                  <td>
                    <span className="tag">{row.category}</span>
                  </td>
                  <td>{row.description}</td>
                  <td>{row.inferred_intent}</td>
                  <td>{row.experiment_suggestion}</td>
                  <td>
                    {row.date_from}
                    {row.date_to ? ` -> ${row.date_to}` : ''}
                  </td>
                  <td>
                    {row.screenshot_url ? (
                      <a href={row.screenshot_url} target="_blank" rel="noreferrer">
                        Open
                      </a>
                    ) : (
                      '-'
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <p style={{ marginTop: 12 }}>
        <Link href="/">Back to Weekly View</Link>
      </p>
    </section>
  );
}
