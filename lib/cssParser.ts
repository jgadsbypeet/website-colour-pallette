import parseValue from 'postcss-value-parser'
import { ColorInfo, parseColor } from './colorUtils'

export interface ParsedStyles {
  colors: ColorInfo[]
  links: string[]
}

export function parseCSS(css: string, source: string): ColorInfo[] {
  const colors: ColorInfo[] = []
  
  try {
    const parsed = parseValue(css)
    
    parsed.nodes.forEach(node => {
      if (node.type === 'function') {
        // Handle rgb(), rgba(), hsl(), hsla()
        if (['rgb', 'rgba', 'hsl', 'hsla'].includes(node.value)) {
          const args = node.nodes
            .filter(n => n.type === 'word' || n.type === 'div')
            .map(n => n.value)
            .join('')
          
          const colorValue = `${node.value}(${args})`
          const color = parseColor(colorValue, source)
          if (color) colors.push(color)
        }
      } else if (node.type === 'word') {
        // Handle hex colors, named colors, and CSS variables
        const value = node.value
        
        if (value.startsWith('#')) {
          const color = parseColor(value, source)
          if (color) colors.push(color)
        } else if (value.startsWith('var(--')) {
          // CSS variable - will be resolved later
          // For now, just note that we found one
        } else {
          // Named color
          const color = parseColor(value, source)
          if (color) colors.push(color)
        }
      }
    })
  } catch (error) {
    console.warn(`Failed to parse CSS from ${source}:`, error)
  }
  
  return colors
}

export function parseHTML(html: string, source: string): ParsedStyles {
  const colors: ColorInfo[] = []
  const links: string[] = []
  
  try {
    // Simple regex-based HTML parsing to avoid cheerio dependency issues
    const styleRegex = /style\s*=\s*["']([^"']+)["']/g
    const styleBlockRegex = /<style[^>]*>([\s\S]*?)<\/style>/g
    const linkRegex = /href\s*=\s*["']([^"']+)["']/g
    const cssLinkRegex = /<link[^>]*rel\s*=\s*["']stylesheet["'][^>]*href\s*=\s*["']([^"']+)["'][^>]*>/g
    
    // Parse inline style attributes
    let match
    while ((match = styleRegex.exec(html)) !== null) {
      const styleAttr = match[1]
      const inlineColors = parseCSS(styleAttr, `${source} (inline style)`)
      colors.push(...inlineColors)
    }
    
    // Parse <style> blocks
    while ((match = styleBlockRegex.exec(html)) !== null) {
      const styleContent = match[1]
      const styleColors = parseCSS(styleContent, `${source} (<style> block)`)
      colors.push(...styleColors)
    }
    
    // Extract links for crawling
    while ((match = linkRegex.exec(html)) !== null) {
      const href = match[1]
      if (href) {
        try {
          const url = new URL(href, source)
          links.push(url.href)
        } catch {
          // Invalid URL, skip
        }
      }
    }
    
    // Extract CSS file links
    while ((match = cssLinkRegex.exec(html)) !== null) {
      const href = match[1]
      if (href) {
        try {
          const url = new URL(href, source)
          links.push(url.href)
        } catch {
          // Invalid URL, skip
        }
      }
    }
    
  } catch (error) {
    console.warn(`Failed to parse HTML from ${source}:`, error)
  }
  
  return { colors, links }
}

export function resolveCSSVariables(
  css: string,
  variables: Map<string, string>
): string {
  let resolved = css
  
  variables.forEach((value, variable) => {
    const regex = new RegExp(`var\\(${variable}\\)`, 'g')
    resolved = resolved.replace(regex, value)
  })
  
  return resolved
}

export function extractCSSVariables(css: string): Map<string, string> {
  const variables = new Map<string, string>()
  
  try {
    const parsed = parseValue(css)
    
    parsed.nodes.forEach(node => {
      if (node.type === 'function' && node.value === 'var') {
        const args = node.nodes.filter(n => n.type === 'word')
        if (args.length > 0) {
          const varName = args[0].value
          // Look for CSS custom property definitions
          const varRegex = new RegExp(`--${varName}\\s*:\\s*([^;]+)`, 'g')
          const matches = css.match(varRegex)
          if (matches) {
            matches.forEach(match => {
              const value = match.split(':')[1]?.trim()
              if (value) {
                variables.set(varName, value)
              }
            })
          }
        }
      }
    })
  } catch (error) {
    console.warn('Failed to extract CSS variables:', error)
  }
  
  return variables
} 