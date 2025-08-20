'use client'

interface SwatchProps {
  hex: string
  alphaPresent: boolean
  count: number
  sampleSources: string[]
}

export default function Swatch({ hex, alphaPresent, count, sampleSources }: SwatchProps) {
  return (
    <div className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
      <div className="flex-shrink-0">
        <div
          className="w-12 h-12 rounded-lg border border-gray-300 shadow-sm"
          style={{ backgroundColor: hex }}
        />
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2 mb-1">
          <span className="font-mono font-bold text-gray-900">{hex}</span>
          {alphaPresent && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
              Alpha
            </span>
          )}
        </div>
        
        <div className="text-sm text-gray-600 mb-1">
          Count: {count.toLocaleString()}
        </div>
        
        {sampleSources.length > 0 && (
          <div className="text-xs text-gray-500">
            <div className="font-medium mb-1">Sample sources:</div>
            <div className="space-y-1">
              {sampleSources.map((source, index) => (
                <div key={index} className="truncate" title={source}>
                  {source}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 