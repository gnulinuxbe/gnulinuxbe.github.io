'use client'
import { useState, useRef, useEffect } from 'react'

export default function TagInput({ value, onChange, suggestions = [], placeholder = 'Дадаць тэг...' }: {
  value: string[]; onChange: (v: string[]) => void
  suggestions?: string[]; placeholder?: string
}) {
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const [cur, setCur] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropRef = useRef<HTMLDivElement>(null)

  const opts = suggestions.filter(s => s.toLowerCase().includes(q.toLowerCase()) && !value.includes(s))
  const add = (t: string) => { const v=t.trim(); if(v&&!value.includes(v)) onChange([...value,v]); setQ(''); setOpen(false) }
  const rem = (t: string) => onChange(value.filter(x=>x!==t))

  const onKey = (e: React.KeyboardEvent) => {
    if(e.key==='Enter'){e.preventDefault(); open&&opts[cur] ? add(opts[cur]) : q.trim()&&add(q)}
    if(e.key==='ArrowDown'){e.preventDefault();setCur(c=>Math.min(c+1,opts.length-1))}
    if(e.key==='ArrowUp'){e.preventDefault();setCur(c=>Math.max(c-1,0))}
    if(e.key==='Escape') setOpen(false)
    if(e.key==='Backspace'&&!q&&value.length) rem(value[value.length-1])
  }

  useEffect(()=>{
    const h=(e:MouseEvent)=>{
      if(!dropRef.current?.contains(e.target as Node)&&!inputRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown',h)
    return ()=>document.removeEventListener('mousedown',h)
  },[])
  useEffect(()=>setCur(0),[q])

  return (
    <div style={{position:'relative'}}>
      <div style={{display:'flex',flexWrap:'wrap',gap:5,background:'var(--bg3)',border:'1px solid var(--bd)',borderRadius:'var(--r)',padding:'6px 8px',minHeight:38,cursor:'text'}}
        onClick={()=>inputRef.current?.focus()}>
        {value.map(t=>(
          <span key={t} style={{display:'flex',alignItems:'center',gap:4,background:'var(--bluea)',color:'var(--blue)',fontSize:11,fontWeight:700,padding:'2px 8px',borderRadius:4,whiteSpace:'nowrap'}}>
            {t}
            <button type="button" onClick={e=>{e.stopPropagation();rem(t)}} style={{background:'none',border:'none',color:'inherit',cursor:'pointer',fontSize:14,opacity:.7,padding:0,lineHeight:1}}>×</button>
          </span>
        ))}
        <input ref={inputRef} value={q} placeholder={value.length?'':placeholder}
          onChange={e=>{setQ(e.target.value);setOpen(true)}}
          onFocus={()=>setOpen(true)} onKeyDown={onKey}
          style={{background:'none',border:'none',outline:'none',color:'var(--text)',fontSize:13,fontWeight:500,minWidth:120,flex:1,padding:0}}/>
      </div>
      {open&&opts.length>0&&(
        <div ref={dropRef} style={{position:'absolute',top:'calc(100% + 4px)',left:0,right:0,zIndex:200,background:'var(--bg2)',border:'1px solid var(--bd2)',borderRadius:'var(--r)',overflow:'hidden',boxShadow:'0 8px 24px rgba(0,0,0,.4)'}}>
          {opts.slice(0,10).map((o,i)=>(
            <div key={o} onMouseDown={e=>{e.preventDefault();add(o)}} onMouseEnter={()=>setCur(i)}
              style={{padding:'8px 12px',fontSize:13,fontWeight:500,color:i===cur?'var(--text)':'var(--t2)',background:i===cur?'var(--bg3)':'transparent',cursor:'pointer'}}>
              {o}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
