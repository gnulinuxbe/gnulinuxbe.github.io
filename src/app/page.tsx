'use client'
import { useState, useEffect } from 'react'
import type { SiteData } from '@/types'
import { loadData } from '@/lib/data'
import Header from '@/components/Header'

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

          {/* Visual gallery below ls listing */}
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:10}}>
            {data.categories.map(cat => (
              <a key={cat.id} href={`/${cat.id}`} style={{
                display:'block',textDecoration:'none',
                background:'var(--bg1)',border:'1px solid var(--bd)',
                borderRadius:12,overflow:'hidden',
                transition:'border-color .2s,transform .2s',
              }}
              onMouseEnter={e=>{const el=e.currentTarget as HTMLElement;el.style.borderColor='var(--pinkb)';el.style.transform='translateY(-2px)'}}
              onMouseLeave={e=>{const el=e.currentTarget as HTMLElement;el.style.borderColor='var(--bd)';el.style.transform='none'}}
              >
                <div style={{position:'relative',height:110,overflow:'hidden',background:'var(--bg2)'}}>
                  {cat.bannerUrl
                    ? <img src={cat.bannerUrl} alt="" style={{position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'cover',display:'block'}}/>
                    : <div style={{position:'absolute',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:5,padding:'0 12px',textAlign:'center'}}>
                        <div style={{position:'absolute',inset:0,background:'linear-gradient(135deg,rgba(255,45,107,.07) 0%,transparent 60%)'}}/>
                        <span style={{fontFamily:'var(--fd)',fontSize:'clamp(1.1rem,3vw,1.6rem)',letterSpacing:3,color:'var(--t2)',position:'relative'}}>{cat.name}</span>
                        <span style={{fontSize:7,fontWeight:700,letterSpacing:2,textTransform:'uppercase',color:'var(--t3)',background:'var(--bg3)',padding:'2px 8px',borderRadius:3,position:'relative',whiteSpace:'nowrap'}}>{cat.sub}</span>
                      </div>
                  }
                </div>
                <div style={{padding:'8px 12px',display:'flex',alignItems:'center',gap:6,borderTop:'1px solid var(--bd)'}}>
                  <span style={{fontSize:10,color:'var(--pink)',fontWeight:700,flexShrink:0}}>~/</span>
                  <span style={{fontSize:11,fontWeight:600,color:'var(--t2)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{cat.id}</span>
                  <span style={{fontSize:10,color:'var(--t3)',marginLeft:'auto',flexShrink:0}}>{cat.items.length}</span>
                </div>
              </a>
            ))}
          </div>
        </div>
      </main>
    </>
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
