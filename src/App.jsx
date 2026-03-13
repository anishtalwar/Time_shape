import { useState, useEffect } from 'react';
import { generateBasePattern, applyFeel } from './groove';
import { GrooveScheduler } from './audio';
import GrooveFingerprint from './components/GrooveFingerprint';
import FeelControl from './components/FeelControl';
import StateChip from './components/StateChip';
import './App.css';

const BASE = generateBasePattern();
const DEFAULT_FEEL = { tight: 0.5, push: 0.5, swing: 0.5, accent: 0.5, drift: 0.5 };
const PRESET_NAMES = ['late & loose', 'tight bounce', 'broken swing', 'nervous pocket'];
const scheduler = new GrooveScheduler();

const CONTROLS = [
  { key: 'tight',  left: 'loose',    right: 'tight'    },
  { key: 'push',   left: 'behind',   right: 'ahead'    },
  { key: 'swing',  left: 'straight', right: 'swing'    },
  { key: 'accent', left: 'even',     right: 'accented' },
  { key: 'drift',  left: 'stable',   right: 'drifting' },
];

export default function App() {
  const [feel, setFeel]               = useState(DEFAULT_FEEL);
  const [savedStates, setSavedStates] = useState([null, null, null, null]);
  const [activeState, setActiveState] = useState(null);
  const [isAB, setIsAB]               = useState(false);
  const [isPlaying, setIsPlaying]     = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const [bpm, setBpm]                 = useState(120);

  const notes      = applyFeel(BASE, feel);
  const ghostNotes = isAB ? BASE : null;

  // Keep scheduler synced
  useEffect(() => { scheduler.setNotes(notes); }, [notes]);
  useEffect(() => { scheduler.setBpm(bpm); }, [bpm]);
  useEffect(() => { scheduler.onStep = (step) => setCurrentStep(step); }, []);

  function togglePlay() {
    if (isPlaying) {
      scheduler.stop();
      setIsPlaying(false);
      setCurrentStep(-1);
    } else {
      scheduler.setNotes(notes);
      scheduler.start();
      setIsPlaying(true);
    }
  }

  function setParam(key, val) {
    setFeel(f => ({ ...f, [key]: val }));
    setActiveState(null);
  }

  function saveState(slot) {
    setSavedStates(s => {
      const next = [...s];
      next[slot] = { feel: { ...feel }, notes: applyFeel(BASE, feel), name: PRESET_NAMES[slot] };
      return next;
    });
    setActiveState(slot);
  }

  function loadState(slot) {
    const s = savedStates[slot];
    if (!s) return;
    setFeel(s.feel);
    setActiveState(slot);
    if (isPlaying) scheduler.setNotes(applyFeel(BASE, s.feel));
  }

  function reset() {
    setFeel(DEFAULT_FEEL);
    setActiveState(null);
    if (isPlaying) scheduler.setNotes(applyFeel(BASE, DEFAULT_FEEL));
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      padding: '36px 52px 48px',
      maxWidth: '700px',
      margin: '0 auto',
      overflowX: 'hidden',
    }}>

      {/* Header */}
      <header style={{ marginBottom: '36px' }}>
        <p style={{
          fontFamily: 'var(--mono)',
          fontSize: '8px',
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: 'var(--ink-60)',
          marginBottom: '10px',
        }}>
          Rhythm Study
        </p>
        <h1 style={{
          fontFamily: 'var(--sans)',
          fontSize: 'clamp(40px, 9vw, 68px)',
          fontWeight: '300',
          letterSpacing: '-0.035em',
          lineHeight: '0.95',
          color: 'var(--ink)',
        }}>
          Time Shape
        </h1>
      </header>

      {/* Groove field */}
      <section style={{ marginBottom: '36px' }}>
        {/* Section label + annotation */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          borderTop: '1px solid var(--ink-20)',
          paddingTop: '10px',
          marginBottom: '16px',
        }}>
          <p style={{
            fontFamily: 'var(--mono)',
            fontSize: '8px',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'var(--ink-60)',
          }}>
            Groove field
          </p>
          <p style={{
            fontFamily: 'var(--mono)',
            fontSize: '8px',
            letterSpacing: '0.06em',
            color: 'var(--ink-20)',
            fontStyle: 'italic',
            transform: 'rotate(-0.5deg)',
          }}>
            fig. 01 / microtiming study
          </p>
        </div>

        <GrooveFingerprint
          notes={notes}
          ghostNotes={ghostNotes}
          isPlaying={isPlaying}
          currentStep={currentStep}
        />

        {/* Playback row */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '18px',
          marginTop: '18px',
          borderTop: '1px solid var(--ink-08)',
          paddingTop: '14px',
        }}>
          <button
            onClick={togglePlay}
            style={{
              fontFamily: 'var(--mono)',
              fontSize: '8px',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: isPlaying ? 'var(--active)' : 'var(--ink)',
              border: '1px solid',
              borderColor: isPlaying ? 'var(--active)' : 'var(--ink-20)',
              borderRadius: '2px',
              padding: '7px 16px',
              transition: 'all 0.12s',
            }}
          >
            {isPlaying ? '◼ stop' : '▶ play'}
          </button>

          {/* BPM control */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              onClick={() => setBpm(b => Math.max(60, b - 1))}
              style={{
                fontFamily: 'var(--mono)', fontSize: '10px',
                color: 'var(--ink-60)', width: '16px', textAlign: 'center',
              }}
            >−</button>
            <span style={{
              fontFamily: 'var(--mono)', fontSize: '8px',
              letterSpacing: '0.1em', textTransform: 'uppercase',
              color: 'var(--ink-60)', minWidth: '52px', textAlign: 'center',
            }}>
              {bpm} bpm
            </span>
            <button
              onClick={() => setBpm(b => Math.min(200, b + 1))}
              style={{
                fontFamily: 'var(--mono)', fontSize: '10px',
                color: 'var(--ink-60)', width: '16px', textAlign: 'center',
              }}
            >+</button>
          </div>

          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
            fontFamily: 'var(--mono)',
            fontSize: '8px',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: isAB ? 'var(--active)' : 'var(--ink-60)',
            userSelect: 'none',
          }}>
            <input
              type="checkbox"
              checked={isAB}
              onChange={e => setIsAB(e.target.checked)}
              style={{ accentColor: 'var(--active)', width: '10px', height: '10px' }}
            />
            A/B original
          </label>

          <button
            onClick={reset}
            style={{
              marginLeft: 'auto',
              fontFamily: 'var(--mono)',
              fontSize: '8px',
              letterSpacing: '0.12em',
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
      <section style={{ marginBottom: '32px' }}>
        <div style={{
          borderTop: '1px solid var(--ink-20)',
          paddingTop: '10px',
          marginBottom: '4px',
        }}>
          <p style={{
            fontFamily: 'var(--mono)',
            fontSize: '8px',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'var(--ink-60)',
          }}>
            Feel
          </p>
        </div>
        {CONTROLS.map(({ key, left, right }) => (
          <FeelControl
            key={key}
            leftLabel={left}
            rightLabel={right}
            value={feel[key]}
            onChange={val => setParam(key, val)}
          />
        ))}
      </section>

      {/* Groove states */}
      <section style={{ marginBottom: 'auto' }}>
        <div style={{
          borderTop: '1px solid var(--ink-20)',
          paddingTop: '10px',
          marginBottom: '14px',
        }}>
          <p style={{
            fontFamily: 'var(--mono)',
            fontSize: '8px',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'var(--ink-60)',
          }}>
            Groove states
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {savedStates.map((s, i) => (
            <StateChip
              key={i}
              label={s?.name ?? ''}
              active={activeState === i}
              isEmpty={s === null}
              notes={s?.notes}
              onSelect={() => loadState(i)}
              onSave={() => saveState(i)}
            />
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        paddingTop: '56px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
      }}>
        <p style={{
          fontFamily: 'var(--mono)',
          fontSize: '11px',
          letterSpacing: '0.06em',
          color: 'var(--ink-60)',
          fontStyle: 'italic',
        }}>
          feel as gesture, not data
        </p>
        <p style={{
          fontFamily: 'var(--mono)',
          fontSize: '8px',
          letterSpacing: '0.08em',
          color: 'var(--ink-20)',
          textTransform: 'uppercase',
        }}>
          2026
        </p>
      </footer>
    </div>
  );
}
