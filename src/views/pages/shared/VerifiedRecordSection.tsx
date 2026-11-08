import { useVerifiedRecord } from '@/controllers/useVerifiedRecord'
import { VerifiedRecordPanel } from '../../components/domain/VerifiedRecordPanel'

/**
 * The "Verified record" panel for one order (B3 and S6); nothing when no registry is configured.
 * `version` changes with each order step, so the record is checked again after it.
 */
export function VerifiedRecordSection({ orderId, version }: { orderId: string; version: string }) {
  const record = useVerifiedRecord(orderId, version)
  if (!record) return null
  return (
    <VerifiedRecordPanel
      state={record.state}
      sealed={record.sealed}
      total={record.total}
      network={record.network}
      registry={record.registry}
      batches={record.batches}
      detailsOpen={record.detailsOpen}
      onDetailsOpenChange={record.setDetailsOpen}
      onRetry={record.retry}
      onDownload={record.download}
    />
  )
}

export default VerifiedRecordSection
