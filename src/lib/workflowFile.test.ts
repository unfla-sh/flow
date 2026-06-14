import { describe, expect, it } from 'vitest'

import { buildDemoDoc } from '@/store/workflowStore'
import type { WorkflowDoc } from '@/types/workflow'
import { parseWorkflowFile, sanitizeDoc, serializeDoc } from './workflowFile'

describe('workflowFile', () => {
  it('round-trips a doc through serialize → parse', () => {
    const doc = buildDemoDoc()
    const parsed = parseWorkflowFile(serializeDoc(doc))
    expect(parsed.ok).toBe(true)
    if (parsed.ok) {
      expect(Object.keys(parsed.doc.flows)).toContain('root')
      expect(parsed.doc.flows.root.nodes).toHaveLength(doc.flows.root.nodes.length)
    }
  })

  it('preserves style fields (iconBg, textColor) and edge handles through a round-trip', () => {
    const doc: WorkflowDoc = {
      schemaVersion: 1,
      settings: { name: 'T', version: '1.0.0' },
      flows: {
        root: {
          settings: { direction: 'lr' },
          nodes: [
            {
              id: 'a',
              type: 'data',
              position: { x: 0, y: 0 },
              data: {
                label: 'A',
                nodeType: 'data',
                params: {},
                icon: 'cat',
                style: { iconBg: '#2563eb', textColor: '#e11d48', borderColor: '#000' },
              },
            },
            { id: 'b', type: 'data', position: { x: 0, y: 200 }, data: { label: 'B', nodeType: 'data', params: {} } },
          ],
          edges: [
            {
              id: 'e1',
              source: 'a',
              target: 'b',
              sourceHandle: 'bottom',
              targetHandle: 'top',
              data: { style: { arrow: true, arrowStart: true, pathType: 'step' } },
            },
          ],
        },
      },
    }
    const parsed = parseWorkflowFile(serializeDoc(doc))
    expect(parsed.ok).toBe(true)
    if (!parsed.ok) return
    const a = parsed.doc.flows.root.nodes[0]
    expect(a.data.style?.iconBg).toBe('#2563eb')
    expect(a.data.style?.textColor).toBe('#e11d48')
    expect(a.data.icon).toBe('cat')
    const e = parsed.doc.flows.root.edges[0]
    expect(e.sourceHandle).toBe('bottom')
    expect(e.targetHandle).toBe('top')
    expect(e.data?.style?.arrowStart).toBe(true)
    expect(e.data?.style?.pathType).toBe('step')
  })

  it('preserves meta provenance through a round-trip', () => {
    const doc = buildDemoDoc()
    doc.meta = { appVersion: '1.2.3', exportedAt: '2026-06-13T00:00:00.000Z' }
    const parsed = parseWorkflowFile(serializeDoc(doc))
    expect(parsed.ok).toBe(true)
    if (!parsed.ok) return
    expect(parsed.doc.meta?.appVersion).toBe('1.2.3')
    expect(parsed.doc.meta?.exportedAt).toBe('2026-06-13T00:00:00.000Z')
  })

  it('rejects invalid JSON with a readable error', () => {
    const r = parseWorkflowFile('{ not json')
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error).toMatch(/not valid json/i)
  })

  it('rejects a doc missing the root flow', () => {
    const r = parseWorkflowFile(
      JSON.stringify({ schemaVersion: 1, settings: { name: 'x', version: '1' }, flows: {} }),
    )
    expect(r.ok).toBe(false)
  })

  it('sanitizeDoc strips React Flow runtime fields', () => {
    const doc = buildDemoDoc()
    doc.flows.root.nodes[0] = { ...doc.flows.root.nodes[0], selected: true, dragging: true }
    const clean = sanitizeDoc(doc)
    expect('selected' in clean.flows.root.nodes[0]).toBe(false)
    expect('dragging' in clean.flows.root.nodes[0]).toBe(false)
  })
})
