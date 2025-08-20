'use client'

interface ProgressProps {
  pagesQueued: number
  pagesDone: number
  pagesError: number
  currentUrl: string
  colorsFound: number
  isComplete: boolean
  error?: string
  onCancel: () => void
}

export default function Progress({
  pagesQueued,
  pagesDone,
  pagesError,
  currentUrl,
  colorsFound,
  isComplete,
  error,
  onCancel
}: ProgressProps) {
  const totalPages = pagesQueued + pagesDone + pagesError
  const progress = totalPages > 0 ? (pagesDone / totalPages) * 100 : 0

  if (isComplete && !error) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-green-800">
              Crawl Complete!
            </h3>
            <div className="mt-2 text-sm text-green-700">
              <p>Pages crawled: {pagesDone}</p>
              <p>Colors found: {colorsFound}</p>
              {pagesError > 0 && <p>Errors: {pagesError}</p>}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">
              Crawl Error
            </h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error}</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-blue-800">
          Crawling in Progress...
        </h3>
        <button
          onClick={onCancel}
          className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
        >
          Cancel
        </button>
      </div>

      <div className="space-y-3">
        <div>
          <div className="flex justify-between text-sm text-blue-700 mb-1">
            <span>Progress</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-blue-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm text-blue-700">
          <div>
            <span className="font-medium">Pages Queued:</span> {pagesQueued}
          </div>
          <div>
            <span className="font-medium">Pages Done:</span> {pagesDone}
          </div>
          <div>
            <span className="font-medium">Pages Error:</span> {pagesError}
          </div>
          <div>
            <span className="font-medium">Colors Found:</span> {colorsFound}
          </div>
        </div>

        {currentUrl && (
          <div className="text-sm text-blue-700">
            <span className="font-medium">Current URL:</span>
            <div className="mt-1 break-all">{currentUrl}</div>
          </div>
        )}
      </div>
    </div>
  )
} 