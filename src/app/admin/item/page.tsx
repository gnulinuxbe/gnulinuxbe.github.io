'use client'
import { Suspense, useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { loadData, saveData, uploadFile, uid, allTags } from '@/lib/data'
import { PLATFORMS, LINK_TYPES } from '@/lib/platforms'
import TagInput from '@/components/TagInput'
import type { SiteData, Item, Platform, Link as AppLink, AppEntry } from '@/types'

const today = () => new Date().toISOString().slice(0, 10)

const emptyItem = (catId: string): Item => ({
  id: '', name: '', bannerUrl: '', iconUrl: '', screenshotUrl: '',
  category: catId, tags: [], createdAt: today(), updatedAt: today(),
  description: '', platforms: [],
})

const emptyApp = (): AppEntry => ({
  id: uid(), name: '', iconUrl: '', screenshotUrl: '', description: '', platforms: [],
})

// ── Platform editor ──────────────────────────────────────────────────────────
function PlatformsEditor({ value, onChange }: { value: Platform[]; onChange: (p: Platform[]) => void }) {
  const activeNames = value.map(p => p.name)
  const inactive = PLATFORMS.filter(p => !activeNames.includes(p.name))

  const addPlat = (name: string) => onChange([...value, { name, links: [] }])
  const remPlat = (name: string) => onChange(value.filter(p => p.name !== name))

  const setLinks = (name: string, links: AppLink[]) =>
    onChange(value.map(p => p.name === name ? { ...p, links } : p))

  const addLink = (name: string) => {
    const plat = value.find(p => p.name === name)
    if (!plat) return
    setLinks(name, [...plat.links, { label: '', url: '', type: 'website' }])
  }
  const remLink = (name: string, i: number) => {
    const plat = value.find(p => p.name === name)
    if (!plat) return
    setLinks(name, plat.links.filter((_, idx) => idx !== i))
  }
  const setLink = (name: string, i: number, field: keyof AppLink, val: string) => {
    const plat = value.find(p => p.name === name)
    if (!plat) return
    setLinks(name, plat.links.map((l, idx) => idx === i ? { ...l, [field]: val } : l))
  }

  return (
    <div>
      {inactive.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
          {inactive.map(p => (
            <button key={p.name} type="button" onClick={() => addPlat(p.name)} style={{
              background: p.bg, color: p.color, border: `1px solid ${p.color}50`,
              borderRadius: 8, padding: '5px 11px', fontSize: 12, fontWeight: 600, cursor: 'pointer',
            }}>
              {p.icon} {p.name} +
            </button>
          ))}
        </div>
      )}

      {value.map(plat => {
        const meta = PLATFORMS.find(p => p.name === plat.name)
        return (
          <div key={plat.name} style={{
            background: 'var(--bg2)', border: '1px solid var(--bd)',
            borderRadius: 10, padding: '14px 16px', marginBottom: 10,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: meta?.color ?? 'var(--text)' }}>
                {meta?.icon} {plat.name}
              </div>
              <button type="button" onClick={() => remPlat(plat.name)} style={{
                background: 'none', border: 'none', color: 'var(--pink)',
                cursor: 'pointer', fontSize: 13, fontWeight: 700,
              }}>
                Выдаліць
              </button>
            </div>

            {plat.links.map((link, li) => (
              <div key={li} style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 150px 32px', gap: 6, marginBottom: 6 }}>
                <input placeholder="Назва" value={link.label}
                  onChange={e => setLink(plat.name, li, 'label', e.target.value)} style={inp} />
                <input placeholder="URL" value={link.url}
                  onChange={e => setLink(plat.name, li, 'url', e.target.value)} style={inp} />
                <select value={link.type}
                  onChange={e => setLink(plat.name, li, 'type', e.target.value as AppLink['type'])} style={inp}>
                  {LINK_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
                <button type="button" onClick={() => remLink(plat.name, li)} style={{
                  background: 'var(--bg3)', border: '1px solid var(--bd)',
                  borderRadius: 6, color: 'var(--pink)', cursor: 'pointer', fontSize: 16, fontWeight: 700,
                }}>✕</button>
              </div>
            ))}

            <button type="button" onClick={() => addLink(plat.name)} style={{
              fontSize: 12, fontWeight: 700, color: 'var(--blue)', background: 'var(--bluea)',
              border: '1px solid rgba(96,165,250,.3)', borderRadius: 7,
              padding: '5px 12px', cursor: 'pointer', marginTop: 4,
            }}>
              + Спасылка
            </button>
          </div>
        )
      })}
    </div>
  )
}

// ── Image upload field ───────────────────────────────────────────────────────
function ImageField({ label, value, onChange, slug }: {
  label: string; value: string; onChange: (v: string) => void; slug: string
}) {
  const [loading, setLoading] = useState(false)
  const upload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    setLoading(true)
    try { onChange(await uploadFile(f, slug)) } finally { setLoading(false) }
  }
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={labelSt}>{label}</label>
      <div style={{ display: 'flex', gap: 8 }}>
        <input style={{ ...inp, flex: 1 }} value={value}
          onChange={e => onChange(e.target.value)} placeholder="https://..." />
        <label style={{ ...btnSt('var(--bg3)', 'var(--t2)'), cursor: 'pointer', padding: '8px 13px' }}>
          {loading ? '…' : '📁'}
          <input type="file" accept="image/*" style={{ display: 'none' }} onChange={upload} />
        </label>
      </div>
      {value && (
        <img src={value} alt="" style={{ marginTop: 6, height: 60, borderRadius: 7, objectFit: 'cover', border: '1px solid var(--bd)' }} />
      )}
    </div>
  )
}

