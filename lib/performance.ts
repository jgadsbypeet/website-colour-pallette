export interface PerformanceMetrics {
  startTime: number
  endTime: number
  duration: number
  pagesProcessed: number
  colorsFound: number
  memoryUsage?: NodeJS.MemoryUsage
}

export class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = []
  private currentStart: number = 0

  start(): void {
    this.currentStart = performance.now()
  }

  end(pagesProcessed: number, colorsFound: number): PerformanceMetrics {
    const endTime = performance.now()
    const duration = endTime - this.currentStart
    
    const metric: PerformanceMetrics = {
      startTime: this.currentStart,
      endTime,
      duration,
      pagesProcessed,
      colorsFound,
      memoryUsage: process.memoryUsage?.()
    }
    
    this.metrics.push(metric)
    return metric
  }

  getAverageMetrics(): Partial<PerformanceMetrics> {
    if (this.metrics.length === 0) return {}
    
    const avg = this.metrics.reduce((acc, metric) => ({
      duration: acc.duration + metric.duration,
      pagesProcessed: acc.pagesProcessed + metric.pagesProcessed,
      colorsFound: acc.colorsFound + metric.colorsFound
    }), { duration: 0, pagesProcessed: 0, colorsFound: 0 })
    
    return {
      duration: avg.duration / this.metrics.length,
      pagesProcessed: avg.pagesProcessed / this.metrics.length,
      colorsFound: avg.colorsFound / this.metrics.length
    }
  }

  getLatestMetrics(): PerformanceMetrics | null {
    return this.metrics[this.metrics.length - 1] || null
  }

  clear(): void {
    this.metrics = []
  }
}
