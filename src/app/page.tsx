'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import type { SiteData, Item, Category } from '@/types'
import { loadData } from '@/lib/data'
import { formatDate } from '@/lib/platforms'
import Header from '@/components/Header'
import MatrixRain from '@/components/MatrixRain'

const RECENT_MS = 14 * 24 * 60 * 60 * 1000
const isRecent  = (d: string) => !!d && Date.now() - new Date(d).getTime() < RECENT_MS
const catHasRecent = (cat: Category) =>
  cat.items.some(i => isRecent(i.updatedAt||'') || isRecent(i.createdAt||''))

const CHARS       = 'АБВГДЕЖЗІЙКЛМНОПРСТУФХЦЧШЫЬЭЮЯabcdef0123456789!@#$%'
const BOOT_MIN_MS = 1800
const SESSION_KEY = 'gnulinuxbe_booted'

const TUX = `   .---.
  ( o o )
  |  O  |
 //|   |\\
(/ \\_^_/ \\)
   \`---\``

// ── hooks ──────────────────────────────────────────────────────────────────────

function useMatrixText(finalText: string, delay = 0, skip = false) {
  const [display, setDisplay] = useState(skip ? finalText : '')
  const [done, setDone]       = useState(skip)
  useEffect(() => {
    if (skip) return
    let t: ReturnType<typeof setTimeout>
    let iv: ReturnType<typeof setInterval>
    let revealed = 0
    const run = () => {
      iv = setInterval(() => {
        const s = finalText.split('').map((ch, i) => {
          if (i < revealed) return ch
          if (ch === ' ') return ' '
          return CHARS[Math.floor(Math.random() * CHARS.length)]
        }).join('')
        setDisplay(s); revealed++
        if (revealed > finalText.length) { clearInterval(iv); setDisplay(finalText); setDone(true) }
      }, 40)
    }
    t = setTimeout(run, delay)
    return () => { clearTimeout(t); clearInterval(iv) }
  }, [finalText, delay, skip])
  return { display, done }
}

function useCountUp(target: number, duration = 900) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    const start = performance.now()
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1)
      setVal(Math.round((1 - Math.pow(1 - p, 3)) * target))
      if (p < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [target, duration])
  return val
}

function useGlitch(value: number, interval = 4000) {
  const [display, setDisplay] = useState(value)
  useEffect(() => {
    setDisplay(value)
    const t = setInterval(() => {
      let n = 0
      const fl = setInterval(() => {
        setDisplay(Math.floor(Math.random() * value * 2)); n++
        if (n >= 4) { clearInterval(fl); setDisplay(value) }
      }, 60)
    }, interval + Math.random() * 2000)
    return () => clearInterval(t)
  }, [value, interval])
  return display
}

// ── boot screen ────────────────────────────────────────────────────────────────

const BOOT_LINES = [
  { text:'initializing gnulinuxbe...', delay:0 },
  { text:'loading data.json',           delay:300 },
  { text:'parsing categories...',       delay:700 },
  { text:'done.',                       delay:1100, color:'var(--green)' },
]

