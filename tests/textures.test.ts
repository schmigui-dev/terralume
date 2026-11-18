import { describe, expect, it } from 'vitest'
import { TEXTURE_SETS } from '#/features/globe/textures'

describe('TEXTURE_SETS', () => {
  it('uses only 4K in high and only 2K in low quality', () => {
    for (const url of Object.values(TEXTURE_SETS.high)) expect(url).toMatch(/_4096\.jpg$/)
    for (const url of Object.values(TEXTURE_SETS.low)) expect(url).toMatch(/_2048\.jpg$/)
  })
})
