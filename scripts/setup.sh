#!/bin/bash

echo "🚀 Setting up Website Colour Palette Crawler..."

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Install Playwright browsers
echo "🌐 Installing Playwright browsers..."
npx playwright install

echo "✅ Setup complete!"
echo ""
echo "To start the development server:"
echo "  npm run dev"
echo ""
echo "To run tests:"
echo "  npm test"
echo ""
echo "To build for production:"
echo "  npm run build" 