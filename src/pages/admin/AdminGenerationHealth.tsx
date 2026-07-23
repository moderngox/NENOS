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
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const load = async () => {
    const response = await fetch('/api/admin/generation-health');
    if (!response.ok) return;
    const body = (await response.json()) as { books: HealthBook[] };
    setBooks(body.books);
  };

  useEffect(() => {
    load();
  }, []);

  const retry = async (e: React.MouseEvent, bookId: string, path: 'retry-generation' | 'retry-pdf') => {
    e.stopPropagation(); // don't also trigger the row's navigate-to-order click
    const key = `${bookId}:${path}`;
    setBusyKey(key);
    setMessage(null);
    try {
      const response = await fetch(`/api/admin/books/${bookId}/${path}`, { method: 'POST' });
      const body = (await response.json().catch(() => ({}))) as { message?: string; error?: string };
      setMessage(response.ok ? body.message ?? 'Done.' : body.error ?? 'Retry failed.');
      if (response.ok) await load();
    } catch {
      setMessage('Retry failed — network error.');
    } finally {
      setBusyKey(null);
    }
  };

  return (
    <div>
      <div style={{ fontFamily: 'Geist, sans-serif', fontWeight: 800, fontSize: 24, color: 'var(--ink)', marginBottom: 8 }}>Generation health</div>
      <div style={{ font: '600 13px Geist', color: 'var(--muted)', marginBottom: 20 }}>
        Books currently generating or in an error state. Retry directly here, or click a row for full order details.
      </div>
      {message && <p style={{ font: '600 13px Geist', color: 'var(--ink)', marginBottom: 12 }}>{message}</p>}
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
                  <th style={thStyle}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {books.length === 0 ? (
                  <tr>
                    <td style={tdStyle} colSpan={7}>
                      Nothing generating or errored right now.
                    </td>
                  </tr>
                ) : (
                  books.map((b) => {
                    const canRetryFull = b.fullStatus === 'error' || b.fullStatus === 'generating';
                    const canRetryPdf = b.pdfStatus === 'error' || b.pdfStatus === 'generating';
                    return (
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
                        <td style={tdStyle}>
                          <div style={{ display: 'flex', gap: 6 }}>
                            {canRetryFull && (
                              <button
                                type="button"
                                disabled={busyKey === `${b.bookId}:retry-generation`}
                                onClick={(e) => retry(e, b.bookId, 'retry-generation')}
                                className="cta-secondary"
                                style={{ padding: '6px 10px', fontSize: 11 }}
                              >
                                Resume gen
                              </button>
                            )}
                            {canRetryPdf && (
                              <button
                                type="button"
                                disabled={busyKey === `${b.bookId}:retry-pdf`}
                                onClick={(e) => retry(e, b.bookId, 'retry-pdf')}
                                className="cta-secondary"
                                style={{ padding: '6px 10px', fontSize: 11 }}
                              >
                                Resume PDF
                              </button>
                            )}
                            {!canRetryFull && !canRetryPdf && '—'}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
