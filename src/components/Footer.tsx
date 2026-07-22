export function Footer() {
  return (
    <footer
      style={{
        borderTop: '1px solid var(--border)',
        padding: '20px 22px',
        textAlign: 'center',
        marginTop: 'auto',
      }}
    >
      <span style={{ font: '600 12px Geist', color: 'var(--muted)' }}>
        © {new Date().getFullYear()} NENOS by MODERN GOX
      </span>
    </footer>
  );
}
