'use client'
import { useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import type { SiteData, Platform, AppEntry } from '@/types'
import { getLinkStyle, formatDate } from '@/lib/platforms'
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
              cursor:'pointer', transition:'all .15s', whiteSpace:'nowrap',
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
                display:'flex', alignItems:'center', gap:12,
                padding:'11px 14px',
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

export default function AppPage({ initialData }: { initialData?: SiteData }) {
  const { categoryId, itemId, appId } = useParams() as { categoryId: string; itemId: string; appId: string }
  const data = (initialData ?? STATIC_DATA) as SiteData

  const cat  = data.categories.find(c => c.id === categoryId)
  const item = cat?.items.find(i => i.id === itemId)
  const app  = item?.apps?.find(a => a.id === appId)

  if (!cat || !item || !app) return <Msg>Не знойдзена</Msg>

  const siblings = (item.apps ?? []).filter(a => a.id !== appId)

  return (
    <>
      <Header cats={data.categories} activeId={categoryId} crumb={app.name}/>

      {/* Banner: app screenshot or item banner */}
      <div style={{ position:'relative', width:'100%', height:'clamp(150px,22vw,300px)', overflow:'hidden', background:'var(--bg2)' }}>
        {item.bannerUrl
          ? <img src={item.bannerUrl} alt={app.name} style={{ width:'100%', height:'100%', objectFit:'cover', objectPosition:'center', display:'block' }}/>
          : (
            <div style={{ width:'100%', height:'100%', position:'relative' }}>
              <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse at center,rgba(255,45,107,.18) 0%,transparent 65%)' }}/>
              <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
                <span style={{ fontFamily:'var(--fd)', fontSize:'clamp(2rem,7vw,5rem)', letterSpacing:5, color:'var(--text)' }}>{app.name}</span>
              </div>
            </div>
          )
        }
        <div style={{ position:'absolute', bottom:0, left:0, right:0, height:'50%', background:'linear-gradient(to bottom,transparent,var(--bg))', pointerEvents:'none' }}/>
      </div>

      <div style={{ maxWidth:760, margin:'0 auto', padding:'0 16px 80px' }}>

        {/* Icon + title + developer badge */}
        <div style={{ display:'flex', alignItems:'flex-end', gap:14, padding:'0 0 16px', flexWrap:'wrap' }}>
          {app.iconUrl && (
            <img src={app.iconUrl} alt="" style={{
              width:64, height:64, borderRadius:16, objectFit:'cover', flexShrink:0,
              background:'var(--bg2)', border:'2px solid var(--bg)',
              marginTop:-32, position:'relative', zIndex:2,
            }}/>
          )}
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ display:'flex', alignItems:'center', gap:5, marginBottom:6 }}>
              <span style={{ color:'var(--pink)', fontWeight:700, fontSize:14, flexShrink:0, fontFamily:'monospace' }}>$ man</span>
              <h1 style={{ fontSize:17, fontWeight:700, color:'var(--text)', letterSpacing:-.2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', fontFamily:'monospace' }}>{app.name}</h1>
            </div>
            {/* Developer badge */}
            <a href={`/${categoryId}/${item.id}`} style={{ display:'inline-flex', alignItems:'center', gap:5, textDecoration:'none' }}>
              {item.iconUrl && <img src={item.iconUrl} alt="" style={{ width:14, height:14, borderRadius:3, objectFit:'cover', flexShrink:0 }}/>}
              <span style={{ fontSize:10, fontWeight:600, color:'var(--t3)' }}>by</span>
              <span style={{ fontSize:10, fontWeight:700, color:'var(--pink)' }}>{item.name}</span>
            </a>
          </div>
        </div>

        <div style={{ height:1, background:'var(--bd)', marginBottom:20 }}/>

        {/* Description */}
        {app.description && (
          <div className="md" style={{ fontSize:13, color:'var(--t2)', lineHeight:1.75, marginBottom:20 }}
            dangerouslySetInnerHTML={{ __html: md(app.description) }}/>
        )}

        {/* Platform links */}
        {app.platforms.length > 0 && (
          <div style={{ marginBottom:24 }}>
            <PlatformLinks platforms={app.platforms}/>
          </div>
        )}

        {/* Screenshot */}
        {app.screenshotUrl && (
          <div style={{ marginBottom:24 }}>
            <div style={{ fontSize:10, fontWeight:600, color:'var(--t3)', marginBottom:8 }}># скрыншот</div>
            <img src={app.screenshotUrl} alt="Скрыншот" style={{ width:'100%', borderRadius:12, border:'1px solid var(--bd)', display:'block' }}/>
          </div>
        )}

        {/* Sibling apps */}
        {siblings.length > 0 && (
          <div style={{ marginBottom:24 }}>
            <div style={{ fontSize:10, fontWeight:800, color:'var(--t3)', letterSpacing:1.5, textTransform:'uppercase', marginBottom:10 }}>
              # іншыя праграмы ад {item.name}
            </div>
            <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
              {siblings.map(sib => (
                <a key={sib.id} href={`/${categoryId}/${item.id}/${sib.id}`} style={{
                  display:'flex', alignItems:'center', gap:7,
                  padding:'6px 10px 6px 6px', borderRadius:8,
                  background:'var(--bg1)', border:'1px solid var(--bd)',
                  textDecoration:'none', transition:'border-color .15s',
                }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor='var(--pinkb)'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor='var(--bd)'}
                >
                  {sib.iconUrl
                    ? <img src={sib.iconUrl} alt="" style={{ width:24, height:24, borderRadius:6, objectFit:'cover', flexShrink:0 }}/>
                    : <div style={{ width:24, height:24, borderRadius:6, background:'var(--bg3)', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:9, color:'var(--t3)', fontFamily:'var(--fd)' }}>{sib.name.slice(0,2).toUpperCase()}</div>
                  }
                  <span style={{ fontSize:11, fontWeight:600, color:'var(--text)', whiteSpace:'nowrap' }}>{sib.name}</span>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Back buttons */}
        <div style={{ display:'flex', gap:8, marginTop:8, flexWrap:'wrap' }}>
          <a href={`/${categoryId}/${item.id}`} style={{
            display:'inline-flex', alignItems:'center', gap:6,
            fontSize:11, fontWeight:600, color:'var(--t3)',
            background:'var(--bg2)', border:'1px solid var(--bd)',
            padding:'7px 14px', borderRadius:8, textDecoration:'none', transition:'all .15s',
          }}
          onMouseEnter={e => { const el=e.currentTarget as HTMLElement; el.style.color='var(--text)'; el.style.borderColor='var(--bd2)' }}
          onMouseLeave={e => { const el=e.currentTarget as HTMLElement; el.style.color='var(--t3)'; el.style.borderColor='var(--bd)' }}
          >← {item.name}</a>
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

function Msg({ children }: { children: React.ReactNode }) {
  return <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', color:'var(--t2)', fontSize:13 }}>{children}</div>
}
