import { useRef } from 'react'

export function useAudio() {
  const ctxRef = useRef(null)

  function getCtx() {
    if (!ctxRef.current) ctxRef.current = new AudioContext()
    return ctxRef.current
  }

  // iOS blocks Web Audio until a silent buffer is played inside a user gesture.
  // Call this in every button handler that will later trigger sounds from timers.
  async function unlock() {
    const c = getCtx()
    if (c.state === 'suspended') await c.resume()
    const buf = c.createBuffer(1, 1, c.sampleRate)
    const src = c.createBufferSource()
    src.buffer = buf
    src.connect(c.destination)
    src.start(0)
  }

  function tone(freq, startDelay, dur, vol = 0.5, type = 'sine') {
    const c = getCtx()
    if (c.state !== 'running') return
    const osc = c.createOscillator()
    const gain = c.createGain()
    osc.connect(gain)
    gain.connect(c.destination)
    osc.type = type
    osc.frequency.value = freq
    const t = c.currentTime + startDelay
    gain.gain.setValueAtTime(0, t)
    gain.gain.linearRampToValueAtTime(vol, t + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur)
    osc.start(t)
    osc.stop(t + dur + 0.05)
  }

  function playSetChime() {
    tone(880, 0, 0.6)
    tone(1320, 0.05, 0.4, 0.2)
  }

  function playGo() {
    tone(880, 0, 0.18, 0.5)
    tone(1320, 0.16, 0.3, 0.4)
  }

  function playRest() {
    tone(660, 0, 0.35, 0.4)
    tone(440, 0.28, 0.5, 0.3)
  }

  function playFinishAlarm() {
    tone(440, 0, 0.4)
    tone(554, 0.2, 0.4)
    tone(659, 0.4, 0.4)
    tone(880, 0.6, 1.0, 0.4)
  }

  return { unlock, playSetChime, playGo, playRest, playFinishAlarm }
}
