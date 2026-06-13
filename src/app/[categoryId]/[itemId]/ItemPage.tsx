'use client'
import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import type { SiteData, Platform, AppEntry } from '@/types'
import { loadData } from '@/lib/data'
import { getLinkStyle, formatDate } from '@/lib/platforms'
import Header from '@/components/Header'

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

export default function ItemPage() {
  const { categoryId, itemId } = useParams() as { categoryId: string; itemId: string }
  const [data, setData] = useState<SiteData | null>(null)
  const [appTab, setAppTab] = useState(0)

  useEffect(() => { loadData().then(setData) }, [])

  const cat  = data?.categories.find(c => c.id === categoryId)
  const item = cat?.items.find(i => i.id === itemId)

  if (!data) return <Spinner/>
  if (!item || !cat) return <Msg>Не знойдзена</Msg>

  const isGrouped = !!(item.apps && item.apps.length > 0)
  const activeApp: AppEntry | null = isGrouped ? (item.apps![appTab] ?? null) : null

  return (
    <>
      <Header cats={data.categories} activeId={categoryId} crumb={item.name}/>
      {/* ── Banner ── */}
      <div style={{ position:'relative', width:'100%', height:'clamp(150px,22vw,300px)', overflow:'hidden', background:'var(--bg2)' }}>
        {item.bannerUrl
          ? <img src={item.bannerUrl} alt={item.name} style={{ width:'100%', height:'100%', objectFit:'cover', objectPosition:'center center', display:'block' }}/>
          : (
            <div style={{ width:'100%', height:'100%', position:'relative' }}>
              <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse at center,rgba(255,45,107,.18) 0%,transparent 65%)' }}/>
              <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:8 }}>
                <span style={{ fontFamily:'var(--fd)', fontSize:'clamp(2rem,7vw,5.5rem)', letterSpacing:5, color:'var(--text)', textAlign:'center', padding:'0 16px' }}>{item.name}</span>
                {item.category && <span style={{ fontSize:10, fontWeight:700, letterSpacing:3, textTransform:'uppercase', color:'#fff', background:'var(--pink)', padding:'3px 12px', borderRadius:4 }}>{item.category.toUpperCase()}</span>}
              </div>
            </div>
          )
        }
        <div style={{ position:'absolute', bottom:0, left:0, right:0, height:'50%', background:'linear-gradient(to bottom,transparent,var(--bg))', pointerEvents:'none' }}/>
      </div>

      {/* ── Content ── */}
      <div style={{ maxWidth:760, margin:'0 auto', padding:'0 16px 80px' }}>

        {/* ── Icon + title + meta ── */}
        <div style={{ display:'flex', alignItems:'flex-end', gap:14, padding:'0 0 16px', flexWrap:'wrap' }}>
          {item.iconUrl && (
            <img src={item.iconUrl} alt="" style={{
              width:64, height:64, borderRadius:16, objectFit:'cover', flexShrink:0,
              background:'var(--bg2)', border:'2px solid var(--bg)',
              marginTop:-32, position:'relative', zIndex:2,
            }}/>
          )}
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ display:'flex', alignItems:'center', gap:5, marginBottom:5 }}>
              <span style={{ color:'var(--pink)', fontWeight:700, fontSize:14, flexShrink:0, fontFamily:'monospace' }}>$ man</span>
              <h1 style={{ fontSize:17, fontWeight:700, color:'var(--text)', letterSpacing:-.2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', fontFamily:'monospace' }}>{item.name}</h1>
            </div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:5, alignItems:'center' }}>
              {item.category && <span style={{ fontSize:10, color:'var(--t2)', fontWeight:500 }}>{item.category}</span>}
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

        {/* ── GROUPED MODE: app selector → description + platform links ── */}
        {isGrouped && item.apps && (
          <>
            {/* App tabs */}
            <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:20 }}>
              {item.apps.map((app, i) => (
                <button key={app.id} onClick={() => setAppTab(i)} style={{
                  display:'flex', alignItems:'center', gap:8,
                  padding:'8px 14px', borderRadius:10, cursor:'pointer', transition:'all .15s',
                  background: i===appTab ? 'var(--bg3)' : 'var(--bg2)',
                  border: `1px solid ${i===appTab ? 'var(--pinkb)' : 'var(--bd)'}`,
                }}>
                  {app.iconUrl && <img src={app.iconUrl} alt="" style={{ width:22, height:22, borderRadius:5, objectFit:'cover', flexShrink:0 }}/>}
                  <span style={{ fontSize:12, fontWeight:600, color: i===appTab ? 'var(--text)' : 'var(--t2)', whiteSpace:'nowrap' }}>
                    {app.name}
                  </span>
                </button>
              ))}
            </div>

            {/* Active app: ONE description + platform links */}
            {activeApp && (
              <div style={{ background:'var(--bg1)', border:'1px solid var(--bd)', borderRadius:14, overflow:'hidden', marginBottom:20 }}>
                {/* App header */}
                <div style={{ padding:'12px 16px', borderBottom:'1px solid var(--bd)', display:'flex', alignItems:'center', gap:10 }}>
                  {activeApp.iconUrl && (
                    <img src={activeApp.iconUrl} alt="" style={{ width:28, height:28, borderRadius:7, objectFit:'cover', flexShrink:0 }}/>
                  )}
                  <span style={{ fontSize:13, fontWeight:700, color:'var(--text)' }}>{activeApp.name}</span>
                </div>

                {/* Description — ONE for all platforms */}
                {activeApp.description && (
                  <div className="md" style={{ padding:'14px 16px', fontSize:13, color:'var(--t2)', lineHeight:1.75, borderBottom: activeApp.platforms.length ? '1px solid var(--bd)' : 'none' }}
                    dangerouslySetInnerHTML={{ __html: md(activeApp.description) }}/>
                )}

                {/* Platform tabs + links */}
                {activeApp.platforms.length > 0 && (
                  <div style={{ padding:'14px 16px' }}>
                    <PlatformLinks platforms={activeApp.platforms}/>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* ── Screenshot ── */}
        {item.screenshotUrl && (
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
