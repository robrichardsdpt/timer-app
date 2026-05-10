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

const WORK_COLOR = '#ff5500'
const REST_COLOR = '#00d4ff'

export default function Interval() {
  const [workSecs, setWorkSecs] = useState(15)
  const [restSecs, setRestSecs] = useState(45)
  const [limitType, setLimitType] = useState('sets') // 'sets' | 'duration'
  const [totalSets, setTotalSets] = useState(8)
  const [totalMins, setTotalMins] = useState(10)

  const [phase, setPhase] = useState('idle')  // 'idle' | 'work' | 'rest' | 'finished'
  const [remaining, setRemaining] = useState(0)
  const [currentSet, setCurrentSet] = useState(0)
  const [elapsedSecs, setElapsedSecs] = useState(0)
  const [paused, setPaused] = useState(false)

  const tickRef = useRef(null)
  const { unlock, playGo, playRest, playFinishAlarm } = useAudio()

  useWakeLock(phase === 'work' || phase === 'rest')

  const maxSets = limitType === 'sets' ? totalSets : Infinity
  const maxSecs = limitType === 'duration' ? totalMins * 60 : Infinity

  useEffect(() => {
    if ((phase !== 'work' && phase !== 'rest') || paused) return

    tickRef.current = setInterval(() => {
      setElapsedSecs(e => e + 1)
      setRemaining(r => {
        if (r > 1) return r - 1

        // Phase transition
        setPhase(p => {
          if (p === 'work') {
            // Check if workout is done (after this work phase)
            const nextSet = currentSet + 1
            const elapsedAfter = elapsedSecs + 1
            if (nextSet >= maxSets || elapsedAfter >= maxSecs) {
              clearInterval(tickRef.current)
              playFinishAlarm()
              return 'finished'
            }
            playRest()
            setRemaining(restSecs)
            return 'rest'
          } else {
            // rest → work
            setCurrentSet(s => s + 1)
            playGo()
            setRemaining(workSecs)
            return 'work'
          }
        })
        return 0
      })
    }, 1000)

    return () => clearInterval(tickRef.current)
  }, [phase, paused, workSecs, restSecs, maxSets, maxSecs])

  function start() {
    unlock()
    setCurrentSet(0)
    setElapsedSecs(0)
    setRemaining(workSecs)
    setPhase('work')
    setPaused(false)
    playGo()
  }

  function togglePause() {
    setPaused(p => !p)
  }

  function stop() {
    clearInterval(tickRef.current)
    setPhase('idle')
    setCurrentSet(0)
    setElapsedSecs(0)
    setRemaining(0)
    setPaused(false)
  }

  const isWork = phase === 'work'
  const isRest = phase === 'rest'
  const phaseDur = isWork ? workSecs : restSecs
  const progress = phaseDur > 0 ? remaining / phaseDur : 0
  const color = isWork ? WORK_COLOR : REST_COLOR
  const warn = remaining <= 3 && remaining > 0
  const setsDisplay = limitType === 'sets' ? `${currentSet + 1} / ${totalSets}` : `Set ${currentSet + 1}`

  if (phase === 'finished') {
    return (
      <div className="page interval-page">
        <div className="finish-card">
          <div className="finish-check" style={{ color: '#00ff88' }}>✓</div>
          <h2 className="finish-title">Done</h2>
          <p className="finish-sub">{currentSet + 1} rounds · {workSecs}s on / {restSecs}s off</p>
          <button className="pill-btn pill-cyan" onClick={stop}>Back</button>
        </div>
      </div>
    )
  }

  if (phase === 'idle') {
    const roundSecs = workSecs + restSecs
    const estimatedRounds = limitType === 'sets' ? totalSets : Math.floor(totalMins * 60 / roundSecs)
    const estimatedTime = limitType === 'sets'
      ? formatSecs(totalSets * roundSecs)
      : `${totalMins}m`

    return (
      <div className="page interval-page">
        <h1 className="mode-title interval-glow">Interval</h1>
        <p className="mode-sub">Work / Rest cycles</p>

        <div className="setup-grid">
          <div className="setup-card work-card">
            <span className="setup-label" style={{ color: WORK_COLOR }}>Work</span>
            <span className="setup-val">{formatSecs(workSecs)}</span>
            <div className="setup-btns">
              <button className="nudge-btn nudge-work" onClick={() => setWorkSecs(s => Math.max(5, s - 5))}>−</button>
              <button className="nudge-btn nudge-work" onClick={() => setWorkSecs(s => s + 5)}>+</button>
            </div>
          </div>
          <div className="setup-card rest-card">
            <span className="setup-label" style={{ color: REST_COLOR }}>Rest</span>
            <span className="setup-val">{formatSecs(restSecs)}</span>
            <div className="setup-btns">
              <button className="nudge-btn" onClick={() => setRestSecs(s => Math.max(5, s - 5))}>−</button>
              <button className="nudge-btn" onClick={() => setRestSecs(s => s + 5)}>+</button>
            </div>
          </div>
        </div>

        <div className="limit-toggle">
          <button
            className={`toggle-btn${limitType === 'sets' ? ' active' : ''}`}
            onClick={() => setLimitType('sets')}
          >Sets</button>
          <button
            className={`toggle-btn${limitType === 'duration' ? ' active' : ''}`}
            onClick={() => setLimitType('duration')}
          >Duration</button>
        </div>

        {limitType === 'sets' ? (
          <div className="setup-card setup-card-wide">
            <span className="setup-label">Rounds</span>
            <span className="setup-val">{totalSets}</span>
            <div className="setup-btns">
              <button className="nudge-btn" onClick={() => setTotalSets(s => Math.max(1, s - 1))}>−</button>
              <button className="nudge-btn" onClick={() => setTotalSets(s => s + 1)}>+</button>
            </div>
          </div>
        ) : (
          <div className="setup-card setup-card-wide">
            <span className="setup-label">Total Time</span>
            <span className="setup-val">{totalMins}m</span>
            <div className="setup-btns">
              <button className="nudge-btn" onClick={() => setTotalMins(m => Math.max(1, m - 1))}>−</button>
              <button className="nudge-btn" onClick={() => setTotalMins(m => m + 1)}>+</button>
            </div>
          </div>
        )}

        <p className="workout-summary">
          ~{estimatedRounds} rounds · {estimatedTime} · {workSecs}s on / {restSecs}s off
        </p>

        <button className="pill-btn pill-work pill-lg" onClick={start}>Start</button>
      </div>
    )
  }

  return (
    <div className="page interval-page">
      <div className={`phase-banner${isWork ? ' phase-work' : ' phase-rest'}`}>
        {isWork ? 'GO' : 'REST'}
      </div>

      <div className="ring-wrap">
        <Ring progress={progress} color={warn ? '#ff3535' : color} />
        <div className="ring-inner">
          <span className={`ring-time${warn ? ' warn-text' : ''}`}>
            {String(Math.floor(remaining / 60)).padStart(2, '0')}:{String(remaining % 60).padStart(2, '0')}
          </span>
          {warn && <span className="ring-warn-label">{isWork ? 'rest soon' : 'go soon'}</span>}
        </div>
      </div>

      <div className="interval-meta">
        <span className="meta-label">Round</span>
        <span className="meta-val">{setsDisplay}</span>
        {limitType === 'duration' && (
          <>
            <span className="meta-sep">·</span>
            <span className="meta-label">Elapsed</span>
            <span className="meta-val">{formatSecs(elapsedSecs)}</span>
          </>
        )}
      </div>

      <div className="controls">
        <button
          className={`pill-btn ${paused ? 'pill-cyan' : 'pill-ghost'}`}
          onClick={togglePause}
        >
          {paused ? 'Resume' : 'Pause'}
        </button>
        <button className="pill-btn pill-ghost" onClick={stop}>Stop</button>
      </div>
    </div>
  )
}
