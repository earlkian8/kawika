import { useEffect, useState } from 'react'

/** Seconds remaining until `until` (epoch ms), ticking once per second. */
export function useCountdown(until: number | null) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!until) return
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [until])
  return until ? Math.max(0, Math.ceil((until - now) / 1000)) : 0
}