function BootScreen({ fading, onSkip }: { fading: boolean; onSkip: () => void }) {
  const [visible, setVisible] = useState(0)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    BOOT_LINES.forEach((l, i) => setTimeout(() => setVisible(i+1), l.delay))
    const start = performance.now()
    const tick  = (now: number) => {
      const p = Math.min((now - start) / 900, 1)
      setProgress(Math.round(p * 100))
      if (p < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter' || e.key === 'Escape') { e.preventDefault(); onSkip() }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onSkip])

  const filled = Math.round(progress / 5)
  const bar    = '█'.repeat(filled) + '░'.repeat(20 - filled)

  return (
    <div onClick={onSkip} style={{
      position:'fixed', inset:0, zIndex:90, cursor:'pointer',
      display:'flex', alignItems:'center', justifyContent:'center',
      background:'var(--bg)',
      opacity: fading ? 0 : 1,
      transition: fading ? 'opacity .4s ease' : 'none',
      pointerEvents: fading ? 'none' : 'auto',
    }}>
      <div style={{fontFamily:'monospace',color:'var(--t2)',textAlign:'center'}}>
        <pre style={{
          fontSize:'clamp(9px,2vw,13px)', lineHeight:1.4,
          color:'var(--pink)', margin:'0 0 20px', userSelect:'none',
          textShadow:'0 0 12px rgba(255,45,107,.5)',
        }}>{TUX}</pre>

        <div style={{textAlign:'left',fontSize:12}}>
          <div style={{color:'var(--pink)',fontWeight:700,marginBottom:12}}>$ boot gnulinuxbe</div>
          {BOOT_LINES.map((l,i) => visible > i && (
            <div key={i} style={{marginBottom:4,color:(l as any).color||'var(--t2)',animation:'fr .15s ease'}}>
              {'> '}{l.text}
            </div>
          ))}
          {visible > 0 && (
            <div style={{marginTop:12,color:'var(--t3)'}}>
              [{bar}] {progress}%
            </div>
          )}
        </div>
        <div style={{marginTop:20,fontSize:9,color:'var(--t3)',letterSpacing:1}}>
          PRESS ANY KEY TO SKIP
        </div>
      </div>
      <style>{`@keyframes fr{from{opacity:0}to{opacity:1}}`}</style>
    </div>
  )
}

// ── connection overlay ─────────────────────────────────────────────────────────

function ConnectedOverlay() {
  const [phase, setPhase] = useState<'in'|'hold'|'out'|'done'>('in')
  useEffect(() => {
    const t1 = setTimeout(() => setPhase('hold'), 400)
    const t2 = setTimeout(() => setPhase('out'),  1400)
    const t3 = setTimeout(() => setPhase('done'), 1900)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [])
  if (phase === 'done') return null
  return (
    <div style={{
      position:'fixed',inset:0,zIndex:100,pointerEvents:'none',
      display:'flex',alignItems:'center',justifyContent:'center',
      opacity: phase==='hold' ? 1 : 0,
      transition: phase==='in' ? 'opacity .4s' : 'opacity .5s',
    }}>
      <div style={{fontFamily:'monospace',textAlign:'center'}}>
        <div style={{fontSize:'clamp(1rem,4vw,2rem)',fontWeight:800,letterSpacing:6,color:'var(--green)',textTransform:'uppercase',textShadow:'0 0 20px rgba(34,197,94,.6)'}}>
          СУВЯЗЬ УСТАЛЯВАНА
        </div>
        <div style={{fontSize:11,color:'var(--t3)',marginTop:6,letterSpacing:2}}>CONNECTION ESTABLISHED</div>
      </div>
    </div>
  )
}

// ── system toasts ──────────────────────────────────────────────────────────────

const TOAST_MSGS = [
  '> ping gnulinuxbe.github.io... 8ms',
  '> kernel: new update available',
  '> mount /dev/freedom OK',
  '> gpg: signature verified',
  '> systemd: all units running',
  '> uptime: 99.9%',
  '> locale: be_BY.UTF-8',
]

function SystemToasts() {
  const [toasts, setToasts] = useState<{id:number;text:string;visible:boolean}[]>([])
  const counter = useRef(0)
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>
    const schedule = () => {
      timer = setTimeout(() => {
        const id   = counter.current++
        const text = TOAST_MSGS[Math.floor(Math.random() * TOAST_MSGS.length)]
        setToasts(prev => [...prev, {id, text, visible:true}])
        setTimeout(() => {
          setToasts(prev => prev.map(t => t.id===id ? {...t,visible:false} : t))
          setTimeout(() => setToasts(prev => prev.filter(t => t.id!==id)), 500)
        }, 3000)
        schedule()
      }, 4000 + Math.random() * 5000)
    }
    schedule()
    return () => clearTimeout(timer)
  }, [])
  return (
    <div style={{position:'fixed',bottom:20,right:20,zIndex:50,display:'flex',flexDirection:'column',gap:6,alignItems:'flex-end',pointerEvents:'none'}}>
      {toasts.map(t => (
        <div key={t.id} style={{
          fontFamily:'monospace',fontSize:11,color:'var(--green)',
          background:'var(--bg1)',border:'1px solid rgba(34,197,94,.2)',
          padding:'7px 12px',borderRadius:8,
          opacity:t.visible?1:0,transition:'opacity .5s',whiteSpace:'nowrap',
        }}>{t.text}</div>
      ))}
    </div>
  )
}

// ── main ───────────────────────────────────────────────────────────────────────

export default function Home() {
  const [data, setData]       = useState<SiteData | null>(null)
  const [phase, setPhase]     = useState<'boot'|'crt'|'done'>('boot')
  const isFirst   = useRef(typeof sessionStorage !== 'undefined' && !sessionStorage.getItem(SESSION_KEY))
  const dataRef   = useRef<SiteData | null>(null)
  const timerRef  = useRef<ReturnType<typeof setTimeout> | null>(null)
  const skipRef   = useRef(false)

  const doCrt = useCallback((d: SiteData) => {
    setData(d); setPhase('crt')
    setTimeout(() => setPhase('done'), 700)
  }, [])

  const skip = useCallback(() => {
    if (skipRef.current) return
    skipRef.current = true
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null }
    if (dataRef.current) doCrt(dataRef.current)
    // якщо дадзеныя яшчэ грузяцца — doCrt выклічацца калі прыйдуць
  }, [doCrt])

  useEffect(() => {
    if (!isFirst.current) {
      loadData().then(d => { setData(d); setPhase('done') })
      return
    }
    sessionStorage.setItem(SESSION_KEY, '1')
    const t = Date.now()
    loadData().then(d => {
      dataRef.current = d
      if (skipRef.current) {
        doCrt(d)
      } else {
        const wait = Math.max(0, BOOT_MIN_MS - (Date.now() - t))
        timerRef.current = setTimeout(() => doCrt(d), wait)
      }
    })
  }, [doCrt])

  const first = isFirst.current

  const allItems = data?.categories.flatMap(c => c.items) ?? []
  const totalPrograms = data?.categories.reduce((acc, c) =>
    acc + c.items.reduce((a, i) => a + (Array.isArray(i.apps) && i.apps.length > 0 ? i.apps.length : 1), 0), 0) ?? 0
  const thisMonth = new Date().toISOString().slice(0, 7)
  const updatedThisMonth = allItems.filter(i =>
    (i.updatedAt||'').startsWith(thisMonth) || (i.createdAt||'').startsWith(thisMonth)
  ).length

  return (
    <>
      {/* Matrix rain runs always — during boot and after */}
      <MatrixRain/>

      {/* Boot screen overlay — fades out during 'crt' phase */}
      {first && phase !== 'done' && <BootScreen fading={phase === 'crt'} onSkip={skip}/>}

      {/* Connection overlay — only on first visit, after boot */}
      {first && phase !== 'boot' && <ConnectedOverlay/>}

      <SystemToasts/>

      {/* Main content — CRT reveal on first visit */}
      {data && (
        <>
          <Header cats={data.categories}/>
          <main style={{
            position:'relative', zIndex:1,
            animation: first && phase === 'crt' ? 'crtReveal .5s ease-out forwards' : 'none',
            opacity:   (!first || phase !== 'boot') ? 1 : 0,
          }}>
            <div style={{maxWidth:860,margin:'0 auto',padding:'28px 16px 80px'}}>

              <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:24}}>
                <img src="/ava-gnu.png" alt="" style={{width:44,height:44,borderRadius:10,objectFit:'contain',background:'var(--bg2)',padding:3,flexShrink:0,border:'1px solid var(--bd)'}}/>
                <div><MatrixTitle skip={!first}/></div>
              </div>

              <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8,marginBottom:20}}>
                <StatCard value={totalPrograms}             label="праектаў"    color="var(--pink)"  glitchInterval={5000}/>
                <StatCard value={data.categories.length}   label="катэгорый"   color="var(--blue)"  glitchInterval={7000}/>
                <StatCard value={updatedThisMonth}          label="гэты месяц"  color="var(--green)" prefix="+" glitchInterval={6000}/>
              </div>

              <TerminalListing cats={data.categories} skip={!first}/>

              <div style={{fontSize:10,fontWeight:700,color:'var(--t3)',letterSpacing:.8,textTransform:'uppercase',padding:'4px 2px 8px',fontFamily:'monospace'}}>
                # нядаўна абноўлена
              </div>
              <RecentlyUpdated data={data}/>
            </div>
          </main>
        </>
      )}

      <style>{`
        @keyframes crtReveal {
          0%   { transform:scaleY(.02) scaleX(.98); filter:brightness(4); opacity:1; }
          15%  { transform:scaleY(.02) scaleX(.98); filter:brightness(4); }
          40%  { transform:scaleY(1)   scaleX(1);   filter:brightness(1.4); }
          100% { transform:scaleY(1)   scaleX(1);   filter:brightness(1); opacity:1; }
        }
        @keyframes blink{0%,100%{opacity:1}50%{opacity:0}}
        @keyframes fadeRow{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:none}}
        @keyframes fr{from{opacity:0}to{opacity:1}}
      `}</style>
    </>
  )
}

