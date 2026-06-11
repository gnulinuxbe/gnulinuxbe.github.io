'use client'
import { PLATFORMS } from '@/lib/platforms'

interface Props {
  selected: string[]
  onChange: (names: string[]) => void
  single?: boolean   // true = radio (pick one), false = multi
}

export default function PlatformPicker({ selected, onChange, single = true }: Props) {
  const toggle = (name: string) => {
    if (single) {
      onChange(selected.includes(name) ? [] : [name])
    } else {
      onChange(selected.includes(name)
        ? selected.filter(n => n !== name)
        : [...selected, name])
    }
  }

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
      {PLATFORMS.map(p => {
        const on = selected.includes(p.name)
        return (
          <button key={p.name} type="button" onClick={() => toggle(p.name)} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '7px 13px', borderRadius: 9,
            border: `1px solid ${on ? p.color+'70' : 'var(--bd)'}`,
            background: on ? p.bg : 'var(--bg3)',
            color: on ? p.color : 'var(--t2)',
            fontSize: 12, fontWeight: 600, cursor: 'pointer',
            transition: 'all .15s',
          }}>
            <span style={{ fontSize: 14 }}>{p.icon}</span>
            {p.name}
            {on && <span style={{ fontSize: 10, color: p.color }}>✓</span>}
          </button>
        )
      })}
    </div>
  )
}
