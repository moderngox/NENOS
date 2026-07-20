import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

interface Overview {
  ordersToday: number;
  inGeneration: number;
  stuck: number;
  errored: number;
}

function Tile({ label, value, to, warn }: { label: string; value: number; to?: string; warn?: boolean }) {
  const content = (
    <div
      style={{
        border: '1px solid var(--border)',
        borderRadius: 12,
        padding: '20px 22px',
        background: '#fff',
        flex: '1 1 200px',
      }}
    >
      <div style={{ font: '600 12px Geist', color: 'var(--muted)', marginBottom: 8 }}>{label}</div>
      <div style={{ fontFamily: 'Geist, sans-serif', fontWeight: 800, fontSize: 30, color: warn && value > 0 ? '#b3261e' : 'var(--ink)' }}>
        {value}
      </div>
    </div>
  );
  if (!to) return content;
  return (
    <Link to={to} style={{ textDecoration: 'none', color: 'inherit', flex: '1 1 200px' }}>
      {content}
    </Link>
  );
}

export function AdminOverview() {
  const [overview, setOverview] = useState<Overview | null>(null);

  useEffect(() => {
    (async () => {
      const response = await fetch('/api/admin/overview');
      if (!response.ok) return;
      setOverview((await response.json()) as Overview);
    })();
  }, []);

  return (
    <div>
      <div style={{ fontFamily: 'Geist, sans-serif', fontWeight: 800, fontSize: 24, color: 'var(--ink)', marginBottom: 24 }}>Overview</div>
      {overview && (
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <Tile label="Orders today" value={overview.ordersToday} to="/admin/orders" />
          <Tile label="In generation" value={overview.inGeneration} to="/admin/generation" />
          <Tile label="Stuck" value={overview.stuck} to="/admin/generation" warn />
          <Tile label="Errored" value={overview.errored} to="/admin/generation" warn />
        </div>
      )}
    </div>
  );
}
