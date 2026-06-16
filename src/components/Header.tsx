'use client'
import { useState, useEffect } from 'react'
import type { Category } from '@/types'

interface Props {
  cats: Category[]
  activeId?: string | null
  crumb?: string | null
}

export default function Header({ cats, activeId, crumb }: Props) {
  const [open, setOpen] = useState(false)
  const activeCat = cats.find(c => c.id === activeId)

  return (
    <>
      <header style={{
        position:'sticky', top:0, zIndex:100,
        height:52,
        background:'var(--header-bg)',
        backdropFilter:'blur(16px)',
        borderBottom:'1px solid var(--bd)',
        display:'flex', alignItems:'center',
        padding:'0 16px', gap:10,
      }}>
        {/* Logo */}
        <a href="/" style={{ display:'flex', alignItems:'center', flexShrink:0 }}>
          <img src="/logo.png" alt="Linux па-беларуску" style={{ height:26, width:'auto' }}/>
        </a>

        {/* Breadcrumb path — desktop only */}
        <nav className="desktop-nav" style={{
          display:'flex', alignItems:'center', flex:1,
          overflow:'hidden', fontSize:12, fontWeight:500, color:'var(--t3)',
        }}>
          <a href="/" style={{ color: !activeId ? 'var(--pink)' : 'var(--t3)', padding:'4px 2px', transition:'color .15s', flexShrink:0 }}>~</a>
          {activeCat && (
            <>
              <Slash/>
              <a href={`/${activeCat.id}`} style={{
                color: activeId && !crumb ? 'var(--text)' : 'var(--t2)',
                padding:'4px 4px', transition:'color .15s', whiteSpace:'nowrap', flexShrink:0,
              }}>{activeCat.id}</a>
            </>
          )}
          {crumb && (
            <>
              <Slash/>
              <span style={{ color:'var(--text)', padding:'4px 4px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                {slugify(crumb)}
              </span>
            </>
          )}
        </nav>

        {/* Right side */}
        <div style={{ display:'flex', alignItems:'center', gap:8, marginLeft:'auto', flexShrink:0 }}>
          <ThemeToggle/>
          {process.env.NEXT_PUBLIC_ENABLE_ADMIN && (
            <a href="/admin" style={{
              display:'flex', alignItems:'center', justifyContent:'center',
              width:30, height:30, borderRadius:'var(--r)',
              border:'1px solid var(--bd)', background:'var(--bg2)',
              color:'var(--t3)', fontSize:13, transition:'all .15s',
            }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.color='var(--text)'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.color='var(--t3)'}
            >⚙</a>
          )}

          {/* Hamburger — mobile only */}
          <button
            className="hamburger"
            onClick={() => setOpen(o => !o)}
            style={{
              display:'none', alignItems:'center', justifyContent:'center',
              width:30, height:30, borderRadius:'var(--r)',
              border:'1px solid var(--bd)', background:'var(--bg2)',
              color:'var(--t2)', fontSize:16, cursor:'pointer', flexShrink:0,
            }}
            aria-label="Меню"
          >
            {open ? '✕' : '☰'}
          </button>
        </div>
      </header>

      {/* Mobile drawer */}
      {open && (
        <div style={{
          position:'fixed', top:52, left:0, right:0, bottom:0,
          background:'var(--drawer-bg)',
          backdropFilter:'blur(16px)',
          zIndex:99,
          overflowY:'auto',
          padding:'8px 0 32px',
        }}
        onClick={() => setOpen(false)}
        >
          {/* Home */}
          <a href="/" style={{
            display:'flex', alignItems:'center', gap:10,
            padding:'13px 20px',
            fontSize:13, fontWeight:600,
            color: !activeId ? 'var(--pink)' : 'var(--text)',
            borderBottom:'1px solid var(--bd)',
            textDecoration:'none',
          }}>
            <span style={{ color:'var(--pink)', fontWeight:700 }}>~</span>
            <span>Галоўная</span>
          </a>

          {/* Categories */}
          {cats.map(cat => (
            <a key={cat.id} href={`/${cat.id}`} style={{
              display:'flex', alignItems:'center', gap:10,
              padding:'13px 20px',
              fontSize:13, fontWeight:600,
              color: activeId===cat.id ? 'var(--pink)' : 'var(--text)',
              background: activeId===cat.id ? 'var(--pinka)' : 'transparent',
              borderBottom:'1px solid var(--bd)',
              textDecoration:'none',
            }}>
              <span style={{ color:'var(--pink)', fontWeight:700, fontSize:14 }}>/</span>
              <span style={{ color:'var(--blue)', marginRight:6 }}>{cat.id}</span>
              <span style={{ color:'var(--t3)', fontSize:11 }}># {cat.name}</span>
              <span style={{ marginLeft:'auto', fontSize:11, color:'var(--t3)' }}>{cat.items.length}</span>
            </a>
          ))}
        </div>
      )}

      <style>{`
        @media(max-width:640px){
          .desktop-nav{display:none!important}
          .hamburger{display:flex!important}
        }
      `}</style>
    </>
  )
}

type ThemeMode = 'auto' | 'light' | 'dark'

function ThemeToggle() {
  const [mode, setMode] = useState<ThemeMode>('auto')

  useEffect(() => {
    const stored = localStorage.getItem('theme') as ThemeMode | null
    if (stored === 'light' || stored === 'dark') setMode(stored)
    else setMode('auto')
  }, [])

  const toggle = () => {
    const next: ThemeMode = mode === 'auto' ? 'light' : mode === 'light' ? 'dark' : 'auto'
    setMode(next)
    if (next === 'auto') {
      localStorage.removeItem('theme')
      document.documentElement.removeAttribute('data-theme')
    } else {
      localStorage.setItem('theme', next)
      document.documentElement.setAttribute('data-theme', next)
    }
  }

  const icon = mode === 'light' ? '☀' : mode === 'dark' ? '☾' : '⬤'
  const title = mode === 'auto' ? 'Аўта (сістэма)' : mode === 'light' ? 'Светлая' : 'Цёмная'

  return (
    <button onClick={toggle} title={title} style={{
      display:'flex', alignItems:'center', justifyContent:'center',
      width:30, height:30, borderRadius:'var(--r)',
      border:'1px solid var(--bd)', background:'var(--bg2)',
      color: mode === 'auto' ? 'var(--pink)' : 'var(--t2)',
      fontSize: mode === 'auto' ? 8 : 14,
      cursor:'pointer', transition:'all .15s',
    }}
    onMouseEnter={e => (e.currentTarget as HTMLElement).style.color='var(--text)'}
    onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = mode === 'auto' ? 'var(--pink)' : 'var(--t2)'}
    >
      {icon}
    </button>
  )
}

function Slash() {
  return <span style={{ color:'var(--pink)', padding:'0 1px', fontWeight:700, flexShrink:0, fontSize:14 }}>/</span>
}

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-zа-яёіўьъ0-9\s-]/g,'').trim().replace(/\s+/g,'-').slice(0,30)
}
