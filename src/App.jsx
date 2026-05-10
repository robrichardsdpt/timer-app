import { Routes, Route, NavLink } from 'react-router-dom'
import Home from './pages/Home.jsx'
import Timer from './pages/Timer.jsx'
import Stopwatch from './pages/Stopwatch.jsx'
import Emom from './pages/Emom.jsx'
import Interval from './pages/Interval.jsx'

export default function App() {
  return (
    <div className="app">
      <nav className="nav">
        <NavLink to="/" end>Home</NavLink>
        <NavLink to="/emom">EMOM</NavLink>
        <NavLink to="/interval">Interval</NavLink>
        <NavLink to="/timer">Timer</NavLink>
        <NavLink to="/stopwatch">Stopwatch</NavLink>
      </nav>
      <main className="main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/emom" element={<Emom />} />
          <Route path="/interval" element={<Interval />} />
          <Route path="/timer" element={<Timer />} />
          <Route path="/stopwatch" element={<Stopwatch />} />
        </Routes>
      </main>
    </div>
  )
}
