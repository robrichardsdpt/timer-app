import { useRef } from 'react'

export function useAudio() {
  const ctxRef = useRef(null)

  function ctx() {
    if (!ctxRef.current) ctxRef.current = new AudioContext()
    if (ctxRef.current.state === 'suspended') ctxRef.current.resume()
    return ctxRef.current
  }

  function tone(freq, start, dur, vol = 0.5, type = 'sine') {
    const c = ctx()
    const osc = c.createOscillator()
    const gain = c.createGain()
    osc.connect(gain)
    gain.connect(c.destination)
    osc.type = type
    osc.frequency.value = freq
    const t = c.currentTime + start
    gain.gain.setValueAtTime(0, t)
    gain.gain.linearRampToValueAtTime(vol, t + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur)
    osc.start(t)
    osc.stop(t + dur + 0.05)
  }

  // EMOM set chime — clean high ding
  function playSetChime() {
    tone(880, 0, 0.6)
    tone(1320, 0.05, 0.4, 0.2)
  }

  // Interval GO — two clean ascending pings, punchy but not harsh
  function playGo() {
    tone(880, 0, 0.18, 0.5)
    tone(1320, 0.16, 0.3, 0.4)
  }

  // Interval REST — descending soft tones (settle down)
  function playRest() {
    tone(660, 0, 0.35, 0.4, 'sine')
    tone(440, 0.28, 0.5, 0.3, 'sine')
  }

  // Workout complete — ascending triumphant fanfare
  function playFinishAlarm() {
    tone(440, 0, 0.4)
    tone(554, 0.2, 0.4)
    tone(659, 0.4, 0.4)
    tone(880, 0.6, 1.0, 0.4)
  }

  return { playSetChime, playGo, playRest, playFinishAlarm }
}
