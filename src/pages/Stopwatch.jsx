import { useState, useEffect, useRef } from 'react'
import { useWakeLock } from '../hooks/useWakeLock'

export default function Stopwatch() {
  const [elapsed, setElapsed] = useState(0)
  const [running, setRunning] = useState(false)
  const [laps, setLaps] = useState([])
  const tickRef = useRef(null)

  useWakeLock(running)

  useEffect(() => {
    if (!running) return
    tickRef.current = setInterval(() => setElapsed(e => e + 10), 10)
    return () => clearInterval(tickRef.current)
  }, [running])

  function lap() { setLaps(l => [...l, elapsed]) }

  function reset() {
    clearInterval(tickRef.current)
    setRunning(false)
    setElapsed(0)
    setLaps([])
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
        <span className="sw-time">{fmt(elapsed)}</span>
      </div>

      <div className="controls">
        <button
          className={`pill-btn ${running ? 'pill-ghost' : 'pill-cyan'}`}
          onClick={() => setRunning(r => !r)}
        >
          {running ? 'Pause' : elapsed === 0 ? 'Start' : 'Resume'}
        </button>
        {running && <button className="pill-btn pill-ghost" onClick={lap}>Lap</button>}
        {elapsed > 0 && !running && <button className="pill-btn pill-ghost" onClick={reset}>Reset</button>}
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
