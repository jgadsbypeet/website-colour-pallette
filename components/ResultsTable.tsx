'use client'

import { useState, useMemo } from 'react'
import { NormalizedColor } from '@/lib/colorUtils'
import Swatch from './Swatch'

interface ResultsTableProps {
  colors: NormalizedColor[]
  pagesCrawled: string[]
  errors: string[]
  totalColors: number
  uniqueColors: number
}

type SortField = 'hex' | 'count' | 'alphaPresent'
type SortDirection = 'asc' | 'desc'

export default function ResultsTable({
  colors,
  pagesCrawled,
  errors,
  totalColors,
  uniqueColors
}: ResultsTableProps) {
  const [sortField, setSortField] = useState<SortField>('count')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table')
  const [filterAlpha, setFilterAlpha] = useState<boolean | null>(null)

  const sortedAndFilteredColors = useMemo(() => {
    let filtered = colors

    // Filter by alpha presence
    if (filterAlpha !== null) {
      filtered = filtered.filter(color => color.alphaPresent === filterAlpha)
    }

    // Sort colors
    filtered.sort((a, b) => {
      let aValue: any = a[sortField]
      let bValue: any = b[sortField]

      if (sortField === 'hex') {
        aValue = aValue.toLowerCase()
        bValue = bValue.toLowerCase()
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
      return 0
    })

    return filtered
  }, [colors, sortField, sortDirection, filterAlpha])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const exportToCSV = () => {
    const headers = ['hex', 'count', 'alpha_present', 'sample_sources']
    const rows = sortedAndFilteredColors.map(color => [
      color.hex,
      color.count.toString(),
      color.alphaPresent ? 'yes' : 'no',
      color.sampleSources.join('; ')
    ])

    const csv = [headers.join(','), ...rows.map(row => row.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'color-palette.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const exportToJSON = () => {
    const json = JSON.stringify(sortedAndFilteredColors, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'color-palette.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  const copyHexList = () => {
    const hexList = sortedAndFilteredColors.map(color => color.hex).join('\n')
    navigator.clipboard.writeText(hexList).then(() => {
      alert('Hex codes copied to clipboard!')
    })
  }

  if (colors.length === 0) {
    return null
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Results</h2>
          <div className="text-sm text-gray-600 space-y-1">
            <p>Total colors found: {totalColors.toLocaleString()}</p>
            <p>Unique colors: {uniqueColors.toLocaleString()}</p>
            <p>Pages crawled: {pagesCrawled.length}</p>
            {errors.length > 0 && <p>Errors: {errors.length}</p>}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mt-4 sm:mt-0">
          <button
            onClick={exportToCSV}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
          >
            Export CSV
          </button>
          <button
            onClick={exportToJSON}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Export JSON
          </button>
          <button
            onClick={copyHexList}
            className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
          >
            Copy Hex List
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1 rounded-md text-sm font-medium ${
                viewMode === 'table'
                  ? 'bg-blue-100 text-blue-800'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Table
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1 rounded-md text-sm font-medium ${
                viewMode === 'grid'
                  ? 'bg-blue-100 text-blue-800'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Grid
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Filter:</span>
            <select
              value={filterAlpha === null ? 'all' : filterAlpha ? 'alpha' : 'no-alpha'}
              onChange={(e) => {
                const value = e.target.value
                if (value === 'all') setFilterAlpha(null)
                else if (value === 'alpha') setFilterAlpha(true)
                else setFilterAlpha(false)
              }}
              className="px-2 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All colors</option>
              <option value="alpha">With alpha</option>
              <option value="no-alpha">Without alpha</option>
            </select>
          </div>
        </div>

        <div className="text-sm text-gray-600">
          Showing {sortedAndFilteredColors.length} of {colors.length} colors
        </div>
      </div>

      {viewMode === 'table' ? (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Color
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('hex')}
                >
                  Hex
                  {sortField === 'hex' && (
                    <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('alphaPresent')}
                >
                  Alpha
                  {sortField === 'alphaPresent' && (
                    <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('count')}
                >
                  Count
                  {sortField === 'count' && (
                    <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sample Sources
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedAndFilteredColors.map((color, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div
                      className="w-8 h-8 rounded border border-gray-300"
                      style={{ backgroundColor: color.hex }}
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                    {color.hex}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {color.alphaPresent ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                        Yes
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                        No
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {color.count.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    <div className="space-y-1">
                      {color.sampleSources.map((source, idx) => (
                        <div key={idx} className="truncate max-w-xs" title={source}>
                          {source}
                        </div>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedAndFilteredColors.map((color, index) => (
            <Swatch
              key={index}
              hex={color.hex}
              alphaPresent={color.alphaPresent}
              count={color.count}
              sampleSources={color.sampleSources}
            />
          ))}
        </div>
      )}
    </div>
  )
} 