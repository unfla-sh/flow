import { describe, expect, it } from 'vitest'

import { parseMermaid } from './mermaid'

describe('parseMermaid', () => {
  it('parses a flowchart with shapes, labels and branches', () => {
    const r = parseMermaid(`flowchart LR
      A([Start]) --> B[fetch_data.py]
      B --> C{valid?}
      C -->|yes| D[transform]
      C -->|no| E([End])
      D --> E`)
    expect(r.ok).toBe(true)
    if (!r.ok) return
    const { nodes, edges } = r.doc.flows.root
    const byLabel = (l: string) => nodes.find((n) => n.data.label === l)
    expect(byLabel('Start')?.data.nodeType).toBe('start')
    expect(byLabel('End')?.data.nodeType).toBe('end')
    expect(byLabel('fetch_data.py')?.data.nodeType).toBe('script')
    expect(byLabel('valid?')?.data.nodeType).toBe('decision') // {diamond}
    expect(edges).toHaveLength(5)
    // condition branch labels route to true/false handles
    const yes = edges.find((e) => e.label === 'yes')
    expect(yes?.sourceHandle).toBe('true')
  })

  it('maps direction TB → tb', () => {
    const r = parseMermaid('flowchart TB\n A --> B')
    expect(r.ok && r.doc.flows.root.settings?.direction).toBe('tb')
  })

  it('wraps a subgraph in a frame node', () => {
    const r = parseMermaid(`flowchart LR
      A[ingest] --> B
      subgraph Extract
      B[parse] --> C[clean]
      end
      C --> D([Done])`)
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.doc.flows.root.nodes.some((n) => n.data.nodeType === 'frame')).toBe(true)
  })

  it('extracts a mermaid block from markdown', () => {
    const md = ['# Title', '', '```mermaid', 'flowchart LR', '  A --> B', '```', 'text'].join('\n')
    const r = parseMermaid(md)
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.doc.flows.root.nodes).toHaveLength(2)
  })

  it('rejects non-flowchart input', () => {
    expect(parseMermaid('sequenceDiagram\n A->>B: hi').ok).toBe(false)
  })

  it('treats a <--> connector as a two-way arrow', () => {
    const r = parseMermaid('flowchart LR\n A[web] <--> B[db]')
    expect(r.ok).toBe(true)
    if (!r.ok) return
    const e = r.doc.flows.root.edges[0]
    expect(e.data?.style?.arrow).toBe(true)
    expect(e.data?.style?.arrowStart).toBe(true)
  })
})
