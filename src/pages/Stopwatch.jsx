import { useState, useEffect, useRef } from 'react'
import { useWakeLock } from '../hooks/useWakeLock'

export default function Stopwatch() {
  const [displayMs, setDisplayMs] = useState(0)
  const [running, setRunning] = useState(false)
  const [laps, setLaps] = useState([])

  // Refs track real time so RAF can compute elapsed without stale state
  const rafRef = useRef(null)
  const startRef = useRef(null)   // performance.now() when last resumed
  const baseRef = useRef(0)       // accumulated ms before latest resume

  useWakeLock(running)

  useEffect(() => {
    if (running) {
      startRef.current = performance.now()
      const tick = () => {
        setDisplayMs(baseRef.current + (performance.now() - startRef.current))
        rafRef.current = requestAnimationFrame(tick)
      }
      rafRef.current = requestAnimationFrame(tick)
    } else {
      if (startRef.current !== null) {
        baseRef.current += performance.now() - startRef.current
        startRef.current = null
      }
      cancelAnimationFrame(rafRef.current)
    }
    return () => cancelAnimationFrame(rafRef.current)
  }, [running])

  function snapMs() {
    return baseRef.current + (startRef.current !== null ? performance.now() - startRef.current : 0)
  }

  function lap() { setLaps(l => [...l, snapMs()]) }

  function reset() {
    cancelAnimationFrame(rafRef.current)
    setRunning(false)
    setDisplayMs(0)
    setLaps([])
    baseRef.current = 0
    startRef.current = null
  }

  function fmt(ms) {
    const m = String(Math.floor(ms / 60000)).padStart(2, '0')
    const s = String(Math.floor((ms % 60000) / 1000)).padStart(2, '0')
    const c = String(Math.floor((ms % 1000) / 10)).padStart(2, '0')
    return `${m}:${s}.${c}`
  }

  return (
    <div className="page">
      <h1 className="mode-title sw-glow">Stopwatch</h1>

      <div className="sw-display">
        <span className="sw-time">{fmt(displayMs)}</span>
      </div>

      <div className="controls">
        <button
          className={`pill-btn ${running ? 'pill-ghost' : 'pill-cyan'}`}
          onClick={() => setRunning(r => !r)}
        >
          {running ? 'Pause' : displayMs === 0 ? 'Start' : 'Resume'}
        </button>
        {running && <button className="pill-btn pill-ghost" onClick={lap}>Lap</button>}
        {displayMs > 0 && !running && <button className="pill-btn pill-ghost" onClick={reset}>Reset</button>}
      </div>

      {laps.length > 0 && (
        <ol className="laps">
          {[...laps].reverse().map((t, ri) => {
            const i = laps.length - 1 - ri
            const delta = i > 0 ? t - laps[i - 1] : t
            return (
              <li key={i} className={i === laps.length - 1 ? 'lap-latest' : ''}>
                <span className="lap-num">Lap {i + 1}</span>
                <span className="lap-time">{fmt(t)}</span>
                <span className="lap-delta">{i > 0 ? `+${fmt(delta)}` : ''}</span>
              </li>
            )
          })}
        </ol>
      )}
    </div>
  )
}
