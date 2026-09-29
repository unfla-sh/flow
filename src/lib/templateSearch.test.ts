import { existsSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { templates } from '@/data/templates'

import { templateMatches, templateThumbnailUrl } from './templateSearch'

const byId = (id: string) => templates.find((template) => template.id === id)!

describe('templateMatches', () => {
  it('matches on name, description, category and kit', () => {
    const uml = byId('type-uml-class')
    expect(templateMatches(uml, 'uml')).toBe(true)
    expect(templateMatches(uml, 'inheritance')).toBe(true) // description
    expect(templateMatches(uml, 'hierarchy')).toBe(true) // category
    expect(templateMatches(uml, 'kanban')).toBe(false)
  })

  it('requires every word, in any order', () => {
    const kanban = byId('type-kanban')
    expect(templateMatches(kanban, 'kanban wip')).toBe(true)
    expect(templateMatches(kanban, 'wip kanban')).toBe(true)
    expect(templateMatches(kanban, 'kanban uml')).toBe(false)
  })

  it('treats an empty or blank query as "everything"', () => {
    expect(templates.every((template) => templateMatches(template, ''))).toBe(true)
    expect(templates.every((template) => templateMatches(template, '   '))).toBe(true)
  })
})

describe('template thumbnails', () => {
  it('ships a generated preview for every bundled template', () => {
    const missing = templates
      .map((template) => template.id)
      .filter((id) => !existsSync(join(process.cwd(), 'public', 'template-thumbs', `${id}.webp`)))
    // Regenerate with: python3 scripts/generate-template-thumbnails.py
    expect(missing).toEqual([])
  })

  it('builds a base-aware url', () => {
    expect(templateThumbnailUrl('type-kanban', '/app/')).toBe('/app/template-thumbs/type-kanban.webp')
  })
})
