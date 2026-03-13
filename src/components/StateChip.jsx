import { noteToX, noteToY } from '../groove';

const TW = 52;
const TH = 22;

function MiniFingerprint({ notes }) {
  if (!notes) return null;
  return (
    <svg viewBox={`0 0 ${TW} ${TH}`} width={TW} height={TH} style={{ display: 'block' }}>
      {notes.map((n, i) => {
        const x = noteToX(n) * TW;
        const y = noteToY(n) * TH;
        const r = n.track === 'kick' ? 2.2 : n.track === 'snare' ? 1.6 : 1;
        const vel = n.velocity / 127;
        const base = r * (0.55 + vel * 0.6);
        return (
          <ellipse key={i}
            cx={x} cy={y}
            rx={base + Math.min(Math.abs(n.offset) * 0.06, 2)}
            ry={base}
            fill="currentColor" fillOpacity={n.track === 'kick' ? 0.9 : n.track === 'snare' ? 0.65 : 0.38}
          />
        );
      })}
    </svg>
  );
}

export default function StateChip({ label, active, onSelect, onSave, isEmpty, notes }) {
  if (isEmpty) {
    return (
      <button
        onClick={onSave}
        style={{
          fontFamily: 'var(--mono)',
          fontSize: '8px',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: 'var(--ink-20)',
          border: '1px dashed var(--ink-20)',
          borderRadius: '2px',
          padding: '10px 14px',
          transition: 'color 0.15s, border-color 0.15s',
          lineHeight: 1,
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
        + save state
      </button>
    );
  }

  return (
    <button
      onClick={onSelect}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: '7px',
        padding: '8px 10px',
        borderRadius: '2px',
        border: active ? '1px solid var(--ink)' : '1px solid var(--ink-20)',
        background: active ? 'var(--ink)' : 'transparent',
        color: active ? 'var(--bg)' : 'var(--ink)',
        transition: 'all 0.12s',
        cursor: 'pointer',
      }}
    >
      <div style={{
        background: active ? 'rgba(255,255,255,0.12)' : 'var(--ink-08)',
        borderRadius: '1px',
        padding: '2px 3px',
      }}>
        <MiniFingerprint notes={notes} />
      </div>
      <span style={{
        fontFamily: 'var(--mono)',
        fontSize: '7.5px',
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: active ? 'var(--bg)' : 'var(--ink-60)',
        lineHeight: 1,
      }}>
        {label}
      </span>
    </button>
  );
}
