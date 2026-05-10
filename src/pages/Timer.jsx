import { useState, useEffect, useRef } from 'react'
import { Ring } from '../components/Ring'
import { useWakeLock } from '../hooks/useWakeLock'
import { useAudio } from '../hooks/useAudio'

async function requestNotify() {
  if ('Notification' in window && Notification.permission === 'default') {
    await Notification.requestPermission()
  }
}

function fireNotification(title = "Time's up!", body = 'Your timer finished.') {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, { body, icon: '/icon-192.png' })
  }
}

function formatSecs(s) {
  if (s < 60) return `${s}s`
  const m = Math.floor(s / 60)
  const r = s % 60
  return r ? `${m}:${String(r).padStart(2, '0')}` : `${m}m`
}

export default function Timer() {
  const [duration, setDuration] = useState(60)
  const [remaining, setRemaining] = useState(null)
  const [running, setRunning] = useState(false)
  const tickRef = useRef(null)
  const { unlock, playFinishAlarm } = useAudio()

  useWakeLock(running)

  useEffect(() => {
    if (!running || remaining <= 0) return
    tickRef.current = setInterval(() => {
      setRemaining(r => {
        if (r <= 1) {
          setRunning(false)
          playFinishAlarm()
          fireNotification()
          return 0
        }
        return r - 1
      })
    }, 1000)
    return () => clearInterval(tickRef.current)
  }, [running, remaining])

  function start() {
    unlock()
    requestNotify()
    if (remaining === null) setRemaining(duration)
    setRunning(true)
  }

  function reset() {
    clearInterval(tickRef.current)
    setRunning(false)
    setRemaining(null)
  }

  const display = remaining ?? duration
  const mins = String(Math.floor(display / 60)).padStart(2, '0')
  const secs = String(display % 60).padStart(2, '0')
  const finished = remaining === 0
  const progress = remaining !== null && duration > 0 ? remaining / duration : 1
  const warn = remaining !== null && remaining <= 5 && !finished
  const color = finished ? '#ff3535' : warn ? '#ff3535' : '#00d4ff'

  return (
    <div className="page">
      <h1 className="mode-title timer-glow">Timer</h1>

      {remaining === null && (
        <div className="timer-setup">
          <div className="setup-card setup-card-wide">
            <span className="setup-label">Duration</span>
            <span className="setup-val">{formatSecs(duration)}</span>
            <div className="setup-btns">
              <button className="nudge-btn" onClick={() => setDuration(d => Math.max(5, d - 5))}>−</button>
              <button className="nudge-btn" onClick={() => setDuration(d => d + 5)}>+</button>
            </div>
          </div>
        </div>
      )}

      {remaining !== null ? (
        <div className="ring-wrap">
          <Ring progress={progress} color={color} />
          <div className="ring-inner">
            <span className={`ring-time${warn || finished ? ' warn-text' : ''}`}>{mins}:{secs}</span>
            {finished && <span className="ring-warn-label">time's up</span>}
            {warn && !finished && <span className="ring-warn-label">almost done</span>}
          </div>
        </div>
      ) : (
        <div className="ring-wrap">
          <Ring progress={1} color="#1e1e30" track="#0e0e20" />
          <div className="ring-inner">
            <span className="ring-time muted-time">{mins}:{secs}</span>
          </div>
        </div>
      )}

      <div className="controls">
        {!running && !finished && (
          <button className="pill-btn pill-cyan" onClick={start}>
            {remaining === null ? 'Start' : 'Resume'}
          </button>
        )}
        {running && (
          <button className="pill-btn pill-ghost" onClick={() => setRunning(false)}>Pause</button>
        )}
        {remaining !== null && (
          <button className="pill-btn pill-ghost" onClick={reset}>Reset</button>
        )}
      </div>
    </div>
  )
}
