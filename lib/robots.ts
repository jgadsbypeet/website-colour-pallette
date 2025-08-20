export interface RobotsInfo {
  isAllowed: boolean
  crawlDelay: number
  userAgent: string
}

export async function checkRobotsTxt(
  baseUrl: string,
  userAgent: string = 'Website-Color-Palette-Crawler/1.0'
): Promise<RobotsInfo> {
  try {
    const robotsUrl = new URL('/robots.txt', baseUrl).href
    
    const response = await fetch(robotsUrl, {
      headers: {
        'User-Agent': userAgent
      }
    })
    
    if (!response.ok) {
      // If robots.txt doesn't exist or isn't accessible, assume crawling is allowed
      return {
        isAllowed: true,
        crawlDelay: 1000, // Default 1 second delay
        userAgent
      }
    }
    
    const robotsText = await response.text()
    
    // Simple robots.txt parsing (replace the problematic library)
    const lines = robotsText.split('\n').map(line => line.trim().toLowerCase())
    let isAllowed = true
    let crawlDelay = 1000
    let currentUserAgent = ''
    let relevantSection = false
    
    for (const line of lines) {
      if (line.startsWith('user-agent:')) {
        currentUserAgent = line.substring(11).trim()
        relevantSection = currentUserAgent === '*' || currentUserAgent === userAgent.toLowerCase()
      } else if (relevantSection) {
        if (line.startsWith('disallow:')) {
          const path = line.substring(9).trim()
          if (path === '/' || path === '') {
            isAllowed = false
          }
        } else if (line.startsWith('crawl-delay:')) {
          const delay = parseInt(line.substring(12).trim())
          if (!isNaN(delay)) {
            crawlDelay = delay * 1000 // Convert to milliseconds
          }
        }
      }
    }
    
    return {
      isAllowed,
      crawlDelay: Math.max(crawlDelay, 1000), // Minimum 1 second
      userAgent
    }
    
  } catch (error) {
    console.warn(`Failed to check robots.txt for ${baseUrl}:`, error)
    // If we can't check robots.txt, assume crawling is allowed with default delay
    return {
      isAllowed: true,
      crawlDelay: 1000,
      userAgent
    }
  }
}

export function isSameOrigin(url: string, baseUrl: string): boolean {
  try {
    const urlObj = new URL(url)
    const baseObj = new URL(baseUrl)
    return urlObj.origin === baseObj.origin
  } catch {
    return false
  }
}

export function isSubdomain(url: string, baseUrl: string): boolean {
  try {
    const urlObj = new URL(url)
    const baseObj = new URL(baseUrl)
    
    // Check if URL is a subdomain of base URL
    return urlObj.hostname.endsWith('.' + baseObj.hostname) || 
           urlObj.hostname === baseObj.hostname
  } catch {
    return false
  }
}

export function normalizeUrl(url: string, baseUrl: string): string {
  try {
    const urlObj = new URL(url, baseUrl)
    // Remove hash and search params for deduplication
    urlObj.hash = ''
    urlObj.search = ''
    return urlObj.href
  } catch {
    return url
  }
} 