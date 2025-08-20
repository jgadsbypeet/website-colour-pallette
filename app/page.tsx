'use client'

import { useState, useEffect } from 'react'
import { CrawlOptions } from '@/lib/crawlQueueServerless'
import { NormalizedColor } from '@/lib/colorUtils'
import { startCrawl, getCrawlProgress, getCrawlResults, cancelCrawl } from './actions/crawl'
import UrlForm from '@/components/UrlForm'
import Progress from '@/components/Progress'
import ResultsTable from '@/components/ResultsTable'

export default function Home() {
  const [isCrawling, setIsCrawling] = useState(false)
  const [progress, setProgress] = useState({
    pagesQueued: 0,
    pagesDone: 0,
    pagesError: 0,
    currentUrl: '',
    colorsFound: 0,
    isComplete: false,
    error: undefined as string | undefined
  })
  const [results, setResults] = useState<{
    colors: NormalizedColor[]
    pagesCrawled: string[]
    errors: string[]
    totalColors: number
    uniqueColors: number
  }>({
    colors: [],
    pagesCrawled: [],
    errors: [],
    totalColors: 0,
    uniqueColors: 0
  })

  useEffect(() => {
    let interval: NodeJS.Timeout

    if (isCrawling) {
      interval = setInterval(async () => {
        const progressData = await getCrawlProgress()
        if (progressData) {
          setProgress({
            pagesQueued: progressData.pagesQueued,
            pagesDone: progressData.pagesDone,
            pagesError: progressData.pagesError,
            currentUrl: progressData.currentUrl,
            colorsFound: progressData.colorsFound,
            isComplete: progressData.isComplete,
            error: progressData.error
          })
          
          if (progressData.isComplete || progressData.error) {
            setIsCrawling(false)
            const resultsData = await getCrawlResults()
            if (resultsData) {
              setResults(resultsData)
            }
          }
        }
      }, 1000)
    }

    return () => {
      if (interval) {
        clearInterval(interval)
      }
    }
  }, [isCrawling])

  const handleStartCrawl = async (url: string, options: CrawlOptions) => {
    setIsCrawling(true)
    setProgress({
      pagesQueued: 0,
      pagesDone: 0,
      pagesError: 0,
      currentUrl: '',
      colorsFound: 0,
      isComplete: false,
      error: undefined
    })
    setResults({
      colors: [],
      pagesCrawled: [],
      errors: [],
      totalColors: 0,
      uniqueColors: 0
    })

    const response = await startCrawl(url, options)
    if (!response.success) {
      setIsCrawling(false)
      setProgress(prev => ({ ...prev, error: response.error }))
    }
  }

  const handleCancelCrawl = async () => {
    await cancelCrawl()
    setIsCrawling(false)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <UrlForm onStartCrawl={handleStartCrawl} isCrawling={isCrawling} />
          
          {isCrawling && (
            <Progress
              {...progress}
              onCancel={handleCancelCrawl}
            />
          )}
          
          {results.colors.length > 0 && (
            <ResultsTable {...results} />
          )}
        </div>
      </div>
    </div>
  )
} 