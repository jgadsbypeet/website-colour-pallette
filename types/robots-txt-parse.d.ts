declare module 'robots-txt-parse' {
  export interface Robots {
    isAllowed(url: string, userAgent: string): boolean
    getCrawlDelay(userAgent: string): number | null
  }
  
  export function parse(robotsText: string): Promise<Robots>
} 