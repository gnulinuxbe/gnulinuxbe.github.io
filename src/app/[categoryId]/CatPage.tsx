'use client'
import { useState, useEffect, useMemo, useRef } from 'react'
import { useParams } from 'next/navigation'
import type { SiteData, Item } from '@/types'
import { loadData } from '@/lib/data'
import { getLinkStyle } from '@/lib/platforms'
import Header from '@/components/Header'
import MatrixRain from '@/components/MatrixRain'

const ALL = 'Усе'

export default function CatPage({ initialData }: { initialData?: SiteData }) {
  const { categoryId } = useParams() as { categoryId: string }
  const [data, setData] = useState<SiteData | null>(initialData ?? null)
  const [search, setSearch] = useState('')
  const [fTag, setFTag] = useState(ALL)
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => { if (!initialData) loadData().then(setData) }, [initialData])

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

  const items = useMemo(() => {
    if (!cat) return []
    const q = search.toLowerCase()
    return cat.items
      .filter(item => {
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
  }, [cat, search, fTag])

  if (!data) return <Spinner/>
  if (!cat) return <Msg>Не знойдзена</Msg>

  return (
    <>
      <MatrixRain opacity={0.12}/>
      <Header cats={data.categories} activeId={categoryId}/>
      <main style={{position:'relative',zIndex:1}}>
        {/* Category banner — show image only, no text overlay */}
        <div style={{position:'relative',height:'clamp(110px,16vw,220px)',overflow:'hidden',background:'var(--bg2)'}}>
          {cat.bannerUrl
            ? <img src={cat.bannerUrl} alt="" style={{width:'100%',height:'100%',objectFit:'cover',display:'block'}}/>
            : <div style={{width:'100%',height:'100%',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:7,padding:'0 20px',textAlign:'center',position:'relative'}}>
                <div style={{position:'absolute',inset:0,background:'radial-gradient(ellipse at center,rgba(255,45,107,.1) 0%,transparent 65%)'}}/>
                <span style={{fontFamily:'var(--fd)',fontSize:'clamp(1.8rem,5vw,4.5rem)',letterSpacing:4,color:'var(--t2)',position:'relative'}}>{cat.name}</span>
                <span style={{fontSize:'clamp(7px,.8vw,10px)',fontWeight:800,letterSpacing:'2.5px',textTransform:'uppercase',color:'var(--t3)',background:'var(--bg3)',padding:'3px 12px',borderRadius:4,position:'relative',whiteSpace:'nowrap'}}>{cat.sub}</span>
              </div>
          }
        </div>

        <div style={{maxWidth:1280,margin:'0 auto',padding:'0 16px 80px'}}>
          {/* Head */}
          <div style={{display:'flex',alignItems:'center',gap:10,padding:'14px 0 16px',flexWrap:'wrap'}}>
            <div style={{display:'flex',alignItems:'center',gap:6,flex:1,minWidth:0}}>
              <span style={{color:'var(--pink)',fontWeight:700,fontSize:18,flexShrink:0}}>~/</span>
              <span style={{fontSize:'clamp(13px,3vw,18px)',fontWeight:700,color:'var(--text)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                {categoryId}
              </span>
            </div>
            {cat.contributeUrl && (
              <a href={cat.contributeUrl} target="_blank" rel="noreferrer" style={{
                background:'var(--pinka)',border:'1px solid var(--pinkb)',color:'var(--pink)',
                fontSize:11,fontWeight:700,padding:'6px 14px',borderRadius:'var(--r)',
                letterSpacing:.5,textTransform:'uppercase',whiteSpace:'nowrap',
              }}>+ Прапанаваць</a>
            )}
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

          <p style={{fontSize:10,fontWeight:600,color:'var(--t3)',marginBottom:11}}>{items.length} з {cat.items.length} праектаў</p>

          {/* App Store grid — auto-fill, works on any screen */}
          <div style={{display:'grid',gridTemplateColumns:`repeat(auto-fill,minmax(${APP_STORE_CATS.includes(categoryId)?'130px':'200px'},1fr))`,gap:10}}>
            {items.map(item => <ItemCard key={item.id} item={item} catId={categoryId}/>)}
            {items.length === 0 && (
              <p style={{gridColumn:'1/-1',padding:48,textAlign:'center',color:'var(--t3)',fontSize:14}}>Нічога не знойдзена</p>
            )}
          </div>
        </div>
      </main>
      <style>{`input:focus{border-color:var(--pinkb)!important}`}</style>
    </>
  )
}

const APP_STORE_CATS = ['peraklady']

function ItemCard({ item, catId }: { item: Item; catId: string }) {
  const firstLink = item.apps
    ? item.apps[0]?.platforms[0]?.links[0]
    : item.platforms[0]?.links?.[0]

  const platNames = item.apps
    ? Array.from(new Set(item.apps.flatMap(a => a.platforms.map(p => p.name))))
    : item.platforms.map(p => p.name)

  const hoverEnter = (e: React.MouseEvent) => { const el=e.currentTarget as HTMLElement; el.style.borderColor='var(--pinkb)'; el.style.transform='translateY(-2px)' }
  const hoverLeave = (e: React.MouseEvent) => { const el=e.currentTarget as HTMLElement; el.style.borderColor='var(--bd)'; el.style.transform='none' }

  const Chips = () => (
    <div style={{display:'flex',gap:3,justifyContent:'center',overflow:'hidden',height:16,flexShrink:0}}>
      {platNames.slice(0,2).map(n=>(
        <span key={n} style={{fontSize:8,fontWeight:700,background:'var(--pinkc)',color:'var(--pink)',padding:'1px 5px',borderRadius:3,whiteSpace:'nowrap',flexShrink:0}}>{n}</span>
      ))}
      {platNames.length > 2 && <span style={{fontSize:8,fontWeight:700,background:'var(--bg4)',color:'var(--t3)',padding:'1px 5px',borderRadius:3,whiteSpace:'nowrap',flexShrink:0}}>+{platNames.length-2}</span>}
    </div>
  )

  const Btn = () => {
    if (!firstLink) return null
    const ls = getLinkStyle(firstLink.type)
    return (
      <a href={firstLink.url} target="_blank" rel="noreferrer" style={{
        marginTop:'auto', display:'block', textAlign:'center', textDecoration:'none', width:'100%',
        background: ls.bg, color: ls.color, border:`1px solid ${ls.color}40`,
        fontSize:10, fontWeight:700, letterSpacing:.3, textTransform:'uppercase',
        padding:'6px 0', borderRadius:8,
      }}>{ls.label}</a>
    )
  }

  /* ── App Store style (peraklady) ── */
  if (APP_STORE_CATS.includes(catId)) return (
    <div style={{background:'var(--bg1)',border:'1px solid var(--bd)',borderRadius:14,overflow:'hidden',transition:'border-color .2s,transform .2s',display:'flex',flexDirection:'column'}}
      onMouseEnter={hoverEnter} onMouseLeave={hoverLeave}>
      <div style={{padding:'16px 12px 12px',flex:1,display:'flex',flexDirection:'column',alignItems:'center',textAlign:'center',gap:8}}>
        <a href={`/${catId}/${item.id}`} style={{textDecoration:'none',flexShrink:0}}>
          <div style={{width:64,height:64,borderRadius:16,overflow:'hidden',background:'var(--bg3)',border:'1px solid var(--bd)'}}>
            {item.iconUrl
              ? <img src={item.iconUrl} alt={item.name} style={{width:'100%',height:'100%',objectFit:'cover',display:'block'}}/>
              : <span style={{display:'flex',width:'100%',height:'100%',alignItems:'center',justifyContent:'center',fontFamily:'var(--fd)',fontSize:'1.4rem',color:'var(--t3)'}}>{item.name.slice(0,2).toUpperCase()}</span>
            }
          </div>
        </a>
        <div style={{minWidth:0,width:'100%'}}>
          <a href={`/${catId}/${item.id}`} style={{fontSize:12,fontWeight:700,color:'var(--text)',textDecoration:'none',display:'block',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{item.name}</a>
          {item.category && <span style={{fontSize:9,color:'var(--t3)',display:'block',marginTop:2,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{item.category}</span>}
        </div>
        <Chips/>
        <Btn/>
      </div>
    </div>
  )

  /* ── Banner style (slouniki, github-projects, …) ── */
  return (
    <div style={{background:'var(--bg1)',border:'1px solid var(--bd)',borderRadius:12,overflow:'hidden',transition:'border-color .2s,transform .2s',display:'flex',flexDirection:'column'}}
      onMouseEnter={hoverEnter} onMouseLeave={hoverLeave}>
      <a href={`/${catId}/${item.id}`} style={{display:'block',position:'relative',height:90,background:'var(--bg2)',overflow:'hidden',textDecoration:'none',flexShrink:0}}>
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
            <a href={`/${catId}/${item.id}`} style={{fontSize:11,fontWeight:600,color:'var(--text)',textDecoration:'none',display:'block',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{item.name}</a>
            {item.category && <span style={{fontSize:9,color:'var(--t3)',display:'block',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{item.category}</span>}
          </div>
        </div>
        <Chips/>
        <div style={{marginTop:8}}><Btn/></div>
      </div>
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

function Spinner() {
  return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:6,height:'100vh'}}>
      {[0,.2,.4].map((d,i)=><span key={i} style={{width:6,height:6,borderRadius:'50%',background:'var(--pink)',animation:`sp 1.2s ${d}s ease-in-out infinite`,display:'block'}}/>)}
      <style>{`@keyframes sp{0%,100%{opacity:.2;transform:scale(.8)}50%{opacity:1;transform:scale(1)}}`}</style>
    </div>
  )
}

function Msg({ children }: { children: React.ReactNode }) {
  return <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',color:'var(--t2)',fontSize:14}}>{children}</div>
}
