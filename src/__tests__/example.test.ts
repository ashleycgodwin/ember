import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'

// A tiny pure function we can test
function add(a: number, b: number): number {
  return a + b
}

describe('add', () => {
  it('adds two numbers', () => {
    expect(add(2, 3)).toBe(5)
  })

  it('is commutative — order should not matter (property-based)', () => {
    // fast-check runs this with hundreds of random number pairs automatically
    fc.assert(
      fc.property(fc.integer(), fc.integer(), (a, b) => {
        return add(a, b) === add(b, a)
      })
    )
  })
})
