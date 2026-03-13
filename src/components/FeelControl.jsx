import { useRef, useState, useEffect } from 'react';

const SVG_H = 36;

export default function FeelControl({ leftLabel, rightLabel, value, onChange }) {
  const wrapRef    = useRef(null);  // observe this div for true width
  const svgRef     = useRef(null);
  const [width, setWidth] = useState(300);
  const dragging   = useRef(false);
  const [anchor, setAnchor] = useState(null);

  useEffect(() => {
    if (!wrapRef.current) return;
    const obs = new ResizeObserver(e => setWidth(e[0].contentRect.width));
    obs.observe(wrapRef.current);
    return () => obs.disconnect();
  }, []);

  function fromEvent(e) {
    const rect = wrapRef.current.getBoundingClientRect();
    return Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
  }

  function onPointerDown(e) {
    e.currentTarget.setPointerCapture(e.pointerId);
    dragging.current = true;
    setAnchor(value);
    onChange(fromEvent(e));
  }

  function onPointerMove(e) {
    if (!dragging.current) return;
    onChange(fromEvent(e));
  }

  function onPointerUp() {
    dragging.current = false;
    setTimeout(() => setAnchor(null), 800);
  }

  const dev    = value - 0.5;
  const absDev = Math.abs(dev);
  const cx     = value * width;
  const cy     = SVG_H / 2;
  const r      = 7;

  const leftActive  = absDev > 0.12 && dev < 0;
  const rightActive = absDev > 0.12 && dev > 0;

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '76px 1fr 76px',
      alignItems: 'center',
      gap: '14px',
      padding: '11px 0',
      borderBottom: '1px solid var(--ink-08)',
    }}>
      <span style={{
        fontFamily: 'var(--mono)',
        fontSize: '8px',
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        color: leftActive ? 'var(--ink)' : 'var(--ink-60)',
        textAlign: 'right',
        transition: 'color 0.18s',
        userSelect: 'none',
      }}>
        {leftLabel}
      </span>

      {/* Wrapper div — observed for width, captures pointer events */}
      <div
        ref={wrapRef}
        style={{ cursor: 'ew-resize', touchAction: 'none' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        <svg
          ref={svgRef}
          width={width}
          height={SVG_H}
          style={{ display: 'block' }}
        >
          {/* Track */}
          <line x1={0} y1={cy} x2={width} y2={cy}
            stroke="var(--ink)" strokeOpacity={0.12} strokeWidth={0.75} />

          {/* End ticks — show range */}
          <line x1={4} y1={cy - 5} x2={4} y2={cy + 5}
            stroke="var(--ink)" strokeOpacity={0.2} strokeWidth={0.75} />
          <line x1={width - 4} y1={cy - 5} x2={width - 4} y2={cy + 5}
            stroke="var(--ink)" strokeOpacity={0.2} strokeWidth={0.75} />

          {/* Center tick */}
          <line x1={width / 2} y1={cy - 4} x2={width / 2} y2={cy + 4}
            stroke="var(--ink)" strokeOpacity={0.2} strokeWidth={0.75} />

          {/* Anchor ghost */}
          {anchor !== null && (
            <circle cx={anchor * width} cy={cy} r={8}
              fill="var(--ink)" fillOpacity={0.1} />
          )}

          {/* Trail */}
          {anchor !== null && Math.abs(anchor - value) > 0.02 && (
            <line
              x1={anchor * width} y1={cy} x2={cx} y2={cy}
              stroke="var(--ink)" strokeOpacity={0.08}
              strokeWidth={2} strokeLinecap="round"
            />
          )}

          {/* Handle ring */}
          <circle cx={cx} cy={cy} r={r + 4}
            fill="none" stroke="var(--ink)" strokeOpacity={0.12} strokeWidth={1} />

          {/* Mark */}
          <circle cx={cx} cy={cy} r={r}
            fill="var(--ink)" fillOpacity={0.74} />
        </svg>
      </div>

      <span style={{
        fontFamily: 'var(--mono)',
        fontSize: '8px',
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        color: rightActive ? 'var(--ink)' : 'var(--ink-60)',
        transition: 'color 0.18s',
        userSelect: 'none',
      }}>
        {rightLabel}
      </span>
    </div>
  );
}
