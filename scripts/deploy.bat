@echo off
REM 🚀 Website Color Palette Crawler - Deployment Script (Windows)
REM This script helps you deploy your app to Vercel

echo 🚀 Starting deployment process...

REM Check if git is initialized
if not exist ".git" (
    echo ❌ Git not initialized. Please run:
    echo    git init
    echo    git add .
    echo    git commit -m "Initial commit"
    pause
    exit /b 1
)

REM Check if remote origin is set
git remote get-url origin >nul 2>&1
if errorlevel 1 (
    echo ❌ No remote origin set. Please run:
    echo    git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
    pause
    exit /b 1
)

REM Build the project
echo 🔨 Building project...
call npm run build

if errorlevel 1 (
    echo ❌ Build failed. Please fix the errors and try again.
    pause
    exit /b 1
)

echo ✅ Build successful!

REM Push to GitHub
echo 📤 Pushing to GitHub...
git add .
git commit -m "Deploy: %date% %time%"
git push origin main

if errorlevel 1 (
    echo ❌ Push failed. Please check your git configuration.
    pause
    exit /b 1
)

echo ✅ Code pushed to GitHub!

REM Deploy to Vercel
echo 🌐 Deploying to Vercel...
vercel --prod >nul 2>&1
if errorlevel 1 (
    echo 📋 Vercel CLI not installed. Please:
    echo    1. Install Vercel CLI: npm i -g vercel
    echo    2. Run: vercel --prod
    echo    OR deploy manually at: https://vercel.com
) else (
    echo ✅ Deployed to Vercel!
)

echo 🎉 Deployment process completed!
echo 📖 Check DEPLOYMENT.md for detailed instructions.
pause
