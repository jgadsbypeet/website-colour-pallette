import { CrawlQueue, CrawlOptions } from '@/lib/crawlQueue'
import { normalizeColor, filterNearDuplicates } from '@/lib/colorUtils'
import path from 'path'
import { createServer } from 'http'
import { readFileSync } from 'fs'
import { AddressInfo } from 'net'

describe('Crawler Integration Tests', () => {
  let server: any
  let baseUrl: string
  let testSitePath: string

  beforeAll(async () => {
    // Set up a simple HTTP server to serve the test site
    testSitePath = path.join(__dirname, '../test-site')
    
    server = createServer((req, res) => {
      let filePath = path.join(testSitePath, req.url || '/')
      
      // Default to index.html for root
      if (req.url === '/') {
        filePath = path.join(testSitePath, 'index.html')
      }
      
      try {
        const content = readFileSync(filePath, 'utf8')
        const ext = path.extname(filePath)
        
        let contentType = 'text/html'
        if (ext === '.css') contentType = 'text/css'
        if (ext === '.js') contentType = 'application/javascript'
        
        res.writeHead(200, { 'Content-Type': contentType })
        res.end(content)
      } catch (error) {
        res.writeHead(404)
        res.end('File not found')
      }
    })

    await new Promise<void>((resolve) => {
      server.listen(0, () => {
        const port = (server.address() as AddressInfo).port
        baseUrl = `http://localhost:${port}`
        resolve()
      })
    })
  })

  afterAll(async () => {
    if (server) {
      await new Promise<void>((resolve) => {
        server.close(() => resolve())
      })
    }
  })

  it('should crawl the test site and extract colors', async () => {
    const options: CrawlOptions = {
      maxPages: 10,
      maxDepth: 2,
      includeSubdomains: false,
      bypassRobots: true,
      minCount: 1,
      nearDuplicateDelta: 0
    }

    const crawler = new CrawlQueue(baseUrl, options)
    
    // Start crawling
    await crawler.start()
    
    // Get results
    const result = crawler.getResult()
    
    // Verify we got some results
    expect(result.colors.length).toBeGreaterThan(0)
    expect(result.pagesCrawled.length).toBeGreaterThan(0)
    
    // Normalize colors
    const normalized = normalizeColor(result.colors)
    expect(normalized.length).toBeGreaterThan(0)
    
    // Check that we found expected colors
    const hexColors = normalized.map(c => c.hex)
    expect(hexColors).toContain('#FF0000') // Red
    expect(hexColors).toContain('#00FF00') // Green
    expect(hexColors).toContain('#0000FF') // Blue
    expect(hexColors).toContain('#FFFFFF') // White
    expect(hexColors).toContain('#333333') // Dark gray
    
    // Check that we found colors with alpha
    const colorsWithAlpha = normalized.filter(c => c.alphaPresent)
    expect(colorsWithAlpha.length).toBeGreaterThan(0)
    
    // Check that we found CSS variable colors
    const hasCSSVariables = result.colors.some(c => 
      c.source.includes('CSS variable') || c.source.includes('var(--')
    )
    expect(hasCSSVariables).toBe(true)
  }, 30000) // 30 second timeout for crawling

  it('should respect crawl limits', async () => {
    const options: CrawlOptions = {
      maxPages: 2,
      maxDepth: 1,
      includeSubdomains: false,
      bypassRobots: true,
      minCount: 1,
      nearDuplicateDelta: 0
    }

    const crawler = new CrawlQueue(baseUrl, options)
    
    await crawler.start()
    
    const result = crawler.getResult()
    
    // Should not exceed max pages
    expect(result.pagesCrawled.length).toBeLessThanOrEqual(2)
    
    // Should still find colors
    expect(result.colors.length).toBeGreaterThan(0)
  }, 30000)

  it('should filter near duplicates correctly', async () => {
    const options: CrawlOptions = {
      maxPages: 5,
      maxDepth: 1,
      includeSubdomains: false,
      bypassRobots: true,
      minCount: 1,
      nearDuplicateDelta: 5 // Higher threshold for filtering
    }

    const crawler = new CrawlQueue(baseUrl, options)
    
    await crawler.start()
    
    const result = crawler.getResult()
    const normalized = normalizeColor(result.colors)
    
    // Apply near-duplicate filtering
    const filtered = filterNearDuplicates(normalized, options.nearDuplicateDelta)
    
    // Should have fewer colors after filtering
    expect(filtered.length).toBeLessThanOrEqual(normalized.length)
    
    // Should still have some colors
    expect(filtered.length).toBeGreaterThan(0)
  }, 30000)

  it('should handle errors gracefully', async () => {
    const options: CrawlOptions = {
      maxPages: 5,
      maxDepth: 1,
      includeSubdomains: false,
      bypassRobots: true,
      minCount: 1,
      nearDuplicateDelta: 0
    }

    // Try to crawl a non-existent URL
    const crawler = new CrawlQueue(`${baseUrl}/nonexistent`, options)
    
    await crawler.start()
    
    const result = crawler.getResult()
    
    // Should have errors
    expect(result.errors.length).toBeGreaterThan(0)
    
    // Should still complete without crashing
    expect(result.pagesCrawled.length).toBeGreaterThanOrEqual(0)
  }, 30000)
}) 