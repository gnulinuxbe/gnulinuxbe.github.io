import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Linux па-беларуску',
  description: 'Свабоднае праграмнае забеспячэнне на роднай мове',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="be">
      <head><link rel="icon" href="/ava-gnu.png"/></head>
      <body>{children}</body>
    </html>
  )
}
