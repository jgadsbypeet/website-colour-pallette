import {
  parseColor,
  normalizeColor,
  filterNearDuplicates,
  exportToCSV,
  exportToJSON,
  copyHexList,
  ColorInfo,
  NormalizedColor
} from '@/lib/colorUtils'

describe('colorUtils', () => {
  describe('parseColor', () => {
    it('should parse hex colors', () => {
      const result = parseColor('#FF0000', 'test.css')
      expect(result).toEqual({
        hex: '#FF0000',
        alpha: 1,
        lab: expect.any(Object),
        originalValue: '#FF0000',
        source: 'test.css'
      })
    })

    it('should parse rgb colors', () => {
      const result = parseColor('rgb(255, 0, 0)', 'test.css')
      expect(result).toEqual({
        hex: '#FF0000',
        alpha: 1,
        lab: expect.any(Object),
        originalValue: 'rgb(255, 0, 0)',
        source: 'test.css'
      })
    })

    it('should parse rgba colors with alpha', () => {
      const result = parseColor('rgba(255, 0, 0, 0.5)', 'test.css')
      expect(result).toEqual({
        hex: '#FF0000',
        alpha: 0.5,
        lab: expect.any(Object),
        originalValue: 'rgba(255, 0, 0, 0.5)',
        source: 'test.css'
      })
    })

    it('should parse named colors', () => {
      const result = parseColor('red', 'test.css')
      expect(result).toEqual({
        hex: '#FF0000',
        alpha: 1,
        lab: expect.any(Object),
        originalValue: 'red',
        source: 'test.css'
      })
    })

    it('should return null for invalid colors', () => {
      const result = parseColor('invalid', 'test.css')
      expect(result).toBeNull()
    })

    it('should return null for empty values', () => {
      const result = parseColor('', 'test.css')
      expect(result).toBeNull()
    })
  })

  describe('normalizeColor', () => {
    it('should normalize and deduplicate colors', () => {
      const colors: ColorInfo[] = [
        { hex: '#FF0000', alpha: 1, lab: { l: 0, a: 0, b: 0 }, originalValue: '#FF0000', source: 'test1.css' },
        { hex: '#FF0000', alpha: 0.5, lab: { l: 0, a: 0, b: 0 }, originalValue: 'rgb(255, 0, 0)', source: 'test2.css' },
        { hex: '#00FF00', alpha: 1, lab: { l: 0, a: 0, b: 0 }, originalValue: '#00FF00', source: 'test3.css' }
      ]

      const result = normalizeColor(colors)
      expect(result).toHaveLength(2)
      
      const redColor = result.find(c => c.hex === '#FF0000')
      expect(redColor).toBeDefined()
      expect(redColor?.count).toBe(2)
      expect(redColor?.alphaPresent).toBe(true)
      expect(redColor?.sampleSources).toContain('test1.css')
      expect(redColor?.sampleSources).toContain('test2.css')
    })

    it('should handle single colors', () => {
      const colors: ColorInfo[] = [
        { hex: '#FF0000', alpha: 1, lab: { l: 0, a: 0, b: 0 }, originalValue: '#FF0000', source: 'test.css' }
      ]

      const result = normalizeColor(colors)
      expect(result).toHaveLength(1)
      expect(result[0].count).toBe(1)
      expect(result[0].alphaPresent).toBe(false)
    })
  })

  describe('filterNearDuplicates', () => {
    it('should not filter when delta is 0', () => {
      const colors: NormalizedColor[] = [
        { hex: '#FF0000', alphaPresent: false, count: 1, sampleSources: ['test1'], lab: { l: 50, a: 50, b: 0 } },
        { hex: '#FF0001', alphaPresent: false, count: 1, sampleSources: ['test2'], lab: { l: 50, a: 50, b: 1 } }
      ]

      const result = filterNearDuplicates(colors, 0)
      expect(result).toHaveLength(2)
    })

    it('should filter near duplicates when delta is positive', () => {
      const colors: NormalizedColor[] = [
        { hex: '#FF0000', alphaPresent: false, count: 2, sampleSources: ['test1'], lab: { l: 50, a: 50, b: 0 } },
        { hex: '#FF0001', alphaPresent: false, count: 1, sampleSources: ['test2'], lab: { l: 50, a: 50, b: 1 } }
      ]

      const result = filterNearDuplicates(colors, 2)
      expect(result).toHaveLength(1)
      expect(result[0].hex).toBe('#FF0000') // Should keep the one with higher count
    })
  })

  describe('export functions', () => {
    const colors: NormalizedColor[] = [
      { hex: '#FF0000', alphaPresent: false, count: 2, sampleSources: ['test1.css', 'test2.css'], lab: { l: 50, a: 50, b: 0 } },
      { hex: '#00FF00', alphaPresent: true, count: 1, sampleSources: ['test3.css'], lab: { l: 50, a: -50, b: 0 } }
    ]

    it('should export to CSV correctly', () => {
      const csv = exportToCSV(colors)
      const lines = csv.split('\n')
      
      expect(lines[0]).toBe('hex,count,alpha_present,sample_sources')
      expect(lines[1]).toBe('#FF0000,2,no,test1.css; test2.css')
      expect(lines[2]).toBe('#00FF00,1,yes,test3.css')
    })

    it('should export to JSON correctly', () => {
      const json = exportToJSON(colors)
      const parsed = JSON.parse(json)
      
      expect(parsed).toHaveLength(2)
      expect(parsed[0].hex).toBe('#FF0000')
      expect(parsed[1].hex).toBe('#00FF00')
    })

    it('should copy hex list correctly', () => {
      const hexList = copyHexList(colors)
      expect(hexList).toBe('#FF0000\n#00FF00')
    })
  })
}) 