import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Website Color Palette Crawler',
  description: 'Extract color palettes from websites with usage statistics',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {/* Serverless deployment ready - no Playwright dependencies */}
        {children}
      </body>
    </html>
  )
} 