// ── Single app editor ────────────────────────────────────────────────────────
function AppEditor({ app, onChange, onDelete }: {
  app: AppEntry; onChange: (a: AppEntry) => void; onDelete: () => void
}) {
  const [open, setOpen] = useState(true)
  const set = <K extends keyof AppEntry>(k: K, v: AppEntry[K]) => onChange({ ...app, [k]: v })

  return (
    <div style={{ background: 'var(--bg2)', border: '1px solid var(--bd)', borderRadius: 10, marginBottom: 10, overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', cursor: 'pointer' }}
        onClick={() => setOpen(o => !o)}>
        {app.iconUrl && (
          <img src={app.iconUrl} alt="" style={{ width: 28, height: 28, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }} />
        )}
        <div style={{ flex: 1, fontWeight: 600, fontSize: 14 }}>{app.name || '(без назвы)'}</div>
        <button type="button" onClick={e => { e.stopPropagation(); onDelete() }}
          style={{ background: 'none', border: 'none', color: 'var(--pink)', cursor: 'pointer', fontSize: 18, lineHeight: 1 }}>
          ✕
        </button>
        <span style={{ color: 'var(--t3)', fontSize: 12 }}>{open ? '▲' : '▼'}</span>
      </div>

      {open && (
        <div style={{ padding: '4px 14px 14px', borderTop: '1px solid var(--bd)' }}>
          <div style={{ marginBottom: 12, marginTop: 12 }}>
            <label style={labelSt}>ID</label>
            <input style={inp} value={app.id} onChange={e => set('id', e.target.value)} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={labelSt}>Назва</label>
            <input style={inp} value={app.name} onChange={e => set('name', e.target.value)} />
          </div>
          <ImageField label="Іконка" value={app.iconUrl} onChange={v => set('iconUrl', v)} slug={`app-${app.id}-icon`} />
          <ImageField label="Скрыншот" value={app.screenshotUrl ?? ''} onChange={v => set('screenshotUrl', v)} slug={`app-${app.id}-shot`} />
          <div style={{ marginBottom: 12 }}>
            <label style={labelSt}>Апісанне</label>
            <textarea style={{ ...inp, height: 80, resize: 'vertical' }} value={app.description}
              onChange={e => set('description', e.target.value)} />
          </div>
          <div>
            <label style={labelSt}>Платформы</label>
            <PlatformsEditor value={app.platforms} onChange={v => set('platforms', v)} />
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main item form ───────────────────────────────────────────────────────────
function ItemForm() {
  const params = useSearchParams()
  const catId = params.get('cat') ?? ''
  const itemId = params.get('id') ?? 'new'
  const isNew = itemId === 'new'
  const router = useRouter()

  const [siteData, setSiteData] = useState<SiteData | null>(null)
  const [form, setForm] = useState<Item>(emptyItem(catId))
  const [tagSuggestions, setTagSuggestions] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [grouped, setGrouped] = useState(false)

  useEffect(() => {
    loadData().then(d => {
      setSiteData(d)
      setTagSuggestions(allTags(d))
      if (!isNew) {
        const item = d.categories.find(c => c.id === catId)?.items.find(i => i.id === itemId)
        if (item) {
          setForm({ ...item })
          setGrouped(!!item.apps?.length)
        }
      }
    })
  }, [catId, itemId, isNew])

  const set = <K extends keyof Item>(k: K, v: Item[K]) => setForm(f => ({ ...f, [k]: v }))

  const save = async () => {
    if (!siteData) return
    setSaving(true)
    try {
      const finalItem: Item = {
        ...form,
        id: form.id.trim() || uid(),
        updatedAt: today(),
        apps: grouped ? (form.apps ?? []) : undefined,
      }
      const next: SiteData = {
        ...siteData,
        categories: siteData.categories.map(c => {
          if (c.id !== catId) return c
          return {
            ...c,
            items: isNew
              ? [...c.items, finalItem]
              : c.items.map(i => i.id === itemId ? finalItem : i),
          }
        }),
      }
      await saveData(next)
      router.push('/admin')
    } finally {
      setSaving(false)
    }
  }

  const catName = siteData?.categories.find(c => c.id === catId)?.name ?? catId

  const toggleGrouped = () => {
    if (!grouped && !form.apps) set('apps', [])
    setGrouped(g => !g)
  }

  if (!siteData) return <Loader />

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '32px 16px', fontFamily: 'var(--fb)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28 }}>
        <button onClick={() => router.push('/admin')} style={btnSt('var(--bg3)', 'var(--t2)')}>← Назад</button>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800 }}>{isNew ? 'Новы элемент' : `Рэдагаваць: ${form.name}`}</div>
          <div style={{ fontSize: 12, color: 'var(--t2)', marginTop: 2 }}>Катэгорыя: {catName}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Left */}
        <div>
          <section style={cardSt}>
            <div style={secTitle}>Асноўнае</div>
            <div style={{ marginBottom: 14 }}>
              <label style={labelSt}>ID (slug)</label>
              <input style={inp} value={form.id} onChange={e => set('id', e.target.value)} placeholder="mastodon" />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={labelSt}>Назва</label>
              <input style={inp} value={form.name} onChange={e => set('name', e.target.value)} placeholder="Mastodon" />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={labelSt}>Апісанне</label>
              <textarea style={{ ...inp, height: 100, resize: 'vertical' }} value={form.description}
                onChange={e => set('description', e.target.value)} placeholder="Апісанне праекту..." />
            </div>
            {grouped && (
              <div style={{ marginBottom: 14 }}>
                <label style={labelSt}>Агульная нататка для ўсіх праграм</label>
                <textarea style={{ ...inp, height: 80, resize: 'vertical' }}
                  value={form.note ?? ''}
                  onChange={e => set('note', e.target.value || undefined)}
                  placeholder="Тэкст з'явіцца на старонцы кожнай праграмы гэтага праекта. Падтрымліваецца **markdown**." />
                <div style={{ fontSize: 10, color: 'var(--t3)', marginTop: 4 }}>
                  Паказваецца на ўсіх дачарніх старонках (Mail, Calendar, Drive...) як выдзеленая нататка
                </div>
              </div>
            )}
            <div>
              <label style={labelSt}>Тэгі</label>
              <TagInput value={form.tags} onChange={v => set('tags', v)} suggestions={tagSuggestions} />
            </div>
          </section>

          <section style={{ ...cardSt, marginTop: 16 }}>
            <div style={secTitle}>Выявы</div>
            <ImageField label="Іконка" value={form.iconUrl}
              onChange={v => set('iconUrl', v)} slug={`${form.id || 'item'}-icon`} />
            <ImageField label="Банер" value={form.bannerUrl}
              onChange={v => set('bannerUrl', v)} slug={`${form.id || 'item'}-banner`} />
            <ImageField label="Скрыншот" value={form.screenshotUrl}
              onChange={v => set('screenshotUrl', v)} slug={`${form.id || 'item'}-shot`} />
          </section>
        </div>

        {/* Right */}
        <div>
          <section style={cardSt}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={secTitle}>{grouped ? 'Праграмы (grouped)' : 'Платформы'}</div>
              <button type="button" onClick={toggleGrouped} style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: grouped ? 'var(--pinka)' : 'var(--bg3)',
                border: `1px solid ${grouped ? 'var(--pink)' : 'var(--bd)'}`,
                borderRadius: 8, padding: '5px 12px',
                fontSize: 12, fontWeight: 700,
                color: grouped ? 'var(--pink)' : 'var(--t2)', cursor: 'pointer',
              }}>
                {grouped ? '✓ Grouped' : 'Grouped'}
              </button>
            </div>

            {!grouped ? (
              <PlatformsEditor value={form.platforms} onChange={v => set('platforms', v)} />
            ) : (
              <div>
                {(form.apps ?? []).map((app, i) => (
                  <AppEditor key={app.id} app={app}
                    onChange={a => set('apps', (form.apps ?? []).map((x, xi) => xi === i ? a : x))}
                    onDelete={() => set('apps', (form.apps ?? []).filter((_, xi) => xi !== i))} />
                ))}
                <button type="button"
                  onClick={() => set('apps', [...(form.apps ?? []), emptyApp()])}
                  style={{ ...btnSt('var(--greena)', 'var(--green)'), width: '100%', justifyContent: 'center', marginTop: 6 }}>
                  + Дадаць праграму
                </button>
              </div>
            )}
          </section>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
        <button onClick={save} disabled={saving}
          style={btnSt(saving ? 'var(--bg3)' : 'var(--pink)', saving ? 'var(--t2)' : 'white')}>
          {saving ? 'Захоўваем...' : '💾 Захаваць'}
        </button>
        <button onClick={() => router.push('/admin')} style={btnSt('var(--bg3)', 'var(--t2)')}>Адмена</button>
      </div>
    </div>
  )
}

function Loader() {
  return <div style={{ padding: 40, color: 'var(--t2)', fontFamily: 'var(--fb)' }}>Загрузка...</div>
}

export default function Page() {
  return <Suspense fallback={<Loader />}><ItemForm /></Suspense>
}

// ── Styles ───────────────────────────────────────────────────────────────────
const inp: React.CSSProperties = {
  width: '100%', background: 'var(--bg3)', border: '1px solid var(--bd)',
  borderRadius: 'var(--r)', padding: '9px 12px', color: 'var(--text)',
  fontSize: 13, fontWeight: 500, outline: 'none',
}
const cardSt: React.CSSProperties = {
  background: 'var(--bg1)', border: '1px solid var(--bd)',
  borderRadius: 'var(--rl)', padding: 20,
}
const secTitle: React.CSSProperties = {
  fontSize: 11, fontWeight: 800, color: 'var(--t2)',
  textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 16,
}
const labelSt: React.CSSProperties = {
  display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--t2)',
  textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 5,
}
function btnSt(bg: string, color: string): React.CSSProperties {
  return {
    background: bg, color, border: 'none', borderRadius: 9,
    padding: '9px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer',
    textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6,
  }
}
