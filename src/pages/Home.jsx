import { Link } from 'react-router-dom'

const modes = [
  { to: '/emom', label: 'EMOM', sub: 'Every minute on the minute sets', featured: true },
  { to: '/interval', label: 'Interval', sub: 'Work / rest cycles with GO & REST alarms', featured: true },
  { to: '/timer', label: 'Timer', sub: 'Simple countdown' },
  { to: '/stopwatch', label: 'Stopwatch', sub: 'Count up with laps' },
]

export default function Home() {
  return (
    <div className="page home-page">
      <h1 className="mode-title home-glow">Modes</h1>
      <div className="home-grid">
        {modes.map(m => (
          <Link key={m.to} to={m.to} className={`home-card${m.featured ? ' home-card-featured' : ''}`}>
            <span className="home-card-label">{m.label}</span>
            <span className="home-card-sub">{m.sub}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
