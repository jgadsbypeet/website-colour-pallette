'use client'

import { useState } from 'react'
import { CrawlOptions } from '@/lib/crawlQueue'

interface UrlFormProps {
  onStartCrawl: (url: string, options: CrawlOptions) => void
  isCrawling: boolean
}

export default function UrlForm({ onStartCrawl, isCrawling }: UrlFormProps) {
  const [url, setUrl] = useState('')
  const [maxPages, setMaxPages] = useState(200)
  const [maxDepth, setMaxDepth] = useState(3)
  const [includeSubdomains, setIncludeSubdomains] = useState(false)
  const [bypassRobots, setBypassRobots] = useState(false)
  const [minCount, setMinCount] = useState(1)
  const [nearDuplicateDelta, setNearDuplicateDelta] = useState(0)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!url.trim()) return
    
    const options: CrawlOptions = {
      maxPages,
      maxDepth,
      includeSubdomains,
      bypassRobots,
      minCount,
      nearDuplicateDelta
    }
    
    onStartCrawl(url.trim(), options)
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-2xl font-bold mb-4">Website Color Palette Crawler</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-2">
            Website URL
          </label>
          <input
            type="url"
            id="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
            disabled={isCrawling}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="maxPages" className="block text-sm font-medium text-gray-700 mb-2">
              Max Pages
            </label>
            <input
              type="number"
              id="maxPages"
              value={maxPages}
              onChange={(e) => setMaxPages(parseInt(e.target.value) || 1)}
              min="1"
              max="1000"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isCrawling}
            />
          </div>

          <div>
            <label htmlFor="maxDepth" className="block text-sm font-medium text-gray-700 mb-2">
              Max Depth
            </label>
            <input
              type="number"
              id="maxDepth"
              value={maxDepth}
              onChange={(e) => setMaxDepth(parseInt(e.target.value) || 1)}
              min="1"
              max="10"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isCrawling}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="minCount" className="block text-sm font-medium text-gray-700 mb-2">
              Min Occurrence Count
            </label>
            <input
              type="number"
              id="minCount"
              value={minCount}
              onChange={(e) => setMinCount(parseInt(e.target.value) || 1)}
              min="1"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isCrawling}
            />
          </div>

          <div>
            <label htmlFor="nearDuplicateDelta" className="block text-sm font-medium text-gray-700 mb-2">
              Near-Duplicate Delta (LAB)
            </label>
            <input
              type="number"
              id="nearDuplicateDelta"
              value={nearDuplicateDelta}
              onChange={(e) => setNearDuplicateDelta(parseFloat(e.target.value) || 0)}
              min="0"
              step="0.1"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isCrawling}
            />
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="includeSubdomains"
              checked={includeSubdomains}
              onChange={(e) => setIncludeSubdomains(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              disabled={isCrawling}
            />
            <label htmlFor="includeSubdomains" className="ml-2 block text-sm text-gray-700">
              Include subdomains
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="bypassRobots"
              checked={bypassRobots}
              onChange={(e) => setBypassRobots(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              disabled={isCrawling}
            />
            <label htmlFor="bypassRobots" className="ml-2 block text-sm text-gray-700">
              Bypass robots.txt (I own this site)
            </label>
          </div>
        </div>

        <button
          type="submit"
          disabled={isCrawling || !url.trim()}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isCrawling ? 'Crawling...' : 'Start Crawl'}
        </button>
      </form>
    </div>
  )
} 