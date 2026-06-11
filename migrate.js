#!/usr/bin/env node
/**
 * migrate.js — перанос data.json паміж версіямі сайта
 *
 * Запуск:  node migrate.js [input.json] [output.json]
 * Прыклад: node migrate.js old-data.json public/data.json
 *
 * Што робіць:
 *  - Дадае адсутныя палі з дэфолтнымі значэннямі
 *  - Пераносіць description з Platform на Item/AppEntry
 *  - Выдаляе статус з Platform (перанесена на Link.type)
 *  - Захоўвае ўсе дадзеныя якія ёсць
 */

const fs = require('fs')
const path = require('path')

const inputFile  = process.argv[2] || 'public/data.json'
const outputFile = process.argv[3] || 'public/data.json'

// ── helpers ──────────────────────────────────────────────────────────────────
function migrateLink(link) {
  return {
    label: link.label || '',
    url:   link.url   || '',
    type:  link.type  || guessLinkType(link.label || '', link.url || ''),
  }
}

function guessLinkType(label, url) {
  const s = (label + url).toLowerCase()
  if (s.includes('crowdin') || s.includes('weblate') || s.includes('transifex') ||
      s.includes('перакласці') || s.includes('translate')) return 'translate'
  if (s.includes('play.google') || s.includes('app store') || s.includes('f-droid') ||
      s.includes('спампаваць') || s.includes('download')) return 'download'
  if (s.includes('telegram') || s.includes('t.me') || s.includes('matrix') ||
      s.includes('discord') || s.includes('чат') || s.includes('chat')) return 'chat'
  if (s.includes('адкрыць') || s.includes('сайт') || s.includes('open') ||
      s.includes('website')) return 'website'
  return 'other'
}

function migratePlatform(p) {
  // Old format had: { name, status, description, links }
  // New format:     { name, links }
  const links = (p.links || []).map(migrateLink)
  return {
    name:  p.name || '',
    links,
    // keep description separately so caller can decide where to put it
    _description: p.description || '',
  }
}

function migrateAppEntry(app) {
  const platforms = (app.platforms || []).map(migratePlatform)
  // Collect descriptions from platforms if app has no description
  const collectedDesc = platforms
    .map(p => p._description)
    .filter(Boolean)
    .join('\n\n')

  return {
    id:          app.id || slugify(app.name || 'app'),
    name:        app.name || '',
    iconUrl:     app.iconUrl || '',
    description: app.description || collectedDesc || '',
    platforms:   platforms.map(({ _description, ...rest }) => rest),
  }
}

function migrateItem(item) {
  const platforms = (item.platforms || []).map(migratePlatform)
  // Collect descriptions from platforms if item has no description
  const collectedDesc = platforms
    .map(p => p._description)
    .filter(Boolean)
    .join('\n\n')

  const apps = item.apps ? item.apps.map(migrateAppEntry) : undefined

  return {
    id:            item.id            || slugify(item.name || 'item'),
    name:          item.name          || '',
    bannerUrl:     item.bannerUrl     || '',
    iconUrl:       item.iconUrl       || '',
    screenshotUrl: item.screenshotUrl || '',
    category:      item.category      || '',
    tags:          item.tags          || [],
    updatedAt:     item.updatedAt     || '',
    description:   item.description   || collectedDesc || '',
    platforms:     platforms.map(({ _description, ...rest }) => rest),
    ...(apps ? { apps } : {}),
  }
}

function migrateCategory(cat) {
  return {
    id:           cat.id           || slugify(cat.name || 'cat'),
    name:         cat.name         || '',
    sub:          cat.sub          || '',
    icon:         cat.icon         || '📁',
    bannerUrl:    cat.bannerUrl    || '',
    contributeUrl:cat.contributeUrl|| '',
    items:        (cat.items || []).map(migrateItem),
  }
}

function slugify(s) {
  return s.toLowerCase().replace(/[^a-zа-яёіўьъ0-9]/g, '-').replace(/-+/g, '-').slice(0, 40)
}

// ── run ───────────────────────────────────────────────────────────────────────
try {
  const raw  = fs.readFileSync(path.resolve(inputFile), 'utf-8')
  const data = JSON.parse(raw)

  const migrated = {
    categories: (data.categories || []).map(migrateCategory),
  }

  fs.writeFileSync(path.resolve(outputFile), JSON.stringify(migrated, null, 2), 'utf-8')

  // Stats
  const totalItems = migrated.categories.reduce((n, c) => n + c.items.length, 0)
  const totalApps  = migrated.categories.reduce((n, c) =>
    n + c.items.reduce((m, i) => m + (i.apps?.length || 0), 0), 0)

  console.log(`✓ Мігравана: ${migrated.categories.length} катэгорый, ${totalItems} элементаў, ${totalApps} прыкладанняў`)
  console.log(`  → ${outputFile}`)
} catch (e) {
  console.error('✗ Памылка:', e.message)
  process.exit(1)
}
