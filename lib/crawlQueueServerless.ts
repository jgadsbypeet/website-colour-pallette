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

export class CrawlQueueServerless {
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

      // Add initial URL to queue
      this.queue.push(this.baseUrl)
      
      // Start crawling
      await this.processQueue()
      
    } catch (error) {
      this.errors.push(`Crawl failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
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
      isComplete: !this.isRunning && this.queue.length === 0
    }
  }

  getResults(): CrawlResult {
    // Import normalizeColor here to avoid circular dependency
    const { normalizeColor } = require('./colorUtils')
    
    // Normalize and deduplicate colors
    const normalizedColors = normalizeColor(this.allColors)
    
    return {
      colors: normalizedColors,
      pagesCrawled: this.pagesCrawled,
      errors: this.errors,
      totalColors: this.allColors.length,
      uniqueColors: normalizedColors.length
    }
  }

  private async processQueue(): Promise<void> {
    while (this.queue.length > 0 && !this.isCancelled && this.pagesCrawled.length < this.options.maxPages) {
      const url = this.queue.shift()!
      
      if (this.visited.has(url)) continue
      this.visited.add(url)
      
      try {
        await this.crawlPage(url)
        
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
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': this.robotsInfo?.userAgent || 'Website-Color-Palette-Crawler/1.0'
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const html = await response.text()
      
      // Parse HTML for colors and links
      const parsed = parseHTML(html, url)
      this.allColors.push(...parsed.colors)
      
      // Process CSS files
      await this.processCSSFiles(parsed.links, url)
      
      // Add new links to queue (respecting depth limit)
      if (this.getUrlDepth(url) < this.options.maxDepth) {
        for (const link of parsed.links) {
          const normalizedLink = normalizeUrl(link, this.baseUrl)
          if (normalizedLink && this.shouldCrawlLink(normalizedLink) && !this.visited.has(normalizedLink)) {
            this.queue.push(normalizedLink)
          }
        }
      }
      
      this.pagesCrawled.push(url)
      
    } catch (error) {
      throw new Error(`Failed to fetch ${url}: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  private getUrlDepth(url: string): number {
    try {
      const urlObj = new URL(url)
      const pathParts = urlObj.pathname.split('/').filter(part => part.length > 0)
      return pathParts.length
    } catch {
      return 0
    }
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

}
