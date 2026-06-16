'use client'
import { useEffect, useRef } from 'react'

const CHARS = 'АБВГДЕЖЗІЙКЛМНОПРСТУФХЦЧШЫЬЭЮЯabcdef0123456789!@#$%'

export default function MatrixRain({ opacity = 0.35 }: { opacity?: number }) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const cv  = ref.current!
    const ctx = cv.getContext('2d')!
    let tid: ReturnType<typeof setTimeout>
    let paused = false

    const resize = () => { cv.width = window.innerWidth; cv.height = window.innerHeight }
    resize(); window.addEventListener('resize', resize)

    const fs = 14
    const drops: number[] = []
    const init = () => { drops.length=0; for(let i=0;i<Math.floor(cv.width/fs);i++) drops.push(Math.random()*-50) }
    init(); window.addEventListener('resize', init)

    let lastTheme = document.documentElement.getAttribute('data-theme') ?? 'dark'

    const tick = () => {
      if (!paused) {
        const theme = document.documentElement.getAttribute('data-theme') ?? 'dark'
        const isLight = theme === 'light'

        if (theme !== lastTheme) {
          ctx.clearRect(0, 0, cv.width, cv.height)
          lastTheme = theme
        }

        ctx.fillStyle = isLight ? 'rgba(238,240,248,0.09)' : 'rgba(10,10,10,0.05)'
        ctx.fillRect(0,0,cv.width,cv.height)
        ctx.fillStyle = isLight ? 'rgba(212,20,79,0.14)' : 'rgba(255,45,107,0.18)'
        ctx.font = `${fs}px monospace`
        drops.forEach((y,i) => {
          ctx.fillText(CHARS[Math.floor(Math.random()*CHARS.length)], i*fs, y*fs)
          if (y*fs > cv.height && Math.random() > 0.975) drops[i] = 0
          drops[i] += 0.5
        })
      }
      tid = setTimeout(tick, 50)
    }
    tick()

    const vis = () => { paused = document.hidden }
    document.addEventListener('visibilitychange', vis)
    return () => {
      clearTimeout(tid)
      window.removeEventListener('resize', resize)
      window.removeEventListener('resize', init)
      document.removeEventListener('visibilitychange', vis)
    }
  }, [])

  return <canvas ref={ref} style={{position:'fixed',inset:0,pointerEvents:'none',zIndex:0,opacity}}/>
}
