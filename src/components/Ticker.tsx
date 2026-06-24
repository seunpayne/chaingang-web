interface TickerAnnouncement {
  id: string
  title: string
  type: string
}

interface TickerProps {
  announcements: TickerAnnouncement[]
}

const FALLBACK_ITEMS = [
  '🚴 Saturday Group Ride — 7AM every Saturday. All skill levels welcome!',
  '🏔️ Free Cycling Clinics — Last Saturday of each month. Open to the public.',
  '📸 Follow us on Instagram @chaingangabuja for ride photos and updates.',
  '⛓️ Chains, Pedals & Lungs — Est. 2016. 120+ members strong.',
]

export default function Ticker({ announcements }: TickerProps) {
  const tickerItems =
    announcements.length > 0
      ? announcements.map((a) => {
          const icon = a.type === 'Urgent' ? '⚠️' : a.type === 'Event' ? '📅' : 'ℹ️'
          return `${icon} ${a.title}`
        })
      : FALLBACK_ITEMS

  // Duplicate items for seamless infinite scroll
  const items = [...tickerItems, ...tickerItems]

  return (
    <div className="bg-gold text-forest overflow-hidden py-2">
      <div className="ticker-animate whitespace-nowrap flex">
        {items.map((item, i) => (
          <span key={i} className="inline-block px-8 font-semibold shrink-0">
            {item}
          </span>
        ))}
      </div>
    </div>
  )
}
