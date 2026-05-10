import { useRef } from 'react'

// Web Audio API uses iOS AVAudioSessionCategoryAmbient — mixes with music
// and respects the silent switch. HTMLAudioElement uses Playback category,
// which interrupts music. So we use Web Audio for music compatibility.

export function useAudio() {
  const ctxRef = useRef(null)

  function getCtx() {
    if (!ctxRef.current) {
      ctxRef.current = new (window.AudioContext || window.webkitAudioContext)()
    }
    return ctxRef.current
  }

  // Call synchronously inside a button tap. Resumes the context and plays
  // a silent 1-sample buffer to satisfy iOS's user-gesture requirement.
  function unlock() {
    const ctx = getCtx()
    ctx.resume()
    const buf = ctx.createBuffer(1, 1, ctx.sampleRate)
    const src = ctx.createBufferSource()
    src.buffer = buf
    src.connect(ctx.destination)
    src.start(0)
  }

  function playNotes(notes) {
    const ctx = getCtx()
    if (ctx.state !== 'running') return
    const now = ctx.currentTime
    for (const { freq, start, dur, vol = 0.5 } of notes) {
      const osc  = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.frequency.value = freq
      osc.type = 'sine'
      const t = now + start
      gain.gain.setValueAtTime(0, t)
      gain.gain.linearRampToValueAtTime(vol, t + 0.003)
      gain.gain.exponentialRampToValueAtTime(0.001, t + dur)
      osc.start(t)
      osc.stop(t + dur + 0.05)
    }
  }

  function playSetChime() {
    playNotes([
      { freq: 880,  start: 0,    dur: 0.6 },
      { freq: 1320, start: 0.05, dur: 0.4, vol: 0.25 },
    ])
  }

  function playGo() {
    playNotes([
      { freq: 880,  start: 0,    dur: 0.2 },
      { freq: 1320, start: 0.18, dur: 0.3, vol: 0.6 },
    ])
  }

  function playRest() {
    playNotes([
      { freq: 660, start: 0,   dur: 0.4 },
      { freq: 440, start: 0.3, dur: 0.5, vol: 0.7 },
    ])
  }

  function playFinishAlarm() {
    playNotes([
      { freq: 440, start: 0,   dur: 0.4 },
      { freq: 554, start: 0.2, dur: 0.4 },
      { freq: 659, start: 0.4, dur: 0.4 },
      { freq: 880, start: 0.6, dur: 1.0, vol: 0.8 },
    ])
  }

  return { unlock, playSetChime, playGo, playRest, playFinishAlarm }
}
