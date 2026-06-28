'use client'
import { useState, useEffect, useMemo, useRef } from 'react'
import { useParams } from 'next/navigation'
import type { SiteData, Item, AppEntry } from '@/types'
import { getLinkStyle } from '@/lib/platforms'
import { fetchProgress, getItemProgress, getAppProgress, avgPct, pctColor, type ProgressData } from '@/lib/progress'
import Header from '@/components/Header'
import MatrixRain from '@/components/MatrixRain'
import dataJson from '../../../public/data.json'

const STATIC_DATA = dataJson as unknown as SiteData
const ALL = 'Усе'
const APP_STORE_CATS = ['peraklady']

type GridEntry =
  | { kind: 'solo';         item: Item }
  | { kind: 'group-header'; item: Item }
  | { kind: 'app';          item: Item; app: AppEntry }

function buildEntries(filtered: { item: Item; matchedApp?: string }[]): GridEntry[] {
  const out: GridEntry[] = []
  for (const { item, matchedApp } of filtered) {
    if (item.apps && item.apps.length > 0) {
      const appsToShow = matchedApp
        ? item.apps.filter(a => a.name === matchedApp)
        : item.apps
      for (const app of appsToShow) out.push({ kind: 'app', item, app })
    } else {
      out.push({ kind: 'solo', item })
    }
  }
  return out
}

