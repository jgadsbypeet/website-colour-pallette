# 🚀 Deployment Guide

This guide will help you deploy your Website Color Palette Crawler to a public hosting service.

## 📋 Prerequisites

1. **GitHub Account**: You'll need a GitHub account to host your code
2. **Node.js**: Ensure you have Node.js 18+ installed locally
3. **Git**: Make sure Git is installed and configured

## 🎯 Option 1: Deploy to Vercel (Recommended)

### Step 1: Push to GitHub

```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit changes
git commit -m "Initial commit: Website Color Palette Crawler"

# Create a new repository on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git branch -M main
git push -u origin main
```

### Step 2: Deploy to Vercel

1. **Go to [vercel.com](https://vercel.com)** and sign up/login
2. **Click "New Project"**
3. **Import your GitHub repository**
4. **Configure the project:**
   - **Framework Preset**: Next.js
   - **Root Directory**: `./` (leave as default)
   - **Build Command**: `npm run build` (auto-detected)
   - **Output Directory**: `.next` (auto-detected)
   - **Install Command**: `npm install` (auto-detected)

5. **Environment Variables** (optional):
   ```
   MAX_PAGES=50
   MAX_DEPTH=3
   CRAWL_DELAY=1000
   ```

6. **Click "Deploy"**

### Step 3: Install Playwright on Vercel

After the first deployment, you'll need to install Playwright browsers:

1. **Go to your Vercel project dashboard**
2. **Click "Functions" tab**
3. **Find your API route** (e.g., `/api/crawl`)
4. **Add this build command** in your project settings:
   ```bash
   npm run build && npx playwright install --with-deps chromium
   ```

## 🌐 Option 2: Deploy to Netlify

### Step 1: Build Locally

```bash
npm run build
npm run export  # If you want static export
```

### Step 2: Deploy

1. **Go to [netlify.com](https://netlify.com)**
2. **Drag & drop your `out` folder** (for static export)
3. **Or connect your GitHub repo** for auto-deploy

## 🚂 Option 3: Deploy to Railway

### Step 1: Prepare

1. **Go to [railway.app](https://railway.app)**
2. **Connect your GitHub repo**
3. **Set build command**: `npm run build`
4. **Set start command**: `npm start`

## 🔧 Production Optimizations

### Environment Variables

Set these in your deployment platform:

```bash
NODE_ENV=production
MAX_PAGES=50
MAX_DEPTH=3
CRAWL_DELAY=1000
```

### Build Optimization

The `next.config.js` already includes:
- `output: 'standalone'` - Optimized production build
- `compress: true` - Gzip compression
- `poweredByHeader: false` - Security

## 🚨 Important Notes

### Playwright Installation

**Vercel**: Add to build command:
```bash
npm run build && npx playwright install --with-deps chromium
```

**Other platforms**: May require custom Docker setup for Playwright

### Rate Limiting

Consider implementing rate limiting for production:
- Limit concurrent crawls
- Add user authentication
- Implement API keys

### CORS & Security

For production, consider:
- Adding CORS headers
- Rate limiting
- User authentication
- API key requirements

## 🎉 After Deployment

1. **Test your deployed app**
2. **Check that crawling works**
3. **Monitor performance**
4. **Set up custom domain** (optional)

## 🆘 Troubleshooting

### Common Issues

1. **Playwright not found**: Ensure browsers are installed during build
2. **Build failures**: Check Node.js version compatibility
3. **Crawling errors**: Verify environment variables are set

### Support

- **Vercel**: [vercel.com/docs](https://vercel.com/docs)
- **Netlify**: [docs.netlify.com](https://docs.netlify.com)
- **Railway**: [docs.railway.app](https://docs.railway.app)

---

**Happy Deploying! 🚀**
