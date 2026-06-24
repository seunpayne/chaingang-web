import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/react'
import Ticker from '@/components/Ticker'
import { getActiveAnnouncements } from '@/app/actions/announcements'
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

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const announcements = await getActiveAnnouncements()
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://chaingang.ng'

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SportsOrganization',
    name: 'Chaingang Cycling Club Abuja',
    alternateName: 'Chaingang CC Abuja',
    url: siteUrl,
    logo: `${siteUrl}/logo.png`,
    description:
      "Nigeria's foremost mountain biking club based in Abuja. Weekly off-road rides, cycling clinics, and community projects across the FCT.",
    foundingDate: '2016',
    address: {
      '@type': 'PostalAddress',
      streetAddress: '3 Agapitus Street, Rainbow Estate, Pyakkasa',
      addressLocality: 'Abuja',
      addressRegion: 'FCT',
      addressCountry: 'NG',
    },
    email: 'info@chaingang.ng',
    telephone: '+2347066399546',
    sameAs: [
      'https://instagram.com/chaingangabuja',
      'https://strava.com/clubs/chaingangabuja',
      'https://facebook.com/chaingangabuja',
      'https://x.com/chaingangabuja',
    ],
  }

  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-screen flex flex-col">
        <Ticker announcements={announcements} />
        {children}
        <Analytics />
      </body>
    </html>
  )
}
