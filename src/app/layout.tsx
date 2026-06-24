import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/react'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'Chaingang Cycling Club Abuja — Chains, Pedals & Lungs',
    template: '%s | Chaingang Cycling Club Abuja',
  },
  description:
    "Nigeria's foremost mountain biking club based in Abuja. Weekly off-road rides, cycling clinics, and community projects across the FCT.",
  keywords: ['mountain bike Abuja', 'cycling club Nigeria', 'MTB Abuja', 'Chaingang Cycling Club'],
  openGraph: {
    type: 'website',
    locale: 'en_NG',
    url: process.env.NEXT_PUBLIC_SITE_URL,
    siteName: 'Chaingang Cycling Club Abuja',
    title: 'Chaingang Cycling Club Abuja — Chains, Pedals & Lungs',
    description:
      "Nigeria's foremost mountain biking club based in Abuja. Weekly off-road rides, cycling clinics, and community projects across the FCT.",
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Chaingang Cycling Club Abuja',
    description:
      "Nigeria's foremost mountain biking club based in Abuja. Weekly off-road rides, cycling clinics, and community projects across the FCT.",
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">
        {/* Ticker placeholder — will be replaced by real component in T-005 */}
        {children}
        <Analytics />
      </body>
    </html>
  )
}
