@echo off
echo 🚀 Setting up Website Colour Palette Crawler...

REM Install dependencies
echo 📦 Installing dependencies...
npm install

REM Install Playwright browsers
echo 🌐 Installing Playwright browsers...
npx playwright install

echo ✅ Setup complete!
echo.
echo To start the development server:
echo   npm run dev
echo.
echo To run tests:
echo   npm test
echo.
echo To build for production:
echo   npm run build
pause 