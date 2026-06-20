'use client'
import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import type { SiteData, Platform, AppEntry } from '@/types'
import { getLinkStyle, formatDate } from '@/lib/platforms'
import { fetchProgress, getItemProgress, getAppProgress, avgPct, pctColor, type ProgressData, type ItemProgressEntry } from '@/lib/progress'
import Header from '@/components/Header'
import dataJson from '../../../../public/data.json'

const STATIC_DATA = dataJson as unknown as SiteData

function md(text: string): string {
  if (!text) return ''
  return text.split('\n').map(line => {
    if (/^[-*]\s/.test(line)) return `<li>${il(line.slice(2).trim())}</li>`
    if (/^###\s/.test(line))  return `<h3>${il(line.slice(4))}</h3>`
    if (/^##\s/.test(line))   return `<h2>${il(line.slice(3))}</h2>`
    if (!line.trim())         return ''
    return `<p>${il(line)}</p>`
  }).filter(Boolean).join('')
    .replace(/(<li>[\s\S]*?<\/li>)+/g, m => `<ul>${m}</ul>`)
}
function il(t: string) {
  return t
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code>$1</code>')
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g,
      '<a href="$2" target="_blank" rel="noreferrer">$1</a>')
}

// ── Platform tabs + links (shared component) ──────────────────────────────────
function PlatformLinks({ platforms }: { platforms: Platform[] }) {
  const [tab, setTab] = useState(0)
  if (!platforms.length) return null
  const plat = platforms[tab] ?? platforms[0]

  return (
    <div>
      {/* Platform tabs */}
      {platforms.length > 1 && (
        <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:10 }}>
          {platforms.map((p, i) => (
            <button key={p.name} onClick={() => setTab(i)} style={{
              fontSize:11, fontWeight:600, padding:'5px 13px', borderRadius:7,
              border: `1px solid ${i===tab ? 'var(--bd2)' : 'var(--bd)'}`,
              background: i===tab ? 'var(--bg3)' : 'var(--bg2)',
              color: i===tab ? 'var(--text)' : 'var(--t2)',
              cursor:'pointer', transition:'all .15s', whiteSpace:'nowrap',
            }}>{p.name}</button>
          ))}
        </div>
      )}

      {/* Links for active platform */}
      {plat.links.length > 0 && (
        <div style={{ border:'1px solid var(--bd)', borderRadius:10, overflow:'hidden' }}>
          {plat.links.map((link, i) => {
            const ls = getLinkStyle(link.type)
            return (
              <a key={i} href={link.url} target="_blank" rel="noreferrer" style={{
                display:'flex', alignItems:'center', gap:12,
                padding:'11px 14px',
                borderBottom: i < plat.links.length-1 ? '1px solid var(--bd)' : 'none',
                textDecoration:'none', background:'transparent', transition:'background .15s',
              }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background='var(--bg2)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background='transparent'}
              >
                {/* Type pill */}
                <div style={{
                  padding:'4px 11px', borderRadius:6, flexShrink:0,
                  background: ls.bg, border:`1px solid ${ls.color}40`,
                  fontSize:10, fontWeight:700, color: ls.color, whiteSpace:'nowrap',
                }}>{ls.label}</div>
                {/* Label + url */}
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:12, fontWeight:600, color:'var(--text)', marginBottom:1 }}>{link.label}</div>
                  <div style={{ fontSize:10, color:'var(--t3)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                    {link.url.replace(/^https?:\/\//, '')}
                  </div>
                </div>
                <span style={{ fontSize:16, color:'var(--t3)', flexShrink:0 }}>›</span>
              </a>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function ItemPage({ initialData }: { initialData?: SiteData }) {
  const { categoryId, itemId } = useParams() as { categoryId: string; itemId: string; appId?: string }
  const data = (initialData ?? STATIC_DATA) as SiteData
  const [appTab, setAppTab] = useState(0)
  const [progress, setProgress] = useState<ProgressData | null>(null)

  const cat  = data.categories.find(c => c.id === categoryId)
  const item = cat?.items.find(i => i.id === itemId)

  useEffect(() => { fetchProgress().then(setProgress) }, [])

  useEffect(() => {
    if (!item?.apps) return
    const app = new URLSearchParams(window.location.search).get('app')
    if (!app) return
    const idx = item.apps.findIndex(a => a.name.toLowerCase() === app.toLowerCase())
    if (idx >= 0) setAppTab(idx)
  }, [item])

  if (!item || !cat) return <Msg>Не знойдзена</Msg>

  const isGrouped = !!(item.apps && item.apps.length > 0)
  const activeApp: AppEntry | null = isGrouped ? (item.apps![appTab] ?? null) : null

  return (
    <>
      <Header cats={data.categories} activeId={categoryId} crumb={item.name}/>
      {/* ── Banner ── */}
      <div style={{ position:'relative', width:'100%', height:'clamp(160px,22vw,260px)', overflow:'hidden', background:'var(--banner-area)' }}>
        {item.bannerUrl
          ? <img src={item.bannerUrl} alt={item.name} style={{ width:'100%', height:'100%', objectFit:'cover', objectPosition:'center center', display:'block' }}/>
          : (
            <div style={{ width:'100%', height:'100%', position:'relative' }}>
              <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse at center,rgba(255,45,107,.18) 0%,transparent 65%)' }}/>
              <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:8 }}>
                <span style={{ fontFamily:'var(--fd)', fontSize:'clamp(2rem,7vw,5.5rem)', letterSpacing:5, color:'#eef0f8', textAlign:'center', padding:'0 16px' }}>{item.name}</span>
              </div>
            </div>
          )
        }
        <div className="banner-fade"/>
      </div>

      {/* ── Content ── */}
      <div style={{ maxWidth:760, margin:'0 auto', padding:'0 16px 80px' }}>

        {/* ── Icon + title ── */}
        <div style={{ display:'flex', alignItems:'center', gap:14, padding:'18px 0 16px', flexWrap:'wrap' }}>
          {item.iconUrl && (
            <img src={item.iconUrl} alt="" style={{
              width:56, height:56, borderRadius:14, objectFit:'cover', flexShrink:0,
              background:'var(--bg2)', border:'1px solid var(--bd)',
            }}/>
          )}
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ display:'flex', alignItems:'center', gap:5, marginBottom:5 }}>
              <span style={{ color:'var(--pink)', fontWeight:700, fontSize:13, flexShrink:0, fontFamily:'monospace' }}>$ man</span>
              <h1 style={{ fontSize:16, fontWeight:700, color:'var(--text)', letterSpacing:-.2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', fontFamily:'monospace' }}>{item.name}</h1>
            </div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:4, alignItems:'center' }}>
              {item.tags.map(t => (
                <span key={t} style={{ fontSize:9, fontWeight:600, background:'var(--bluea)', color:'var(--blue)', padding:'2px 7px', borderRadius:4 }}>{t}</span>
              ))}
              {item.updatedAt && (
                <span style={{ fontSize:9, color:'var(--t3)', marginLeft:'auto', whiteSpace:'nowrap' }}>
                  ↻ {formatDate(item.updatedAt)}
                </span>
              )}
            </div>
          </div>
        </div>

        <div style={{ height:1, background:'var(--bd)', marginBottom:20 }}/>

        {/* ── SIMPLE MODE: description + platform links ── */}
        {!isGrouped && (
          <>
            {item.description && (
              <div className="md" style={{ fontSize:13, color:'var(--t2)', lineHeight:1.75, marginBottom:16 }}
                dangerouslySetInnerHTML={{ __html: md(item.description) }}/>
            )}
            <PlatformLinks platforms={item.platforms}/>
          </>
        )}

        {/* ── GROUPED MODE: family overview ── */}
        {isGrouped && item.apps && (
          <>
            {item.description && (
              <div className="md" style={{ fontSize:13, color:'var(--t2)', lineHeight:1.75, marginBottom:20 }}
                dangerouslySetInnerHTML={{ __html: md(item.description) }}/>
            )}
            <div style={{ fontSize:10, fontWeight:800, color:'var(--t3)', letterSpacing:1.5, textTransform:'uppercase', marginBottom:10 }}>
              # праграмы
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:6, marginBottom:24 }}>
              {item.apps.map(app => (
                <a key={app.id} href={`/${categoryId}/${item.id}/${app.id}`} style={{
                  display:'flex', alignItems:'center', gap:12,
                  padding:'12px 14px', borderRadius:12,
                  background:'var(--bg1)', border:'1px solid var(--bd)',
                  textDecoration:'none', transition:'border-color .15s',
                }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor='var(--pinkb)'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor='var(--bd)'}
                >
                  {app.iconUrl
                    ? <img src={app.iconUrl} alt="" style={{ width:40, height:40, borderRadius:10, objectFit:'cover', flexShrink:0 }}/>
                    : <div style={{ width:40, height:40, borderRadius:10, background:'var(--bg3)', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, color:'var(--t3)', fontFamily:'var(--fd)' }}>{app.name.slice(0,2).toUpperCase()}</div>
                  }
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:13, fontWeight:700, color:'var(--text)', marginBottom:2 }}>{app.name}</div>
                    {app.description && (
                      <div style={{ fontSize:11, color:'var(--t3)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                        {app.description.replace(/[#*[\]`]/g, '').slice(0, 100)}
                      </div>
                    )}
                    {app.platforms.length > 0 && (
                      <div style={{ display:'flex', gap:4, marginTop:5, flexWrap:'wrap' }}>
                        {Array.from(new Set(app.platforms.map(p => p.name))).map(n => (
                          <span key={n} style={{ fontSize:9, fontWeight:700, background:'var(--pinkc)', color:'var(--pink)', padding:'1px 6px', borderRadius:4 }}>{n}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <span style={{ fontSize:16, color:'var(--t3)', flexShrink:0 }}>›</span>
                </a>
              ))}
            </div>
          </>
        )}

        {/* ── Translation progress ── */}
        <TranslationProgress item={item} progress={progress}/>

        {/* ── Screenshot ── */}
        {item.screenshotUrl && !isGrouped && (
          <div style={{ marginBottom:20 }}>
            <div style={{ fontSize:10, fontWeight:600, color:'var(--t3)', marginBottom:8 }}># скрыншот</div>
            <img src={item.screenshotUrl} alt="Скрыншот"
              style={{ width:'100%', borderRadius:12, border:'1px solid var(--bd)', display:'block' }}/>
          </div>
        )}

        {/* Back + Copy */}
        <div style={{ display:'flex', gap:8, marginTop:24 }}>
          <a href={`/${categoryId}`} style={{
            display:'inline-flex', alignItems:'center', gap:6,
            fontSize:11, fontWeight:600, color:'var(--t3)',
            background:'var(--bg2)', border:'1px solid var(--bd)',
            padding:'7px 14px', borderRadius:8, textDecoration:'none', transition:'all .15s',
          }}
          onMouseEnter={e => { const el=e.currentTarget as HTMLElement; el.style.color='var(--text)'; el.style.borderColor='var(--bd2)' }}
          onMouseLeave={e => { const el=e.currentTarget as HTMLElement; el.style.color='var(--t3)'; el.style.borderColor='var(--bd)' }}
          >cd ../{categoryId}</a>
          <CopyLink/>
        </div>
      </div>

      <style>{`
        .md p{margin-bottom:10px}
        .md h2{font-size:14px;font-weight:700;color:var(--text);margin:18px 0 7px}
        .md h3{font-size:13px;font-weight:700;color:var(--text);margin:14px 0 5px}
        .md ul{padding:0;margin:5px 0 10px;list-style:none;display:flex;flex-direction:column;gap:4px}
        .md li{padding-left:14px;position:relative;font-size:13px}
        .md li::before{content:'—';position:absolute;left:0;color:var(--pink);font-weight:700}
        .md a{color:var(--pink);text-decoration:underline;text-underline-offset:2px}
        .md strong{color:var(--text);font-weight:700}
        .md code{background:var(--bg3);color:var(--purp);padding:1px 6px;border-radius:4px;font-size:11px}
      `}</style>
    </>
  )
}

const PLATFORM_LABEL: Record<string, string> = {
  crowdin: 'Crowdin', weblate: 'Weblate', github: 'GitHub',
}

function ProgressBar({ entries, label }: { entries: ItemProgressEntry[]; label?: string }) {
  const total = avgPct(entries)
  if (total === null) return null
  const color = pctColor(total)
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
      {/* Totals row */}
      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
        {label && (
          <span style={{ fontSize:10, color:'var(--t2)', flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
            {label}
          </span>
        )}
        <div style={{ ...(label ? { width:40, flexShrink:0 } : { flex:1 }), height: label ? 3 : 4, borderRadius:3, background:'var(--bg3)', overflow:'hidden' }}>
          <div style={{ width:`${total}%`, height:'100%', background:color, borderRadius:3, transition:'width .5s ease' }}/>
        </div>
        {label && <span style={{ fontSize:10, fontWeight:800, color, flexShrink:0, minWidth:32, textAlign:'right' }}>{total}%</span>}
      </div>
      {/* Per-component detail (only if multiple) */}
      {!label && entries.length > 1 && (
        <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
          {entries.map(e => (
            <div key={e.key} style={{ display:'flex', alignItems:'center', gap:8 }}>
              <span style={{ fontSize:9, fontWeight:700, color:'var(--t3)', background:'var(--bg3)', borderRadius:4, padding:'1px 6px', flexShrink:0, whiteSpace:'nowrap' }}>
                {PLATFORM_LABEL[e.platform] ?? e.platform}
              </span>
              <span style={{ fontSize:10, color:'var(--t2)', flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                {e.key}
              </span>
              <div style={{ width:40, height:3, borderRadius:2, background:'var(--bg3)', overflow:'hidden', flexShrink:0 }}>
                <div style={{ width:`${e.pct}%`, height:'100%', background:pctColor(e.pct), borderRadius:2 }}/>
              </div>
              <span style={{ fontSize:10, fontWeight:700, color:pctColor(e.pct), flexShrink:0, minWidth:32, textAlign:'right' }}>{e.pct}%</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function TranslationProgress({ item, progress }: { item: SiteData['categories'][0]['items'][0]; progress: ProgressData | null }) {
  if (!progress) return null

  const isGrouped = !!(item.apps && item.apps.length > 0)

  // For grouped items: show per-app breakdown
  if (isGrouped && item.apps) {
    const appRows = item.apps
      .map(app => ({ app, entries: getAppProgress(app, progress) }))
      .filter(r => r.entries.length > 0)
    if (!appRows.length) return null

    return (
      <div style={{ marginBottom:20, background:'var(--bg1)', border:'1px solid var(--bd)', borderRadius:12, padding:'14px 16px' }}>
        <div style={{ fontSize:10, fontWeight:800, color:'var(--t3)', letterSpacing:1.5, textTransform:'uppercase', marginBottom:12 }}>
          # прагрэс перакладу (be)
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {appRows.map(({ app, entries }) => (
            <ProgressBar key={app.id} entries={entries} label={app.name}/>
          ))}
        </div>
      </div>
    )
  }

  // For simple items: show component breakdown
  const entries = getItemProgress(item, progress)
  if (!entries.length) return null
  const pct = avgPct(entries)
  const color = pct !== null ? pctColor(pct) : 'var(--t3)'

  return (
    <div style={{ marginBottom:20, background:'var(--bg1)', border:'1px solid var(--bd)', borderRadius:12, padding:'14px 16px' }}>
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
        <span style={{ fontSize:10, fontWeight:800, color:'var(--t3)', letterSpacing:1.5, textTransform:'uppercase', flex:1 }}>
          # прагрэс перакладу (be)
        </span>
        {pct !== null && <span style={{ fontSize:13, fontWeight:800, color }}>{pct}%</span>}
      </div>
      <ProgressBar entries={entries}/>
    </div>
  )
}

function CopyLink() {
  const [copied, setCopied] = useState(false)
  const copy = useCallback(() => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }, [])
  return (
    <button onClick={copy} style={{
      display:'inline-flex', alignItems:'center', gap:6,
      fontSize:11, fontWeight:600, color: copied ? 'var(--green)' : 'var(--t3)',
      background:'var(--bg2)', border:`1px solid ${copied ? 'rgba(34,197,94,.3)' : 'var(--bd)'}`,
      padding:'7px 14px', borderRadius:8, cursor:'pointer', transition:'all .15s',
    }}>
      {copied ? '✓ скапіявана' : '⎘ спасылка'}
    </button>
  )
}

function Spinner() {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:6, height:'100vh' }}>
      {[0,.2,.4].map((d,i) => (
        <span key={i} style={{ width:6, height:6, borderRadius:'50%', background:'var(--pink)', animation:`sp 1.2s ${d}s ease-in-out infinite`, display:'block' }}/>
      ))}
      <style>{`@keyframes sp{0%,100%{opacity:.2;transform:scale(.8)}50%{opacity:1;transform:scale(1)}}`}</style>
    </div>
  )
}

function Msg({ children }: { children: React.ReactNode }) {
  return <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', color:'var(--t2)', fontSize:13 }}>{children}</div>
}
