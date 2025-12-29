interface State {
  id: number
  transitions: Map<string, number[]>
  epsilon: number[]
}

interface NFA {
  states: State[]
  start: number
  accept: number
}

export function buildNFA(pattern: string): NFA {
  let stateId = 0

  const newState = (): State => ({
    id: stateId++,
    transitions: new Map(),
    epsilon: [],
  })

  const parse = (expr: string, start: number, end: number): NFA => {
    if (start >= end) {
      const s = newState()
      const e = newState()
      s.epsilon.push(e.id)
      return { states: [s, e], start: s.id, accept: e.id }
    }

    const fragments: NFA[] = []
    let i = start

    while (i < end) {
      const char = expr[i]
      if (char === undefined) break

      if (char === "(") {
        let depth = 1
        let j = i + 1
        while (j < end && depth > 0) {
          if (expr[j] === "\\") {
            j += 2
            continue
          }
          if (expr[j] === "(") depth++
          if (expr[j] === ")") depth--
          j++
        }

        const groupNFA = parse(expr, i + 1, j - 1)
        const nextChar = expr[j]

        if (j < end && nextChar !== undefined && /[*+?]/.test(nextChar)) {
          fragments.push(quantify(groupNFA, nextChar))
          i = j + 1
        } else {
          fragments.push(groupNFA)
          i = j
        }
      } else if (char === "[") {
        let j = i + 1
        while (j < end && expr[j] !== "]") {
          if (expr[j] === "\\") j++
          j++
        }
        j++

        const s = newState()
        const e = newState()
        s.transitions.set(expr.slice(i, j), [e.id])

        const nfa = { states: [s, e], start: s.id, accept: e.id }
        const nextChar = expr[j]

        if (j < end && nextChar !== undefined && /[*+?]/.test(nextChar)) {
          fragments.push(quantify(nfa, nextChar))
          i = j + 1
        } else {
          fragments.push(nfa)
          i = j
        }
      } else if (char === "|") {
        const left = concat(fragments)
        const right = parse(expr, i + 1, end)
        return alternate(left, right)
      } else if (!/[*+?]/.test(char)) {
        const s = newState()
        const e = newState()
        const symbol =
          char === "\\" && i + 1 < end ? expr.slice(i, i + 2) : char
        s.transitions.set(symbol, [e.id])

        const nfa = { states: [s, e], start: s.id, accept: e.id }

        if (char === "\\") i++
        i++

        const nextChar = expr[i]
        if (i < end && nextChar !== undefined && /[*+?]/.test(nextChar)) {
          fragments.push(quantify(nfa, nextChar))
          i++
        } else {
          fragments.push(nfa)
        }
      } else {
        i++
      }
    }

    return concat(fragments)
  }

  const concat = (nfas: NFA[]): NFA => {
    if (nfas.length === 0) {
      const s = newState()
      const e = newState()
      s.epsilon.push(e.id)
      return { states: [s, e], start: s.id, accept: e.id }
    }
    if (nfas.length === 1 && nfas[0]) return nfas[0]

    const states: State[] = []
    for (let i = 0; i < nfas.length; i++) {
      const nfa = nfas[i]
      if (!nfa) continue
      states.push(...nfa.states)
      if (i < nfas.length - 1) {
        const nextNfa = nfas[i + 1]
        if (!nextNfa) continue
        const accept = states.find((s) => s.id === nfa.accept)
        if (accept) accept.epsilon.push(nextNfa.start)
      }
    }

    const first = nfas[0]
    const last = nfas[nfas.length - 1]
    if (!first || !last) {
      const s = newState()
      const e = newState()
      s.epsilon.push(e.id)
      return { states: [s, e], start: s.id, accept: e.id }
    }

    return { states, start: first.start, accept: last.accept }
  }

  const alternate = (nfa1: NFA, nfa2: NFA): NFA => {
    const s = newState()
    const e = newState()

    s.epsilon.push(nfa1.start, nfa2.start)

    const accept1 = nfa1.states.find((st) => st.id === nfa1.accept)
    const accept2 = nfa2.states.find((st) => st.id === nfa2.accept)

    if (accept1) accept1.epsilon.push(e.id)
    if (accept2) accept2.epsilon.push(e.id)

    return {
      states: [s, ...nfa1.states, ...nfa2.states, e],
      start: s.id,
      accept: e.id,
    }
  }

  const quantify = (nfa: NFA, q: string): NFA => {
    const s = newState()
    const e = newState()

    const accept = nfa.states.find((st) => st.id === nfa.accept)

    if (q === "*") {
      s.epsilon.push(nfa.start, e.id)
      if (accept) accept.epsilon.push(nfa.start, e.id)
    } else if (q === "+") {
      s.epsilon.push(nfa.start)
      if (accept) accept.epsilon.push(nfa.start, e.id)
    } else if (q === "?") {
      s.epsilon.push(nfa.start, e.id)
      if (accept) accept.epsilon.push(e.id)
    }

    return { states: [s, ...nfa.states, e], start: s.id, accept: e.id }
  }

  const clean = pattern.replace(/^\^|\$$/g, "")
  return parse(clean, 0, clean.length)
}

