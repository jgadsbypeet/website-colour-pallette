'use server'

import { CrawlQueue, CrawlOptions } from '@/lib/crawlQueue'
import { normalizeColor, filterNearDuplicates, NormalizedColor } from '@/lib/colorUtils'

let currentCrawl: CrawlQueue | null = null

export async function startCrawl(
  url: string,
  options: CrawlOptions
): Promise<{ success: boolean; error?: string }> {
  try {
    // Validate URL
    new URL(url)
    
    // Cancel any existing crawl
    if (currentCrawl) {
      currentCrawl.cancel()
    }
    
    // Create new crawl
    currentCrawl = new CrawlQueue(url, options)
    
    // Start crawling in background
    currentCrawl.start().catch(error => {
      console.error('Crawl failed:', error)
    })
    
    return { success: true }
    
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Invalid URL' 
    }
  }
}

export async function getCrawlProgress(): Promise<{
  pagesQueued: number
  pagesDone: number
  pagesError: number
  currentUrl: string
  colorsFound: number
  isComplete: boolean
  error?: string
} | null> {
  if (!currentCrawl) {
    return null
  }
  
  return currentCrawl.getProgress()
}

export async function getCrawlResults(): Promise<{
  colors: NormalizedColor[]
  pagesCrawled: string[]
  errors: string[]
  totalColors: number
  uniqueColors: number
} | null> {
  if (!currentCrawl) {
    return null
  }
  
  const result = currentCrawl.getResult()
  
  // Normalize and filter colors
  const normalized = normalizeColor(result.colors)
  const filtered = filterNearDuplicates(
    normalized,
    currentCrawl['options'].nearDuplicateDelta
  )
  
  return {
    ...result,
    colors: filtered
  }
}

export async function cancelCrawl(): Promise<{ success: boolean }> {
  if (currentCrawl) {
    currentCrawl.cancel()
    currentCrawl = null
    return { success: true }
  }
  
  return { success: false }
} 