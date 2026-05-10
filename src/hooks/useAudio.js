import { useRef } from 'react'

// ---------------------------------------------------------------------------
// WAV generator — runs once at module load, produces data URIs.
// Using HTMLAudioElement (not Web Audio API) so iOS routes sounds through
// AVAudioSessionCategoryPlayback, which bypasses the hardware silent switch.
// ---------------------------------------------------------------------------
function makeWAV(notes, sampleRate = 22050) {
  // Find total length
  let totalSecs = 0
  for (const n of notes) totalSecs = Math.max(totalSecs, n.start + n.dur)
  totalSecs += 0.05 // small tail so the last note isn't clipped

  const numSamples = Math.ceil(totalSecs * sampleRate)
  const pcm = new Float32Array(numSamples)

  for (const { freq, start, dur, vol = 0.5 } of notes) {
    const s0 = Math.floor(start * sampleRate)
    const s1 = Math.min(numSamples, Math.floor((start + dur) * sampleRate))
    for (let i = s0; i < s1; i++) {
      const t = (i - s0) / sampleRate
      // 3 ms linear attack, then exponential decay
      const attack = Math.min(1, t / 0.003)
      const decay  = Math.exp(-4 * t)
      pcm[i] += Math.sin(2 * Math.PI * freq * t) * attack * decay * vol
    }
  }

  // Soft-clip to ±1
  for (let i = 0; i < numSamples; i++) {
    pcm[i] = Math.max(-1, Math.min(1, pcm[i]))
  }

  // Pack as 16-bit WAV
  const dataBytes = numSamples * 2
  const buf = new ArrayBuffer(44 + dataBytes)
  const v   = new DataView(buf)
  const str = (off, s) => { for (let i = 0; i < s.length; i++) v.setUint8(off + i, s.charCodeAt(i)) }

  str(0,  'RIFF'); v.setUint32(4,  36 + dataBytes, true)
  str(8,  'WAVE'); str(12, 'fmt ')
  v.setUint32(16, 16, true)            // fmt chunk size
  v.setUint16(20, 1,  true)            // PCM
  v.setUint16(22, 1,  true)            // mono
  v.setUint32(24, sampleRate,      true)
  v.setUint32(28, sampleRate * 2,  true)
  v.setUint16(32, 2,  true)            // block align
  v.setUint16(34, 16, true)            // bits per sample
  str(36, 'data'); v.setUint32(40, dataBytes, true)

  for (let i = 0; i < numSamples; i++) {
    v.setInt16(44 + i * 2, Math.round(pcm[i] * 32767), true)
  }

  let b = ''
  const bytes = new Uint8Array(buf)
  for (let i = 0; i < bytes.length; i++) b += String.fromCharCode(bytes[i])
  return 'data:audio/wav;base64,' + btoa(b)
}

// Pre-bake all clips at import time
const CLIPS = {
  chime: makeWAV([
    { freq: 880,  start: 0,    dur: 0.6 },
    { freq: 1320, start: 0.05, dur: 0.4, vol: 0.25 },
  ]),
  go: makeWAV([
    { freq: 880,  start: 0,    dur: 0.2 },
    { freq: 1320, start: 0.18, dur: 0.3, vol: 0.8 },
  ]),
  rest: makeWAV([
    { freq: 660, start: 0,    dur: 0.4 },
    { freq: 440, start: 0.3,  dur: 0.5, vol: 0.7 },
  ]),
  finish: makeWAV([
    { freq: 440, start: 0,   dur: 0.4 },
    { freq: 554, start: 0.2, dur: 0.4 },
    { freq: 659, start: 0.4, dur: 0.4 },
    { freq: 880, start: 0.6, dur: 1.0, vol: 0.8 },
  ]),
}

// ---------------------------------------------------------------------------
export function useAudio() {
  const elsRef = useRef(null)

  function getEls() {
    if (!elsRef.current) {
      elsRef.current = {}
      for (const [key, src] of Object.entries(CLIPS)) {
        const el = new Audio(src)
        el.preload = 'auto'
        elsRef.current[key] = el
      }
    }
    return elsRef.current
  }

  // Call synchronously inside a button tap. Playing each element once
  // (even briefly) tells iOS this page is doing media playback, which
  // switches the audio session category and bypasses the silent switch
  // for all subsequent plays — including those triggered from timers.
  function unlock() {
    for (const el of Object.values(getEls())) {
      el.play()
        .then(() => { el.pause(); el.currentTime = 0 })
        .catch(() => {})
    }
  }

  function play(key) {
    const el = getEls()[key]
    if (!el) return
    el.currentTime = 0
    el.play().catch(() => {})
  }

  function playSetChime()  { play('chime')  }
  function playGo()        { play('go')     }
  function playRest()      { play('rest')   }
  function playFinishAlarm() { play('finish') }

  return { unlock, playSetChime, playGo, playRest, playFinishAlarm }
}
