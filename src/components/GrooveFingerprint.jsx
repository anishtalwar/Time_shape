import { useMemo } from 'react';
import { noteToX, noteToY } from '../groove';

const W = 560;
const H = 180;
const PAD = 20;

const TRACK_COLORS = {
  kick:  'rgba(26,25,22,0.85)',
  snare: 'rgba(26,25,22,0.65)',
  hat:   'rgba(26,25,22,0.38)',
};

const TRACK_R = {
  kick:  5.5,
  snare: 4,
  hat:   2.5,
};

export default function GrooveFingerprint({ notes, ghostNotes, isPlaying, playhead }) {
  const innerW = W - PAD * 2;
  const innerH = H - PAD * 2;

  // Grid lines (16 steps)
  const gridLines = useMemo(() =>
    Array.from({ length: 17 }, (_, i) => {
      const x = PAD + (i / 16) * innerW;
      const isBar = i % 4 === 0;
      return { x, isBar };
    }),
  [innerW]);

  const toSvgX = (n) => PAD + noteToX(n) * innerW;
  const toSvgY = (n) => PAD + noteToY(n) * innerH;

  return (
    <svg
      width="100%"
      viewBox={`0 0 ${W} ${H}`}
      style={{ display: 'block', overflow: 'visible' }}
    >
      {/* Grid */}
      {gridLines.map(({ x, isBar }) => (
        <line
          key={x}
          x1={x} y1={PAD}
          x2={x} y2={PAD + innerH}
          stroke="var(--ink)"
          strokeOpacity={isBar ? 0.18 : 0.07}
          strokeWidth={isBar ? 1 : 0.5}
        />
      ))}

      {/* Track labels */}
      {[['kick', 0.25], ['snare', 0.5], ['hat', 0.75]].map(([label, fy]) => (
        <text
          key={label}
          x={PAD - 6}
          y={PAD + fy * innerH + 4}
          fontSize={8}
          fontFamily="var(--mono)"
          fill="var(--ink)"
          fillOpacity={0.3}
          textAnchor="end"
        >
          {label}
        </text>
      ))}

      {/* Ghost notes (original) */}
      {ghostNotes && ghostNotes.map((n, i) => (
        <circle
          key={`g-${i}`}
          cx={toSvgX(n)}
          cy={toSvgY(n)}
          r={TRACK_R[n.track]}
          fill="none"
          stroke="var(--ink)"
          strokeOpacity={0.18}
          strokeWidth={1}
        />
      ))}

      {/* Trail lines from ghost to current */}
      {ghostNotes && notes.map((n, i) => {
        const g = ghostNotes[i];
        if (!g) return null;
        const cx = toSvgX(n), cy = toSvgY(n);
        const gx = toSvgX(g), gy = toSvgY(g);
        if (Math.abs(cx - gx) < 1 && Math.abs(cy - gy) < 1) return null;
        return (
          <line
            key={`t-${i}`}
            x1={gx} y1={gy}
            x2={cx} y2={cy}
            stroke="var(--active)"
            strokeOpacity={0.3}
            strokeWidth={0.75}
            strokeDasharray="2 2"
          />
        );
      })}

      {/* Live notes */}
      {notes.map((n, i) => {
        const cx = toSvgX(n);
        const cy = toSvgY(n);
        const r  = TRACK_R[n.track];
        const velScale = n.velocity / 127;
        return (
          <g key={`n-${i}`}>
            <circle
              cx={cx} cy={cy}
              r={r * (0.6 + velScale * 0.7)}
              fill={TRACK_COLORS[n.track]}
            />
          </g>
        );
      })}

      {/* Playhead */}
      {isPlaying && (
        <line
          x1={PAD + playhead * innerW}
          y1={PAD - 6}
          x2={PAD + playhead * innerW}
          y2={PAD + innerH + 6}
          stroke="var(--active)"
          strokeOpacity={0.7}
          strokeWidth={1}
        />
      )}
    </svg>
  );
}
