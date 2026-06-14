/**
 * A tiny, SANDBOXED expression evaluator for branch decisions during
 * simulation. Deliberately NOT eval/Function — shared flows must never run
 * arbitrary code on a viewer's machine. Supports:
 *   literals: numbers, 'strings', "strings", true/false/null
 *   identifiers with dotted paths resolved against a context object (a.b.c)
 *   operators: ! && || == === != !== < <= > >= and parentheses
 * Throws on anything it doesn't understand; callers treat that as "unknown".
 */

type Token = { t: 'num' | 'str' | 'ident' | 'op' | 'paren'; v: string }

const OPS = ['===', '!==', '==', '!=', '<=', '>=', '&&', '||', '<', '>', '!']

function tokenize(input: string): Token[] {
  const tokens: Token[] = []
  let i = 0
  while (i < input.length) {
    const c = input[i]
    if (/\s/.test(c)) {
      i++
      continue
    }
    if (c === '(' || c === ')') {
      tokens.push({ t: 'paren', v: c })
      i++
      continue
    }
    if (c === '"' || c === "'") {
      let j = i + 1
      let s = ''
      while (j < input.length && input[j] !== c) {
        s += input[j]
        j++
      }
      if (j >= input.length) throw new Error('unterminated string')
      tokens.push({ t: 'str', v: s })
      i = j + 1
      continue
    }
    if (/[0-9]/.test(c) || (c === '.' && /[0-9]/.test(input[i + 1] ?? ''))) {
      let num = ''
      while (i < input.length && /[0-9.]/.test(input[i])) {
        num += input[i]
        i++
      }
      tokens.push({ t: 'num', v: num })
      continue
    }
    const op = OPS.find((o) => input.startsWith(o, i))
    if (op) {
      tokens.push({ t: 'op', v: op })
      i += op.length
      continue
    }
    if (/[A-Za-z_$]/.test(c)) {
      let id = ''
      while (i < input.length && /[A-Za-z0-9_$.]/.test(input[i])) {
        id += input[i]
        i++
      }
      tokens.push({ t: 'ident', v: id })
      continue
    }
    throw new Error(`unexpected character "${c}"`)
  }
  return tokens
}

function resolve(path: string, ctx: Record<string, unknown>): unknown {
  if (path === 'true') return true
  if (path === 'false') return false
  if (path === 'null') return null
  let cur: unknown = ctx
  for (const key of path.split('.')) {
    if (cur == null || typeof cur !== 'object') return undefined
    cur = (cur as Record<string, unknown>)[key]
  }
  return cur
}

class Parser {
  private pos = 0
  private tokens: Token[]
  private ctx: Record<string, unknown>

  constructor(tokens: Token[], ctx: Record<string, unknown>) {
    this.tokens = tokens
    this.ctx = ctx
  }

  private peek() {
    return this.tokens[this.pos]
  }
  private next() {
    return this.tokens[this.pos++]
  }

  parse(): unknown {
    const value = this.parseOr()
    if (this.pos < this.tokens.length) throw new Error('trailing tokens')
    return value
  }

  private parseOr(): unknown {
    let left = this.parseAnd()
    while (this.peek()?.v === '||') {
      this.next()
      const right = this.parseAnd()
      left = Boolean(left) || Boolean(right)
    }
    return left
  }

  private parseAnd(): unknown {
    let left = this.parseCmp()
    while (this.peek()?.v === '&&') {
      this.next()
      const right = this.parseCmp()
      left = Boolean(left) && Boolean(right)
    }
    return left
  }

  private parseCmp(): unknown {
    const left = this.parseUnary()
    const op = this.peek()
    if (op?.t === 'op' && ['==', '===', '!=', '!==', '<', '<=', '>', '>='].includes(op.v)) {
      this.next()
      const right = this.parseUnary()
      switch (op.v) {
        case '==':
          return left == right
        case '===':
          return left === right
        case '!=':
          return left != right
        case '!==':
          return left !== right
        case '<':
          return (left as number) < (right as number)
        case '<=':
          return (left as number) <= (right as number)
        case '>':
          return (left as number) > (right as number)
        case '>=':
          return (left as number) >= (right as number)
      }
    }
    return left
  }

  private parseUnary(): unknown {
    if (this.peek()?.v === '!') {
      this.next()
      return !this.parseUnary()
    }
    return this.parsePrimary()
  }

  private parsePrimary(): unknown {
    const tok = this.next()
    if (!tok) throw new Error('unexpected end of expression')
    if (tok.t === 'num') return Number(tok.v)
    if (tok.t === 'str') return tok.v
    if (tok.t === 'ident') return resolve(tok.v, this.ctx)
    if (tok.v === '(') {
      const value = this.parseOr()
      if (this.next()?.v !== ')') throw new Error('missing )')
      return value
    }
    throw new Error(`unexpected token "${tok.v}"`)
  }
}

/** Evaluate an expression against a context. Throws on anything unsupported. */
export function evaluateExpression(expr: string, ctx: Record<string, unknown>): unknown {
  return new Parser(tokenize(expr), ctx).parse()
}
