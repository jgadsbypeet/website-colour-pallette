import { ColorInfo, NormalizedColor } from './colorUtils'
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
  colors: NormalizedColor[]
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
    const isComplete = this.pagesCrawled.length >= this.options.maxPages || 
                      this.queue.length === 0 || 
                      this.isCancelled
    
    return {
      pagesQueued: this.queue.length,
      pagesDone: this.pagesCrawled.length,
      pagesError: this.errors.length,
      currentUrl: this.queue[0] || '',
      colorsFound: this.allColors.length,
      isComplete
    }
  }

  async getResults(): Promise<CrawlResult> {
    // Lazy load normalizeColor to reduce initial bundle size
    const { normalizeColor } = await import('./colorUtils')
    
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
    const startTime = Date.now()
    const maxCrawlTime = 5 * 60 * 1000 // 5 minute maximum crawl time
    
    while (this.queue.length > 0 && !this.isCancelled && this.pagesCrawled.length < this.options.maxPages) {
      // Check for timeout
      if (Date.now() - startTime > maxCrawlTime) {
        this.errors.push('Crawl timeout: Maximum crawl time exceeded (5 minutes)')
        break
      }
      
      const url = this.queue.shift()!
      
      if (this.visited.has(url)) continue
      this.visited.add(url)
      
      try {
        console.log(`Crawling page ${this.pagesCrawled.length + 1}/${this.options.maxPages}: ${url}`)
        await this.crawlPage(url)
        
        // Check if we've reached max pages after this crawl
        if (this.pagesCrawled.length >= this.options.maxPages) {
          console.log(`Reached maximum pages limit (${this.options.maxPages}), stopping crawl`)
          break
        }
        
        // Respect crawl delay but with minimum
        const delay = Math.max(this.robotsInfo?.crawlDelay || 1000, 500) // Minimum 500ms delay
        await new Promise(resolve => setTimeout(resolve, delay))
        
        // Early termination if we have enough colors
        if (this.allColors.length > 1000) {
          console.log('Early termination: Found sufficient colors (>1000)')
          break
        }
        
      } catch (error) {
        this.errors.push(`Failed to crawl ${url}: ${error instanceof Error ? error.message : 'Unknown error'}`)
        console.warn(`Error crawling ${url}:`, error)
        
        // Continue with next URL instead of failing completely
        continue
      }
    }
    
    // Ensure we stop processing when done
    console.log(`Crawl completed. Pages crawled: ${this.pagesCrawled.length}, Colors found: ${this.allColors.length}`)
    
    // Clear the queue to ensure completion is detected
    this.queue.length = 0
  }

  private async crawlPage(url: string): Promise<void> {
    try {
      // Add timeout and better error handling
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': this.robotsInfo?.userAgent || 'Website-Color-Palette-Crawler/1.0',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1'
        },
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      // Check content type to ensure we're processing HTML
      const contentType = response.headers.get('content-type') || ''
      if (!contentType.includes('text/html') && !contentType.includes('application/xhtml')) {
        throw new Error(`Invalid content type: ${contentType}`)
      }

      // Limit response size to prevent memory issues
      const contentLength = response.headers.get('content-length')
      if (contentLength && parseInt(contentLength) > 5 * 1024 * 1024) { // 5MB limit
        throw new Error('Response too large (>5MB)')
      }

      const html = await response.text()
      
      // Parse HTML for colors and links
      const parsed = parseHTML(html, url)
      this.allColors.push(...parsed.colors)
      
      // Process CSS files only if we haven't reached max pages
      if (this.pagesCrawled.length < this.options.maxPages) {
        await this.processCSSFiles(parsed.links, url)
      }
      
      // Add new links to queue (respecting depth limit) only if we haven't reached max pages
      if (this.getUrlDepth(url) < this.options.maxDepth && this.pagesCrawled.length < this.options.maxPages) {
        // Filter and limit links to prevent overwhelming the queue
        const validLinks = parsed.links
          .slice(0, 20) // Limit links per page
          .map(link => normalizeUrl(link, this.baseUrl))
          .filter(link => 
            link && 
            this.shouldCrawlLink(link) && 
            !this.visited.has(link) &&
            !this.queue.includes(link) && // Prevent duplicates in queue
            !this.isProblematicUrl(link) // Filter out problematic URLs
          )
        
        this.queue.push(...validLinks.slice(0, 10)) // Limit new URLs added per page
      }
      
      this.pagesCrawled.push(url)
      
    } catch (error) {
      throw new Error(`Failed to fetch ${url}: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  private isProblematicUrl(url: string): boolean {
    try {
      const urlObj = new URL(url)
      const pathname = urlObj.pathname.toLowerCase()
      const search = urlObj.search.toLowerCase()
      
      // Filter out problematic file types
      const problematicExtensions = [
        '.svg', '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
        '.zip', '.rar', '.tar', '.gz', '.mp4', '.avi', '.mov', '.mp3',
        '.wav', '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.ico', '.webp',
        '.woff', '.woff2', '.ttf', '.eot', '.otf'
      ]
      
      if (problematicExtensions.some(ext => pathname.endsWith(ext))) {
        return true
      }
      
      // Filter out problematic paths
      const problematicPaths = [
        '/wp-admin', '/admin', '/login', '/logout', '/search',
        '/api/', '/ajax/', '/feed', '/rss', '/sitemap',
        '/.well-known/', '/robots.txt', '/favicon.ico'
      ]
      
      if (problematicPaths.some(path => pathname.includes(path))) {
        return true
      }
      
      // Filter out URLs with problematic query parameters
      const problematicParams = ['download', 'export', 'print', 'pdf']
      if (problematicParams.some(param => search.includes(param))) {
        return true
      }
      
      // Filter out very long URLs (likely to be problematic)
      if (url.length > 200) {
        return true
      }
      
      return false
    } catch {
      return true // If URL is malformed, consider it problematic
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
    // Limit concurrent CSS requests to prevent overwhelming the server
    const maxConcurrent = 3
    const cssLinks = links.filter(link => link.endsWith('.css')).slice(0, 10) // Limit to 10 CSS files
    
    for (let i = 0; i < cssLinks.length; i += maxConcurrent) {
      const batch = cssLinks.slice(i, i + maxConcurrent)
      
      await Promise.allSettled(batch.map(async (link) => {
        if (this.cssCache.has(link)) return
        
        try {
          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), 15000) // 15 second timeout for CSS
          
          const response = await fetch(link, {
            headers: {
              'User-Agent': this.robotsInfo?.userAgent || 'Website-Color-Palette-Crawler/1.0'
            },
            signal: controller.signal
          })
          
          clearTimeout(timeoutId)
          
          if (response.ok) {
            const contentLength = response.headers.get('content-length')
            if (contentLength && parseInt(contentLength) > 2 * 1024 * 1024) { // 2MB limit for CSS
              console.warn(`CSS file too large: ${link}`)
              return
            }
            
            const css = await response.text()
            this.cssCache.set(link, css)
            
            const colors = parseCSS(css, link)
            this.allColors.push(...colors)
          }
        } catch (error) {
          console.warn(`Failed to fetch CSS from ${link}:`, error)
        }
      }))
      
      // Small delay between batches to be polite
      if (i + maxConcurrent < cssLinks.length) {
        await new Promise(resolve => setTimeout(resolve, 500))
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
