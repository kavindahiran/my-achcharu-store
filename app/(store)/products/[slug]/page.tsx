import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

async function getProduct(slug: string) {
  return await prisma.achcharuProduct.findUnique({
    where: { slug },
  })
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const product = await getProduct(slug)

  if (!product || !product.isAvailable) notFound()

  const ingredients = product.ingredients as string[]
  const outOfStock = product.stockLevel === 0

  return (
    <div className="min-h-screen bg-stone-950">
      <div className="max-w-5xl mx-auto px-4 py-12">

        {/* Back */}
        <Link
          href="/products"
          className="text-stone-400 hover:text-amber-400 text-sm transition-colors mb-8 inline-flex items-center gap-2"
        >
          ← Back to all products
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mt-6">

          {/* Image */}
          <div className="relative h-80 md:h-full min-h-72 rounded-2xl overflow-hidden bg-stone-800">
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
              priority
              loading="eager"
            />
            {product.isFeatured && (
              <span className="absolute top-4 left-4 bg-amber-500 text-stone-950 text-xs font-bold px-3 py-1 rounded-full">
                Featured
              </span>
            )}
          </div>

          {/* Details */}
          <div className="flex flex-col gap-5">
            <div>
              <h1 className="font-display text-3xl md:text-4xl text-white font-bold">
                {product.name}
              </h1>
              <p className="text-stone-400 mt-3 leading-relaxed">
                {product.description}
              </p>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-2">
              <span className="text-amber-400 font-bold text-3xl">
                QAR {Number(product.priceQAR).toFixed(2)}
              </span>
              <span className="text-stone-400 text-sm">per jar</span>
            </div>

            {/* Stock */}
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${outOfStock ? 'bg-red-500' : 'bg-green-500'}`} />
              <span className={`text-sm font-medium ${outOfStock ? 'text-red-400' : 'text-green-400'}`}>
                {outOfStock ? 'Out of stock' : `${product.stockLevel} jars available`}
              </span>
            </div>

            {/* Ingredients */}
            {ingredients && ingredients.length > 0 && (
              <div>
                <h3 className="text-stone-300 font-semibold text-sm uppercase tracking-wider mb-2">
                  Ingredients
                </h3>
                <div className="flex flex-wrap gap-2">
                  {ingredients.map((ing) => (
                    <span
                      key={ing}
                      className="bg-stone-800 border border-stone-700 text-stone-300 text-xs px-3 py-1 rounded-full"
                    >
                      {ing}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Info */}
            <div className="bg-stone-900 border border-stone-800 rounded-xl p-4 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-stone-300 text-sm">
                <span>✋</span> Handmade fresh after your order
              </div>
              <div className="flex items-center gap-2 text-stone-300 text-sm">
                <span>📦</span> Delivered across all Qatar zones
              </div>
              <div className="flex items-center gap-2 text-stone-300 text-sm">
                <span>🏦</span> Pay via QNB · CBQ · Doha Bank · Cash on Delivery
              </div>
            </div>

            {/* CTA */}
            {outOfStock ? (
              <button
                disabled
                className="w-full bg-stone-800 text-stone-500 font-semibold py-4 rounded-xl cursor-not-allowed"
              >
                Out of Stock
              </button>
            ) : (
              <Link
                href="/customize"
                className="w-full bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold py-4 rounded-xl text-center transition-colors text-base"
              >
                Order This Jar — QAR {Number(product.priceQAR).toFixed(2)}
              </Link>
            )}

            <Link
              href="/customize"
              className="w-full border border-stone-700 hover:border-amber-500 text-stone-400 hover:text-amber-400 font-semibold py-3 rounded-xl text-center transition-colors text-sm"
            >
              Prefer a custom jar? Build your own →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
