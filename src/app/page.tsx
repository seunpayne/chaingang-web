export default function HomePage() {
  return (
    <main className="flex-1">
      {/* Header / Navigation */}
      <header className="bg-forest text-cream">
        <nav className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-display text-2xl font-bold text-gold">
              CHAINGANG
            </span>
            <span className="text-sm text-cream-200 hidden sm:inline">
              CYCLING CLUB ABUJA
            </span>
          </div>
          <div className="flex items-center gap-4">
            <a href="#about" className="hover:text-gold transition-colors text-sm">
              About
            </a>
            <a href="#values" className="hover:text-gold transition-colors text-sm">
              Values
            </a>
            <a href="#activities" className="hover:text-gold transition-colors text-sm">
              Ride
            </a>
            <a href="#contact" className="hover:text-gold transition-colors text-sm">
              Contact
            </a>
            <a
              href="/login"
              className="btn-primary text-sm px-4 py-2"
            >
              Member Login
            </a>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="relative bg-forest py-24">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="font-display text-5xl sm:text-6xl md:text-7xl font-black text-gold mb-6">
            Chains, Pedals &amp; Lungs
          </h1>
          <p className="text-cream text-lg sm:text-xl max-w-2xl mx-auto mb-10">
            Nigeria&apos;s foremost mountain biking club — building community,
            fitness, and adventure on the trails of Abuja since 2016.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="#about" className="btn-primary">
              Learn More
            </a>
            <a href="#contact" className="btn-secondary">
              Get In Touch
            </a>
          </div>
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16 max-w-3xl mx-auto">
            <div className="text-center">
              <div className="font-display text-3xl font-bold text-gold">120+</div>
              <div className="text-cream-200 text-sm mt-1">Active Members</div>
            </div>
            <div className="text-center">
              <div className="font-display text-3xl font-bold text-gold">2016</div>
              <div className="text-cream-200 text-sm mt-1">Established</div>
            </div>
            <div className="text-center">
              <div className="font-display text-3xl font-bold text-gold">Sat</div>
              <div className="text-cream-200 text-sm mt-1">Group Ride Day</div>
            </div>
            <div className="text-center">
              <div className="font-display text-3xl font-bold text-gold">Free</div>
              <div className="text-cream-200 text-sm mt-1">Cycling Clinics</div>
            </div>
          </div>
        </div>
      </section>

      {/* About / Who We Are */}
      <section id="about" className="py-20 bg-cream">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="font-display text-4xl font-bold text-forest text-center mb-12">
            Who We Are
          </h2>
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-lg mb-6 leading-relaxed">
              Chaingang Cycling Club is Abuja&apos;s premier mountain biking 
              community. We started in 2016 with four riders and a shared 
              passion for off-road cycling. Today, we&apos;re 120+ members strong — 
              a diverse group united by chains, pedals, and lungs.
            </p>
            <p className="text-lg leading-relaxed">
              We ride every Saturday through the rugged trails surrounding the 
              FCT. We host free cycling clinics for beginners. We give back to 
              our community through development projects. And we do it all 
              together — because the chain is only as strong as its weakest link.
            </p>
          </div>
        </div>
      </section>

      {/* Values */}
      <section id="values" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="font-display text-4xl font-bold text-forest text-center mb-12">
            Our Values
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {values.map((v) => (
              <div key={v.title} className="bg-cream-50 p-8 rounded-lg border border-cream-200">
                <h3 className="font-display text-2xl font-bold text-forest mb-3">
                  {v.title}
                </h3>
                <p className="text-forest-600">{v.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Activities */}
      <section id="activities" className="py-20 bg-cream">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="font-display text-4xl font-bold text-forest text-center mb-12">
            What We Do
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {activities.map((a) => (
              <div key={a.title} className="bg-white p-6 rounded-lg border border-cream-200">
                <h3 className="font-display text-xl font-bold text-forest mb-2">
                  {a.title}
                </h3>
                <p className="text-gold font-semibold text-sm mb-3">{a.schedule}</p>
                <p className="text-forest-600 text-sm">{a.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="py-20 bg-forest text-cream">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="font-display text-4xl font-bold text-gold mb-12">
            Get In Touch
          </h2>
          <div className="max-w-xl mx-auto space-y-4">
            <p>
              <a href="mailto:info@chaingang.ng" className="text-gold hover:underline">
                info@chaingang.ng
              </a>
            </p>
            <p>
              <a href="tel:+2347066399546" className="text-gold hover:underline">
                +234 706 639 9546
              </a>
            </p>
            <p className="text-cream-200">
              3 Agapitus Street, Rainbow Estate, Pyakkasa, Abuja
            </p>
          </div>
          {/* Social Links */}
          <div className="flex justify-center gap-6 mt-8">
            {socialLinks.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-cream-200 hover:text-gold transition-colors"
                aria-label={s.label}
              >
                {s.label}
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-forest-900 text-cream-200 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm">
          <p>
            &copy; {new Date().getFullYear()} Chaingang Cycling Club Abuja. 
            CAC Reg: 163297. All rights reserved.
          </p>
          <p className="mt-2">
            Built with ❤️ by the Chaingang community.
          </p>
        </div>
      </footer>
    </main>
  )
}

// Static content per PRD
const values = [
  {
    title: 'Community',
    description:
      'We believe in the power of shared experience. Every rider, regardless of skill level, belongs. Our strength is in our diversity — from beginners to seasoned riders, we ride as one chain.',
  },
  {
    title: 'Excellence',
    description:
      'We push ourselves and each other to be better — on the bike and off. We celebrate personal bests, support growth, and hold ourselves to high standards in everything we do.',
  },
  {
    title: 'Adventure',
    description:
      "The FCT's trails are our playground. We explore, we discover, we push boundaries. Every ride is an opportunity to see Abuja from a new perspective — through dirt, sweat, and scenery.",
  },
  {
    title: 'Service',
    description:
      'We ride for more than ourselves. Our free cycling clinics, community development projects, and youth engagement programmes ensure the next generation of Abuja riders has a path to follow.',
  },
]

const activities = [
  {
    title: 'Saturday Group Ride',
    schedule: 'Every Saturday, 7:00 AM',
    description:
      'Our flagship ride — 30-50km of off-road trails through the FCT. All skill levels welcome. Meet at the club start point.',
  },
  {
    title: 'Wednesday Midweek Ride',
    schedule: 'Every Wednesday, 7:00 PM',
    description:
      'Night ride with lights. Shorter, faster, and fun. Perfect midweek workout to keep the legs spinning.',
  },
  {
    title: 'Free Cycling Clinics',
    schedule: 'Last Saturday of each month',
    description:
      'Beginner-friendly skills sessions covering bike handling, trail etiquette, maintenance basics, and safety. Open to the public.',
  },
  {
    title: 'Community Development',
    schedule: 'Quarterly',
    description:
      'Trail maintenance, community clean-ups, and youth cycling programmes. Giving back to the communities we ride through.',
  },
  {
    title: 'Club Socials',
    schedule: 'Monthly',
    description:
      'Post-ride hangouts, BBQ sessions, film nights, and the occasional road trip. Because cycling is better with friends.',
  },
]

const socialLinks = [
  { label: 'Instagram', href: 'https://instagram.com/chaingangabuja' },
  { label: 'Strava', href: 'https://strava.com/clubs/chaingangabuja' },
  { label: 'Facebook', href: 'https://facebook.com/chaingangabuja' },
  { label: 'Twitter / X', href: 'https://x.com/chaingangabuja' },
]