export default function CatPage({ initialData }: { initialData?: SiteData }) {
  const { categoryId } = useParams() as { categoryId: string }
  const data = (initialData ?? STATIC_DATA) as SiteData
  const [search, setSearch] = useState('')
  const [fTag, setFTag] = useState(ALL)
  const [fDev, setFDev] = useState('')
  const [progress, setProgress] = useState<ProgressData | null>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => { fetchProgress().then(setProgress) }, [])

  // Read ?org= param from URL on mount
  useEffect(() => {
    const p = new URLSearchParams(window.location.search).get('org')
    if (p) setFDev(p)
  }, [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault()
        searchRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const cat = data?.categories.find(c => c.id === categoryId)

  const tags = useMemo(() => {
    if (!cat) return [ALL]
    return [ALL, ...Array.from(new Set(cat.items.flatMap(i => i.tags))).sort()]
  }, [cat])

  const filtered = useMemo(() => {
    if (!cat) return []
    const q = search.toLowerCase()
    return cat.items
      .filter(item => {
        if (fDev && item.org?.name !== fDev) return false
        if (fTag !== ALL && !item.tags.includes(fTag)) return false
        if (q && !item.name.toLowerCase().includes(q)
              && !item.id.toLowerCase().includes(q)
              && !item.category.toLowerCase().includes(q)
              && !(item.description || '').toLowerCase().includes(q)
              && !item.tags.some(t => t.toLowerCase().includes(q))
              && !item.apps?.some(a => a.name.toLowerCase().includes(q) || (a.description || '').toLowerCase().includes(q))) return false
        return true
      })
      .sort((a, b) => a.name.localeCompare(b.name, 'be'))
      .map(item => {
        if (!q) return { item, matchedApp: undefined }
        const directMatch = item.name.toLowerCase().includes(q)
          || item.id.toLowerCase().includes(q)
          || item.category.toLowerCase().includes(q)
          || (item.description || '').toLowerCase().includes(q)
          || item.tags.some(t => t.toLowerCase().includes(q))
        if (directMatch) return { item, matchedApp: undefined }
        const matched = item.apps?.find(a => a.name.toLowerCase().includes(q) || (a.description || '').toLowerCase().includes(q))
        return { item, matchedApp: matched?.name }
      })
  }, [cat, search, fTag, fDev])

  if (!cat) return <Msg>Не знойдзена</Msg>

  const isAppStore = APP_STORE_CATS.includes(categoryId)
  const entries = isAppStore ? buildEntries(filtered) : null

  const totalCards   = isAppStore
    ? cat.items.reduce((acc, i) => acc + (Array.isArray(i.apps) && i.apps.length > 0 ? i.apps.length : 1), 0)
    : cat.items.length
  const currentCards = isAppStore ? (entries?.length ?? 0) : filtered.length

  const avgAll = useMemo(() => {
    if (!progress) return null
    const pcts: number[] = []
    for (const item of cat.items) {
      if (item.apps?.length) {
        for (const app of item.apps) {
          const p = avgPct(getAppProgress(app, progress))
          if (p !== null) pcts.push(p)
        }
      } else {
        const p = avgPct(getItemProgress(item, progress))
        if (p !== null) pcts.push(p)
      }
    }
    return pcts.length ? Math.round(pcts.reduce((a, b) => a + b, 0) / pcts.length) : null
  }, [progress, cat])

  return (
    <>
      <MatrixRain opacity={0.06}/>
      <Header cats={data.categories} activeId={categoryId}/>
      <main style={{position:'relative',zIndex:1}}>
        {/* Compact blurred hero */}
        <div style={{position:'relative',overflow:'hidden'}}>
          {cat.bannerUrl ? (
            <>
              <img src={cat.bannerUrl} alt="" style={{position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'cover',filter:'blur(60px) brightness(.3) saturate(1.8)',transform:'scale(1.1)',zIndex:0}}/>
              <div style={{position:'absolute',inset:0,background:'rgba(0,0,0,.48)',zIndex:1}}/>
            </>
          ) : (
            <div style={{position:'absolute',inset:0,background:'linear-gradient(135deg,#0e0e16 0%,#1c1030 60%,#200820 100%)',zIndex:0}}/>
          )}
          <div className="cat-hero-inner" style={{position:'relative',zIndex:2,maxWidth:1280,margin:'0 auto',padding:'44px 20px 40px',display:'flex',alignItems:'center',gap:32,flexWrap:'wrap'}}>
            {/* Left: name + subtitle + CTA */}
            <div style={{flex:1,minWidth:200}}>
              {cat.sub && <div style={{fontSize:10,fontWeight:700,color:'rgba(255,255,255,.3)',textTransform:'uppercase',letterSpacing:2.5,marginBottom:10}}>{cat.sub}</div>}
              <h1 className="cat-hero-title" style={{fontSize:'clamp(26px,4vw,40px)',fontWeight:900,color:'#fff',margin:'0 0 20px',letterSpacing:-1,fontFamily:'var(--fd)',lineHeight:1.05}}>{cat.name}</h1>
              {cat.contributeUrl && (
                <a href={cat.contributeUrl} target="_blank" rel="noreferrer" style={{
                  display:'inline-flex',alignItems:'center',gap:6,
                  background:'var(--pink)',color:'#fff',border:'none',
                  fontSize:11,fontWeight:800,padding:'9px 22px',borderRadius:99,
                  textDecoration:'none',letterSpacing:.5,textTransform:'uppercase',
                }}>+ Прапанаваць</a>
              )}
            </div>
            {/* Right: stats */}
            <div className="cat-hero-stats" style={{display:'flex',gap:24,alignItems:'center',flexShrink:0}}>
              <div style={{textAlign:'center'}}>
                <div className="cat-hero-num" style={{fontSize:40,fontWeight:900,color:'#fff',lineHeight:1,letterSpacing:-2}}>{totalCards}</div>
                <div style={{fontSize:8,fontWeight:700,color:'rgba(255,255,255,.3)',textTransform:'uppercase',letterSpacing:1.5,marginTop:5}}>{isAppStore ? 'праграм' : 'праектаў'}</div>
              </div>
              {avgAll !== null && (
                <>
                  <div style={{width:1,height:36,background:'rgba(255,255,255,.1)',flexShrink:0}}/>
                  <div style={{textAlign:'center'}}>
                    <div className="cat-hero-num" style={{fontSize:40,fontWeight:900,color:pctColor(avgAll),lineHeight:1,letterSpacing:-2}}>{avgAll}<span style={{fontSize:20,letterSpacing:0}}>%</span></div>
                    <div style={{fontSize:8,fontWeight:700,color:'rgba(255,255,255,.3)',textTransform:'uppercase',letterSpacing:1.5,marginTop:5}}>пераклад</div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <div style={{maxWidth:1280,margin:'0 auto',padding:'0 16px 80px'}}>
          {/* Head breadcrumb */}
          <div style={{display:'flex',alignItems:'center',gap:6,padding:'14px 0 16px'}}>
            <span style={{color:'var(--pink)',fontWeight:700,fontSize:18,flexShrink:0}}>~/</span>
            <span style={{fontSize:'clamp(13px,3vw,18px)',fontWeight:700,color:'var(--text)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{categoryId}</span>
          </div>

          {/* Filter bar */}
          <div style={{background:'var(--bg1)',border:'1px solid var(--bd)',borderRadius:14,padding:'11px 13px',marginBottom:13,display:'flex',flexDirection:'column',gap:8}}>
            <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}>
              <div style={{flex:1,minWidth:160,position:'relative',display:'flex',alignItems:'center'}}>
                <svg style={{position:'absolute',left:9,width:13,height:13,color:'var(--t3)',pointerEvents:'none'}} viewBox="0 0 20 20" fill="none">
                  <circle cx="8.5" cy="8.5" r="5.5" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="m13 13 3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                <input ref={searchRef} value={search} onChange={e=>setSearch(e.target.value)} placeholder="Пошук… ( / )" style={{
                  width:'100%',background:'var(--bg3)',border:'1px solid var(--bd)',color:'var(--text)',
                  fontSize:12,padding:'7px 10px 7px 28px',borderRadius:'var(--r)',outline:'none',fontWeight:500,
                }}/>
              </div>
            </div>
            {tags.length > 1 && <Chips items={tags} active={fTag} onSelect={setFTag}/>}
          </div>

          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:11,flexWrap:'wrap'}}>
            <p style={{fontSize:10,fontWeight:600,color:'var(--t3)',margin:0}}>
              {currentCards} з {totalCards} {isAppStore ? 'праграм' : 'праектаў'}
            </p>
            {fDev && (() => {
              const devOrg = cat.items.find(i => i.org?.name === fDev)?.org
              return devOrg ? (
                <button onClick={()=>setFDev('')} style={{
                  display:'inline-flex',alignItems:'center',gap:5,
                  background:'var(--pinka)',border:'1px solid var(--pinkb)',
                  color:'var(--pink)',fontSize:10,fontWeight:700,
                  padding:'3px 8px 3px 5px',borderRadius:99,cursor:'pointer',
                }}>
                  {devOrg.iconUrl && <img src={devOrg.iconUrl} alt="" style={{width:14,height:14,borderRadius:3,objectFit:'cover',flexShrink:0}}/>}
                  {devOrg.name}
                  <span style={{opacity:.7}}>✕</span>
                </button>
              ) : null
            })()}
          </div>

          {/* Grid */}
          {isAppStore && entries ? (
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(130px,1fr))',gap:10}}>
              {entries.map((entry) => {
                if (entry.kind === 'app')  return <AppCard  key={`${entry.item.id}-${entry.app.id}`} item={entry.item} app={entry.app} catId={categoryId} onDevClick={setFDev} progress={progress}/>
                return <ItemCard key={entry.item.id} item={entry.item} catId={categoryId} progress={progress} onOrgClick={setFDev}/>
              })}
              {entries.length === 0 && (
                <p style={{gridColumn:'1/-1',padding:48,textAlign:'center',color:'var(--t3)',fontSize:14}}>Нічога не знойдзена</p>
              )}
            </div>
          ) : (
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:10}}>
              {filtered.map(({item, matchedApp}) => <ItemCard key={item.id} item={item} catId={categoryId} matchedApp={matchedApp} progress={progress} onOrgClick={setFDev}/>)}
              {filtered.length === 0 && (
                <p style={{gridColumn:'1/-1',padding:48,textAlign:'center',color:'var(--t3)',fontSize:14}}>Нічога не знойдзена</p>
              )}
            </div>
          )}
        </div>
      </main>
      <style>{`
        input:focus{border-color:var(--pinkb)!important}
        @media(max-width:540px){
          .cat-hero-inner{padding:28px 16px 24px!important;gap:16px!important;flex-wrap:nowrap!important;align-items:flex-start!important}
          .cat-hero-title{font-size:26px!important;margin-bottom:14px!important}
          .cat-hero-stats{flex-direction:column!important;gap:8px!important;align-items:flex-end!important}
          .cat-hero-num{font-size:26px!important}
        }
      `}</style>
    </>
  )
}

