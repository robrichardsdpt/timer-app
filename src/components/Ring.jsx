const SIZE = 220
const R = 94
const SW = 12
const CIRC = 2 * Math.PI * R
const CX = SIZE / 2
const CY = SIZE / 2

export function Ring({ progress, color = '#00d4ff', track = '#0e0e20' }) {
  const p = Math.max(0, Math.min(1, progress))
  const offset = CIRC * (1 - p)
  const showDot = p > 0.02 && p < 0.98

  return (
    <svg width={SIZE} height={SIZE} className="ring-svg" style={{ overflow: 'visible' }}>
      <defs>
        <filter id={`glow-${color.replace('#', '')}`} x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Track */}
      <circle cx={CX} cy={CY} r={R} fill="none" stroke={track} strokeWidth={SW} />

      {/* Arc */}
      <circle
        cx={CX} cy={CY} r={R}
        fill="none"
        stroke={color}
        strokeWidth={SW}
        strokeLinecap="round"
        strokeDasharray={CIRC}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${CX} ${CY})`}
        filter={`url(#glow-${color.replace('#', '')})`}
        style={{ transition: 'stroke-dashoffset 0.55s linear, stroke 0.4s ease' }}
      />

      {/* Leading dot */}
      {showDot && (
        <circle
          cx={CX}
          cy={CY - R}
          r={SW * 0.8}
          fill="white"
          filter={`url(#glow-${color.replace('#', '')})`}
          style={{
            transform: `rotate(${(1 - p) * 360}deg)`,
            transformOrigin: `${CX}px ${CY}px`,
            transition: 'transform 0.55s linear',
          }}
        />
      )}
    </svg>
  )
}
