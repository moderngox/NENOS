export function Chip({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected?: boolean;
  onClick?: () => void;
}) {
  return (
    <button type="button" className={`chip${selected ? ' selected' : ''}`} onClick={onClick} aria-pressed={selected}>
      {label}
      {selected ? ' ✓' : ''}
    </button>
  );
}
