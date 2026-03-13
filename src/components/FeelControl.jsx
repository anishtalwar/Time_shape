export default function FeelControl({ label, leftLabel, rightLabel, value, onChange }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '72px 1fr 72px',
      alignItems: 'center',
      gap: '12px',
      padding: '10px 0',
      borderBottom: '1px solid var(--ink-08)',
    }}>
      <span style={{
        fontFamily: 'var(--mono)',
        fontSize: '9px',
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: 'var(--ink-60)',
        textAlign: 'right',
      }}>
        {leftLabel}
      </span>

      <div style={{ position: 'relative' }}>
        {/* Center tick */}
        <div style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          width: '1px',
          height: '10px',
          background: 'var(--ink-20)',
          pointerEvents: 'none',
        }} />
        <input
          type="range"
          min={0}
          max={100}
          value={Math.round(value * 100)}
          onChange={e => onChange(e.target.value / 100)}
          style={{
            width: '100%',
            accentColor: 'var(--active)',
          }}
        />
      </div>

      <span style={{
        fontFamily: 'var(--mono)',
        fontSize: '9px',
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: 'var(--ink-60)',
      }}>
        {rightLabel}
      </span>
    </div>
  );
}
