# Website Colour Palette Crawler

A web application that crawls websites and extracts color palettes with usage statistics. Built with Next.js 14, TypeScript, and Playwright for robust web crawling capabilities.

## Features

- **Comprehensive Color Extraction**: Parses colors from CSS files, inline styles, style attributes, and computed DOM styles
- **Multiple Color Formats**: Supports hex, RGB, RGBA, HSL, HSLA, and CSS named colors
- **CSS Variable Resolution**: Automatically resolves CSS custom properties and their color values
- **Smart Deduplication**: Uses LAB color space for near-duplicate detection and filtering
- **Robots.txt Compliance**: Respects website crawling policies by default
- **Export Options**: CSV, JSON, and hex code list exports
- **Real-time Progress**: Live progress tracking during crawling operations
- **Responsive UI**: Modern, mobile-friendly interface built with Tailwind CSS

## Tech Stack

- **Frontend**: Next.js 14 with App Router, React 18, TypeScript
- **Styling**: Tailwind CSS
- **Web Crawling**: Playwright (headless browser automation)
- **HTML Parsing**: Cheerio
- **CSS Parsing**: PostCSS with value parser
- **Color Processing**: Colord with LAB color space support
- **Robots.txt**: robots-txt-parse
- **Testing**: Jest with React Testing Library

## Prerequisites

- Node.js 18+ 
- npm or yarn
- Playwright browsers (installed automatically)

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd website-colour-palette
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Install Playwright browsers**
   ```bash
   npx playwright install
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Usage

### Basic Crawling

1. **Enter a website URL** in the input field
2. **Configure crawl settings**:
   - **Max Pages**: Maximum number of pages to crawl (default: 200)
   - **Max Depth**: Maximum link depth to follow (default: 3)
   - **Include Subdomains**: Whether to crawl subdomains
   - **Bypass robots.txt**: Only enable if you own the site
   - **Min Occurrence Count**: Filter colors by minimum usage count
   - **Near-Duplicate Delta**: LAB color space threshold for filtering similar colors

3. **Click "Start Crawl"** to begin the crawling process

### Advanced Features

- **Real-time Progress**: Monitor crawling progress with live updates
- **Color Filtering**: Filter results by alpha channel presence
- **View Modes**: Switch between table and grid views
- **Sorting**: Sort by hex code, count, or alpha presence
- **Export Options**: Download results as CSV or JSON, or copy hex codes

## Configuration

### Crawl Limits

- **Default max pages**: 200
- **Default max depth**: 3
- **Minimum crawl delay**: 1 second (respects robots.txt)
- **Request timeout**: 30 seconds per page

### Color Processing

- **Normalization**: All colors converted to 6-digit hex (uppercase)
- **Alpha handling**: Alpha values tracked separately from main color count
- **LAB conversion**: Colors converted to LAB color space for accurate similarity detection
- **Near-duplicate filtering**: Uses Euclidean distance in LAB space

## API Reference

### Server Actions

The application uses Next.js server actions for backend functionality:

- `startCrawl(url, options)`: Initiates a new crawl
- `getCrawlProgress()`: Returns current crawl progress
- `getCrawlResults()`: Returns final crawl results
- `cancelCrawl()`: Cancels the current crawl

### Data Structures

```typescript
interface CrawlOptions {
  maxPages: number
  maxDepth: number
  includeSubdomains: boolean
  bypassRobots: boolean
  minCount: number
  nearDuplicateDelta: number
}

interface NormalizedColor {
  hex: string
  alphaPresent: boolean
  count: number
  sampleSources: string[]
  lab: { l: number; a: number; b: number }
}
```

## Testing

Run the test suite:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm test -- --coverage
```

### Test Coverage

- **Color utilities**: Parsing, normalization, filtering, and export functions
- **CSS parsing**: HTML and CSS color extraction
- **Robots.txt handling**: Compliance checking and URL filtering
- **Integration tests**: End-to-end crawl functionality

## Performance Considerations

### Memory Usage

- **In-memory storage**: All crawl data stored in memory (no database)
- **CSS caching**: External CSS files cached during crawl to avoid refetching
- **Element sampling**: Limited DOM element sampling for computed styles

### Rate Limiting

- **Respects robots.txt**: Automatically follows crawl delay directives
- **Minimum delays**: 1-second minimum between requests
- **User agent**: Polite, identifiable user agent string

### Scalability

- **Page limits**: Configurable maximum page count
- **Depth limits**: Configurable link depth traversal
- **Cancellation**: Crawl can be cancelled at any time

## Ethical Considerations

### Responsible Crawling

- **Robots.txt compliance**: Enabled by default
- **Rate limiting**: Respects website performance
- **User agent identification**: Clear identification of crawler purpose
- **Ownership verification**: Bypass option only for site owners

### Best Practices

- **Test on your own sites first**
- **Respect crawl limits and delays**
- **Monitor for errors and adjust settings**
- **Use appropriate depth and page limits**

## Troubleshooting

### Common Issues

1. **Playwright installation errors**
   ```bash
   npx playwright install --force
   ```

2. **Memory issues with large sites**
   - Reduce max pages and depth
   - Increase crawl delays
   - Monitor system resources

3. **Timeout errors**
   - Check network connectivity
   - Increase timeout values in code
   - Verify target site accessibility

4. **Color parsing issues**
   - Check browser console for errors
   - Verify CSS syntax in target site
   - Test with simpler sites first

### Debug Mode

Enable detailed logging by setting environment variables:

```bash
DEBUG=playwright:* npm run dev
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- **Playwright**: For robust web automation capabilities
- **Colord**: For comprehensive color manipulation and conversion
- **Tailwind CSS**: For the beautiful, responsive UI components
- **Next.js**: For the modern React framework and server actions

## Support

For issues, questions, or contributions:

1. Check the troubleshooting section above
2. Review existing GitHub issues
3. Create a new issue with detailed information
4. Include error messages, browser console logs, and reproduction steps 