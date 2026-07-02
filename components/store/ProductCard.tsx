import Link from 'next/link'
import Image from 'next/image'

type Product = {
  id: string
  name: string
  slug: string
  description: string
  priceQAR: number | string
  imageUrl: string
  stockLevel: number
  isAvailable: boolean
  isFeatured: boolean
}

export default function ProductCard({ product }: { product: Product }) {
  const outOfStock = product.stockLevel === 0 || !product.isAvailable

  return (
    <div className="bg-stone-900 border border-stone-800 rounded-2xl overflow-hidden hover:border-amber-500/40 transition-all group">

      {/* Image */}
      <div className="relative h-52 bg-stone-900 overflow-hidden">
        {product.imageUrl && (product.imageUrl.startsWith('/') || product.imageUrl.startsWith('http')) ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center p-6">
            <img src="/jar.png" alt={product.name} className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500" />
          </div>
        )}
        {product.isFeatured && (
          <span className="absolute top-3 left-3 bg-amber-500 text-stone-950 text-xs font-bold px-2.5 py-1 rounded-full">
            Featured
          </span>
        )}
        {outOfStock && (
          <div className="absolute inset-0 bg-stone-950/70 flex items-center justify-center">
            <span className="text-stone-400 font-semibold text-sm">Out of Stock</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col gap-3">
        <div>
          <h3 className="text-white font-semibold text-lg leading-snug">{product.name}</h3>
          <p className="text-stone-300 text-sm mt-1 line-clamp-2">{product.description}</p>
        </div>

        <div className="flex items-center justify-between mt-1">
          <div>
            <span className="text-amber-400 font-bold text-xl">
              QAR {Number(product.priceQAR).toFixed(2)}
            </span>
            <span className="text-stone-400 text-xs ml-2">per jar</span>
          </div>
          {!outOfStock && (
            <span className="text-green-500 text-xs font-medium">
              {product.stockLevel} left
            </span>
          )}
        </div>

        <Link
          href={outOfStock ? '#' : `/products/${product.slug}`}
          className={`w-full text-center py-2.5 rounded-xl text-sm font-semibold transition-colors ${
            outOfStock
              ? 'bg-stone-800 text-stone-600 cursor-not-allowed'
              : 'bg-amber-500 hover:bg-amber-400 text-stone-950'
          }`}
        >
          {outOfStock ? 'Out of Stock' : 'View & Order'}
        </Link>
      </div>
    </div>
  )
}
