import { describe, expect, it } from 'vitest'

import { buildDemoDoc } from '@/store/workflowStore'
import type { WorkflowDoc, WorkflowNode } from '@/types/workflow'
import { decodeDoc, encodeDoc } from './share'

describe('share encode/decode', () => {
  it('round-trips a doc through encode → decode (gzip)', async () => {
    const doc = buildDemoDoc()
    const encoded = await encodeDoc(doc)
    expect(encoded[0]).toBe('z') // gzipped
    expect(encoded).not.toMatch(/[+/=]/) // URL-safe
    const result = await decodeDoc(encoded)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.doc.settings.name).toBe(doc.settings.name)
      expect(result.doc.flows.root.nodes).toHaveLength(doc.flows.root.nodes.length)
    }
  })

  it('preserves unicode labels', async () => {
    const doc = buildDemoDoc()
    doc.settings.name = 'Flujo 🌐 — 网络 ⇄ db'
    const result = await decodeDoc(await encodeDoc(doc))
    expect(result.ok && result.doc.settings.name).toBe('Flujo 🌐 — 网络 ⇄ db')
  })

  it('compresses large flows well below the raw JSON size', async () => {
    // ~150 nodes — exercises the >100-node case.
    const nodes: WorkflowNode[] = Array.from({ length: 150 }, (_, i) => ({
      id: `n${i}`,
      type: 'data',
      position: { x: i * 10, y: 0 },
      data: { label: `Node number ${i}`, nodeType: 'data', params: { url: `https://example.com/${i}` } },
    }))
    const edges = nodes.slice(1).map((n, i) => ({ id: `e${i}`, source: `n${i}`, target: n.id }))
    const big: WorkflowDoc = {
      schemaVersion: 1,
      settings: { name: 'Big', version: '1.0.0' },
      flows: { root: { settings: { direction: 'lr' }, nodes, edges } },
    }
    const rawLen = JSON.stringify(big).length
    const encoded = await encodeDoc(big)
    expect(encoded.length).toBeLessThan(rawLen / 2) // gzip wins on repetitive node data
    const result = await decodeDoc(encoded)
    expect(result.ok && result.doc.flows.root.nodes).toHaveLength(150)
  })

  it('returns an error for garbage input', async () => {
    expect((await decodeDoc('z!!!not-valid')).ok).toBe(false)
  })
})
