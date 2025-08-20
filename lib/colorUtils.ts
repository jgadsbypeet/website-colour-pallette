import { colord, extend } from 'colord'
import labPlugin from 'colord/plugins/lab'

extend([labPlugin])

export interface ColorInfo {
  hex: string
  alpha: number
  lab: { l: number; a: number; b: number }
  originalValue: string
  source: string
}

export interface NormalizedColor {
  hex: string
  alphaPresent: boolean
  count: number
  sampleSources: string[]
  lab: { l: number; a: number; b: number }
}

export function parseColor(value: string, source: string): ColorInfo | null {
  if (!value || typeof value !== 'string') return null

  const trimmed = value.trim()
  if (!trimmed) return null

  try {
    const color = colord(trimmed)
    if (!color.isValid()) return null

    return {
      hex: color.toHex().toUpperCase(),
      alpha: color.alpha(),
      lab: color.toLab(),
      originalValue: trimmed,
      source
    }
  } catch {
    return null
  }
}

export function normalizeColor(colors: ColorInfo[]): NormalizedColor[] {
  const colorMap = new Map<string, NormalizedColor>()

  for (const color of colors) {
    const key = color.hex
    const existing = colorMap.get(key)

    if (existing) {
      existing.count++
      if (!existing.sampleSources.includes(color.source)) {
        existing.sampleSources.push(color.source)
      }
      if (color.alpha < 1) {
        existing.alphaPresent = true
      }
    } else {
      colorMap.set(key, {
        hex: key,
        alphaPresent: color.alpha < 1,
        count: 1,
        sampleSources: [color.source].slice(0, 3), // Keep only first 3 sources
        lab: color.lab
      })
    }
  }

  return Array.from(colorMap.values())
}

export function filterNearDuplicates(
  colors: NormalizedColor[],
  deltaThreshold: number
): NormalizedColor[] {
  if (deltaThreshold <= 0) return colors

  const result: NormalizedColor[] = []
  const used = new Set<string>()

  for (const color of colors) {
    if (used.has(color.hex)) continue

    const nearDuplicates = colors.filter(other => {
      if (other.hex === color.hex) return false
      
      const delta = Math.sqrt(
        Math.pow(color.lab.l - other.lab.l, 2) +
        Math.pow(color.lab.a - other.lab.a, 2) +
        Math.pow(color.lab.b - other.lab.b, 2)
      )
      
      return delta <= deltaThreshold
    })

    if (nearDuplicates.length === 0) {
      result.push(color)
      used.add(color.hex)
    } else {
      // Keep the color with the highest count
      const allSimilar = [color, ...nearDuplicates]
      const best = allSimilar.reduce((a, b) => a.count > b.count ? a : b)
      
      if (!used.has(best.hex)) {
        result.push(best)
        used.add(best.hex)
        
        // Mark all similar colors as used
        allSimilar.forEach(c => used.add(c.hex))
      }
    }
  }

  return result
}

export function exportToCSV(colors: NormalizedColor[]): string {
  const headers = ['hex', 'count', 'alpha_present', 'sample_sources']
  const rows = colors.map(color => [
    color.hex,
    color.count.toString(),
    color.alphaPresent ? 'yes' : 'no',
    color.sampleSources.join('; ')
  ])

  return [headers.join(','), ...rows.map(row => row.join(','))].join('\n')
}

export function exportToJSON(colors: NormalizedColor[]): string {
  return JSON.stringify(colors, null, 2)
}

export function copyHexList(colors: NormalizedColor[]): string {
  return colors.map(color => color.hex).join('\n')
} 