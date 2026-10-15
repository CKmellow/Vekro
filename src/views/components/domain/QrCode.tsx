import { QRCodeSVG } from 'qrcode.react'
import { cn } from '@/lib/cn'

/** QR for a Trust Link, ink on white with a quiet zone. `label` says what it opens. */
export function QrCode({
  value,
  label,
  size = 176,
  className,
}: {
  value: string
  label: string
  size?: number
  className?: string
}) {
  return (
    <div className={cn('inline-grid rounded-md border border-border bg-surface p-3 text-ink-950', className)}>
      <QRCodeSVG
        value={value}
        size={size}
        level="M"
        fgColor="currentColor"
        bgColor="transparent"
        role="img"
        aria-label={label}
      />
    </div>
  )
}
