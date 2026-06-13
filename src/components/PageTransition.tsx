'use client'
import { useEffect } from 'react'

const SCAN_IN: Keyframe[] = [
  { clipPath: 'inset(0 0 100% 0)', filter: 'brightness(3) saturate(0)', transform: 'translateX(-2px)' },
  { clipPath: 'inset(0 0 42%  0)', filter: 'brightness(1.3) saturate(1)', transform: 'none' },
  { clipPath: 'inset(0 0 0%   0)', filter: 'brightness(1) saturate(1)',   transform: 'none' },
]
const TIMING: KeyframeAnimationOptions = { duration: 220, easing: 'linear', fill: 'backwards' }

function animate() {
  document.documentElement.animate(SCAN_IN, TIMING)
}

export default function PageTransition() {
  useEffect(() => {
    // Firefox и другие без view transitions — анімацыя пры кожным уваходзе
    if (!('startViewTransition' in document)) {
      animate()
    }

    // Жэст "назад" на Mac/iOS (bfcache restore) — для ўсіх браўзераў
    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) animate()
    }
    window.addEventListener('pageshow', onPageShow)
    return () => window.removeEventListener('pageshow', onPageShow)
  }, [])

  return null
}
