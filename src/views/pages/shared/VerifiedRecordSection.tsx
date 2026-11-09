import { useVerifiedRecord } from '@/controllers/useVerifiedRecord'
import { VerifiedRecordPanel } from '../../components/domain/VerifiedRecordPanel'

/**
 * The "Verified record" panel for one order (B3 and S6); nothing when no registry is configured.
 * `version` changes with each order step, so the record is checked again after it. `buyer` adds the
 * line that their held money is counted in Vekro's published total.
 */
export function VerifiedRecordSection({
  orderId,
  version,
  buyer = false,
}: {
  orderId: string
  version: string
  buyer?: boolean
}) {
  const record = useVerifiedRecord(orderId, version, { buyer })
  if (!record) return null
  return (
    <VerifiedRecordPanel
      state={record.state}
      sealed={record.sealed}
      total={record.total}
      network={record.network}
      registry={record.registry}
      batches={record.batches}
      heldMoney={record.heldMoney}
      detailsOpen={record.detailsOpen}
      onDetailsOpenChange={record.setDetailsOpen}
      onRetry={record.retry}
      onDownload={record.download}
    />
  )
}

export default VerifiedRecordSection
