import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcryptjs'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

const DEFAULT_FRUIT_PRICES = [
  { fruit: 'MANGO',     name: 'Green Mango', emoji: '🥭', description: 'Tangy & classic',          priceQAR: 25.00, sortOrder: 0 },
  { fruit: 'AMBARELLA', name: 'Ambarella',   emoji: '🍈', description: 'Tart & slightly sweet',     priceQAR: 22.00, sortOrder: 1 },
  { fruit: 'PINEAPPLE', name: 'Pineapple',   emoji: '🍍', description: 'Tropical sweetness',        priceQAR: 20.00, sortOrder: 2 },
  { fruit: 'VERALU',    name: 'Veralu',       emoji: '🫐', description: 'Intensely sour',            priceQAR: 28.00, sortOrder: 3 },
  { fruit: 'RED_ONION', name: 'Red Onion',    emoji: '🧅', description: 'Pungent & savory',          priceQAR: 18.00, sortOrder: 4 },
  { fruit: 'DATES',     name: 'Dates',        emoji: '🌴', description: 'Sweet-spicy fusion',        priceQAR: 30.00, sortOrder: 5 },
]

const DEFAULT_SPICE_OPTIONS = [
  { key: 'MILD',         label: 'Mild',         emoji: '🌿', description: 'Light heat, family-friendly',           multiplier: 1.000, sortOrder: 0 },
  { key: 'MEDIUM',       label: 'Medium',        emoji: '🌶️', description: 'Balanced kick (+10%)',                  multiplier: 1.100, sortOrder: 1 },
  { key: 'AUTHENTIC',    label: 'Authentic',     emoji: '🔥', description: 'Traditional Sri Lankan heat (+20%)',    multiplier: 1.200, sortOrder: 2 },
  { key: 'GHOST_PEPPER', label: 'Ghost Pepper',  emoji: '💀', description: 'Extreme heat — not for the faint-hearted (+40%)', multiplier: 1.400, sortOrder: 3 },
]

async function main() {
  // ── Add-ons ───────────────────────────────────────────────────────────────
  await prisma.addOn.upsert({
    where: { type: 'MALDIVE_FISH' },
    update: {},
    create: { type: 'MALDIVE_FISH', name: 'Maldive Fish Flakes', description: 'Sun-dried tuna flakes for deep umami flavour', priceQAR: 3.00, sortOrder: 0 },
  })
  await prisma.addOn.upsert({
    where: { type: 'CASHEW_NUTS' },
    update: {},
    create: { type: 'CASHEW_NUTS', name: 'Cashew Nuts', description: 'Whole roasted cashews', priceQAR: 4.00, sortOrder: 1 },
  })
  await prisma.addOn.upsert({
    where: { type: 'PICKLED_DATES' },
    update: {},
    create: { type: 'PICKLED_DATES', name: 'Pickled Dates', description: 'Sweet-brined Medjool dates', priceQAR: 3.50, sortOrder: 2 },
  })

  // ── Spice options ─────────────────────────────────────────────────────────
  for (const opt of DEFAULT_SPICE_OPTIONS) {
    await prisma.spiceOption.upsert({
      where: { key: opt.key },
      update: {},  // don't overwrite admin changes on re-seed
      create: opt,
    })
  }

  // ── Fruit catalogue ────────────────────────────────────────────────────────
  for (const fp of DEFAULT_FRUIT_PRICES) {
    await prisma.fruitPrice.upsert({
      where: { fruit: fp.fruit },
      update: { name: fp.name, emoji: fp.emoji, description: fp.description, sortOrder: fp.sortOrder },
      create: fp,
    })
  }

  // ── Admin user ────────────────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash('admin123', 12)
  await prisma.user.upsert({
    where: { email: 'admin@achcharu.qa' },
    update: {},
    create: {
      email: 'admin@achcharu.qa',
      passwordHash,
      name: 'Admin',
      role: 'ADMIN',
    },
  })

  console.log('Seeded: AddOns + SpiceOptions + FruitPrices + Admin user')
}

main().catch(console.error).finally(() => prisma.$disconnect())
