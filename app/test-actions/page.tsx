'use client'

import { useState } from 'react'
import { startCrawl, getCrawlProgress, getCrawlResults } from '../actions/crawl'

export default function TestActions() {
  const [status, setStatus] = useState('')
  const [progress, setProgress] = useState<any>(null)
  const [results, setResults] = useState<any>(null)

  const testStartCrawl = async () => {
    setStatus('Testing startCrawl...')
    try {
      const response = await startCrawl('http://localhost:8000', {
        maxPages: 2,
        maxDepth: 1,
        includeSubdomains: false,
        bypassRobots: true,
        minCount: 1,
        nearDuplicateDelta: 0
      })
      setStatus(`startCrawl result: ${JSON.stringify(response)}`)
    } catch (error) {
      setStatus(`startCrawl error: ${error}`)
    }
  }

  const testGetProgress = async () => {
    setStatus('Testing getCrawlProgress...')
    try {
      const response = await getCrawlProgress()
      setProgress(response)
      setStatus(`getCrawlProgress result: ${JSON.stringify(response)}`)
    } catch (error) {
      setStatus(`getCrawlProgress error: ${error}`)
    }
  }

  const testGetResults = async () => {
    setStatus('Testing getCrawlResults...')
    try {
      const response = await getCrawlResults()
      setResults(response)
      setStatus(`getCrawlResults result: ${JSON.stringify(response)}`)
    } catch (error) {
      setStatus(`getCrawlResults error: ${error}`)
    }
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Test Server Actions</h1>
      
      <div className="space-y-4">
        <button 
          onClick={testStartCrawl}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Test startCrawl
        </button>
        
        <button 
          onClick={testGetProgress}
          className="bg-green-500 text-white px-4 py-2 rounded ml-2"
        >
          Test getCrawlProgress
        </button>
        
        <button 
          onClick={testGetResults}
          className="bg-purple-500 text-white px-4 py-2 rounded ml-2"
        >
          Test getCrawlResults
        </button>
      </div>
      
      <div className="mt-6">
        <h2 className="text-xl font-bold mb-2">Status:</h2>
        <pre className="bg-gray-100 p-2 rounded">{status}</pre>
      </div>
      
      {progress && (
        <div className="mt-6">
          <h2 className="text-xl font-bold mb-2">Progress:</h2>
          <pre className="bg-gray-100 p-2 rounded">{JSON.stringify(progress, null, 2)}</pre>
        </div>
      )}
      
      {results && (
        <div className="mt-6">
          <h2 className="text-xl font-bold mb-2">Results:</h2>
          <pre className="bg-gray-100 p-2 rounded">{JSON.stringify(results, null, 2)}</pre>
        </div>
      )}
    </div>
  )
}
