import { describe, expect, it } from 'vitest'

import { evaluateExpression as ev } from './expression'

describe('evaluateExpression (sandboxed)', () => {
  it('resolves identifiers and comparisons', () => {
    expect(ev("status == 'approved'", { status: 'approved' })).toBe(true)
    expect(ev("status == 'approved'", { status: 'rejected' })).toBe(false)
    expect(ev('count > 3', { count: 5 })).toBe(true)
    expect(ev('count >= 5 && count < 10', { count: 5 })).toBe(true)
  })

  it('handles dotted paths, booleans and negation', () => {
    expect(ev('order.paid', { order: { paid: true } })).toBe(true)
    expect(ev('!order.paid', { order: { paid: false } })).toBe(true)
    expect(ev('a || b', { a: false, b: true })).toBe(true)
  })

  it('returns literal values for switch matching', () => {
    expect(ev("'paid'", {})).toBe('paid')
    expect(ev('order.status', { order: { status: 'pending' } })).toBe('pending')
  })

  it('treats missing identifiers as undefined (no throw)', () => {
    expect(ev('missing', {})).toBeUndefined()
    expect(ev("missing == 'x'", {})).toBe(false)
  })

  it('throws on malformed input (caller falls back)', () => {
    expect(() => ev('status ==', {})).toThrow()
    expect(() => ev('(a || b', { a: true })).toThrow()
  })

  it('does NOT execute function calls or arbitrary code', () => {
    expect(() => ev('alert(1)', {})).toThrow()
  })
})
