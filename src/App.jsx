import { useState, useEffect, useRef, useCallback } from 'react';
import { generateBasePattern, applyFeel } from './groove';
import GrooveFingerprint from './components/GrooveFingerprint';
import FeelControl from './components/FeelControl';
import StateChip from './components/StateChip';
import './App.css';

const BASE = generateBasePattern();

const DEFAULT_FEEL = { tight: 0.5, push: 0.5, swing: 0.5, accent: 0.5, drift: 0.5 };

const PRESET_NAMES = ['late & loose', 'tight bounce', 'broken swing', 'nervous pocket'];

export default function App() {
  const [feel, setFeel] = useState(DEFAULT_FEEL);
  const [savedStates, setSavedStates] = useState([null, null, null, null]);
  const [activeState, setActiveState] = useState(null);
  const [isAB, setIsAB] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playhead, setPlayhead] = useState(0);

  const playheadRef = useRef(0);
  const rafRef      = useRef(null);
  const startRef    = useRef(null);
  const LOOP_MS     = 2000;

  const notes      = applyFeel(BASE, feel);
  const ghostNotes = isAB ? BASE : null;

  // Playhead animation
  const tick = useCallback((ts) => {
    if (!startRef.current) startRef.current = ts;
    const elapsed = (ts - startRef.current) % LOOP_MS;
    const p = elapsed / LOOP_MS;
    playheadRef.current = p;
    setPlayhead(p);
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  useEffect(() => {
    if (isPlaying) {
      startRef.current = null;
      rafRef.current = requestAnimationFrame(tick);
    } else {
      cancelAnimationFrame(rafRef.current);
      setPlayhead(0);
    }
    return () => cancelAnimationFrame(rafRef.current);
  }, [isPlaying, tick]);

  function setParam(key, val) {
    setFeel(f => ({ ...f, [key]: val }));
    setActiveState(null);
  }

  function saveState(slot) {
    const name = PRESET_NAMES[slot];
    setSavedStates(s => {
      const next = [...s];
      next[slot] = { feel: { ...feel }, name };
      return next;
    });
    setActiveState(slot);
  }

  function loadState(slot) {
    const s = savedStates[slot];
    if (!s) return;
    setFeel(s.feel);
    setActiveState(slot);
  }

  function reset() {
    setFeel(DEFAULT_FEEL);
    setActiveState(null);
  }

  const controls = [
    { key: 'tight', left: 'loose',    right: 'tight'    },
    { key: 'push',  left: 'behind',   right: 'ahead'    },
    { key: 'swing', left: 'straight', right: 'swing'    },
    { key: 'accent',left: 'even',     right: 'accented' },
    { key: 'drift', left: 'stable',   right: 'drifting' },
  ];

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      padding: '48px 48px 64px',
      maxWidth: '680px',
      margin: '0 auto',
    }}>

      {/* Header */}
      <header style={{ marginBottom: '48px' }}>
        <p style={{
          fontFamily: 'var(--mono)',
          fontSize: '9px',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: 'var(--ink-60)',
          marginBottom: '8px',
        }}>
          Ableton / Rhythm Study
        </p>
        <h1 style={{
          fontFamily: 'var(--sans)',
          fontSize: 'clamp(36px, 8vw, 64px)',
          fontWeight: '300',
          letterSpacing: '-0.03em',
          lineHeight: '1',
          color: 'var(--ink)',
        }}>
          Time Shape
        </h1>
      </header>

      {/* Fingerprint */}
      <section style={{ marginBottom: '32px' }}>
        <div style={{
          padding: '24px 0 16px',
          borderTop: '1px solid var(--ink-20)',
          borderBottom: '1px solid var(--ink-08)',
        }}>
          <GrooveFingerprint
            notes={notes}
            ghostNotes={ghostNotes}
            isPlaying={isPlaying}
            playhead={playhead}
          />
        </div>

        {/* Playback row */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          marginTop: '16px',
        }}>
          <button
            onClick={() => setIsPlaying(p => !p)}
            style={{
              fontFamily: 'var(--mono)',
              fontSize: '9px',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: isPlaying ? 'var(--active)' : 'var(--ink)',
              border: '1px solid',
              borderColor: isPlaying ? 'var(--active)' : 'var(--ink-20)',
              borderRadius: '2px',
              padding: '6px 14px',
              transition: 'all 0.12s',
            }}
          >
            {isPlaying ? '◼ stop' : '▶ play'}
          </button>

          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
            fontFamily: 'var(--mono)',
            fontSize: '9px',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: isAB ? 'var(--active)' : 'var(--ink-60)',
            userSelect: 'none',
          }}>
            <input
              type="checkbox"
              checked={isAB}
              onChange={e => setIsAB(e.target.checked)}
              style={{ accentColor: 'var(--active)' }}
            />
            A/B original
          </label>

          <button
            onClick={reset}
            style={{
              marginLeft: 'auto',
              fontFamily: 'var(--mono)',
              fontSize: '9px',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'var(--ink-20)',
              transition: 'color 0.12s',
            }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--ink-60)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--ink-20)'}
          >
            reset
          </button>
        </div>
      </section>

      {/* Feel controls */}
      <section style={{ marginBottom: '40px' }}>
        <p style={{
          fontFamily: 'var(--mono)',
          fontSize: '9px',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: 'var(--ink-60)',
          marginBottom: '4px',
        }}>
          Feel
        </p>
        {controls.map(({ key, left, right }) => (
          <FeelControl
            key={key}
            label={key}
            leftLabel={left}
            rightLabel={right}
            value={feel[key]}
            onChange={val => setParam(key, val)}
          />
        ))}
      </section>

      {/* Saved states */}
      <section>
        <p style={{
          fontFamily: 'var(--mono)',
          fontSize: '9px',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: 'var(--ink-60)',
          marginBottom: '12px',
        }}>
          Groove states
        </p>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {savedStates.map((s, i) => (
            <StateChip
              key={i}
              label={s?.name ?? ''}
              active={activeState === i}
              isEmpty={s === null}
              onSelect={() => loadState(i)}
              onSave={() => saveState(i)}
            />
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        marginTop: 'auto',
        paddingTop: '48px',
        fontFamily: 'var(--mono)',
        fontSize: '9px',
        letterSpacing: '0.08em',
        color: 'var(--ink-20)',
      }}>
        feel as gesture, not data
      </footer>
    </div>
  );
}