// ── App card (one per AppEntry) — App Store style ────────────────────────────
function AppCard({ item, app, catId, progress }: { item: Item; app: AppEntry; catId: string; onDevClick?: (d: string) => void; progress: ProgressData | null }) {
  const href = `/${catId}/${item.id}/${app.id}`
  const platNames = Array.from(new Set(app.platforms.map(p => p.name)))
  const pct = progress ? avgPct(getAppProgress(app, progress)) : null
  const color = pct !== null ? pctColor(pct) : 'var(--t3)'

  return (
    <div style={{background:'var(--bg1)',border:'1px solid var(--bd)',borderRadius:14,overflow:'hidden',transition:'border-color .2s,transform .2s',display:'flex',flexDirection:'column'}}
      onMouseEnter={e=>{const el=e.currentTarget as HTMLElement;el.style.borderColor='var(--pinkb)';el.style.transform='translateY(-2px)'}}
      onMouseLeave={e=>{const el=e.currentTarget as HTMLElement;el.style.borderColor='var(--bd)';el.style.transform='none'}}>
      {/* Top: grows to fill, pushes progress to bottom */}
      <div style={{padding:'14px 10px 0',flex:1,display:'flex',flexDirection:'column',alignItems:'center',textAlign:'center',gap:6}}>
        <a href={href} style={{textDecoration:'none',flexShrink:0}}>
          <div style={{width:56,height:56,borderRadius:14,overflow:'hidden',background:'var(--bg3)',border:'1px solid var(--bd)'}}>
            {app.iconUrl
              ? <img src={app.iconUrl} alt={app.name} style={{width:'100%',height:'100%',objectFit:'cover',display:'block'}}/>
              : <span style={{display:'flex',width:'100%',height:'100%',alignItems:'center',justifyContent:'center',fontFamily:'var(--fd)',fontSize:'1.4rem',color:'var(--t3)'}}>{app.name.slice(0,2).toUpperCase()}</span>
            }
          </div>
        </a>
        <div style={{minWidth:0,width:'100%'}}>
          <a href={href} style={{fontSize:12,fontWeight:700,color:'var(--text)',textDecoration:'none',display:'block',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{app.name}</a>
          <a href={`/${catId}/${item.id}`} onClick={e=>e.stopPropagation()} style={{display:'inline-flex',alignItems:'center',gap:3,marginTop:2,textDecoration:'none'}}>
            {item.iconUrl && <img src={item.iconUrl} alt="" style={{width:10,height:10,borderRadius:2,objectFit:'cover',flexShrink:0,opacity:.6}}/>}
            <span style={{fontSize:9,color:'var(--t3)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{item.name}</span>
          </a>
        </div>
        <div style={{display:'flex',gap:3,justifyContent:'center',flexWrap:'wrap',minHeight:14}}>
          {platNames.slice(0,3).map(n=>(
            <span key={n} style={{fontSize:8,fontWeight:700,background:'var(--pinkc)',color:'var(--pink)',padding:'1px 5px',borderRadius:3,whiteSpace:'nowrap'}}>{n}</span>
          ))}
          {platNames.length > 3 && <span style={{fontSize:8,fontWeight:700,background:'var(--bg3)',color:'var(--t3)',padding:'1px 5px',borderRadius:3}}>+{platNames.length-3}</span>}
        </div>
      </div>
      {/* Progress — always at bottom */}
      <div style={{padding:'10px 10px 12px'}}>
        {pct !== null ? (
          <>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',marginBottom:4}}>
              <span style={{fontSize:8,fontWeight:700,color:'var(--t3)',textTransform:'uppercase',letterSpacing:.8}}>Пераклад</span>
              <span style={{fontSize:13,fontWeight:800,color}}>{pct}%</span>
            </div>
            <div style={{height:3,borderRadius:2,background:`${color}18`,overflow:'hidden'}}>
              <div style={{width:`${pct}%`,height:'100%',background:color,borderRadius:2}}/>
            </div>
          </>
        ) : (
          <div style={{fontSize:9,color:'var(--t3)',textAlign:'center',height:22,display:'flex',alignItems:'center',justifyContent:'center'}}>Даных няма</div>
        )}
      </div>
    </div>
  )
}

function CTA({ link }: { link: { url: string; type: string; label: string } }) {
  const ls = getLinkStyle(link.type as 'translate'|'download'|'website'|'chat'|'other')
  return (
    <a href={link.url} target="_blank" rel="noreferrer"
      onClick={e => e.stopPropagation()}
      style={{
        marginTop:'auto',display:'block',textAlign:'center',textDecoration:'none',width:'100%',
        background:ls.bg,color:ls.color,border:`1px solid ${ls.color}40`,
        fontSize:10,fontWeight:700,letterSpacing:.3,textTransform:'uppercase',
        padding:'6px 0',borderRadius:8,
      }}>{ls.label}</a>
  )
}

// ── Solo item card (no apps) ─────────────────────────────────────────────────
function ItemCard({ item, catId, matchedApp, progress, onOrgClick }: { item: Item; catId: string; matchedApp?: string; progress: ProgressData | null; onOrgClick?: (org: string) => void }) {
  const href = matchedApp
    ? `/${catId}/${item.id}?app=${encodeURIComponent(matchedApp)}`
    : `/${catId}/${item.id}`

  const hasApps = item.apps && item.apps.length > 0
  const firstLink = hasApps
    ? item.apps![0]?.platforms[0]?.links[0]
    : item.platforms[0]?.links?.[0]

  const platNames = hasApps
    ? Array.from(new Set(item.apps!.flatMap(a => a.platforms.map(p => p.name))))
    : item.platforms.map(p => p.name)

  const hoverEnter = (e: React.MouseEvent) => { const el=e.currentTarget as HTMLElement; el.style.borderColor='var(--pinkb)'; el.style.transform='translateY(-2px)' }
  const hoverLeave = (e: React.MouseEvent) => { const el=e.currentTarget as HTMLElement; el.style.borderColor='var(--bd)'; el.style.transform='none' }

  const PlatChips = () => (
    <div style={{display:'flex',gap:3,justifyContent:'center',overflow:'hidden',height:16,flexShrink:0}}>
      {platNames.slice(0,2).map(n=>(
        <span key={n} style={{fontSize:8,fontWeight:700,background:'var(--pinkc)',color:'var(--pink)',padding:'1px 5px',borderRadius:3,whiteSpace:'nowrap',flexShrink:0}}>{n}</span>
      ))}
      {platNames.length > 2 && <span style={{fontSize:8,fontWeight:700,background:'var(--bg4)',color:'var(--t3)',padding:'1px 5px',borderRadius:3,whiteSpace:'nowrap',flexShrink:0}}>+{platNames.length-2}</span>}
    </div>
  )

  /* ── App Store style (peraklady solo) ── */
  if (APP_STORE_CATS.includes(catId)) {
    const pct = progress ? avgPct(getItemProgress(item, progress)) : null
    const color = pct !== null ? pctColor(pct) : 'var(--t3)'
    return (
      <div style={{background:'var(--bg1)',border:'1px solid var(--bd)',borderRadius:14,overflow:'hidden',transition:'border-color .2s,transform .2s',display:'flex',flexDirection:'column'}}
        onMouseEnter={hoverEnter} onMouseLeave={hoverLeave}>
        {/* Top: grows to fill */}
        <div style={{padding:'14px 10px 0',flex:1,display:'flex',flexDirection:'column',alignItems:'center',textAlign:'center',gap:6}}>
          <a href={href} style={{textDecoration:'none',flexShrink:0}}>
            <div style={{width:56,height:56,borderRadius:14,overflow:'hidden',background:'var(--bg3)',border:'1px solid var(--bd)'}}>
              {item.iconUrl
                ? <img src={item.iconUrl} alt={item.name} style={{width:'100%',height:'100%',objectFit:'cover',display:'block'}}/>
                : <span style={{display:'flex',width:'100%',height:'100%',alignItems:'center',justifyContent:'center',fontFamily:'var(--fd)',fontSize:'1.4rem',color:'var(--t3)'}}>{item.name.slice(0,2).toUpperCase()}</span>
              }
            </div>
          </a>
          <div style={{minWidth:0,width:'100%'}}>
            <a href={href} style={{fontSize:12,fontWeight:700,color:'var(--text)',textDecoration:'none',display:'block',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{item.name}</a>
            {matchedApp && <span style={{fontSize:9,color:'var(--pink)',display:'block',marginTop:2,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>↳ {matchedApp}</span>}
          </div>
          {item.org && (
            <a href={`/${catId}?org=${encodeURIComponent(item.org.name)}`}
              onClick={e=>{e.stopPropagation();e.preventDefault();onOrgClick?.(item.org!.name)}}
              style={{display:'inline-flex',alignItems:'center',gap:4,textDecoration:'none',maxWidth:'100%',overflow:'hidden'}}>
              {item.org.iconUrl && <img src={item.org.iconUrl} alt="" style={{width:10,height:10,borderRadius:2,objectFit:'cover',flexShrink:0,opacity:.6}}/>}
              <span style={{fontSize:9,color:'var(--t3)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{item.org.name}</span>
            </a>
          )}
          <PlatChips/>
        </div>
        {/* Progress — always at bottom */}
        <div style={{padding:'10px 10px 12px'}}>
          {pct !== null ? (
            <>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',marginBottom:4}}>
                <span style={{fontSize:8,fontWeight:700,color:'var(--t3)',textTransform:'uppercase',letterSpacing:.8}}>Пераклад</span>
                <span style={{fontSize:13,fontWeight:800,color}}>{pct}%</span>
              </div>
              <div style={{height:3,borderRadius:2,background:`${color}18`,overflow:'hidden'}}>
                <div style={{width:`${pct}%`,height:'100%',background:color,borderRadius:2}}/>
              </div>
            </>
          ) : (
            <div style={{fontSize:9,color:'var(--t3)',textAlign:'center',height:22,display:'flex',alignItems:'center',justifyContent:'center'}}>Даных няма</div>
          )}
        </div>
      </div>
    )
  }

  /* ── Banner style (slouniki, github-projects, …) ── */
  return (
    <div style={{background:'var(--bg1)',border:'1px solid var(--bd)',borderRadius:12,overflow:'hidden',transition:'border-color .2s,transform .2s',display:'flex',flexDirection:'column'}}
      onMouseEnter={hoverEnter} onMouseLeave={hoverLeave}>
      <a href={href} style={{display:'block',position:'relative',height:90,background:'var(--bg2)',overflow:'hidden',textDecoration:'none',flexShrink:0}}>
        {item.bannerUrl
          ? <img src={item.bannerUrl} alt={item.name} style={{width:'100%',height:'100%',objectFit:'cover',display:'block'}}/>
          : <div style={{width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',background:'linear-gradient(135deg,rgba(255,45,107,.06) 0%,transparent 60%)'}}>
              <span style={{fontFamily:'var(--fd)',fontSize:'1rem',letterSpacing:2,color:'var(--t3)',textAlign:'center',padding:'0 8px'}}>{item.name}</span>
            </div>
        }
      </a>
      <div style={{padding:'9px 10px 10px',flex:1,display:'flex',flexDirection:'column'}}>
        <div style={{display:'flex',alignItems:'center',gap:7,marginBottom:6}}>
          <div style={{width:28,height:28,borderRadius:6,overflow:'hidden',flexShrink:0,background:'var(--bg3)',border:'1px solid var(--bd)'}}>
            {item.iconUrl
              ? <img src={item.iconUrl} alt="" style={{width:'100%',height:'100%',objectFit:'cover',display:'block'}}/>
              : <span style={{display:'flex',width:'100%',height:'100%',alignItems:'center',justifyContent:'center',fontFamily:'var(--fd)',fontSize:'.6rem',color:'var(--t3)'}}>{item.name.slice(0,2).toUpperCase()}</span>
            }
          </div>
          <div style={{flex:1,minWidth:0}}>
            <a href={href} style={{fontSize:11,fontWeight:600,color:'var(--text)',textDecoration:'none',display:'block',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{item.name}</a>
            {matchedApp && <span style={{fontSize:9,color:'var(--pink)',display:'block',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>↳ {matchedApp}</span>}
          </div>
        </div>
        <PctBadge pct={progress ? avgPct(getItemProgress(item, progress)) : null}/>
        <PlatChips/>
        {firstLink && <div style={{marginTop:8}}><CTA link={firstLink}/></div>}
      </div>
    </div>
  )
}

// ── Translation % badge ──────────────────────────────────────────────────────
// Always renders a fixed-height slot so cards stay vertically aligned
function PctBadge({ pct }: { pct: number | null }) {
  return (
    <div style={{ minHeight: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {pct !== null && (() => {
        const color = pctColor(pct)
        return (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            background: `${color}18`, border: `1px solid ${color}40`,
            borderRadius: 5, padding: '2px 6px',
          }}>
            <div style={{ width: 28, height: 3, borderRadius: 2, background: `${color}30`, overflow: 'hidden', flexShrink: 0 }}>
              <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 2 }}/>
            </div>
            <span style={{ fontSize: 9, fontWeight: 800, color, letterSpacing: .3 }}>{pct}%</span>
          </div>
        )
      })()}
    </div>
  )
}

function Chips({ items, active, onSelect }: { items: string[]; active: string; onSelect: (v:string)=>void }) {
  return (
    <div style={{display:'flex',flexWrap:'wrap',gap:5}}>
      {items.map(v=>(
        <button key={v} onClick={()=>onSelect(v)} style={{
          background:active===v?'var(--pinka)':'var(--bg3)',
          border:`1px solid ${active===v?'var(--pinkb)':'var(--bd)'}`,
          color:active===v?'var(--pink)':'var(--t2)',
          fontSize:10,fontWeight:700,padding:'4px 10px',borderRadius:99,cursor:'pointer',whiteSpace:'nowrap',transition:'all .15s',
        }}>{v}</button>
      ))}
    </div>
  )
}

function Msg({ children }: { children: React.ReactNode }) {
  return <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',color:'var(--t2)',fontSize:14}}>{children}</div>
}
