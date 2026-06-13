import type { Metadata } from 'next'
import './globals.css'
import PageTransition from '@/components/PageTransition'

export const metadata: Metadata = {
  title: 'Linux па-беларуску',
  description: 'Свабоднае праграмнае забеспячэнне на роднай мове',
  openGraph: {
    siteName: 'Linux па-беларуску',
    title: 'Linux па-беларуску',
    description: 'Свабоднае праграмнае забеспячэнне на роднай мове',
    images: ['/banner.png'],
    locale: 'be',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="be">
      <head><link rel="icon" href="/ava-gnu.png"/></head>
      <body><PageTransition/>{children}</body>
    </html>
  )
}
