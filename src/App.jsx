import { useState, useEffect, useRef } from 'react';
import { generateBasePattern, applyFeel, PRESETS } from './groove';
import { GrooveScheduler } from './audio';
import { downloadCard } from './utils/cardExport';
import GrooveFingerprint from './components/GrooveFingerprint';
import FeelControl from './components/FeelControl';
import StateChip from './components/StateChip';
import './App.css';

const BASE = generateBasePattern();
const scheduler = new GrooveScheduler();

// Start with Late Pocket as the active personality
const INITIAL_FEEL = PRESETS[0].feel;

// Pre-populate three states; fourth slot is empty
const INITIAL_STATES = [
  ...PRESETS.map(p => ({ feel: p.feel, notes: applyFeel(BASE, p.feel), name: p.name })),
  null,
];

const CONTROLS = [
  { key: 'tight',  left: 'loose',    right: 'tight',    group: 'Timing'    },
  { key: 'push',   left: 'behind',   right: 'ahead',    group: null        },
  { key: 'swing',  left: 'straight', right: 'swing',    group: 'Phrasing'  },
  { key: 'accent', left: 'even',     right: 'accented', group: null        },
  { key: 'drift',  left: 'stable',   right: 'drifting', group: 'Character' },
];

export default function App() {
  const [feel, setFeel]               = useState(INITIAL_FEEL);
  const [savedStates, setSavedStates] = useState(INITIAL_STATES);
  const [activeState, setActiveState] = useState(0);         // Late Pocket active
  const [isAB, setIsAB]               = useState(true);      // A/B on by default
  const [isPlaying, setIsPlaying]     = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const [bpm, setBpm]                 = useState(120);
  const [applied, setApplied]         = useState(false);
  const [exporting, setExporting]     = useState(false);

  const notes      = applyFeel(BASE, feel);
  const ghostNotes = isAB ? BASE : null;

  useEffect(() => { scheduler.setNotes(notes); }, [notes]);
  useEffect(() => { scheduler.setBpm(bpm); }, [bpm]);
  useEffect(() => { scheduler.onStep = step => setCurrentStep(step); }, []);

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
      next[slot] = { feel: { ...feel }, notes: applyFeel(BASE, feel), name: PRESETS[slot]?.name ?? `state ${slot + 1}` };
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
    setFeel(INITIAL_FEEL);
    setActiveState(0);
    if (isPlaying) scheduler.setNotes(applyFeel(BASE, INITIAL_FEEL));
  }

  function applyToClip() {
    setApplied(true);
    setTimeout(() => setApplied(false), 2000);
  }

  async function exportCard() {
    setExporting(true);
    const currentStateName = activeState !== null ? savedStates[activeState]?.name : null;
    await downloadCard({ notes, feel, bpm, stateName: currentStateName });
    setExporting(false);
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
          Groove Shape
        </p>
        <h1 style={{
          fontFamily: 'var(--sans)',
          fontSize: 'clamp(40px, 9vw, 68px)',
          fontWeight: '300',
          letterSpacing: '-0.035em',
          lineHeight: '0.95',
          color: 'var(--ink)',
          marginBottom: '10px',
        }}>
          Time Shape
        </h1>
        <p style={{
          fontFamily: 'var(--mono)',
          fontSize: '9px',
          letterSpacing: '0.06em',
          color: 'var(--ink-60)',
        }}>
          Shape rhythmic feel across MIDI clips
        </p>
      </header>

      {/* Groove field */}
      <section style={{ marginBottom: '36px' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          borderTop: '1px solid var(--ink-20)',
          paddingTop: '10px',
          marginBottom: '16px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <p style={{
              fontFamily: 'var(--mono)',
              fontSize: '8px',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'var(--ink-60)',
            }}>
              Groove Field
            </p>
            {isPlaying && (
              <span style={{
                fontFamily: 'var(--mono)',
                fontSize: '7px',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: 'var(--active)',
              }}>
                ● live
              </span>
            )}
          </div>
          <p style={{
            fontFamily: 'var(--mono)',
            fontSize: '8px',
            letterSpacing: '0.06em',
            color: 'var(--ink-20)',
            fontStyle: 'italic',
            transform: 'rotate(-0.5deg)',
          }}>
            Clip 01 / {bpm} BPM
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

          {/* BPM */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              onClick={() => setBpm(b => Math.max(60, b - 1))}
              style={{ fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--ink-60)', width: '16px', textAlign: 'center' }}
            >−</button>
            <span style={{
              fontFamily: 'var(--mono)', fontSize: '8px',
              letterSpacing: '0.1em', textTransform: 'uppercase',
              color: 'var(--ink-60)', minWidth: '52px', textAlign: 'center',
            }}>{bpm} bpm</span>
            <button
              onClick={() => setBpm(b => Math.min(200, b + 1))}
              style={{ fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--ink-60)', width: '16px', textAlign: 'center' }}
            >+</button>
          </div>

          {/* A/B */}
          <label style={{
            display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer',
            fontFamily: 'var(--mono)', fontSize: '8px', letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: isAB ? 'var(--active)' : 'var(--ink-60)',
            userSelect: 'none',
          }}>
            <input type="checkbox" checked={isAB} onChange={e => setIsAB(e.target.checked)}
              style={{ accentColor: 'var(--active)', width: '10px', height: '10px' }} />
            A/B Original
          </label>

          <button
            onClick={reset}
            style={{
              marginLeft: 'auto',
              fontFamily: 'var(--mono)', fontSize: '8px', letterSpacing: '0.12em',
              textTransform: 'uppercase', color: 'var(--ink-20)', transition: 'color 0.12s',
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
        <div style={{ borderTop: '1px solid var(--ink-20)', paddingTop: '10px', marginBottom: '4px' }}>
          <p style={{
            fontFamily: 'var(--mono)', fontSize: '8px',
            letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-60)',
          }}>Feel</p>
        </div>

        {CONTROLS.map(({ key, left, right, group }) => (
          <div key={key}>
            {group && (
              <p style={{
                fontFamily: 'var(--mono)', fontSize: '7px',
                letterSpacing: '0.14em', textTransform: 'uppercase',
                color: 'var(--ink-20)', paddingTop: '8px', paddingBottom: '2px',
              }}>
                {group}
              </p>
            )}
            <FeelControl
              leftLabel={left}
              rightLabel={right}
              value={feel[key]}
              onChange={val => setParam(key, val)}
            />
          </div>
        ))}
      </section>

      {/* Groove states */}
      <section style={{ marginBottom: 'auto' }}>
        <div style={{ borderTop: '1px solid var(--ink-20)', paddingTop: '10px', marginBottom: '14px' }}>
          <p style={{
            fontFamily: 'var(--mono)', fontSize: '8px',
            letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-60)',
          }}>Groove States</p>
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
        paddingTop: '40px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <p style={{
          fontFamily: 'var(--mono)', fontSize: '11px',
          letterSpacing: '0.06em', color: 'var(--ink-60)', fontStyle: 'italic',
        }}>
          feel as gesture, not data
        </p>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            onClick={exportCard}
            disabled={exporting}
            style={{
              fontFamily: 'var(--mono)',
              fontSize: '8px',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'var(--ink-60)',
              border: '1px solid var(--ink-20)',
              borderRadius: '2px',
              padding: '7px 16px',
              transition: 'all 0.2s',
              opacity: exporting ? 0.5 : 1,
              cursor: exporting ? 'wait' : 'pointer',
            }}
          >
            {exporting ? 'exporting…' : '↓ Export Card'}
          </button>

          <button
            onClick={applyToClip}
            style={{
              fontFamily: 'var(--mono)',
              fontSize: '8px',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: applied ? 'var(--active)' : 'var(--ink)',
              border: '1px solid',
              borderColor: applied ? 'var(--active)' : 'var(--ink-20)',
              borderRadius: '2px',
              padding: '7px 16px',
              transition: 'all 0.2s',
            }}
          >
            {applied ? '✓ applied' : 'Apply to Clip'}
          </button>
        </div>
      </footer>
    </div>
  );
}
