// Generates and downloads a PNG groove card using Canvas API.
// All fonts (Space Mono, Space Grotesk) are already loaded on the page.

const BG    = '#f4f1ec';
const INK   = '#1a1916';
const ink   = (a) => `rgba(26,25,22,${a})`;
const MONO  = `'Space Mono', monospace`;
const SANS  = `'Space Grotesk', sans-serif`;

// Clamp to card width
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

export async function downloadCard({ notes, feel, bpm, stateName }) {
  await document.fonts.ready;

  const W   = 760;
  const PAD = 44;
  const INNER_W = W - PAD * 2;

  // ── Compute layout heights ───────────────────────────────────────────────
  const HEADER_H   = 72;
  const GRID_H     = 3 * 30 + 16;          // 3 tracks × 30 + gap
  const DIVIDER_H  = 28;
  const FEEL_ROW_H = 20;
  const GROUP_H    = 14;
  // 3 groups: Timing(2), Phrasing(2), Character(1)
  const FEEL_H     = 3 * GROUP_H + 5 * FEEL_ROW_H + 12;
  const FOOTER_H   = 36;

  const H = PAD + HEADER_H + DIVIDER_H + GRID_H + DIVIDER_H + FEEL_H + DIVIDER_H + FOOTER_H + PAD;

  // ── Canvas setup (2× for retina) ─────────────────────────────────────────
  const canvas  = document.createElement('canvas');
  canvas.width  = W * 2;
  canvas.height = H * 2;
  const ctx = canvas.getContext('2d');
  ctx.scale(2, 2);

  // Background + subtle border
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = ink(0.1);
  ctx.lineWidth = 0.75;
  ctx.strokeRect(0.5, 0.5, W - 1, H - 1);

  let y = PAD;
  const x = PAD;
  const right = W - PAD;

  // ── Header ───────────────────────────────────────────────────────────────
  ctx.font      = `9px ${MONO}`;
  ctx.fillStyle = ink(0.25);
  ctx.textAlign = 'left';
  ctx.fillText('GROOVE SHAPE', x, y + 6);

  ctx.font      = `9px ${MONO}`;
  ctx.fillStyle = ink(0.35);
  ctx.textAlign = 'right';
  ctx.fillText(`${(stateName || 'custom').toUpperCase()} · ${bpm} BPM`, right, y + 6);

  y += 18;

  // Title
  ctx.font      = `300 38px ${SANS}`;
  ctx.fillStyle = INK;
  ctx.textAlign = 'left';
  ctx.fillText('Time Shape', x, y + 30);
  y += 44;

  // ── Divider ──────────────────────────────────────────────────────────────
  const drawDivider = () => {
    ctx.strokeStyle = ink(0.15);
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(right, y);
    ctx.stroke();
    y += DIVIDER_H;
  };

  drawDivider();

  // ── Groove grid ──────────────────────────────────────────────────────────
  const STEPS    = 16;
  const LABEL_W  = 48;
  const CELL_W   = (INNER_W - LABEL_W) / STEPS;

  const tracks = [
    { key: 'kick',  label: 'KICK',  rBase: 5.5 },
    { key: 'snare', label: 'SNARE', rBase: 4.0 },
    { key: 'hat',   label: 'HAT',   rBase: 2.8 },
  ];

  const opacities = { kick: 0.85, snare: 0.65, hat: 0.40 };

  tracks.forEach(({ key, label, rBase }) => {
    // Track label
    ctx.font      = `8px ${MONO}`;
    ctx.fillStyle = ink(0.28);
    ctx.textAlign = 'left';
    ctx.fillText(label, x, y + 5);

    const trackNotes = notes.filter(n => n.track === key);

    for (let step = 0; step < STEPS; step++) {
      const note   = trackNotes.find(n => n.step === step);
      // x centre: offset note slightly by timing offset for visible drift
      const offsetFrac = note ? clamp(note.offset / 300, -0.5, 0.5) : 0;
      const cx = x + LABEL_W + step * CELL_W + CELL_W / 2 + offsetFrac * CELL_W * 0.7;
      const cy = y + 1;

      if (!note) {
        // Empty step: tiny tick
        ctx.fillStyle = ink(0.08);
        ctx.fillRect(cx - 0.4, cy - 3, 0.8, 6);
      } else {
        const vel  = note.velocity / 127;
        const r    = rBase * (0.45 + vel * 0.75);
        const op   = opacities[key] * (0.5 + vel * 0.5);
        ctx.fillStyle = ink(op);
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Bar lines at beats
    for (let b = 0; b <= 4; b++) {
      const bx = x + LABEL_W + b * CELL_W * 4;
      ctx.strokeStyle = b % 4 === 0 ? ink(0.12) : ink(0.05);
      ctx.lineWidth   = b % 4 === 0 ? 0.6 : 0.3;
      ctx.beginPath();
      ctx.moveTo(bx, y - 6);
      ctx.lineTo(bx, y + 8);
      ctx.stroke();
    }

    y += 30;
  });

  y += 4;
  drawDivider();

  // ── Feel bars ─────────────────────────────────────────────────────────────
  const groups = [
    { label: 'TIMING',    rows: [{ key: 'tight', left: 'LOOSE',    right: 'TIGHT'    },
                                  { key: 'push',  left: 'BEHIND',   right: 'AHEAD'    }] },
    { label: 'PHRASING',  rows: [{ key: 'swing',  left: 'STRAIGHT', right: 'SWING'    },
                                  { key: 'accent', left: 'EVEN',     right: 'ACCENTED' }] },
    { label: 'CHARACTER', rows: [{ key: 'drift',  left: 'STABLE',   right: 'DRIFTING' }] },
  ];

  const BAR_LABEL_W = 68;
  const BAR_W       = INNER_W - BAR_LABEL_W * 2 - 20;

  groups.forEach(({ label, rows }) => {
    // Group label
    ctx.font      = `7px ${MONO}`;
    ctx.fillStyle = ink(0.18);
    ctx.textAlign = 'left';
    ctx.fillText(label, x, y + 5);
    y += GROUP_H;

    rows.forEach(({ key, left, right: rightLabel }) => {
      const val = clamp(feel[key] ?? 0.5, 0, 1);
      const bx  = x + BAR_LABEL_W + 10;

      // Left label
      ctx.font      = `8px ${MONO}`;
      ctx.fillStyle = ink(val < 0.38 ? 0.7 : 0.3);
      ctx.textAlign = 'right';
      ctx.fillText(left, x + BAR_LABEL_W, y + 5);

      // Bar track
      ctx.fillStyle = ink(0.07);
      ctx.fillRect(bx, y - 3, BAR_W, 9);

      // Bar fill
      ctx.fillStyle = ink(0.6);
      ctx.fillRect(bx, y - 3, BAR_W * val, 9);

      // Center tick
      ctx.strokeStyle = BG;
      ctx.lineWidth   = 0.75;
      ctx.beginPath();
      ctx.moveTo(bx + BAR_W / 2, y - 3);
      ctx.lineTo(bx + BAR_W / 2, y + 6);
      ctx.stroke();

      // Right label
      ctx.font      = `8px ${MONO}`;
      ctx.fillStyle = ink(val > 0.62 ? 0.7 : 0.3);
      ctx.textAlign = 'left';
      ctx.fillText(rightLabel, bx + BAR_W + 10, y + 5);

      y += FEEL_ROW_H;
    });

    y += 4;
  });

  y += 2;
  drawDivider();

  // ── Footer ────────────────────────────────────────────────────────────────
  ctx.font      = `italic 10px ${MONO}`;
  ctx.fillStyle = ink(0.45);
  ctx.textAlign = 'left';
  ctx.fillText('feel as gesture, not data', x, y + 8);

  ctx.font      = `8px ${MONO}`;
  ctx.fillStyle = ink(0.18);
  ctx.textAlign = 'right';
  ctx.fillText('2026', right, y + 8);

  // ── Download ──────────────────────────────────────────────────────────────
  canvas.toBlob(blob => {
    const url = URL.createObjectURL(blob);
    const a   = document.createElement('a');
    a.href     = url;
    a.download = `timeshape-${(stateName || 'groove').replace(/\s+/g, '-')}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 'image/png');
}
