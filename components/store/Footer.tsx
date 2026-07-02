import Link from 'next/link'
import Image from 'next/image'

export default function Footer() {
  return (
    <footer className="bg-stone-950 border-t-2 border-amber-500/40">

      {/* ── Brand header row ── */}
      <div className="max-w-6xl mx-auto px-4 pt-12 pb-8 border-b border-stone-800/60">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">

          {/* Logo + name */}
          <div className="flex items-center gap-3">
            <div className="h-14 w-14 rounded-xl overflow-hidden ring-1 ring-stone-700/70 shadow-lg shadow-black/30 shrink-0">
              <Image
                src="/logo.png"
                alt="Mrs Achcharu"
                width={200}
                height={200}
                className="h-14 w-14 object-cover"
              />
            </div>
            <div className="leading-none select-none">
              <div className="flex items-center gap-1 mb-[2px]">
                <span className="block h-px w-3 bg-green-500/70" />
                <span className="text-[8px] text-green-400 font-extrabold tracking-[0.28em] uppercase">Mrs</span>
                <span className="block h-px w-3 bg-green-500/70" />
              </div>
              <div className="font-display text-xl text-amber-400 font-bold leading-none tracking-wide">Achcharu</div>
              <div className="text-[7px] text-stone-400 tracking-[0.22em] uppercase font-medium mt-[2px]">Homemade with love</div>
            </div>
          </div>

          {/* Divider + tagline */}
          <div className="sm:ml-4 flex items-center gap-3">
            <span className="hidden sm:block w-px h-10 bg-stone-700" />
            <p className="text-stone-400 text-sm leading-relaxed max-w-xs">
              Authentic Sri Lankan pickles, crafted fresh and delivered to your door anywhere in Qatar.
            </p>
          </div>

          {/* Flag badges — right side */}
          <div className="sm:ml-auto flex items-center gap-2">
            <div className="flex items-center gap-2 bg-green-950/50 border border-green-700/30 rounded-full px-3 py-1.5">
              <img src="/flag-lk.svg" alt="Sri Lanka" width={24} height={16} className="rounded-sm" />
              <span className="text-green-300 text-xs font-semibold">Sri Lanka</span>
            </div>
            <span className="text-stone-600 text-xs">→</span>
            <div className="flex items-center gap-2 bg-red-950/40 border border-red-800/30 rounded-full px-3 py-1.5">
              <span className="text-xs font-semibold text-red-300">Qatar</span>
              <img src="/flag-qa.svg" alt="Qatar" width={24} height={16} className="rounded-sm" />
            </div>
          </div>

        </div>
      </div>

      {/* ── Three columns ── */}
      <div className="max-w-6xl mx-auto px-4 py-10 grid grid-cols-1 md:grid-cols-3 gap-10">

        {/* About */}
        <div>
          <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider flex items-center gap-2">
            <span className="block w-4 h-0.5 bg-amber-500 rounded" />
            About
          </h4>
          <p className="text-stone-400 text-sm leading-relaxed mb-4">
            Mrs Achcharu brings the taste of home to the Sri Lankan expat community in Qatar.
            Every jar is made fresh after you order — no preservatives, no shortcuts.
          </p>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs text-amber-500/80 italic font-medium">&ldquo;Authentic Taste. Pure Tradition.&rdquo;</span>
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider flex items-center gap-2">
            <span className="block w-4 h-0.5 bg-amber-500 rounded" />
            Quick Links
          </h4>
          <div className="flex flex-col gap-2.5">
            {[
              { href: '/',          label: 'Home',               icon: '🏠' },
              { href: '/products',  label: 'Shop All Jars',      icon: '🛒' },
              { href: '/customize', label: 'Customize Your Jar', icon: '/jar.png' },
              { href: '/orders',    label: 'My Orders',          icon: '📦' },
              { href: '/login',     label: 'Sign In / Register', icon: '👤' },
            ].map(l => (
              <Link key={l.href} href={l.href}
                className="flex items-center gap-2.5 text-stone-400 hover:text-amber-400 text-sm transition-colors group"
              >
                {l.icon.startsWith('/')
                  ? <img src={l.icon} alt="" className="w-4 h-4 object-contain group-hover:scale-110 transition-transform shrink-0" />
                  : <span className="text-sm group-hover:scale-110 transition-transform">{l.icon}</span>
                }
                <span>{l.label}</span>
                <span className="ml-auto text-stone-700 group-hover:text-amber-500/50 text-xs">→</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Payments & Delivery */}
        <div>
          <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider flex items-center gap-2">
            <span className="block w-4 h-0.5 bg-amber-500 rounded" />
            Payments &amp; Delivery
          </h4>
          <div className="flex flex-col gap-2.5">
            {[
              { icon: '🏦', text: 'QNB · CBQ · Doha Bank transfer' },
              { icon: '💵', text: 'Cash on Delivery available' },
              { icon: '📦', text: 'All Qatar zones covered' },
              { icon: '🏙️', text: 'Doha · Lusail · Al Wakrah · Al Khor' },
              { icon: '⚡', text: 'Same-week dispatch after verification' },
            ].map(item => (
              <div key={item.icon} className="flex items-start gap-2.5 text-stone-400 text-sm">
                <span className="shrink-0">{item.icon}</span>
                <span>{item.text}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ── Bottom bar ── */}
      <div className="border-t border-stone-800 py-5">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-stone-500 text-xs">
            © {new Date().getFullYear()} Mrs Achcharu · Handmade with ❤️ for Sri Lankans in Qatar
          </p>
          <div className="flex items-center gap-1.5">
            <span className="block h-px w-3 bg-green-500/50" />
            <span className="text-[9px] text-stone-500 tracking-[0.2em] uppercase">Homemade with love</span>
            <span className="block h-px w-3 bg-green-500/50" />
          </div>
        </div>
      </div>

    </footer>
  )
}
