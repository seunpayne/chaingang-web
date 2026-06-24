import { ImageResponse } from 'next/og'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'edge'
export const alt = 'Chaingang Cycling Club Abuja'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

export default async function Image({
  params,
}: {
  params: { slug: string }
}) {
  const supabase = await createClient()
  const { data: post } = await supabase
    .from('news_posts')
    .select('title, category')
    .eq('slug', params.slug)
    .single()

  const title = post?.title || 'Chaingang Cycling Club Abuja'
  const category = post?.category || 'News'

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'center',
          backgroundColor: '#1B3A1F',
          padding: '80px',
          fontFamily: '"Barlow Condensed", sans-serif',
        }}
      >
        {/* Top Accent Line */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '8px',
            backgroundColor: '#D4B800',
          }}
        />

        {/* Category Badge */}
        <div
          style={{
            display: 'flex',
            backgroundColor: '#D4B800',
            color: '#1B3A1F',
            padding: '8px 24px',
            borderRadius: '999px',
            fontSize: '24px',
            fontWeight: 700,
            marginBottom: '32px',
          }}
        >
          {category}
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: '64px',
            fontWeight: 900,
            color: '#F5F0E8',
            lineHeight: 1.1,
            maxWidth: '1000px',
          }}
        >
          {title}
        </div>

        {/* Footer */}
        <div
          style={{
            position: 'absolute',
            bottom: '40px',
            left: '80px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
          }}
        >
          <div
            style={{
              fontSize: '28px',
              fontWeight: 700,
              color: '#D4B800',
            }}
          >
            CHAINGANG
          </div>
          <div
            style={{
              fontSize: '18px',
              color: '#9EC2A2',
            }}
          >
            Cycling Club Abuja · Chains, Pedals & Lungs
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
