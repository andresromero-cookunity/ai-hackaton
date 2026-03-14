import Link from 'next/link';
import { getDashboardOverview } from './lib/reports';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const data = await getDashboardOverview();

  return (
    <div>
      <section className="grid">
        <article className="card">
          <h2>Weekly Change Detection</h2>
          <p className="subtle">Week starting {data.weekStart} (Monday-Sunday).</p>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Competitor</th>
                  <th>Changes</th>
                  <th>Last change</th>
                </tr>
              </thead>
              <tbody>
                {data.weeklyChanges.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="subtle">
                      No changes detected yet this week.
                    </td>
                  </tr>
                ) : (
                  data.weeklyChanges.map((row) => (
                    <tr key={`${row.competitor_name}-${row.last_change_at}`}>
                      <td>{row.competitor_name}</td>
                      <td>{row.change_count}</td>
                      <td>{row.last_change_at ? new Date(row.last_change_at).toLocaleString() : '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </article>

        <article className="card">
          <h2>Weekly AI Insights</h2>
          <p className="subtle">Structured summaries and CU experiment suggestions.</p>
          {data.weeklyInsights.length === 0 ? (
            <p className="subtle">No insights yet.</p>
          ) : (
            data.weeklyInsights.slice(0, 5).map((insight) => (
              <div key={insight.id} style={{ marginBottom: 14 }}>
                <p className="tag">{insight.competitor_name ?? 'Market-level'}</p>
                <h3>{insight.title}</h3>
                <p>{insight.summary}</p>
                <p className="subtle">Experiment: {insight.experiment_suggestion}</p>
              </div>
            ))
          )}
          <Link href="/tactics">Open Tactic Library</Link>
        </article>
      </section>

      <section className="card">
        <h2>Before/After Change Comparisons</h2>
        <p className="subtle">Section and change-type breakdown for detected weekly changes.</p>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Competitor</th>
                <th>Section</th>
                <th>Type</th>
                <th>Summary</th>
                <th>Before</th>
                <th>After</th>
              </tr>
            </thead>
            <tbody>
              {data.weeklyComparisons.length === 0 ? (
                <tr>
                  <td colSpan={6} className="subtle">
                    No weekly comparisons yet.
                  </td>
                </tr>
              ) : (
                data.weeklyComparisons.map((item) => (
                  <tr key={item.id}>
                    <td>{item.competitor_name}</td>
                    <td>
                      <span className="tag">{item.section}</span>
                    </td>
                    <td>
                      <span className="tag">{item.change_type}</span>
                    </td>
                    <td>{item.summary}</td>
                    <td>
                      {item.before_screenshot_url ? (
                        <a href={item.before_screenshot_url} target="_blank" rel="noreferrer">
                          Open
                        </a>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td>
                      <a href={item.after_screenshot_url} target="_blank" rel="noreferrer">
                        Open
                      </a>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card">
        <h2>Recent Snapshots</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Competitor</th>
                <th>Viewport</th>
                <th>Captured at</th>
                <th>Screenshot</th>
              </tr>
            </thead>
            <tbody>
              {data.recentSnapshots.map((snapshot, index) => (
                <tr key={`${snapshot.competitor_name}-${snapshot.captured_at}-${index}`}>
                  <td>{snapshot.competitor_name}</td>
                  <td>
                    <span className="tag">{snapshot.viewport}</span>
                  </td>
                  <td>{new Date(snapshot.captured_at).toLocaleString()}</td>
                  <td>
                    <a href={snapshot.screenshot_url} target="_blank" rel="noreferrer">
                      View image
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
