import type { Metadata } from 'next'
import './globals.css'
import PageTransition from '@/components/PageTransition'

const SITE_URL = 'https://gnulinuxbe.github.io'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: 'Linux па-беларуску', template: '%s — Linux па-беларуску' },
  description: 'Свабоднае праграмнае забеспячэнне на роднай мове — пераклады, слоўнікі, праекты',
  keywords: ['Linux', 'беларуская мова', 'пераклад', 'свабоднае ПА', 'open source', 'GNU'],
  alternates: { canonical: SITE_URL },
  openGraph: {
    siteName: 'Linux па-беларуску',
    title: 'Linux па-беларуску',
    description: 'Свабоднае праграмнае забеспячэнне на роднай мове',
    images: [{ url: '/banner.png', width: 1200, height: 630, alt: 'Linux па-беларуску' }],
    locale: 'be_BY',
    type: 'website',
    url: SITE_URL,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Linux па-беларуску',
    description: 'Свабоднае праграмнае забеспячэнне на роднай мове',
    images: ['/banner.png'],
  },
  robots: { index: true, follow: true },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Linux па-беларуску',
  description: 'Свабоднае праграмнае забеспячэнне на роднай мове',
  url: SITE_URL,
  inLanguage: 'be',
  potentialAction: {
    '@type': 'SearchAction',
    target: { '@type': 'EntryPoint', urlTemplate: `${SITE_URL}/peraklady/?q={search_term_string}` },
    'query-input': 'required name=search_term_string',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="be">
      <head>
        <link rel="icon" href="/ava-gnu.png"/>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}/>
      </head>
      <body><PageTransition/>{children}</body>
    </html>
  )
}
