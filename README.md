# 🎨 Website Color Palette Crawler

A web application that crawls websites and extracts all color values from pages and stylesheets, normalizing them to 6-digit hex codes and displaying a unique list with usage counts.

## ✨ Features

- **Multi-format Support**: Hex, RGB/RGBA, HSL/HSLA, named colors, CSS variables
- **CSS Variable Resolution**: Automatically resolves CSS custom properties
- **Smart Deduplication**: Removes duplicate colors and counts occurrences
- **Advanced Filtering**: Filter by minimum occurrence and near-duplicates (LAB delta E)
- **Export Options**: CSV, JSON, and hex list formats
- **Respectful Crawling**: Follows robots.txt, configurable depth and page limits
- **Serverless Compatible**: Works on Vercel and other serverless platforms

## 🚀 Tech Stack

- **Frontend**: Next.js 14 with App Router, TypeScript, Tailwind CSS
- **Crawling**: Serverless-compatible crawler using native fetch API
- **Color Processing**: Colord with LAB plugin for color conversions
- **CSS Parsing**: PostCSS and postcss-value-parser
- **Deployment**: Vercel (serverless-optimized)

## 🛠️ Setup

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation
```bash
# Clone the repository
git clone <your-repo-url>
cd website-colour-pallette

# Install dependencies
npm install

# Start development server
npm run dev
```

### Environment Variables
Copy `env.example` to `.env.local` and configure:
```bash
MAX_PAGES=50
MAX_DEPTH=3
CRAWL_DELAY=1000
USER_AGENT=Website-Color-Palette-Crawler/1.0
```

## 🎯 Usage

1. **Enter a URL** to crawl
2. **Configure options**:
   - Max Pages: Limit total pages crawled
   - Max Depth: Limit crawl depth
   - Include Subdomains: Crawl subdomains
   - Bypass robots.txt: Skip robots.txt checking
   - Min Count: Filter colors by minimum occurrence
   - Near Duplicate Delta: LAB color space threshold

3. **Start crawling** and monitor progress
4. **View results** in table or grid format
5. **Export data** in your preferred format

## 🔧 Development

### Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run test         # Run tests
npm run test:watch   # Run tests in watch mode
```

### Project Structure
```
├── app/                 # Next.js App Router pages
├── components/          # React components
├── lib/                 # Utility libraries
├── scripts/             # Build and deployment scripts
├── test-site/           # Local test site for development
└── __tests__/           # Test files
```

## 🚀 Deployment

### Vercel (Recommended)
1. Push code to GitHub
2. Import repository in Vercel
3. Deploy automatically

### Manual Deployment
```bash
# Build the project
npm run build

# Deploy using Vercel CLI
vercel --prod
```

## 🧪 Testing

### Unit Tests
```bash
npm run test
```

### Integration Tests
```bash
# Start test server
cd test-site && python3 -m http.server 8000

# Run tests
npm run test
```

## 📊 Performance

- **Serverless Optimized**: No browser binaries needed
- **Efficient Parsing**: Regex-based HTML parsing
- **Smart Caching**: CSS file caching to avoid re-downloads
- **Rate Limiting**: Configurable delays between requests

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🆘 Support

- **Issues**: Create a GitHub issue
- **Documentation**: Check the code comments and README
- **Deployment**: See `DEPLOYMENT.md` for detailed guides

---

**Last Updated**: August 20, 2025 - Serverless deployment ready! 🚀 