import Link from 'next/link'
import ProductCard from '@/components/store/ProductCard'
import { prisma } from '@/lib/prisma'

async function getProducts() {
  try {
    return await prisma.achcharuProduct.findMany({
      where: { isAvailable: true },
      orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }],
    })
  } catch {
    return []
  }
}

export default async function ProductsPage() {
  const products = await getProducts()

  return (
    <div className="min-h-screen bg-stone-950">

      {/* Header */}
      <section className="bg-stone-900 border-b border-stone-800 py-12">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <span className="text-amber-500 text-sm font-semibold uppercase tracking-widest">
            Ready to Order
          </span>
          <h1 className="font-display text-3xl md:text-4xl text-white font-bold mt-2">
            Our Achcharu Collection
          </h1>
          <p className="text-stone-300 mt-3 max-w-lg mx-auto text-sm">
            All jars are made fresh after your order. No preservatives, no shortcuts —
            just authentic Sri Lankan Achcharu delivered across Qatar.
          </p>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 py-12">

        {products.length === 0 ? (
          /* Empty state */
          <div className="text-center py-20">
            <img src="/jar.png" alt="" className="w-20 h-20 object-contain opacity-60 mx-auto mb-4" />
            <h2 className="font-display text-2xl text-white font-bold mb-2">
              Products Coming Soon
            </h2>
            <p className="text-stone-300 mb-6">
              No products available yet. Check back soon or build your own custom jar.
            </p>
            <Link
              href="/customize"
              className="inline-block bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold px-6 py-3 rounded-xl transition-colors"
            >
              Customize Your Own Jar
            </Link>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-8">
              <p className="text-stone-300 text-sm">
                {products.length} {products.length === 1 ? 'product' : 'products'} available
              </p>
              <Link
                href="/customize"
                className="text-amber-400 hover:text-amber-300 text-sm font-medium transition-colors"
              >
                Want something custom? →
              </Link>
            </div>

            {/* Product Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product: any) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </>
        )}

        {/* Customizer CTA */}
        <div className="mt-16 bg-stone-900 border border-stone-800 rounded-2xl p-8 text-center">
          <div className="text-4xl mb-3">🌶️</div>
          <h3 className="font-display text-2xl text-white font-bold mb-2">
            Can&apos;t Find What You&apos;re Looking For?
          </h3>
          <p className="text-stone-300 text-sm mb-5 max-w-md mx-auto">
            Build your own jar — choose your fruit base, spice level, taste balance,
            and premium add-ons. Priced live as you customize.
          </p>
          <Link
            href="/customize"
            className="inline-block bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold px-8 py-3 rounded-xl transition-colors"
          >
            Start Customizing →
          </Link>
        </div>
      </div>
    </div>
  )
}
