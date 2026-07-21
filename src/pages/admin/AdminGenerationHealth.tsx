import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDateTime } from './adminUtils';

interface HealthBook {
  bookId: string;
  title: string;
  kind: string;
  fullStatus: string;
  fullUnitsDone: number;
  fullUnitsTotal: number;
  pdfStatus: string;
  pdfUnitsDone: number;
  pdfUnitsTotal: number;
  updatedAt: string;
  stuck: boolean;
}

const thStyle: React.CSSProperties = { textAlign: 'left', font: '700 11px Geist', color: 'var(--muted)', padding: '10px 14px', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' };
const tdStyle: React.CSSProperties = { font: '600 13px Geist', color: 'var(--ink)', padding: '12px 14px', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' };

export function AdminGenerationHealth() {
  const navigate = useNavigate();
  const [books, setBooks] = useState<HealthBook[] | null>(null);

  useEffect(() => {
    (async () => {
      const response = await fetch('/api/admin/generation-health');
      if (!response.ok) return;
      const body = (await response.json()) as { books: HealthBook[] };
      setBooks(body.books);
    })();
  }, []);

  return (
    <div>
      <div style={{ fontFamily: 'Geist, sans-serif', fontWeight: 800, fontSize: 24, color: 'var(--ink)', marginBottom: 8 }}>Generation health</div>
      <div style={{ font: '600 13px Geist', color: 'var(--muted)', marginBottom: 20 }}>
        Books currently generating or in an error state. Click a row to retry or resend from its order page.
      </div>
      {books && (
        <div style={{ border: '1px solid var(--border)', borderRadius: 12, background: '#fff', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={thStyle}>Title</th>
                  <th style={thStyle}>Kind</th>
                  <th style={thStyle}>Full gen</th>
                  <th style={thStyle}>PDF build</th>
                  <th style={thStyle}>Updated</th>
                  <th style={thStyle}>Stuck?</th>
                </tr>
              </thead>
              <tbody>
                {books.length === 0 ? (
                  <tr>
                    <td style={tdStyle} colSpan={6}>
                      Nothing generating or errored right now.
                    </td>
                  </tr>
                ) : (
                  books.map((b) => (
                    <tr key={b.bookId} onClick={() => navigate(`/admin/orders/${b.bookId}`)} style={{ cursor: 'pointer' }}>
                      <td style={tdStyle}>{b.title}</td>
                      <td style={tdStyle}>{b.kind}</td>
                      <td style={tdStyle}>
                        {b.fullStatus} ({b.fullUnitsDone}/{b.fullUnitsTotal})
                      </td>
                      <td style={tdStyle}>
                        {b.pdfStatus} ({b.pdfUnitsDone}/{b.pdfUnitsTotal})
                      </td>
                      <td style={tdStyle}>{formatDateTime(b.updatedAt)}</td>
                      <td style={tdStyle}>
                        {b.stuck ? (
                          <span style={{ font: '700 11px Geist', padding: '5px 12px', borderRadius: 999, background: '#fde2e2', color: '#b3261e' }}>
                            Stuck
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
