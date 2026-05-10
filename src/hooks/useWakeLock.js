import { useEffect, useRef } from 'react'

export function useWakeLock(active) {
  const lockRef = useRef(null)

  useEffect(() => {
    if (!('wakeLock' in navigator)) return
    if (!active) {
      lockRef.current?.release()
      lockRef.current = null
      return
    }

    let cancelled = false

    async function acquire() {
      try {
        const lock = await navigator.wakeLock.request('screen')
        if (cancelled) { lock.release(); return }
        lockRef.current = lock
        lock.addEventListener('release', () => {
          if (!cancelled) acquire()
        })
      } catch {}
    }

    acquire()

    return () => {
      cancelled = true
      lockRef.current?.release()
      lockRef.current = null
    }
  }, [active])
}
