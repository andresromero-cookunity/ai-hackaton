import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';

export const metadata: Metadata = {
  title: 'Competitor Snapshotting',
  description: 'Homepage change detection and tactic library for competitor intelligence.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="topbar">
          <div className="container topbar-inner">
            <div>
              <p className="kicker">CookUnity Competitive Intel</p>
              <h1>Competitor Snapshotting Engine</h1>
            </div>
            <nav className="nav">
              <Link href="/">Weekly View</Link>
              <Link href="/tactics">Tactic Library</Link>
              <Link href="/competitors">Competitors</Link>
              <Link href="/gift-cards">Gift Cards</Link>
            </nav>
          </div>
        </header>
        <main className="container">{children}</main>
      </body>
    </html>
  );
}
