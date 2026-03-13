// Generates a set of MIDI-like note events for a 16-step drum pattern
// Each note: { step: 0-15, offset: timing offset in ms (-20 to +20), velocity: 0-127, track: 'kick'|'snare'|'hat' }

export function generateBasePattern() {
  return [
    // kick
    { step: 0,  offset: 0,    velocity: 110, track: 'kick'  },
    { step: 4,  offset: 2,    velocity: 95,  track: 'kick'  },
    { step: 8,  offset: -1,   velocity: 112, track: 'kick'  },
    { step: 12, offset: 3,    velocity: 90,  track: 'kick'  },
    // snare
    { step: 4,  offset: 5,    velocity: 105, track: 'snare' },
    { step: 12, offset: -3,   velocity: 108, track: 'snare' },
    // hats
    { step: 0,  offset: 0,    velocity: 70,  track: 'hat'   },
    { step: 2,  offset: 8,    velocity: 55,  track: 'hat'   },
    { step: 4,  offset: -2,   velocity: 72,  track: 'hat'   },
    { step: 6,  offset: 12,   velocity: 48,  track: 'hat'   },
    { step: 8,  offset: 1,    velocity: 68,  track: 'hat'   },
    { step: 10, offset: 9,    velocity: 52,  track: 'hat'   },
    { step: 12, offset: -1,   velocity: 75,  track: 'hat'   },
    { step: 14, offset: 11,   velocity: 45,  track: 'hat'   },
  ];
}

// Apply feel params to base pattern
// params: { tight, push, swing, accent, drift }
// Each param: 0.0 to 1.0 (0.5 = neutral)
export function applyFeel(baseNotes, params) {
  const { tight = 0.5, push = 0.5, swing = 0.5, accent = 0.5, drift = 0.5 } = params;

  return baseNotes.map((note, i) => {
    let offset = note.offset;
    let velocity = note.velocity;

    // tight/loose — scale timing offsets toward or away from grid
    const tightFactor = (tight - 0.5) * 2; // -1 = loose, +1 = tight
    offset = offset * (1 - tightFactor * 0.8);

    // push/pull — shift everything forward or back
    const pushMs = (push - 0.5) * 24;
    offset += pushMs;

    // swing — push even-step 8ths late
    if (note.step % 2 === 1) {
      const swingAmount = (swing - 0.5) * 2 * 20;
      offset += swingAmount;
    }

    // accent — exaggerate strong beat velocity, compress weak
    const beatStrength = [1, 0, 0.5, 0, 0.8, 0, 0.5, 0, 1, 0, 0.5, 0, 0.8, 0, 0.5, 0][note.step] ?? 0.3;
    const accentFactor = (accent - 0.5) * 2;
    const velocityShift = accentFactor * (beatStrength - 0.5) * 40;
    velocity = Math.max(20, Math.min(127, velocity + velocityShift));

    // drift — add per-note random-ish variation
    const driftAmount = (drift - 0.5) * 2 * 15;
    const driftSeed = Math.sin(i * 9.3 + note.step * 3.7) * driftAmount;
    offset += driftSeed;

    return { ...note, offset, velocity };
  });
}

// Map a note's step + offset to an x position (0..1 normalized)
export function noteToX(note, totalSteps = 16) {
  const stepFraction = note.step / totalSteps;
  const offsetFraction = note.offset / 500; // 500ms is the full bar at ~120bpm 16ths
  return Math.max(0, Math.min(1, stepFraction + offsetFraction));
}

// Map a note's track to a y row (0..1 normalized)
export function noteToY(note) {
  return { kick: 0.25, snare: 0.5, hat: 0.75 }[note.track] ?? 0.5;
}
