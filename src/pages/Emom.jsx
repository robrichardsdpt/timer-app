import { useState, useEffect, useRef } from 'react'
import { Ring } from '../components/Ring'
import { useWakeLock } from '../hooks/useWakeLock'
import { useAudio } from '../hooks/useAudio'

function formatSecs(s) {
  if (s < 60) return `${s}s`
  const m = Math.floor(s / 60)
  const r = s % 60
  return r ? `${m}:${String(r).padStart(2, '0')}` : `${m}:00`
}

function SetDots({ total, current }) {
  if (total > 20) return null
  return (
    <div className="set-dots">
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className={`dot${i < current ? ' done' : ''}${i === current ? ' active' : ''}`}
        />
      ))}
    </div>
  )
}

export default function Emom() {
  const [sets, setSets] = useState(10)
  const [intervalSecs, setIntervalSecs] = useState(60)
  const [currentSet, setCurrentSet] = useState(0)
  const [remaining, setRemaining] = useState(0)
  const [status, setStatus] = useState('idle')
  const tickRef = useRef(null)
  const { unlock, playSetChime, playFinishAlarm } = useAudio()

  useWakeLock(status === 'running')

  useEffect(() => {
    if (status !== 'running') return
    tickRef.current = setInterval(() => {
      setRemaining(r => {
        if (r > 1) return r - 1
        setCurrentSet(s => {
          const next = s + 1
          if (next >= sets) {
            setStatus('finished')
            playFinishAlarm()
            clearInterval(tickRef.current)
            return s
          }
          playSetChime()
          setRemaining(intervalSecs)
          return next
        })
        return 0
      })
    }, 1000)
    return () => clearInterval(tickRef.current)
  }, [status, sets, intervalSecs])

  async function start() {
    await unlock()
    setCurrentSet(0)
    setRemaining(intervalSecs)
    setStatus('running')
    playSetChime()
  }

  function pause() {
    clearInterval(tickRef.current)
    setStatus('paused')
  }

  function resume() { setStatus('running') }

  function stop() {
    clearInterval(tickRef.current)
    setStatus('idle')
    setCurrentSet(0)
    setRemaining(0)
  }

  const mins = String(Math.floor(remaining / 60)).padStart(2, '0')
  const secs = String(remaining % 60).padStart(2, '0')
  const progress = intervalSecs > 0 ? remaining / intervalSecs : 0
  const warn = remaining <= 5 && remaining > 0

  if (status === 'finished') {
    return (
      <div className="page emom-page">
        <div className="finish-card">
          <div className="finish-check">✓</div>
          <h2 className="finish-title">Done</h2>
          <p className="finish-sub">{sets} sets · {formatSecs(intervalSecs)} each</p>
          <button className="pill-btn pill-cyan" onClick={stop}>Back</button>
        </div>
      </div>
    )
  }

  if (status === 'idle') {
    const total = sets * intervalSecs
    return (
      <div className="page emom-page">
        <h1 className="mode-title emom-glow">EMOM</h1>
        <p className="mode-sub">Every Minute On the Minute</p>
        <div className="setup-grid">
          <div className="setup-card">
            <span className="setup-label">Sets</span>
            <span className="setup-val">{sets}</span>
            <div className="setup-btns">
              <button className="nudge-btn" onClick={() => setSets(s => Math.max(1, s - 1))}>−</button>
              <button className="nudge-btn" onClick={() => setSets(s => s + 1)}>+</button>
            </div>
          </div>
          <div className="setup-card">
            <span className="setup-label">Interval</span>
            <span className="setup-val">{formatSecs(intervalSecs)}</span>
            <div className="setup-btns">
              <button className="nudge-btn" onClick={() => setIntervalSecs(s => Math.max(5, s - 5))}>−</button>
              <button className="nudge-btn" onClick={() => setIntervalSecs(s => s + 5)}>+</button>
            </div>
          </div>
        </div>
        <p className="workout-summary">
          {sets} × {formatSecs(intervalSecs)} = {formatSecs(total)} total
        </p>
        <button className="pill-btn pill-cyan pill-lg" onClick={start}>Start</button>
      </div>
    )
  }

  return (
    <div className="page emom-page">
      <div className="active-label">
        <span className="active-set-num">{currentSet + 1}</span>
        <span className="active-set-of"> / {sets}</span>
      </div>

      <div className="ring-wrap">
        <Ring progress={progress} color={warn ? '#ff3535' : '#00d4ff'} />
        <div className="ring-inner">
          <span className={`ring-time${warn ? ' warn-text' : ''}`}>{mins}:{secs}</span>
          {warn && <span className="ring-warn-label">go soon</span>}
        </div>
      </div>

      <SetDots total={sets} current={currentSet} />

      <div className="controls">
        {status === 'running'
          ? <button className="pill-btn pill-ghost" onClick={pause}>Pause</button>
          : <button className="pill-btn pill-cyan" onClick={resume}>Resume</button>
        }
        <button className="pill-btn pill-ghost" onClick={stop}>Stop</button>
      </div>
    </div>
  )
}