// ── components ─────────────────────────────────────────────────────────────────

function MatrixTitle({ skip }: { skip: boolean }) {
  const {display:title, done:titleDone} = useMatrixText('Linux па-беларуску', 0, skip)
  const {display:sub}                   = useMatrixText('# свабоднае ПЗ на роднай мове', 300, skip)
  return (
    <>
      <h1 style={{fontSize:16,fontWeight:700,color:'var(--text)',letterSpacing:-.3,fontFamily:'monospace',display:'flex',alignItems:'center',gap:4}}>
        {title}
        {titleDone && <span style={{display:'inline-block',width:8,height:14,background:'var(--pink)',verticalAlign:'text-bottom',animation:'blink 1s step-end infinite'}}/>}
      </h1>
      <p style={{fontSize:11,color:'var(--t3)',marginTop:2,fontFamily:'monospace'}}>{sub}</p>
    </>
  )
}

const CMD = '$ ls -la /'
const CMD_DELAY = 80
const ROW_DELAY = 60

function TerminalListing({ cats, skip }: { cats: Category[]; skip: boolean }) {
  const [cmdText,  setCmdText]  = useState(skip ? CMD : '')
  const [showRows, setShowRows] = useState(skip)
  const [visibleN, setVisibleN] = useState(skip ? cats.length + 1 : 0)

  useEffect(() => {
    if (skip) return
    let i = 0
    const type = setInterval(() => {
      i++; setCmdText(CMD.slice(0, i))
      if (i >= CMD.length) {
        clearInterval(type)
        setTimeout(() => {
          setShowRows(true)
          let row = 0
          const reveal = setInterval(() => {
            row++; setVisibleN(row)
            if (row >= cats.length + 1) clearInterval(reveal)
          }, ROW_DELAY)
        }, 300)
      }
    }, CMD_DELAY)
    return () => clearInterval(type)
  }, [cats.length, skip])

  return (
    <div style={{background:'var(--bg1)',border:'1px solid var(--bd)',borderRadius:12,overflow:'hidden',marginBottom:16}}>
      <div style={{padding:'8px 14px',borderBottom:showRows?'1px solid var(--bd)':'none',fontFamily:'monospace',fontSize:12,color:'var(--t2)',display:'flex',alignItems:'center',gap:4}}>
        <span style={{color:'var(--pink)',fontWeight:700}}>~</span>
        <span>{cmdText}</span>
        {!showRows && <span style={{display:'inline-block',width:7,height:13,background:'var(--pink)',opacity:.9,animation:'blink 1s step-end infinite',verticalAlign:'text-bottom'}}/>}
      </div>
      {showRows && visibleN >= 1 && (
        <div style={{display:'grid',gridTemplateColumns:'auto 1fr auto',padding:'6px 14px',borderBottom:'1px solid var(--bd)',fontSize:10,fontWeight:600,color:'var(--t3)',letterSpacing:.5}}>
          <span>drwx</span><span style={{paddingLeft:16}}>name</span><span>size</span>
        </div>
      )}
      {showRows && cats.map((cat, i) =>
        visibleN >= i+2 ? <CatRow key={cat.id} cat={cat} index={i} total={cats.length}/> : null
      )}
    </div>
  )
}

