export default function StateChip({ label, active, onSelect, onSave, isEmpty }) {
  if (isEmpty) {
    return (
      <button
        onClick={onSave}
        style={{
          fontFamily: 'var(--mono)',
          fontSize: '9px',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: 'var(--ink-20)',
          border: '1px dashed var(--ink-20)',
          borderRadius: '2px',
          padding: '6px 12px',
          transition: 'color 0.15s, border-color 0.15s',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.color = 'var(--ink-60)';
          e.currentTarget.style.borderColor = 'var(--ink-60)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.color = 'var(--ink-20)';
          e.currentTarget.style.borderColor = 'var(--ink-20)';
        }}
      >
        + save
      </button>
    );
  }

  return (
    <button
      onClick={onSelect}
      style={{
        fontFamily: 'var(--mono)',
        fontSize: '9px',
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        padding: '6px 14px',
        borderRadius: '2px',
        border: active ? '1px solid var(--ink)' : '1px solid var(--ink-20)',
        background: active ? 'var(--ink)' : 'transparent',
        color: active ? 'var(--bg)' : 'var(--ink-60)',
        transition: 'all 0.12s',
      }}
    >
      {label}
    </button>
  );
}
