'use client'
import React, { useState, useEffect } from 'react'
import type { SiteData, Item, Category } from '@/types'
import { loadData } from '@/lib/data'
import { formatDate } from '@/lib/platforms'
import Header from '@/components/Header'

const RECENT_MS = 14 * 24 * 60 * 60 * 1000
const isRecent = (d: string) => !!d && Date.now() - new Date(d).getTime() < RECENT_MS
const catHasRecent = (cat: Category) =>
  cat.items.some(i => isRecent(i.updatedAt || '') || isRecent(i.createdAt || ''))

export default function Home() {
  const [data, setData] = useState<SiteData | null>(null)
  useEffect(() => { loadData().then(setData) }, [])
  if (!data) return <Spinner/>

  return (
    <>
      <Header cats={data.categories}/>
      <main>
        {/* Banner */}
        <div style={{position:'relative',width:'100%',height:'clamp(120px,16vw,220px)',overflow:'hidden',background:'var(--bg2)'}}>
          <img src="/banner.png" alt="" style={{width:'100%',height:'100%',objectFit:'cover',objectPosition:'center center',display:'block'}}/>
          <div style={{position:'absolute',bottom:0,left:0,right:0,height:'70%',background:'linear-gradient(to bottom,transparent,var(--bg))',pointerEvents:'none'}}/>
        </div>

        <div style={{maxWidth:1280,margin:'0 auto',padding:'0 16px 80px'}}>
          {/* Page header — terminal style */}
          <div style={{display:'flex',alignItems:'center',gap:12,padding:'16px 0 22px'}}>
            <img src="/ava-gnu.png" alt="" style={{width:44,height:44,borderRadius:10,objectFit:'contain',background:'var(--bg2)',padding:3,flexShrink:0,border:'1px solid var(--bd)'}}/>
            <div>
              <h1 style={{fontSize:16,fontWeight:700,color:'var(--text)',letterSpacing:-.3}}>
                Linux па-беларуску
              </h1>
              <p style={{fontSize:11,color:'var(--t3)',marginTop:2,fontWeight:400}}>
                # свабоднае праграмнае забеспячэнне на роднай мове
              </p>
            </div>
          </div>

          <Stats data={data}/>

          {/* ls -la style category list */}
          <div style={{
            background:'var(--bg1)',border:'1px solid var(--bd)',
            borderRadius:12,overflow:'hidden',marginBottom:24,
          }}>
            {/* Header row */}
            <div style={{
              display:'grid',gridTemplateColumns:'auto 1fr auto',
              padding:'6px 14px',
              borderBottom:'1px solid var(--bd)',
              fontSize:10,fontWeight:600,color:'var(--t3)',
              letterSpacing:.5,
            }}>
              <span>drwx</span>
              <span style={{paddingLeft:16}}>name</span>
              <span>size</span>
            </div>
            {data.categories.map((cat, i) => (
              <a key={cat.id} href={`/${cat.id}`} style={{
                display:'grid',gridTemplateColumns:'auto 1fr auto',
                padding:'10px 14px',
                borderBottom: i < data.categories.length-1 ? '1px solid var(--bd)' : 'none',
                textDecoration:'none',
                transition:'background .15s',
                alignItems:'center',
              }}
              onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background='var(--bg2)'}
              onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background='transparent'}
              >
                {/* permissions-style prefix */}
                <span style={{fontSize:11,color:'var(--green)',fontWeight:500,whiteSpace:'nowrap'}}>
                  drwxr-xr-x
                </span>
                {/* folder name */}
                <div style={{paddingLeft:16,display:'flex',alignItems:'center',gap:8,minWidth:0}}>
                  <span style={{color:'var(--pink)',fontWeight:700,fontSize:13,flexShrink:0}}>/</span>
                  <span style={{fontSize:13,fontWeight:600,color:'var(--blue)',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>
                    {cat.id}
                  </span>
                  {catHasRecent(cat) && <span style={{width:6,height:6,borderRadius:'50%',background:'var(--pink)',flexShrink:0,display:'inline-block'}}/>}
                  <span style={{fontSize:10,color:'var(--t3)',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',flex:1}}>
                    # {cat.name} — {cat.sub}
                  </span>
                </div>
                {/* file count */}
                <span style={{fontSize:11,color:'var(--t3)',whiteSpace:'nowrap',fontWeight:500}}>
                  {cat.items.length} items
                </span>
              </a>
            ))}
          </div>

          <RecentlyUpdated data={data}/>
        </div>
      </main>
    </>
  )
}

function plural(n: number, one: string, few: string, many: string) {
  const mod10 = n % 10, mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return `${n} ${one}`
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return `${n} ${few}`
  return `${n} ${many}`
}

function Stats({ data }: { data: SiteData }) {
  const allItems = data.categories.flatMap(c => c.items)
  const thisMonth = new Date().toISOString().slice(0, 7)
  const updatedThisMonth = allItems.filter(i =>
    (i.updatedAt || '').startsWith(thisMonth) || (i.createdAt || '').startsWith(thisMonth)
  ).length

  return (
    <div style={{
      fontSize:11, color:'var(--t3)', fontWeight:500,
      display:'flex', gap:16, flexWrap:'wrap',
      padding:'0 2px 16px', letterSpacing:.2,
    }}>
      <span><span style={{color:'var(--pink)'}}>$</span> <span style={{color:'var(--text)',fontWeight:700}}>{plural(allItems.length, 'праект', 'праекты', 'праектаў')}</span></span>
      <span>·</span>
      <span><span style={{color:'var(--text)',fontWeight:700}}>{plural(data.categories.length, 'катэгорыя', 'катэгорыі', 'катэгорый')}</span></span>
      <span>·</span>
      <span>у гэтым месяцы <span style={{color:updatedThisMonth>0?'var(--green)':'var(--t3)',fontWeight:700}}>+{updatedThisMonth}</span></span>
    </div>
  )
}

function RecentlyUpdated({ data }: { data: SiteData }) {
  const peraklady = data.categories.find(c => c.id === 'peraklady')
  if (!peraklady) return null

  const latestDate = (i: Item) => (i.updatedAt || '') > (i.createdAt || '') ? (i.updatedAt || '') : (i.createdAt || '')
  const items = [...peraklady.items]
    .filter(i => i.createdAt || i.updatedAt)
    .sort((a, b) => latestDate(b).localeCompare(latestDate(a)))
    .slice(0, 3)
  if (!items.length) return null

  return (
    <div style={{background:'var(--bg1)',border:'1px solid var(--bd)',borderRadius:10,overflow:'hidden',marginBottom:16}}>
      {items.map((item, idx) => {
        const isNew = !item.updatedAt || item.updatedAt === item.createdAt
        const chipColor = isNew ? 'var(--blue)' : 'var(--pink)'
        const chipBg    = isNew ? 'rgba(96,165,250,.12)' : 'var(--pinka)'
        const chipBd    = isNew ? 'rgba(96,165,250,.3)'  : 'var(--pinkb)'
        const chipLabel = isNew ? '✦ новае' : '↻ абноўлена'
        return (
          <a key={item.id} href={`/peraklady/${item.id}`} style={{
            display:'flex', alignItems:'center', gap:10,
            padding:'9px 12px',
            borderBottom: idx < items.length - 1 ? '1px solid var(--bd)' : 'none',
            textDecoration:'none', transition:'background .15s',
          }}
          onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background='var(--bg2)'}
          onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background='transparent'}
          >
            <span style={{fontSize:9,fontWeight:700,letterSpacing:.5,textTransform:'uppercase',color:chipColor,background:chipBg,border:`1px solid ${chipBd}`,padding:'2px 7px',borderRadius:4,whiteSpace:'nowrap',flexShrink:0}}>
              {chipLabel}
            </span>

            {item.iconUrl && (
              <div style={{width:22,height:22,borderRadius:5,overflow:'hidden',flexShrink:0,background:'var(--bg3)',border:'1px solid var(--bd)'}}>
                <img src={item.iconUrl} alt="" style={{width:'100%',height:'100%',objectFit:'cover',display:'block'}}/>
              </div>
            )}

            <span style={{fontSize:12,fontWeight:600,color:'var(--text)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{item.name}</span>

            <span style={{fontSize:10,color:'var(--t3)',whiteSpace:'nowrap',flexShrink:0,marginLeft:'auto'}}>
              {formatDate(latestDate(item))}
            </span>
          </a>
        )
      })}
    </div>
  )
}

function Spinner() {
  return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:6,height:'100vh'}}>
      {[0,.2,.4].map((d,i)=>(
        <span key={i} style={{width:6,height:6,borderRadius:'50%',background:'var(--pink)',animation:`sp 1.2s ${d}s ease-in-out infinite`,display:'block'}}/>
      ))}
      <style>{`@keyframes sp{0%,100%{opacity:.2;transform:scale(.8)}50%{opacity:1;transform:scale(1)}}`}</style>
    </div>
  )
}
