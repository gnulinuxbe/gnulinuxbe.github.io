'use client'
import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import type { SiteData, Platform } from '@/types'
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

export default function ItemPage({ initialData }: { initialData?: SiteData }) {
  const { categoryId, itemId } = useParams() as { categoryId: string; itemId: string }
  const data = (initialData ?? STATIC_DATA) as SiteData
  const [progress, setProgress] = useState<ProgressData | null>(null)

  const cat  = data.categories.find(c => c.id === categoryId)
  const item = cat?.items.find(i => i.id === itemId)

  useEffect(() => { fetchProgress().then(setProgress) }, [])

  if (!item || !cat) return <Msg>Не знойдзена</Msg>

  const isGrouped = !!(item.apps && item.apps.length > 0)

  const simpleEntries: ItemProgressEntry[] = !isGrouped && progress ? getItemProgress(item, progress) : []
  const simplePct = simpleEntries.length ? avgPct(simpleEntries) : null
  const simpleColor = simplePct !== null ? pctColor(simplePct) : 'rgba(255,255,255,.3)'

  const appCount = item.apps?.length ?? 0
  const appCountLabel = appCount === 1 ? 'праграма' : appCount < 5 ? 'праграмы' : 'праграм'

  return (
    <>
      <Header cats={data.categories} activeId={categoryId} crumb={item.name}/>

      {/* ── HERO ── */}
      {isGrouped ? (
        /* Developer brand — centered */
        <div style={{ position:'relative', overflow:'hidden', textAlign:'center' }}>
          {item.iconUrl ? (
            <>
              <img src={item.iconUrl} alt="" style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', filter:'blur(60px) brightness(.22) saturate(3)', transform:'scale(1.5)', zIndex:0 }}/>
              <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,.45)', zIndex:1 }}/>
            </>
          ) : item.bannerUrl ? (
            <>
              <img src={item.bannerUrl} alt="" style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', filter:'blur(32px) brightness(.2) saturate(1.5)', transform:'scale(1.2)', zIndex:0 }}/>
              <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,.4)', zIndex:1 }}/>
            </>
          ) : (
            <div style={{ position:'absolute', inset:0, background:'linear-gradient(135deg,#0e0e16 0%,#1a1030 100%)', zIndex:0 }}/>
          )}
          <div style={{ position:'relative', zIndex:2, padding:'56px 20px 50px', display:'inline-flex', flexDirection:'column', alignItems:'center' }}>
            {item.iconUrl
              ? <img src={item.iconUrl} alt="" style={{ width:88, height:88, borderRadius:22, objectFit:'cover', marginBottom:16, boxShadow:'0 16px 48px rgba(0,0,0,.8)', border:'1.5px solid rgba(255,255,255,.12)' }}/>
              : <div style={{ width:88, height:88, borderRadius:22, background:'rgba(255,255,255,.07)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:26, fontWeight:800, color:'rgba(255,255,255,.4)', marginBottom:16, fontFamily:'var(--fd)' }}>{item.name.slice(0,2).toUpperCase()}</div>
            }
            <h1 style={{ fontSize:32, fontWeight:800, color:'#fff', margin:'0 0 7px', letterSpacing:-.5 }}>{item.name}</h1>
            <div style={{ fontSize:12, color:'rgba(255,255,255,.35)' }}>{appCount} {appCountLabel}</div>
            {item.tags.length > 0 && (
              <div style={{ display:'flex', gap:5, flexWrap:'wrap', justifyContent:'center', marginTop:12 }}>
                {item.tags.map(t => (
                  <span key={t} style={{ fontSize:10, fontWeight:600, color:'rgba(255,255,255,.35)', background:'rgba(255,255,255,.06)', border:'1px solid rgba(255,255,255,.1)', padding:'2px 8px', borderRadius:5 }}>{t}</span>
                ))}
              </div>
            )}
</div>
        </div>
      ) : (
        /* Single app — left-aligned with % */
        <div style={{ position:'relative', overflow:'hidden' }}>
          {item.iconUrl ? (
            <>
              <img src={item.iconUrl} alt="" style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', filter:'blur(60px) brightness(.22) saturate(3)', transform:'scale(1.5)', zIndex:0 }}/>
              <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,.42)', zIndex:1 }}/>
            </>
          ) : item.bannerUrl ? (
            <>
              <img src={item.bannerUrl} alt="" style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', filter:'blur(28px) brightness(.25) saturate(1.6)', transform:'scale(1.2)', zIndex:0 }}/>
              <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,.4)', zIndex:1 }}/>
            </>
          ) : (
            <div style={{ position:'absolute', inset:0, background:'linear-gradient(135deg,#0e0e16 0%,#1c1030 60%,#200820 100%)', zIndex:0 }}/>
          )}
          <div className="hero-row" style={{ position:'relative', zIndex:2, maxWidth:900, margin:'0 auto', padding:'52px 20px 44px', display:'flex', alignItems:'center', gap:24 }}>
            {item.iconUrl
              ? <img className="hero-icon" src={item.iconUrl} alt="" style={{ width:96, height:96, borderRadius:24, objectFit:'cover', flexShrink:0, boxShadow:'0 16px 48px rgba(0,0,0,.7)', border:'1.5px solid rgba(255,255,255,.1)' }}/>
              : <div className="hero-icon" style={{ width:96, height:96, borderRadius:24, background:'rgba(255,255,255,.07)', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:28, fontWeight:800, color:'rgba(255,255,255,.4)', fontFamily:'var(--fd)' }}>{item.name.slice(0,2).toUpperCase()}</div>
            }
            <div className="hero-info" style={{ flex:1, minWidth:0 }}>
              <h1 className="hero-title" style={{ fontSize:30, fontWeight:800, color:'#fff', margin:'0 0 8px', lineHeight:1.2, letterSpacing:-.5 }}>{item.name}</h1>
              <div style={{ display:'flex', flexWrap:'wrap', gap:5, alignItems:'center' }}>
                {item.org && (
                  <a href={`/${categoryId}?org=${encodeURIComponent(item.org.name)}`} style={{ display:'inline-flex', alignItems:'center', gap:4, fontSize:10, fontWeight:700, color:'rgba(255,255,255,.5)', background:'rgba(255,255,255,.07)', border:'1px solid rgba(255,255,255,.12)', padding:'2px 8px', borderRadius:5, textDecoration:'none' }}>
                    {item.org.iconUrl && <img src={item.org.iconUrl} alt="" style={{ width:12, height:12, borderRadius:2, objectFit:'cover' }}/>}
                    {item.org.name}
                  </a>
                )}
                {item.tags.map(t => (
                  <span key={t} style={{ fontSize:10, fontWeight:600, color:'rgba(255,255,255,.35)', background:'rgba(255,255,255,.06)', border:'1px solid rgba(255,255,255,.1)', padding:'2px 8px', borderRadius:5 }}>{t}</span>
                ))}
                {item.updatedAt && <span style={{ fontSize:9, color:'rgba(255,255,255,.25)' }}>↻ {formatDate(item.updatedAt)}</span>}
              </div>
            </div>
            <div style={{ textAlign:'center', flexShrink:0, padding:'0 4px' }}>
              {simplePct !== null ? (
                <>
                  <div className="hero-pct" style={{ fontSize:48, fontWeight:900, color:simpleColor, lineHeight:1, letterSpacing:-3, fontVariantNumeric:'tabular-nums' }}>{simplePct}<span className="hero-pct-sup" style={{ fontSize:24, letterSpacing:0 }}>%</span></div>
                  <div style={{ fontSize:8, fontWeight:800, color:'rgba(255,255,255,.25)', textTransform:'uppercase', letterSpacing:2, marginTop:6 }}>ПЕРАКЛАД BE</div>
                  <div style={{ width:64, height:3, background:'rgba(255,255,255,.08)', borderRadius:2, margin:'8px auto 0', overflow:'hidden' }}>
                    <div style={{ width:`${simplePct}%`, height:'100%', background:simpleColor }}/>
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
      )}

      {/* ── CONTENT ── */}
      <div style={{ maxWidth: isGrouped ? 1000 : 900, margin:'0 auto', padding:'32px 16px 80px' }}>

        {/* Description: grouped → before grid; simple → after 2-col */}
        {isGrouped && item.description && (
          <div className="md" style={{ fontSize:14, color:'var(--t2)', lineHeight:1.9, marginBottom:28 }}
            dangerouslySetInnerHTML={{ __html: md(item.description) }}/>
        )}

        {/* ── GROUPED: app cards grid ── */}
        {isGrouped && item.apps && (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(220px, 1fr))', gap:12, marginBottom:36 }}>
            {item.apps.map(app => {
              const appEntries = progress ? getAppProgress(app, progress) : []
              const appPct = appEntries.length ? avgPct(appEntries) : null
              const appColor = appPct !== null ? pctColor(appPct) : 'var(--t3)'
              const appPlats = Array.from(new Set(app.platforms.map(p => p.name)))
              return (
                <a key={app.id} href={`/${categoryId}/${item.id}/${app.id}`} style={{
                  display:'flex', flexDirection:'column', padding:'16px', borderRadius:16,
                  background:'var(--bg1)', border:'1px solid var(--bd)',
                  textDecoration:'none', transition:'border-color .15s, background .15s, box-shadow .15s',
                  boxShadow:'0 2px 8px rgba(0,0,0,.1)',
                }}
                onMouseEnter={e => { const el=e.currentTarget as HTMLElement; el.style.borderColor='var(--pinkb)'; el.style.background='var(--bg2)'; el.style.boxShadow='0 6px 24px rgba(0,0,0,.18)' }}
                onMouseLeave={e => { const el=e.currentTarget as HTMLElement; el.style.borderColor='var(--bd)'; el.style.background='var(--bg1)'; el.style.boxShadow='0 2px 8px rgba(0,0,0,.1)' }}
                >
                  {/* Top section grows to fill card height → progress always aligns at bottom */}
                  <div style={{ flex:1, display:'flex', alignItems:'flex-start', gap:14, marginBottom:14 }}>
                    {app.iconUrl
                      ? <img src={app.iconUrl} alt="" style={{ width:52, height:52, borderRadius:13, objectFit:'cover', flexShrink:0, border:'1px solid var(--bd)', boxShadow:'0 4px 12px rgba(0,0,0,.2)' }}/>
                      : <div style={{ width:52, height:52, borderRadius:13, background:'var(--bg3)', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:15, color:'var(--t3)', fontFamily:'var(--fd)' }}>{app.name.slice(0,2).toUpperCase()}</div>
                    }
                    <div style={{ flex:1, minWidth:0, paddingTop:2 }}>
                      <div style={{ fontSize:14, fontWeight:700, color:'var(--text)', marginBottom:6, lineHeight:1.3 }}>{app.name}</div>
                      <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
                        {appPlats.map(n => (
                          <span key={n} style={{ fontSize:9, fontWeight:700, background:'var(--pinkc)', color:'var(--pink)', padding:'2px 7px', borderRadius:4 }}>{n}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                  {/* Progress — always at bottom of card */}
                  {appPct !== null ? (
                    <div>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:6 }}>
                        <span style={{ fontSize:9, fontWeight:700, color:'var(--t3)', textTransform:'uppercase', letterSpacing:1 }}>Пераклад</span>
                        <span style={{ fontSize:15, fontWeight:800, color:appColor }}>{appPct}%</span>
                      </div>
                      <div style={{ height:4, borderRadius:2, background:`${appColor}18`, overflow:'hidden' }}>
                        <div style={{ width:`${appPct}%`, height:'100%', background:appColor, borderRadius:2, transition:'width .4s' }}/>
                      </div>
                    </div>
                  ) : (
                    <div style={{ fontSize:10, color:'var(--t3)' }}>Даных няма</div>
                  )}
                </a>
              )
            })}
          </div>
        )}

        {/* ── SIMPLE: 2-col (screenshot left + sidebar right) ── */}
        {!isGrouped && (
          <div style={{ marginBottom:28 }}>
            <div style={{ display:'flex', gap:24, alignItems:'flex-start', marginBottom:28, flexWrap:'wrap' }}>

              {/* Screenshot */}
              {item.screenshotUrl && (
                <div style={{ flex:1, minWidth:220 }}>
                  <img src={item.screenshotUrl} alt="" style={{ width:'100%', display:'block', borderRadius:14, border:'1px solid var(--bd)', boxShadow:'0 12px 40px rgba(0,0,0,.35)', maxHeight:500, objectFit:'contain', background:'var(--bg1)' }}/>
                </div>
              )}

              {/* Sidebar: links + components */}
              <div className="ap-sidebar" style={{ width: item.screenshotUrl ? 280 : '100%', flexShrink:0, display:'flex', flexDirection:'column', gap:16 }}>
                {item.platforms.length > 0 && (
                  <div>
                    <SLabel>Перакласці</SLabel>
                    <PlatformLinks platforms={item.platforms}/>
                  </div>
                )}
                {simpleEntries.length > 1 && simplePct !== null && (
                  <div>
                    <SLabel>Кампаненты</SLabel>
                    <div style={{ background:'var(--bg1)', border:'1px solid var(--bd)', borderRadius:12, padding:'10px 14px', display:'flex', flexDirection:'column', gap:8 }}>
                      {simpleEntries.map((e: ItemProgressEntry) => (
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

            {/* Description after 2-col */}
            {item.description && (
              <div className="md" style={{ fontSize:14, color:'var(--t2)', lineHeight:1.9, marginBottom:24 }}
                dangerouslySetInnerHTML={{ __html: md(item.description) }}/>
            )}
          </div>
        )}

        {/* Related org items (simple only) */}
        {!isGrouped && item.org && (() => {
          const related = cat.items.filter(i => i.id !== item.id && i.org?.name === item.org!.name)
          if (!related.length) return null
          return (
            <div style={{ marginBottom:24, borderTop:'1px solid var(--bd)', paddingTop:22 }}>
              <SLabel>Іншыя праграмы {item.org.name}</SLabel>
              <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                {related.map(rel => (
                  <a key={rel.id} href={`/${categoryId}/${rel.id}`} style={{
                    display:'flex', alignItems:'center', gap:8, padding:'8px 12px 8px 8px',
                    borderRadius:10, background:'var(--bg1)', border:'1px solid var(--bd)',
                    textDecoration:'none', transition:'border-color .15s',
                  }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor='var(--pinkb)'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor='var(--bd)'}
                  >
                    {rel.iconUrl
                      ? <img src={rel.iconUrl} alt="" style={{ width:28, height:28, borderRadius:7, objectFit:'cover' }}/>
                      : <div style={{ width:28, height:28, borderRadius:7, background:'var(--bg3)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, color:'var(--t3)' }}>{rel.name.slice(0,2).toUpperCase()}</div>
                    }
                    <span style={{ fontSize:12, fontWeight:600, color:'var(--text)' }}>{rel.name}</span>
                  </a>
                ))}
              </div>
            </div>
          )
        })()}

        {/* Nav */}
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
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