function CatRow({ cat, index, total }: { cat: Category; index: number; total: number }) {
  const finalName = cat.id
  const [displayName, setDisplayName] = useState(finalName)

  const scramble = useCallback(() => {
    let revealed = finalName.length
    const iv = setInterval(() => {
      revealed--
      if (revealed < 0) { clearInterval(iv); setDisplayName(finalName); return }
      setDisplayName(finalName.split('').map((ch, i) => {
        if (i <= revealed) return ch
        if (ch === ' ') return ' '
        return CHARS[Math.floor(Math.random() * CHARS.length)]
      }).join(''))
    }, 30)
  }, [finalName])

  return (
    <a href={`/${cat.id}`} style={{
      display:'grid',gridTemplateColumns:'auto 1fr auto',padding:'11px 14px',
      borderBottom:index<total-1?'1px solid var(--bd)':'none',
      textDecoration:'none',transition:'background .15s',alignItems:'center',
      animation:'fadeRow .2s ease',
    }}
    onMouseEnter={e=>{ (e.currentTarget as HTMLElement).style.background='var(--bg2)'; scramble() }}
    onMouseLeave={e=>{ (e.currentTarget as HTMLElement).style.background='transparent' }}
    >
      <span style={{fontSize:11,color:'var(--green)',fontWeight:500,whiteSpace:'nowrap',fontFamily:'monospace'}}>drwxr-xr-x</span>
      <div style={{paddingLeft:16,display:'flex',alignItems:'center',gap:8,minWidth:0}}>
        <span style={{color:'var(--pink)',fontWeight:700,fontSize:13,flexShrink:0}}>/</span>
        <span style={{fontSize:13,fontWeight:600,color:'var(--blue)',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',fontFamily:'monospace'}}>{displayName}</span>
        {catHasRecent(cat) && <span style={{width:6,height:6,borderRadius:'50%',background:'var(--pink)',flexShrink:0,display:'inline-block'}}/>}
        <span style={{fontSize:10,color:'var(--t3)',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',flex:1}}># {cat.name} — {cat.sub}</span>
      </div>
      <span style={{fontSize:11,color:'var(--t3)',whiteSpace:'nowrap',fontWeight:500}}>
        {cat.items.reduce((acc, i) => acc + (Array.isArray(i.apps) && i.apps.length > 0 ? i.apps.length : 1), 0)} items
      </span>
    </a>
  )
}

function StatCard({ value, label, color, prefix='', glitchInterval }: { value:number; label:string; color:string; prefix?:string; glitchInterval?:number }) {
  const counted  = useCountUp(value)
  const glitched = useGlitch(counted, glitchInterval)
  return (
    <div style={{background:'var(--bg1)',border:'1px solid var(--bd)',borderRadius:10,padding:'12px 14px',display:'flex',flexDirection:'column',gap:4,minWidth:0}}>
      <span style={{fontSize:'clamp(18px,5vw,24px)',fontWeight:800,color,lineHeight:1,letterSpacing:-1,fontFamily:'monospace'}}>{prefix}{glitched}</span>
      <span style={{fontSize:'clamp(8px,2vw,10px)',color:'var(--t3)',fontWeight:600,letterSpacing:.3,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{label}</span>
    </div>
  )
}

function RecentlyUpdated({ data }: { data: SiteData }) {
  const peraklady = data.categories.find(c => c.id === 'peraklady')
  if (!peraklady) return null
  const latestDate = (i: Item) => (i.updatedAt||'')>(i.createdAt||'') ? (i.updatedAt||'') : (i.createdAt||'')
  const items = [...peraklady.items]
    .filter(i => i.createdAt || i.updatedAt)
    .sort((a, b) => latestDate(b).localeCompare(latestDate(a)))
    .slice(0, 3)
  if (!items.length) return null
  return (
    <div style={{background:'var(--bg1)',border:'1px solid var(--bd)',borderRadius:10,overflow:'hidden'}}>
      {items.map((item, idx) => {
        const isNew     = !item.updatedAt || item.updatedAt === item.createdAt
        const chipColor = isNew ? 'var(--blue)' : 'var(--pink)'
        const chipBg    = isNew ? 'rgba(96,165,250,.12)' : 'var(--pinka)'
        const chipBd    = isNew ? 'rgba(96,165,250,.3)'  : 'var(--pinkb)'
        return (
          <a key={item.id} href={`/peraklady/${item.id}`} style={{
            display:'flex',alignItems:'center',gap:10,padding:'9px 12px',
            borderBottom:idx<items.length-1?'1px solid var(--bd)':'none',
            textDecoration:'none',transition:'background .15s',
          }}
          onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background='var(--bg2)'}
          onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background='transparent'}
          >
            <span style={{fontSize:9,fontWeight:700,letterSpacing:.5,textTransform:'uppercase',color:chipColor,background:chipBg,border:`1px solid ${chipBd}`,padding:'2px 7px',borderRadius:4,whiteSpace:'nowrap',flexShrink:0}}>
              {isNew ? '✦ новае' : '↻ абноўлена'}
            </span>
            {item.iconUrl && (
              <div style={{width:22,height:22,borderRadius:5,overflow:'hidden',flexShrink:0,background:'var(--bg3)',border:'1px solid var(--bd)'}}>
                <img src={item.iconUrl} alt="" style={{width:'100%',height:'100%',objectFit:'cover',display:'block'}}/>
              </div>
            )}
            <span style={{fontSize:12,fontWeight:600,color:'var(--text)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{item.name}</span>
            <span style={{fontSize:10,color:'var(--t3)',whiteSpace:'nowrap',flexShrink:0,marginLeft:'auto'}}>{formatDate(latestDate(item))}</span>
          </a>
        )
      })}
    </div>
  )
}
