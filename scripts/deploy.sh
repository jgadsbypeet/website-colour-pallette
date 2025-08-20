#!/bin/bash

# 🚀 Website Color Palette Crawler - Deployment Script
# This script helps you deploy your app to Vercel

echo "🚀 Starting deployment process..."

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "❌ Git not initialized. Please run:"
    echo "   git init"
    echo "   git add ."
    echo "   git commit -m 'Initial commit'"
    exit 1
fi

# Check if remote origin is set
if ! git remote get-url origin > /dev/null 2>&1; then
    echo "❌ No remote origin set. Please run:"
    echo "   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git"
    exit 1
fi

# Build the project
echo "🔨 Building project..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed. Please fix the errors and try again."
    exit 1
fi

echo "✅ Build successful!"

# Push to GitHub
echo "📤 Pushing to GitHub..."
git add .
git commit -m "Deploy: $(date)"
git push origin main

if [ $? -ne 0 ]; then
    echo "❌ Push failed. Please check your git configuration."
    exit 1
fi

echo "✅ Code pushed to GitHub!"

# Deploy to Vercel
echo "🌐 Deploying to Vercel..."
if command -v vercel &> /dev/null; then
    vercel --prod
else
    echo "📋 Vercel CLI not installed. Please:"
    echo "   1. Install Vercel CLI: npm i -g vercel"
    echo "   2. Run: vercel --prod"
    echo "   OR deploy manually at: https://vercel.com"
fi

echo "🎉 Deployment process completed!"
echo "📖 Check DEPLOYMENT.md for detailed instructions."
