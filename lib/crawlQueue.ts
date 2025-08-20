import { ColorInfo } from './colorUtils'
import { parseHTML, parseCSS } from './cssParser'
import { checkRobotsTxt, isSameOrigin, isSubdomain, normalizeUrl } from './robots'

export interface CrawlOptions {
  maxPages: number
  maxDepth: number
  includeSubdomains: boolean
  bypassRobots: boolean
  minCount: number
  nearDuplicateDelta: number
}

export interface CrawlProgress {
  pagesQueued: number
  pagesDone: number
  pagesError: number
  currentUrl: string
  colorsFound: number
  isComplete: boolean
  error?: string
}

export interface CrawlResult {
  colors: ColorInfo[]
  pagesCrawled: string[]
  errors: string[]
  totalColors: number
  uniqueColors: number
}

export class CrawlQueue {
  private browser: any = null
  private isRunning = false
  private isCancelled = false
  private queue: string[] = []
  private visited = new Set<string>()
  private cssCache = new Map<string, string>()
  private allColors: ColorInfo[] = []
  private errors: string[] = []
  private pagesCrawled: string[] = []
  
  private options: CrawlOptions
  private baseUrl: string
  private robotsInfo: any = null

  constructor(baseUrl: string, options: CrawlOptions) {
    this.baseUrl = baseUrl
    this.options = options
  }

  async start(): Promise<void> {
    if (this.isRunning) return
    
    this.isRunning = true
    this.isCancelled = false
    
    try {
      // Check robots.txt unless bypassed
      if (!this.options.bypassRobots) {
        this.robotsInfo = await checkRobotsTxt(this.baseUrl)
        if (!this.robotsInfo.isAllowed) {
          throw new Error('Crawling not allowed by robots.txt')
        }
      } else {
        this.robotsInfo = { isAllowed: true, crawlDelay: 1000, userAgent: 'Bypass' }
      }

      // Dynamically import Playwright only on the server side
      const { chromium } = await import('playwright')
      
      // Initialize browser
      this.browser = await chromium.launch({ headless: true })
      
      // Add initial URL to queue
      this.queue.push(this.baseUrl)
      
      // Start crawling
      await this.processQueue()
      
    } catch (error) {
      this.errors.push(`Crawl failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      if (this.browser) {
        await this.browser.close()
        this.browser = null
      }
      this.isRunning = false
    }
  }

  cancel(): void {
    this.isCancelled = true
  }

  getProgress(): CrawlProgress {
    return {
      pagesQueued: this.queue.length,
      pagesDone: this.pagesCrawled.length,
      pagesError: this.errors.length,
      currentUrl: this.queue[0] || '',
      colorsFound: this.allColors.length,
      isComplete: !this.isRunning && this.queue.length === 0,
      error: this.errors.length > 0 ? this.errors[this.errors.length - 1] : undefined
    }
  }

  getResult(): CrawlResult {
    return {
      colors: this.allColors,
      pagesCrawled: this.pagesCrawled,
      errors: this.errors,
      totalColors: this.allColors.length,
      uniqueColors: new Set(this.allColors.map(c => c.hex)).size
    }
  }

  private async processQueue(): Promise<void> {
    while (this.queue.length > 0 && !this.isCancelled) {
      if (this.pagesCrawled.length >= this.options.maxPages) {
        break
      }

      const url = this.queue.shift()!
      
      if (this.visited.has(url)) {
        continue
      }

      this.visited.add(url)
      
      try {
        await this.crawlPage(url)
        this.pagesCrawled.push(url)
        
        // Respect crawl delay
        if (this.robotsInfo?.crawlDelay) {
          await new Promise(resolve => setTimeout(resolve, this.robotsInfo.crawlDelay))
        }
        
      } catch (error) {
        this.errors.push(`Failed to crawl ${url}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }
  }

  private async crawlPage(url: string): Promise<void> {
    if (!this.browser) return

    const page = await this.browser.newPage()
    
    try {
      // Set user agent
      await page.setExtraHTTPHeaders({
        'User-Agent': this.robotsInfo?.userAgent || 'Website-Color-Palette-Crawler/1.0'
      })
      
      // Navigate to page
      await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 })
      
      // Get HTML content
      const html = await page.content()
      
      // Parse HTML for colors and links
      const parsed = parseHTML(html, url)
      this.allColors.push(...parsed.colors)
      
      // Extract computed colors from DOM
      const computedColors = await this.extractComputedColors(page, url)
      this.allColors.push(...computedColors)
      
      // Process CSS files
      await this.processCSSFiles(parsed.links, url)
      
      // Add new links to queue if within depth limit
      if (this.pagesCrawled.length < this.options.maxDepth) {
        for (const link of parsed.links) {
          if (this.shouldCrawlLink(link)) {
            const normalized = normalizeUrl(link, this.baseUrl)
            if (!this.visited.has(normalized) && !this.queue.includes(normalized)) {
              this.queue.push(normalized)
            }
          }
        }
      }
      
    } finally {
      await page.close()
    }
  }

  private async extractComputedColors(page: any, source: string): Promise<ColorInfo[]> {
    const colors: ColorInfo[] = []
    
    try {
      // Sample elements for computed styles
      const selectors = [
        'h1, h2, h3, h4, h5, h6', // Headings
        'a, button, input, select, textarea', // Interactive elements
        '.btn, .button, .link', // Common button/link classes
        'div, span, p' // General elements (limit to first 200)
      ]
      
      for (const selector of selectors) {
        const elements = await page.$$(selector)
        const limit = selector.includes('div, span, p') ? 200 : elements.length
        
        for (let i = 0; i < Math.min(elements.length, limit); i++) {
          const element = elements[i]
          
          try {
            const styles = await element.evaluate((el: Element) => {
              const computed = getComputedStyle(el)
              return {
                color: computed.color,
                backgroundColor: computed.backgroundColor,
                borderColor: computed.borderColor,
                fill: (el as SVGElement).style?.fill || '',
                stroke: (el as SVGElement).style?.stroke || ''
              }
            })
            
            // Parse each style property
            Object.entries(styles).forEach(([property, value]) => {
              if (value && typeof value === 'string' && value !== 'rgba(0, 0, 0, 0)' && value !== 'transparent') {
                const color = this.parseColorWithSource(value, `${source} (computed ${property})`)
                if (color) colors.push(color)
              }
            })
            
          } catch (error) {
            // Skip elements that can't be evaluated
          }
        }
      }
      
    } catch (error) {
      console.warn(`Failed to extract computed colors from ${source}:`, error)
    }
    
    return colors
  }

  private async processCSSFiles(links: string[], source: string): Promise<void> {
    for (const link of links) {
      if (link.endsWith('.css') && !this.cssCache.has(link)) {
        try {
          const response = await fetch(link)
          if (response.ok) {
            const css = await response.text()
            this.cssCache.set(link, css)
            
            const colors = parseCSS(css, link)
            this.allColors.push(...colors)
          }
        } catch (error) {
          console.warn(`Failed to fetch CSS from ${link}:`, error)
        }
      }
    }
  }

  private shouldCrawlLink(link: string): boolean {
    try {
      if (this.options.includeSubdomains) {
        return isSubdomain(link, this.baseUrl)
      } else {
        return isSameOrigin(link, this.baseUrl)
      }
    } catch {
      return false
    }
  }

  private parseColorWithSource(value: string, source: string): ColorInfo | null {
    // Import parseColor here to avoid circular dependency
    const { parseColor } = require('./colorUtils')
    return parseColor(value, source)
  }
} 