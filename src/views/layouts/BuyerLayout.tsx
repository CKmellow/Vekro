import { ShieldCheck } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { VekroMark } from '../components/ui/VekroMark'

/** Buyer pages: 56px frosted header, one 480px column on a faint emerald mesh. */
export function BuyerLayout({ children }: { children: ReactNode }) {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div className="relative min-h-dvh">
      <div aria-hidden="true" className="bg-mesh pointer-events-none absolute inset-x-0 top-0 h-60" />
      <header
        className={cn(
          'sticky top-0 z-30 border-b bg-surface/85 backdrop-blur-lg transition-colors duration-(--duration-state)',
          scrolled ? 'border-border' : 'border-transparent',
        )}
      >
        <div className="mx-auto flex h-14 max-w-120 items-center justify-between px-5 text-text">
          <VekroMark />
          <span className="type-body-sm inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 font-semibold text-emerald-700">
            <ShieldCheck aria-hidden="true" className="size-4" />
            Protected by Vekro Escrow
          </span>
        </div>
      </header>
      <main className="relative mx-auto flex max-w-120 flex-col gap-4 px-5 pt-4 pb-32">{children}</main>
    </div>
  )
}
