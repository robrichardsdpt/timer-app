import { useRef } from 'react'

// Minimal silent WAV generated once — used to switch iOS audio session
// to AVAudioSessionCategoryPlayback, which bypasses the silent switch.
const SILENT_WAV = (() => {
  const buf = new ArrayBuffer(46)
  const v = new DataView(buf)
  ;[82,73,70,70].forEach((b, i) => v.setUint8(i, b))       // "RIFF"
  v.setUint32(4, 38, true)                                   // file size - 8
  ;[87,65,86,69].forEach((b, i) => v.setUint8(8 + i, b))   // "WAVE"
  ;[102,109,116,32].forEach((b, i) => v.setUint8(12 + i, b)) // "fmt "
  v.setUint32(16, 16, true)   // fmt chunk size
  v.setUint16(20, 1, true)    // PCM
  v.setUint16(22, 1, true)    // mono
  v.setUint32(24, 44100, true) // sample rate
  v.setUint32(28, 88200, true) // byte rate
  v.setUint16(32, 2, true)    // block align
  v.setUint16(34, 16, true)   // bits per sample
  ;[100,97,116,97].forEach((b, i) => v.setUint8(36 + i, b)) // "data"
  v.setUint32(40, 2, true)    // data size (1 sample)
  v.setInt16(44, 0, true)     // silence
  let str = ''
  new Uint8Array(buf).forEach(b => { str += String.fromCharCode(b) })
  return 'data:audio/wav;base64,' + btoa(str)
})()

export function useAudio() {
  const ctxRef = useRef(null)

  function getCtx() {
    if (!ctxRef.current) {
      const Ctx = window.AudioContext || window.webkitAudioContext
      ctxRef.current = new Ctx()
    }
    return ctxRef.current
  }

  // Call synchronously inside a button tap handler (not async — iOS revokes
  // the user-gesture privilege at the first await boundary).
  // Playing the silent HTMLAudioElement switches the iOS audio session to
  // "playback" category so sounds ignore the hardware silent switch.
  function unlock() {
    const c = getCtx()
    c.resume()
    new Audio(SILENT_WAV).play().catch(() => {})
    const buf = c.createBuffer(1, 1, c.sampleRate)
    const src = c.createBufferSource()
    src.buffer = buf
    src.connect(c.destination)
    src.start(0)
  }

  function tone(freq, startDelay, dur, vol = 0.5, type = 'sine') {
    const c = getCtx()
    if (c.state !== 'running') c.resume()
    const osc = c.createOscillator()
    const gain = c.createGain()
    osc.connect(gain)
    gain.connect(c.destination)
    osc.type = type
    osc.frequency.value = freq
    const t = c.currentTime + startDelay + 0.05
    gain.gain.setValueAtTime(0, t)
    gain.gain.linearRampToValueAtTime(vol, t + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur)
    osc.start(t)
    osc.stop(t + dur + 0.1)
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
