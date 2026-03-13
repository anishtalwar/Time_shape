// Web Audio drum synthesizer
// All sounds are synthesized — no samples needed

let ctx = null;

function getCtx() {
  if (!ctx) ctx = new AudioContext();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

// --- Drum synths ---

function kick(ac, time, velocity = 1) {
  const gain = ac.createGain();
  gain.gain.setValueAtTime(velocity * 1.2, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.45);
  gain.connect(ac.destination);

  const osc = ac.createOscillator();
  osc.frequency.setValueAtTime(150, time);
  osc.frequency.exponentialRampToValueAtTime(40, time + 0.15);
  osc.connect(gain);
  osc.start(time);
  osc.stop(time + 0.5);

  // Click transient
  const clickBuf = ac.createBuffer(1, ac.sampleRate * 0.02, ac.sampleRate);
  const d = clickBuf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
  const click = ac.createBufferSource();
  click.buffer = clickBuf;
  const clickGain = ac.createGain();
  clickGain.gain.setValueAtTime(velocity * 0.5, time);
  click.connect(clickGain);
  clickGain.connect(ac.destination);
  click.start(time);
}

function snare(ac, time, velocity = 1) {
  // Tone body
  const osc = ac.createOscillator();
  osc.frequency.value = 200;
  const oscGain = ac.createGain();
  oscGain.gain.setValueAtTime(velocity * 0.5, time);
  oscGain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);
  osc.connect(oscGain);
  oscGain.connect(ac.destination);
  osc.start(time);
  osc.stop(time + 0.2);

  // Noise snare
  const bufLen = ac.sampleRate * 0.2;
  const buf = ac.createBuffer(1, bufLen, ac.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < bufLen; i++) data[i] = Math.random() * 2 - 1;

  const noise = ac.createBufferSource();
  noise.buffer = buf;

  const filter = ac.createBiquadFilter();
  filter.type = 'highpass';
  filter.frequency.value = 1800;

  const noiseGain = ac.createGain();
  noiseGain.gain.setValueAtTime(velocity * 0.8, time);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.18);

  noise.connect(filter);
  filter.connect(noiseGain);
  noiseGain.connect(ac.destination);
  noise.start(time);
  noise.stop(time + 0.25);
}

function hat(ac, time, velocity = 1, open = false) {
  const bufLen = ac.sampleRate * (open ? 0.3 : 0.06);
  const buf = ac.createBuffer(1, bufLen, ac.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < bufLen; i++) data[i] = Math.random() * 2 - 1;

  const noise = ac.createBufferSource();
  noise.buffer = buf;

  const hp = ac.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.value = 7000;

  const gain = ac.createGain();
  gain.gain.setValueAtTime(velocity * 0.4, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + (open ? 0.28 : 0.055));

  noise.connect(hp);
  hp.connect(gain);
  gain.connect(ac.destination);
  noise.start(time);
  noise.stop(time + (open ? 0.35 : 0.1));
}

// --- Scheduler ---

const STEP_COUNT = 16;

export class GrooveScheduler {
  constructor() {
    this.isPlaying = false;
    this.bpm = 120;
    this.lookahead = 0.1;       // seconds ahead to schedule
    this.scheduleInterval = 50; // ms between scheduler ticks
    this._timerId = null;
    this._nextStepTime = 0;
    this._currentStep = 0;
    this.onStep = null;         // callback(step, time)
    this._notes = [];
  }

  setNotes(notes) {
    this._notes = notes;
  }

  setBpm(bpm) {
    this.bpm = bpm;
  }

  get stepDuration() {
    // 16th note duration in seconds
    return (60 / this.bpm) / 4;
  }

  start() {
    if (this.isPlaying) return;
    const ac = getCtx();
    this.isPlaying = true;
    this._currentStep = 0;
    this._nextStepTime = ac.currentTime + 0.05;
    this._tick();
  }

  stop() {
    this.isPlaying = false;
    clearTimeout(this._timerId);
  }

  _tick() {
    if (!this.isPlaying) return;
    const ac = getCtx();

    while (this._nextStepTime < ac.currentTime + this.lookahead) {
      this._scheduleStep(this._currentStep, this._nextStepTime);
      this._nextStepTime += this.stepDuration;
      this._currentStep = (this._currentStep + 1) % STEP_COUNT;
    }

    this._timerId = setTimeout(() => this._tick(), this.scheduleInterval);
  }

  _scheduleStep(step, baseTime) {
    const ac = getCtx();
    const notesOnStep = this._notes.filter(n => n.step === step);

    for (const note of notesOnStep) {
      // Convert offset (ms) to seconds and clamp
      const offsetSec = Math.max(-0.04, Math.min(0.04, (note.offset ?? 0) / 1000));
      const t = Math.max(ac.currentTime, baseTime + offsetSec);
      const vel = (note.velocity ?? 80) / 127;

      if (note.track === 'kick')  kick(ac, t, vel);
      if (note.track === 'snare') snare(ac, t, vel);
      if (note.track === 'hat')   hat(ac, t, vel);
    }

    // Fire visual callback on the main step time
    const delay = (baseTime - ac.currentTime) * 1000;
    setTimeout(() => {
      if (this.isPlaying && this.onStep) this.onStep(step);
    }, Math.max(0, delay));
  }
}
