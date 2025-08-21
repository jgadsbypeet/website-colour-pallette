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

  getDebugInfo(): any {
    return {
      options: this.options,
      queueLength: this.queue.length,
      visitedCount: this.visited.size,
      pagesCrawled: this.pagesCrawled.length,
      errors: this.errors,
      colorsFound: this.allColors.length,
      cssCacheSize: this.cssCache.size,
      isCancelled: this.isCancelled,
      robotsInfo: this.robotsInfo
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
    
    console.log(`Starting crawl queue with max pages: ${this.options.maxPages}, max depth: ${this.options.maxDepth}`)
    
    while (this.queue.length > 0 && !this.isCancelled && this.pagesCrawled.length < this.options.maxPages) {
      // Check for timeout
      if (Date.now() - startTime > maxCrawlTime) {
        const timeoutMsg = 'Crawl timeout: Maximum crawl time exceeded (5 minutes)'
        console.warn(timeoutMsg)
        this.errors.push(timeoutMsg)
        break
      }
      
      const url = this.queue.shift()!
      console.log(`Processing URL from queue: ${url}`)
      
      if (this.visited.has(url)) {
        console.log(`Skipping already visited URL: ${url}`)
        continue
      }
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
        console.log(`Waiting ${delay}ms before next crawl...`)
        await new Promise(resolve => setTimeout(resolve, delay))
        
        // Early termination if we have enough colors
        if (this.allColors.length > 1000) {
          console.log('Early termination: Found sufficient colors (>1000)')
          break
        }
        
        // Check if queue is empty and we've crawled at least one page
        if (this.queue.length === 0 && this.pagesCrawled.length > 0) {
          console.log('Early termination: Queue is empty, no more URLs to crawl')
          break
        }
        
        console.log(`Queue status: ${this.queue.length} URLs remaining, ${this.pagesCrawled.length} pages crawled`)
        
      } catch (error) {
        const errorMsg = `Failed to crawl ${url}: ${error instanceof Error ? error.message : 'Unknown error'}`
        console.error(errorMsg, error)
        this.errors.push(errorMsg)
        
        // Continue with next URL instead of failing completely
        continue
      }
    }
    
    // Ensure we stop processing when done
    console.log(`Crawl completed. Pages crawled: ${this.pagesCrawled.length}, Colors found: ${this.allColors.length}`)
    console.log(`Final queue length: ${this.queue.length}, Errors: ${this.errors.length}`)
    
    // Clear the queue to ensure completion is detected
    this.queue.length = 0
  }

  private async crawlPage(url: string): Promise<void> {
    try {
      console.log(`Starting to crawl: ${url}`)
      
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
      console.log(`Response received: ${response.status} ${response.statusText}`)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      // Check content type to ensure we're processing HTML
      const contentType = response.headers.get('content-type') || ''
      console.log(`Content type: ${contentType}`)
      if (!contentType.includes('text/html') && !contentType.includes('application/xhtml')) {
        throw new Error(`Invalid content type: ${contentType}`)
      }

      // Limit response size to prevent memory issues
      const contentLength = response.headers.get('content-length')
      if (contentLength && parseInt(contentLength) > 5 * 1024 * 1024) { // 5MB limit
        throw new Error('Response too large (>5MB)')
      }

      const html = await response.text()
      console.log(`HTML content length: ${html.length} characters`)
      
      // Parse HTML for colors and links
      const parsed = parseHTML(html, url)
      console.log(`Parsed: ${parsed.colors.length} colors, ${parsed.links.length} links`)
      this.allColors.push(...parsed.colors)
      
      // Process CSS files only if we haven't reached max pages
      if (this.pagesCrawled.length < this.options.maxPages) {
        console.log(`Processing CSS files for: ${url}`)
        await this.processCSSFiles(parsed.links, url)
      } else {
        console.log(`Skipping CSS processing - max pages reached`)
      }
      
      // Add new links to queue (respecting depth limit) only if we haven't reached max pages
      if (this.getUrlDepth(url) < this.options.maxDepth && this.pagesCrawled.length < this.options.maxPages) {
        console.log(`Adding links to queue for: ${url}`)
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
        
        console.log(`Valid links found: ${validLinks.length}`)
        this.queue.push(...validLinks.slice(0, 10)) // Limit new URLs added per page
      } else {
        console.log(`Skipping link queue - depth limit or max pages reached`)
      }
      
      this.pagesCrawled.push(url)
      console.log(`Successfully crawled: ${url}`)
      
    } catch (error) {
      console.error(`Error crawling ${url}:`, error)
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
    
    console.log(`Processing ${cssLinks.length} CSS files for: ${source}`)
    
    for (let i = 0; i < cssLinks.length; i += maxConcurrent) {
      const batch = cssLinks.slice(i, i + maxConcurrent)
      console.log(`Processing CSS batch ${Math.floor(i/maxConcurrent) + 1}: ${batch.length} files`)
      
      await Promise.allSettled(batch.map(async (link) => {
        if (this.cssCache.has(link)) {
          console.log(`CSS already cached: ${link}`)
          return
        }
        
        try {
          console.log(`Fetching CSS: ${link}`)
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
            console.log(`CSS parsed: ${colors.length} colors from ${link}`)
            this.allColors.push(...colors)
          } else {
            console.warn(`CSS fetch failed: ${link} - ${response.status}`)
          }
        } catch (error) {
          console.warn(`Failed to fetch CSS from ${link}:`, error)
        }
      }))
      
      // Small delay between batches to be polite
      if (i + maxConcurrent < cssLinks.length) {
        console.log(`Waiting 500ms before next CSS batch...`)
        await new Promise(resolve => setTimeout(resolve, 500))
      }
    }
    
    console.log(`CSS processing completed for: ${source}`)
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
