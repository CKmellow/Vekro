import { describe, expect, it } from 'vitest'
import { passwordStrength } from './password'

describe('passwordStrength', () => {
  it.each([
    ['', 0, 'Too weak'],
    ['abc', 1, 'Too weak'],
    ['abcdefgh', 2, 'Weak'],
    ['abcdefg1', 3, 'Fair'],
    ['abcdefgh1234', 4, 'Strong'],
    ['Abcdef1!', 4, 'Strong'],
  ])('%s scores %i (%s)', (password, score, label) => {
    expect(passwordStrength(password)).toEqual({ score, label })
  })
})
