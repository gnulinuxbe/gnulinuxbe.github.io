'use client'
import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import type { SiteData, Platform } from '@/types'
import { getLinkStyle } from '@/lib/platforms'
import { fetchProgress, getAppProgress, avgPct, pctColor, type ProgressData, type ItemProgressEntry } from '@/lib/progress'
import Header from '@/components/Header'
import dataJson from '../../../../../public/data.json'

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

function PlatformLinks({ platforms }: { platforms: Platform[] }) {
  const [tab, setTab] = useState(0)
  if (!platforms.length) return null
  const plat = platforms[tab] ?? platforms[0]
  return (
    <div>
      {platforms.length > 1 && (
        <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:10 }}>
          {platforms.map((p, i) => (
            <button key={p.name} onClick={() => setTab(i)} style={{
              fontSize:11, fontWeight:600, padding:'5px 13px', borderRadius:7,
              border: `1px solid ${i===tab ? 'var(--bd2)' : 'var(--bd)'}`,
              background: i===tab ? 'var(--bg3)' : 'var(--bg2)',
              color: i===tab ? 'var(--text)' : 'var(--t2)',
              cursor:'pointer', transition:'all .15s', whiteSpace:'nowrap', flex:1,
            }}>{p.name}</button>
          ))}
        </div>
      )}
      {plat.links.length > 0 && (
        <div style={{ border:'1px solid var(--bd)', borderRadius:10, overflow:'hidden' }}>
          {plat.links.map((link, i) => {
            const ls = getLinkStyle(link.type)
            return (
              <a key={i} href={link.url} target="_blank" rel="noreferrer" style={{
                display:'flex', alignItems:'center', gap:12, padding:'11px 14px',
                borderBottom: i < plat.links.length-1 ? '1px solid var(--bd)' : 'none',
                textDecoration:'none', background:'transparent', transition:'background .15s',
              }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background='var(--bg2)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background='transparent'}
              >
                <div style={{ padding:'4px 11px', borderRadius:6, flexShrink:0, background:ls.bg, border:`1px solid ${ls.color}40`, fontSize:10, fontWeight:700, color:ls.color, whiteSpace:'nowrap' }}>{ls.label}</div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:12, fontWeight:600, color:'var(--text)', marginBottom:1 }}>{link.label}</div>
                  <div style={{ fontSize:10, color:'var(--t3)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{link.url.replace(/^https?:\/\//, '')}</div>
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

function SLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:14 }}>
      <div style={{ width:2, height:11, background:'var(--pink)', borderRadius:1, flexShrink:0 }}/>
      <div style={{ fontSize:10, fontWeight:800, color:'var(--t2)', letterSpacing:1.2, textTransform:'uppercase' }}>{children}</div>
    </div>
  )
}

function NavBtn({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} style={{ display:'inline-flex', alignItems:'center', gap:6, fontSize:11, fontWeight:600, color:'var(--t3)', background:'var(--bg2)', border:'1px solid var(--bd)', padding:'7px 14px', borderRadius:8, textDecoration:'none', transition:'all .15s' }}
      onMouseEnter={e => { const el=e.currentTarget as HTMLElement; el.style.color='var(--text)'; el.style.borderColor='var(--bd2)' }}
      onMouseLeave={e => { const el=e.currentTarget as HTMLElement; el.style.color='var(--t3)'; el.style.borderColor='var(--bd)' }}
    >{children}</a>
  )
}

export default function AppPage({ initialData }: { initialData?: SiteData }) {
  const { categoryId, itemId, appId } = useParams() as { categoryId: string; itemId: string; appId: string }
  const data = (initialData ?? STATIC_DATA) as SiteData

  const cat  = data.categories.find(c => c.id === categoryId)
  const item = cat?.items.find(i => i.id === itemId)
  const app  = item?.apps?.find(a => a.id === appId)

  const [progress, setProgress] = useState<ProgressData | null>(null)
  useEffect(() => { fetchProgress().then(setProgress) }, [])

  if (!cat || !item || !app) return <Msg>Не знойдзена</Msg>

  const siblings = (item.apps ?? []).filter(a => a.id !== appId)
  const entries = progress ? getAppProgress(app, progress) : []
  const pct = entries.length ? avgPct(entries) : null
  const color = pct !== null ? pctColor(pct) : 'rgba(255,255,255,.3)'
  const platNames = Array.from(new Set(app.platforms.map(p => p.name)))

  return (
    <>
      <Header cats={data.categories} activeId={categoryId} crumb={app.name}/>

      {/* ── HERO ── */}
      <div style={{ position:'relative', overflow:'hidden' }}>
        {app.iconUrl ? (
          <>
            <img src={app.iconUrl} alt="" style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', filter:'blur(60px) brightness(.22) saturate(3)', transform:'scale(1.5)', zIndex:0 }}/>
            <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,.42)', zIndex:1 }}/>
          </>
        ) : (
          <div style={{ position:'absolute', inset:0, background:'linear-gradient(135deg,#0e0e16 0%,#1c1030 60%,#200820 100%)', zIndex:0 }}/>
        )}

        <div className="hero-row" style={{ position:'relative', zIndex:2, maxWidth:900, margin:'0 auto', padding:'52px 20px 44px', display:'flex', alignItems:'center', gap:24 }}>
          {/* Icon */}
          {app.iconUrl
            ? <img className="hero-icon" src={app.iconUrl} alt="" style={{ width:96, height:96, borderRadius:24, objectFit:'cover', flexShrink:0, boxShadow:'0 16px 48px rgba(0,0,0,.7)', border:'1.5px solid rgba(255,255,255,.1)' }}/>
            : <div className="hero-icon" style={{ width:96, height:96, borderRadius:24, background:'rgba(255,255,255,.07)', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:28, fontWeight:800, color:'rgba(255,255,255,.4)', fontFamily:'var(--fd)' }}>{app.name.slice(0,2).toUpperCase()}</div>
          }

          {/* Info */}
          <div className="hero-info" style={{ flex:1, minWidth:0 }}>
            <h1 className="hero-title" style={{ fontSize:30, fontWeight:800, color:'#fff', margin:'0 0 7px', lineHeight:1.2, letterSpacing:-.5 }}>{app.name}</h1>
            <a href={`/${categoryId}/${item.id}`} style={{ display:'inline-flex', alignItems:'center', gap:6, textDecoration:'none', marginBottom:12 }}>
              {item.iconUrl && <img src={item.iconUrl} alt="" style={{ width:15, height:15, borderRadius:4, objectFit:'cover' }}/>}
              <span style={{ fontSize:12, color:'rgba(255,255,255,.4)' }}>ад</span>
              <span style={{ fontSize:12, fontWeight:700, color:'rgba(255,255,255,.8)', borderBottom:'1px solid rgba(255,255,255,.2)' }}>{item.name}</span>
            </a>
            {platNames.length > 0 && (
              <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
                {platNames.map(n => (
                  <span key={n} style={{ fontSize:10, fontWeight:600, color:'rgba(255,255,255,.4)', background:'rgba(255,255,255,.06)', border:'1px solid rgba(255,255,255,.1)', padding:'2px 9px', borderRadius:5 }}>{n}</span>
                ))}
              </div>
            )}
          </div>

          {/* Progress — always shown, "Даных няма" when no data */}
          <div style={{ textAlign:'center', flexShrink:0, padding:'0 4px' }}>
            {pct !== null ? (
              <>
                <div className="hero-pct" style={{ fontSize:48, fontWeight:900, color, lineHeight:1, letterSpacing:-3, fontVariantNumeric:'tabular-nums' }}>{pct}<span className="hero-pct-sup" style={{ fontSize:24, letterSpacing:0 }}>%</span></div>
                <div style={{ fontSize:8, fontWeight:800, color:'rgba(255,255,255,.25)', textTransform:'uppercase', letterSpacing:2, marginTop:6 }}>ПЕРАКЛАД BE</div>
                <div style={{ width:64, height:3, background:'rgba(255,255,255,.08)', borderRadius:2, margin:'8px auto 0', overflow:'hidden' }}>
                  <div style={{ width:`${pct}%`, height:'100%', background:color, borderRadius:2 }}/>
                </div>
              </>
            ) : (
              <div style={{ fontSize:11, fontWeight:600, color:'rgba(255,255,255,.25)', padding:'8px 14px', background:'rgba(255,255,255,.05)', border:'1px solid rgba(255,255,255,.08)', borderRadius:8, whiteSpace:'nowrap' }}>
                Даных няма
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div style={{ maxWidth:900, margin:'0 auto', padding:'36px 16px 80px' }}>

        {/* Main 2-col: screenshot (left) + action sidebar (right) */}
        <div style={{ display:'flex', gap:24, alignItems:'flex-start', marginBottom:28, flexWrap:'wrap' }}>

          {/* Screenshot */}
          {app.screenshotUrl && (
            <div style={{ flex:1, minWidth:220 }}>
              <img src={app.screenshotUrl} alt="" style={{ width:'100%', display:'block', borderRadius:14, border:'1px solid var(--bd)', boxShadow:'0 12px 40px rgba(0,0,0,.35)', maxHeight:500, objectFit:'contain', background:'var(--bg1)' }}/>
            </div>
          )}

          {/* Action sidebar */}
          <div className="ap-sidebar" style={{ width: app.screenshotUrl ? 280 : '100%', flexShrink:0, display:'flex', flexDirection:'column', gap:16 }}>

            {/* Platform links */}
            {app.platforms.length > 0 && (
              <div>
                <SLabel>Перакласці</SLabel>
                <PlatformLinks platforms={app.platforms}/>
              </div>
            )}

            {/* Multi-source progress detail */}
            {entries.length > 1 && pct !== null && (
              <div>
                <SLabel>Кампаненты</SLabel>
                <div style={{ background:'var(--bg1)', border:'1px solid var(--bd)', borderRadius:12, padding:'10px 14px', display:'flex', flexDirection:'column', gap:8 }}>
                  {entries.map((e: ItemProgressEntry) => (
                    <div key={e.key} style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <span style={{ fontSize:10, color:'var(--t3)', flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{e.key}</span>
                      <span style={{ fontSize:11, fontWeight:700, color:pctColor(e.pct), flexShrink:0 }}>{Math.round(e.pct)}%</span>
                      <div style={{ width:40, height:3, borderRadius:2, background:`${pctColor(e.pct)}20`, overflow:'hidden', flexShrink:0 }}>
                        <div style={{ width:`${e.pct}%`, height:'100%', background:pctColor(e.pct) }}/>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Description — full width below */}
        {app.description && (
          <div className="md" style={{ fontSize:14, color:'var(--t2)', lineHeight:1.9, marginBottom:24 }}
            dangerouslySetInnerHTML={{ __html: md(app.description) }}/>
        )}

        {/* Shared note */}
        {item.note && (
          <div className="md" style={{ fontSize:13, color:'var(--t2)', lineHeight:1.75, marginBottom:24, background:'var(--bg1)', border:'1px solid var(--bd)', borderLeft:'3px solid var(--pink)', borderRadius:'0 10px 10px 0', padding:'12px 16px' }}
            dangerouslySetInnerHTML={{ __html: md(item.note) }}/>
        )}

        {/* Siblings with developer card header */}
        {siblings.length > 0 && (
          <div style={{ marginBottom:28, borderTop:'1px solid var(--bd)', paddingTop:22, marginTop:8 }}>
            <a href={`/${categoryId}/${item.id}`} style={{
              display:'flex', alignItems:'center', gap:12, padding:'12px 14px', marginBottom:14,
              background:'var(--bg1)', border:'1px solid var(--bd)', borderRadius:12,
              textDecoration:'none', transition:'border-color .15s',
            }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor='var(--pinkb)'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor='var(--bd)'}
            >
              {item.iconUrl
                ? <img src={item.iconUrl} alt="" style={{ width:38, height:38, borderRadius:10, objectFit:'cover', flexShrink:0 }}/>
                : <div style={{ width:38, height:38, borderRadius:10, background:'var(--bg3)', flexShrink:0 }}/>
              }
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:9, fontWeight:700, color:'var(--t3)', textTransform:'uppercase', letterSpacing:1, marginBottom:2 }}>Іншыя праграмы распрацоўшчыка</div>
                <div style={{ fontSize:13, fontWeight:700, color:'var(--text)' }}>{item.name}</div>
              </div>
              <span style={{ fontSize:18, color:'var(--t3)', flexShrink:0 }}>›</span>
            </a>
            <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
              {siblings.map(sib => {
                const sibPct = progress ? avgPct(getAppProgress(sib, progress)) : null
                return (
                  <a key={sib.id} href={`/${categoryId}/${item.id}/${sib.id}`} style={{
                    display:'flex', alignItems:'center', gap:9, padding:'8px 12px 8px 8px',
                    borderRadius:10, background:'var(--bg1)', border:'1px solid var(--bd)',
                    textDecoration:'none', transition:'border-color .15s',
                  }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor='var(--pinkb)'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor='var(--bd)'}
                  >
                    {sib.iconUrl
                      ? <img src={sib.iconUrl} alt="" style={{ width:28, height:28, borderRadius:7, objectFit:'cover', flexShrink:0 }}/>
                      : <div style={{ width:28, height:28, borderRadius:7, background:'var(--bg3)', flexShrink:0 }}/>
                    }
                    <span style={{ fontSize:12, fontWeight:600, color:'var(--text)' }}>{sib.name}</span>
                    {sibPct !== null && (
                      <span style={{ fontSize:11, fontWeight:700, color:pctColor(sibPct) }}>{sibPct}%</span>
                    )}
                  </a>
                )
              })}
            </div>
          </div>
        )}

        {/* Nav */}
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          <NavBtn href={`/${categoryId}/${item.id}`}>← {item.name}</NavBtn>
          <NavBtn href={`/${categoryId}`}>cd ../{categoryId}</NavBtn>
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
        @media(max-width:640px){.ap-sidebar{width:100%!important}}
        @media(max-width:520px){
          .hero-row{padding:28px 16px 24px!important;gap:12px!important}
          .hero-icon{width:68px!important;height:68px!important;border-radius:17px!important;flex-shrink:0}
          .hero-title{font-size:20px!important}
          .hero-pct{font-size:32px!important;letter-spacing:-2px!important}
          .hero-pct-sup{font-size:16px!important}
        }
      `}</style>
    </>
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
    <button onClick={copy} style={{ display:'inline-flex', alignItems:'center', gap:6, fontSize:11, fontWeight:600, color: copied ? 'var(--green)' : 'var(--t3)', background:'var(--bg2)', border:`1px solid ${copied ? 'rgba(34,197,94,.3)' : 'var(--bd)'}`, padding:'7px 14px', borderRadius:8, cursor:'pointer', transition:'all .15s' }}>
      {copied ? '✓ скапіявана' : '⎘ спасылка'}
    </button>
  )
}

function Msg({ children }: { children: React.ReactNode }) {
  return <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', color:'var(--t2)', fontSize:13 }}>{children}</div>
}
