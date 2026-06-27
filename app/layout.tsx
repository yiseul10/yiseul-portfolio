import "@styles/globals.css";
import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { Newsreader, Manrope } from 'next/font/google'
import { Navbar } from './components/nav'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'
import Footer from './components/footer'
import { Toaster } from "sonner";
import { ChatBot } from './components/chatbot/ChatBot'
import { siteUrl } from '@lib/site'

const newsreader = Newsreader({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-newsreader',
  display: 'swap',
})

const manrope = Manrope({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-manrope',
  display: 'swap',
})

const baseUrl = siteUrl

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: 'Kim Yiseul | Frontend Engineer',
    template: '%s | Kim Yiseul',
  },
  description:
    'Workflow automation, AI-powered internal tools, data visualization, and product ownership by Kim Yiseul.',
  openGraph: {
    title: 'Kim Yiseul | Frontend Engineer',
    description:
      'Selected work on workflow automation, AI-enabled internal tools, data visualization, and product ownership.',
    url: baseUrl,
    siteName: 'Kim Yiseul Portfolio',
    locale: 'ko-KR',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Kim Yiseul | Frontend Engineer',
    description:
      'Workflow automation, AI-powered internal tools, data visualization, and product ownership.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

const cx = (...classes) => classes.filter(Boolean).join(' ')

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="ko"
      className={cx(
        'text-black   dark:text-white dark:bg-black',
        GeistSans.variable,
        GeistMono.variable,
        newsreader.variable,
        manrope.variable
      )}
    >
    <body className="antialiased mx-4 mt-0 lg:mx-auto min-h-screen flex flex-col max-w-2xl has-[.editor-page]:max-w-4xl has-[.report-page]:max-w-6xl">
    <main className="min-w-0 mt-2 flex flex-col px-2 md:px-0 flex-1">
      <Navbar />
      {children}
      <Toaster />
    </main>
    <Footer />
    <ChatBot />
    <Analytics />
    <SpeedInsights />
    </body>
    </html>
  )
}