export function removeEpsilon(nfa: NFA): NFA {
  const closure = (id: number): Set<number> => {
    const result = new Set<number>([id])
    const stack = [id]

    while (stack.length > 0) {
      const current = stack.pop()
      if (current === undefined) break
      const state = nfa.states.find((s) => s.id === current)

      if (state) {
        for (const eps of state.epsilon) {
          if (!result.has(eps)) {
            result.add(eps)
            stack.push(eps)
          }
        }
      }
    }

    return result
  }

  const states: State[] = nfa.states.map((s) => ({
    id: s.id,
    transitions: new Map(),
    epsilon: [],
  }))

  for (const state of nfa.states) {
    const cls = closure(state.id)
    const newState = states.find((s) => s.id === state.id)
    if (!newState) continue

    for (const clsId of cls) {
      const clsState = nfa.states.find((s) => s.id === clsId)
      if (clsState) {
        for (const [symbol, targets] of clsState.transitions) {
          const existing = newState.transitions.get(symbol) || []
          for (const target of targets) {
            const targetCls = closure(target)
            for (const t of targetCls) {
              if (!existing.includes(t)) existing.push(t)
            }
          }
          newState.transitions.set(symbol, existing)
        }
      }
    }
  }

  return { states, start: nfa.start, accept: nfa.accept }
}

export function buildMatrix(nfa: NFA): number[][] {
  const n = nfa.states.length
  const matrix: number[][] = Array(n)
    .fill(0)
    .map(() => Array(n).fill(0))

  for (const state of nfa.states) {
    for (const targets of state.transitions.values()) {
      for (const target of targets) {
        const row = matrix[state.id]
        if (row) {
          const current = row[target]
          if (current !== undefined) {
            row[target] = current + 1
          }
        }
      }
    }
  }

  return matrix
}

export function spectralRadius(matrix: number[][]): number {
  const n = matrix.length
  if (n === 0) return 0

  let v = Array(n).fill(1 / Math.sqrt(n))

  const tolerance = 1e-6
  const maxIterations = 100

  for (let iter = 0; iter < maxIterations; iter++) {
    const newV = Array(n).fill(0)

    for (let i = 0; i < n; i++) {
      const row = matrix[i] ?? []
      for (let j = 0; j < n; j++) {
        const cell = row[j] ?? 0
        newV[i] += cell * v[j]
      }
    }

    const norm = Math.sqrt(newV.reduce((sum, val) => sum + val * val, 0))
    if (norm === 0) return 0
    const normalizedV = newV.map((val) => val / norm)

    let converged = true
    for (let i = 0; i < n; i++) {
      const a = normalizedV[i]
      const b = v[i]
      if (a !== undefined && b !== undefined && Math.abs(a - b) > tolerance) {
        converged = false
        break
      }
    }
    if (converged) break
    v = normalizedV
  }

  let eigenvalue = 0
  for (let i = 0; i < n; i++) {
    const row = matrix[i] ?? []
    let sum = 0
    for (let j = 0; j < n; j++) {
      sum += (row[j] ?? 0) * v[j]
    }
    eigenvalue += sum * v[i]
  }

  return Math.abs(eigenvalue)
}

export function detectReDoS(pattern: string): boolean {
  try {
    const nfa = buildNFA(pattern)
    const epsilonFree = removeEpsilon(nfa)
    const matrix = buildMatrix(epsilonFree)
    const radius = spectralRadius(matrix)

    return radius > 1.0
  } catch {
    return false
  }
}
