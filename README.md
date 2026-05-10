# Timer App

A progressive web app (PWA) for strength & conditioning workouts. Install it to your iPhone home screen for a native-like experience with screen wake lock and finish notifications.

## Modes

### EMOM — Every Minute On the Minute
Program sets and interval durations (5-second increments). A chime fires at the start of each set; a fanfare plays when the workout is complete. Dot indicators track your progress through all sets.

### Interval — Work / Rest Cycles
Set separate work and rest durations (e.g. 15s on / 45s off). Choose a set count or a total duration as your stopping point. Distinct audio cues signal GO (sharp blasts) and REST (descending tones).

### Timer
Simple countdown with a circular progress ring. Fires a system notification when it reaches zero.

### Stopwatch
Count up with centisecond precision. Tap Lap to record splits shown in reverse chronological order.

## PWA Features

- **Screen wake lock** — keeps your phone screen on while any timer is running (iOS 16.4+ when installed as a PWA)
- **System notifications** — notifies you when the countdown timer finishes
- **Installable** — add to iPhone home screen via Safari → Share → Add to Home Screen

## Tech Stack

- [React 18](https://react.dev/) + [React Router v7](https://reactrouter.com/)
- [Vite 6](https://vitejs.dev/) + [vite-plugin-pwa](https://vite-pwa-org.netlify.app/)
- [Orbitron](https://fonts.google.com/specimen/Orbitron) (Google Fonts) for the digital display
- Web Audio API for all alarm sounds (no audio files)
- Wake Lock API, Notifications API

## Development

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Build

```bash
npm run build
npm run preview
```

Icons are generated automatically at build time from a pure Node.js script (no extra dependencies).
