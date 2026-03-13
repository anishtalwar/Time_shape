import { useMemo } from 'react';
import { noteToX, noteToY } from '../groove';

const W = 560;
const H = 160;
const PX = 24;
const PY = 20;

const TRACK_FILL = {
  kick:  'rgba(26,25,22,0.86)',
  snare: 'rgba(26,25,22,0.62)',
  hat:   'rgba(26,25,22,0.36)',
};

const BASE_R = { kick: 7, snare: 5, hat: 4 };

export default function GrooveFingerprint({ notes, ghostNotes, isPlaying, currentStep }) {
  const iW = W - PX * 2;
  const iH = H - PY * 2;

  const toX = (n) => PX + noteToX(n) * iW;
  const toY = (n) => PY + noteToY(n) * iH;

  const gridLines = useMemo(() =>
    Array.from({ length: 17 }, (_, i) => ({
      x: PX + (i / 16) * iW,
      strong: i % 4 === 0,
      i,
    })),
  [iW]);

  // Connecting arcs between consecutive notes per track
  const arcs = useMemo(() => {
    const groups = {};
    notes.forEach(n => {
      if (!groups[n.track]) groups[n.track] = [];
      groups[n.track].push(n);
    });
    const paths = [];
    Object.entries(groups).forEach(([track, g]) => {
      const sorted = [...g].sort((a, b) => a.step - b.step);
      for (let i = 0; i < sorted.length - 1; i++) {
        const a = sorted[i], b = sorted[i + 1];
        const x1 = toX(a), y1 = toY(a);
        const x2 = toX(b), y2 = toY(b);
        const mx = (x1 + x2) / 2;
        const arcY = (y1 + y2) / 2 - 7;
        paths.push({ d: `M ${x1} ${y1} Q ${mx} ${arcY} ${x2} ${y2}`, track });
      }
    });
    return paths;
  }, [notes]);

  const activeNotes = isPlaying && currentStep >= 0
    ? notes.filter(n => n.step === currentStep)
    : [];

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: 'block', overflow: 'visible' }}>

      {/* Grid lines */}
      {gridLines.map(({ x, strong, i }) => (
        <line key={i}
          x1={x} y1={PY - 6} x2={x} y2={PY + iH + 6}
          stroke="var(--ink)"
          strokeOpacity={strong ? 0.16 : 0.055}
          strokeWidth={strong ? 0.75 : 0.4}
        />
      ))}

      {/* Track labels */}
      {[['kick', 0.25], ['snare', 0.5], ['hat', 0.75]].map(([t, fy]) => (
        <text key={t}
          x={PX - 8} y={PY + fy * iH + 3.5}
          fontSize={7} fontFamily="var(--mono)"
          fill="var(--ink)" fillOpacity={0.22}
          textAnchor="end" letterSpacing="0.06em"
        >
          {t}
        </text>
      ))}

      {/* Connecting arcs */}
      {arcs.map((arc, i) => (
        <path key={i} d={arc.d}
          stroke="var(--ink)" strokeOpacity={0.07}
          strokeWidth={0.5} fill="none"
        />
      ))}

      {/* Ghost notes (A/B) */}
      {ghostNotes && ghostNotes.map((n, i) => (
        <circle key={`g-${i}`}
          cx={toX(n)} cy={toY(n)} r={BASE_R[n.track]}
          fill="none" stroke="var(--ink)"
          strokeOpacity={0.2} strokeWidth={0.75}
          strokeDasharray="1.5 1.5"
        />
      ))}

      {/* Trails ghost → current */}
      {ghostNotes && notes.map((n, i) => {
        const g = ghostNotes[i];
        if (!g) return null;
        const cx = toX(n), gx = toX(g);
        if (Math.abs(cx - gx) < 0.8) return null;
        return (
          <line key={`tr-${i}`}
            x1={gx} y1={toY(g)} x2={cx} y2={toY(n)}
            stroke="var(--active)" strokeOpacity={0.3}
            strokeWidth={0.75} strokeDasharray="1.5 2"
          />
        );
      })}

      {/* Live notes — velocity-weighted smear ellipses */}
      {notes.map((n, i) => {
        const cx = toX(n), cy = toY(n);
        const vel = n.velocity / 127;
        const baseSize = BASE_R[n.track] * (0.55 + vel * 0.7);
        const maxStretch = n.track === 'hat' ? 2 : 6;
        const stretch = Math.min(Math.abs(n.offset) * 0.18, maxStretch);
        const rx = baseSize + stretch;
        const ry = baseSize;
        return (
          <ellipse key={`n-${i}`}
            cx={cx} cy={cy} rx={rx} ry={ry}
            fill={TRACK_FILL[n.track]}
          />
        );
      })}

      {/* Pulse rings on active step */}
      {activeNotes.map((n, i) => {
        const cx = toX(n), cy = toY(n);
        return (
          <g key={`pulse-${currentStep}-${n.track}-${i}`}
            style={{ transformOrigin: `${cx}px ${cy}px`, animation: 'pulseRing 0.45s ease-out forwards' }}
          >
            <circle cx={cx} cy={cy} r={BASE_R[n.track] * 2.4}
              fill="none" stroke="var(--active)"
              strokeWidth="0.75" strokeOpacity="0.5"
            />
          </g>
        );
      })}

      {/* Playhead */}
      {isPlaying && currentStep >= 0 && (
        <line
          x1={PX + (currentStep / 16) * iW} y1={PY - 10}
          x2={PX + (currentStep / 16) * iW} y2={PY + iH + 10}
          stroke="var(--active)" strokeOpacity={0.45} strokeWidth={0.75}
        />
      )}
    </svg>
  );
}
