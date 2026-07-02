export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-stone-950 flex items-center justify-center px-4 py-10">
      {children}
    </div>
  )
}
