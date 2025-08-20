#!/usr/bin/env node

const { CrawlQueue } = require('../lib/crawlQueue')
const { normalizeColor, filterNearDuplicates } = require('../lib/colorUtils')

async function runDemo() {
  console.log('🎨 Website Colour Palette Crawler Demo')
  console.log('=====================================\n')

  // Example URL - replace with a real site you own or have permission to crawl
  const testUrl = 'https://example.com'
  
  console.log(`Testing crawler with: ${testUrl}`)
  console.log('Note: This is a demo URL. Replace with a real site you own.\n')

  const options = {
    maxPages: 5,
    maxDepth: 2,
    includeSubdomains: false,
    bypassRobots: false, // Always respect robots.txt in demo
    minCount: 1,
    nearDuplicateDelta: 0
  }

  console.log('Crawl options:', options)
  console.log('')

  try {
    const crawler = new CrawlQueue(testUrl, options)
    
    console.log('🚀 Starting crawl...')
    console.log('(This may take a few minutes depending on the site)\n')
    
    // Start crawling
    await crawler.start()
    
    // Get results
    const result = crawler.getResult()
    
    console.log('✅ Crawl complete!')
    console.log('')
    console.log('📊 Results:')
    console.log(`  Pages crawled: ${result.pagesCrawled.length}`)
    console.log(`  Total colors found: ${result.totalColors}`)
    console.log(`  Unique colors: ${result.uniqueColors}`)
    console.log(`  Errors: ${result.errors.length}`)
    
    if (result.errors.length > 0) {
      console.log('\n❌ Errors encountered:')
      result.errors.forEach(error => console.log(`  - ${error}`))
    }
    
    if (result.colors.length > 0) {
      // Normalize colors
      const normalized = normalizeColor(result.colors)
      
      console.log('\n🎨 Color Analysis:')
      console.log(`  Normalized colors: ${normalized.length}`)
      
      // Show top colors by count
      const topColors = normalized
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)
      
      console.log('\n🏆 Top 10 colors by usage:')
      topColors.forEach((color, index) => {
        console.log(`  ${index + 1}. ${color.hex} (${color.count} times)`)
        if (color.alphaPresent) {
          console.log(`     Has alpha channel`)
        }
        if (color.sampleSources.length > 0) {
          console.log(`     Sample source: ${color.sampleSources[0]}`)
        }
      })
      
      // Test near-duplicate filtering
      if (normalized.length > 1) {
        console.log('\n🔍 Testing near-duplicate filtering...')
        const filtered = filterNearDuplicates(normalized, 5)
        console.log(`  Colors after filtering (delta=5): ${filtered.length}`)
        console.log(`  Removed ${normalized.length - filtered.length} near-duplicates`)
      }
    }
    
  } catch (error) {
    console.error('❌ Demo failed:', error.message)
    console.log('\n💡 Tips:')
    console.log('  - Make sure you have a working internet connection')
    console.log('  - Try with a different URL')
    console.log('  - Check that the site allows crawling')
    console.log('  - Consider using the bypass option for sites you own')
  }
}

// Run the demo
runDemo().catch(console.error) 