import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="bg-stone-950">

      {/* ── Hero ── */}
      <section className="relative bg-stone-950 overflow-hidden min-h-[90vh] flex items-center">
        <div className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `
              radial-gradient(ellipse at 10% 60%, rgba(234,88,12,0.25) 0%, transparent 55%),
              radial-gradient(ellipse at 90% 10%, rgba(234,179,8,0.15) 0%, transparent 45%),
              radial-gradient(ellipse at 70% 90%, rgba(22,163,74,0.12) 0%, transparent 40%)
            `
          }}
        />

        <div className="relative max-w-6xl mx-auto px-4 py-20 grid grid-cols-1 md:grid-cols-2 gap-12 items-center w-full">
          <div className="flex flex-col gap-6">
            {/* Origin badges */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-3 bg-stone-900 border border-green-500/40 rounded-2xl px-4 py-3 shadow-[0_0_20px_rgba(34,197,94,0.12)]">
                <img src="/flag-lk.svg" alt="Sri Lanka" width={40} height={27} className="rounded-sm shadow-md shrink-0" />
                <div className="leading-none">
                  <div className="text-green-400 text-sm font-bold tracking-wide">Sri Lankan</div>
                  <div className="text-stone-500 text-[10px] tracking-widest uppercase mt-0.5">Origin</div>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <span className="block w-4 h-px bg-amber-500/40" />
                <span className="text-amber-500 text-base">✦</span>
                <span className="block w-4 h-px bg-amber-500/40" />
              </div>

              <div className="flex items-center gap-3 bg-stone-900 border border-red-500/35 rounded-2xl px-4 py-3 shadow-[0_0_20px_rgba(239,68,68,0.10)]">
                <div className="leading-none">
                  <div className="text-red-400 text-sm font-bold tracking-wide">Made in Qatar</div>
                  <div className="text-stone-500 text-[10px] tracking-widest uppercase mt-0.5">Handcrafted</div>
                </div>
                <img src="/flag-qa.svg" alt="Qatar" width={40} height={27} className="rounded-sm shadow-md shrink-0" />
              </div>
            </div>

            <h1 className="font-display text-4xl md:text-5xl xl:text-6xl text-white font-bold leading-tight">
              Missing the Taste
              <br />
              <span className="text-amber-400">of Home?</span>
            </h1>

            <p className="text-stone-300 text-lg leading-relaxed max-w-md">
              Authentic Sri Lankan Achcharu — handmade fresh in Qatar by Mrs Achcharu.
              The same tangy, spicy, mustard-kissed flavour your Amma made back home.
              Delivered to your door anywhere in Qatar.
            </p>

            <div className="flex flex-wrap gap-3">
              <Link href="/products"
                className="bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold px-8 py-3.5 rounded-xl transition-colors text-base shadow-lg shadow-amber-500/20"
              >
                Order Now
              </Link>
              <Link href="/customize"
                className="bg-stone-800 hover:bg-stone-700 border border-stone-700 text-white font-semibold px-8 py-3.5 rounded-xl transition-colors text-base"
              >
                Build Your Jar
              </Link>
            </div>

            <div className="flex flex-wrap gap-4 pt-2">
              <div className="flex items-center gap-2 text-stone-300 text-sm">
                <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
                Delivery across all Qatar zones
              </div>
              <div className="flex items-center gap-2 text-stone-300 text-sm">
                <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
                QNB · CBQ · Doha Bank · COD
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center gap-4 md:gap-6">

            {/* Left — tags rise upward one by one */}
            <div className="hidden sm:block relative overflow-hidden shrink-0 h-56 w-[130px]">
              {[
                { emoji: '🥭', label: 'Amba Achcharu',   delay: '0s'   },
                { emoji: '🫒', label: 'Veralu Achcharu',  delay: '-2s'  },
                { emoji: '🍎', label: 'Jambu Achcharu',   delay: '-4s'  },
                { emoji: '🍐', label: 'Pera Achcharu',    delay: '-6s'  },
              ].map(t => (
                <div
                  key={t.label}
                  className="absolute left-0 top-0 bg-stone-800/90 border border-stone-700 rounded-full px-3 py-1.5 text-xs text-stone-200 font-medium flex items-center gap-2 whitespace-nowrap"
                  style={{ animation: `riseUp 8s linear ${t.delay} infinite both` }}
                >
                  <span>{t.emoji}</span><span>{t.label}</span>
                </div>
              ))}
            </div>

            {/* Circle + label */}
            <div className="flex flex-col items-center gap-3 shrink-0">
              <div className="w-56 h-56 sm:w-64 sm:h-64 md:w-72 md:h-72 rounded-full border border-amber-500/20 flex items-center justify-center">
                <img src="/jar.png" alt="Achcharu Jar" className="w-full h-full object-contain" />
              </div>
              <div className="text-center">
                <div className="font-display text-amber-400 text-xl font-bold">Fresh to Order</div>
                <div className="text-stone-400 text-sm mt-0.5">Made daily · No preservatives</div>
              </div>
            </div>

            {/* Right — tags sink downward one by one */}
            <div className="hidden sm:block relative overflow-hidden shrink-0 h-56 w-[150px]">
              {[
                { emoji: '🌶️', label: 'Ghost Pepper',     delay: '0s'   },
                { emoji: '🌿', label: 'No Preservatives',  delay: '-2s'  },
                { emoji: '🚗', label: 'Qatar Delivery',    delay: '-4s'  },
                { emoji: '✋', label: 'Handmade Daily',    delay: '-6s'  },
              ].map(t => (
                <div
                  key={t.label}
                  className="absolute left-0 top-0 bg-stone-800/90 border border-stone-700 rounded-full px-3 py-1.5 text-xs text-stone-200 font-medium flex items-center gap-2 whitespace-nowrap"
                  style={{ animation: `sinkDown 8s linear ${t.delay} infinite both` }}
                >
                  <span>{t.emoji}</span><span>{t.label}</span>
                </div>
              ))}
            </div>

          </div>
        </div>
      </section>

      {/* ── Qatar community bar ── */}
      <section className="bg-amber-500 py-3">
        <div className="max-w-6xl mx-auto px-4 flex flex-wrap justify-center gap-x-8 gap-y-1 text-stone-900 text-sm font-semibold">
          <span>🏙️ Delivering to Doha · Al Wakrah · Al Khor · Lusail</span>
          <span>🤝 Mrs Achcharu — Trusted by Sri Lankans across Qatar</span>
          <span>🚗 Same-week delivery</span>
        </div>
      </section>

      {/* ── Why Achcharu Qatar ── */}
      <section className="max-w-6xl mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <span className="text-amber-500 text-sm font-semibold uppercase tracking-widest">Why Choose Us</span>
          <h2 className="font-display text-3xl md:text-4xl text-white font-bold mt-2">
            Why Sri Lankan Expats Choose Mrs Achcharu
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: '/jar.png', title: 'Made Fresh, Every Order', desc: 'No shelf-sitting jars. Your Achcharu is prepared after you order — same traditional recipe, freshest possible flavour.' },
            { icon: '🏦', title: 'Qatar-Friendly Payments', desc: 'Pay via QNB, CBQ, or Doha Bank direct transfer. Upload your receipt and we verify. No foreign cards needed. COD also available.' },
            { icon: '📍', title: 'Qatar Address System', desc: "We understand Qatar's zone/street/building address system. No confusing postcodes — just drop your zone and building number." },
            { icon: '🌶️', title: 'Authentic Sri Lankan Heat', desc: 'From mild for the kids to ghost pepper level for those who truly miss home. Real Sri Lankan spice, not a watered-down version.' },
            { icon: '✋', title: 'Customise Your Jar', desc: 'Choose your base fruit, spice level, taste balance, and premium add-ons like Maldive fish flakes and cashew nuts.' },
            { icon: '🇱🇰', title: 'A Taste of Home', desc: 'Made by Sri Lankans, for Sri Lankans in Qatar. Every jar carries the same love and tradition as the Achcharu you grew up with.' },
          ].map(item => (
            <div key={item.title} className="bg-stone-900 border border-stone-800 rounded-2xl p-6 hover:border-amber-500/30 transition-colors">
              <div className="mb-3">
                {item.icon.startsWith('/')
                  ? <img src={item.icon} alt="" className="w-9 h-9 object-contain" />
                  : <span className="text-3xl">{item.icon}</span>
                }
              </div>
              <h3 className="text-white font-semibold mb-2">{item.title}</h3>
              <p className="text-stone-300 text-sm leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Customizer Preview ── */}
      <section className="bg-stone-900 border-y border-stone-800 py-16">
        <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <span className="text-amber-500 text-sm font-semibold uppercase tracking-widest">The Customizer</span>
            <h2 className="font-display text-3xl md:text-4xl text-white font-bold mt-2 mb-4">
              Build the Perfect Jar for You
            </h2>
            <p className="text-stone-300 leading-relaxed mb-6">
              Can&apos;t find exactly what you want? Build it yourself. Choose your fruit base,
              dial in the spice, adjust the taste balance, and add Maldive fish flakes or cashews.
              Priced live as you build.
            </p>
            <Link href="/customize"
              className="inline-block bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold px-6 py-3 rounded-xl transition-colors"
            >
              Start Building →
            </Link>
          </div>

          <div className="flex flex-col gap-3">
            {[
              { step: '1', label: 'Pick your base', options: 'Mango · Ambarella · Pineapple · Veralu · Red Onion · Dates' },
              { step: '2', label: 'Set the heat', options: 'Mild · Medium · Authentic · Ghost Pepper 💀' },
              { step: '3', label: 'Tune the taste', options: 'Extra Sweet · Extra Sour · Extra Mustard · Extra Garlic' },
              { step: '4', label: 'Add premium extras', options: 'Maldive Fish · Cashew Nuts · Pickled Dates' },
            ].map(item => (
              <div key={item.step} className="flex items-start gap-4 bg-stone-800 rounded-xl p-4 border border-stone-700">
                <div className="w-8 h-8 rounded-full bg-amber-500 text-stone-950 text-sm font-bold flex items-center justify-center flex-shrink-0">
                  {item.step}
                </div>
                <div>
                  <div className="text-white font-medium text-sm">{item.label}</div>
                  <div className="text-stone-300 text-xs mt-0.5">{item.options}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How to Order ── */}
      <section className="max-w-6xl mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <span className="text-amber-500 text-sm font-semibold uppercase tracking-widest">Simple Process</span>
          <h2 className="font-display text-3xl md:text-4xl text-white font-bold mt-2">
            Order in 3 Easy Steps
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { step: '01', icon: '🛒', title: 'Choose or Customize', desc: 'Browse ready-made jars or use our customizer to build your own.' },
            { step: '02', icon: '📍', title: 'Enter Your Qatar Address', desc: 'Zone number, street number, building — the Qatar way. Drop a Google Maps pin for easy delivery.' },
            { step: '03', icon: '🏦', title: 'Pay & We Deliver', desc: 'Transfer to QNB, CBQ, or Doha Bank. Upload your receipt. We verify and dispatch your fresh jar.' },
          ].map(item => (
            <div key={item.step} className="relative bg-stone-900 border border-stone-800 rounded-2xl p-8 overflow-hidden">
              <div className="font-display text-6xl font-bold text-stone-800 absolute top-4 right-4 leading-none">{item.step}</div>
              <div className="text-4xl mb-4">{item.icon}</div>
              <h3 className="text-white font-semibold text-lg mb-2">{item.title}</h3>
              <p className="text-stone-300 text-sm leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>

        <div className="text-center mt-10">
          <Link href="/products"
            className="inline-block bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold px-10 py-4 rounded-xl transition-colors text-base shadow-lg shadow-amber-500/20"
          >
            Order from Mrs Achcharu
          </Link>
        </div>
      </section>

    </div>
  )
}
