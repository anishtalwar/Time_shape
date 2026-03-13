// Base pattern — all offsets zero so dots render as circles at rest.
// Feel controls introduce all timing variation.
export function generateBasePattern() {
  return [
    // kick
    { step: 0,  offset: 0, velocity: 110, track: 'kick'  },
    { step: 4,  offset: 0, velocity: 95,  track: 'kick'  },
    { step: 8,  offset: 0, velocity: 112, track: 'kick'  },
    { step: 12, offset: 0, velocity: 90,  track: 'kick'  },
    // snare
    { step: 4,  offset: 0, velocity: 105, track: 'snare' },
    { step: 12, offset: 0, velocity: 108, track: 'snare' },
    // hats
    { step: 0,  offset: 0, velocity: 70,  track: 'hat'   },
    { step: 2,  offset: 0, velocity: 55,  track: 'hat'   },
    { step: 4,  offset: 0, velocity: 72,  track: 'hat'   },
    { step: 6,  offset: 0, velocity: 48,  track: 'hat'   },
    { step: 8,  offset: 0, velocity: 68,  track: 'hat'   },
    { step: 10, offset: 0, velocity: 52,  track: 'hat'   },
    { step: 12, offset: 0, velocity: 75,  track: 'hat'   },
    { step: 14, offset: 0, velocity: 45,  track: 'hat'   },
  ];
}

// Apply feel params to base pattern.
// Each param 0.0–1.0, neutral = 0.5
export function applyFeel(baseNotes, params) {
  const { tight = 0.5, push = 0.5, swing = 0.5, accent = 0.5, drift = 0.5 } = params;

  return baseNotes.map((note, i) => {
    let offset   = note.offset;
    let velocity = note.velocity;

    // tight → snap to grid  |  loose → add humanization
    const tightness = Math.max(0, (tight - 0.5) * 2);   // 0–1
    const looseness = Math.max(0, (0.5 - tight) * 2);   // 0–1
    const humanize  = Math.sin(i * 7.3 + note.step * 2.1) * looseness * 28;
    offset = offset * (1 - tightness) + humanize;

    // push/pull — global shift forward or back
    offset += (push - 0.5) * 44;

    // swing — delay odd 16th-note subdivisions
    if (note.step % 2 === 1) {
      offset += (swing - 0.5) * 2 * 38;
    }

    // accent — boost strong beats, compress weak ones
    const beatStrength = [1, 0, 0.5, 0, 0.8, 0, 0.5, 0, 1, 0, 0.5, 0, 0.8, 0, 0.5, 0][note.step] ?? 0.3;
    velocity = Math.max(20, Math.min(127,
      velocity + (accent - 0.5) * 2 * (beatStrength - 0.5) * 55
    ));

    // drift — per-note random-ish timing scatter
    offset += Math.sin(i * 9.3 + note.step * 3.7) * (drift - 0.5) * 2 * 28;

    return { ...note, offset, velocity };
  });
}

// Map a note's step + offset to an x position (0..1)
// Divisor 280 gives clear visual movement without notes crossing neighbours
export function noteToX(note, totalSteps = 16) {
  const stepFraction   = note.step / totalSteps;
  const offsetFraction = note.offset / 280;
  return Math.max(0, Math.min(1, stepFraction + offsetFraction));
}

export function noteToY(note) {
  return { kick: 0.25, snare: 0.5, hat: 0.75 }[note.track] ?? 0.5;
}
