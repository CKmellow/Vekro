import { Lock } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { useUiGallery } from '@/controllers/useUiGallery'
import { toast } from '@/lib/toast'
import { CountdownRing } from '../../components/domain/CountdownRing'
import { LockRing } from '../../components/domain/LockRing'
import { MoneyPath } from '../../components/domain/MoneyPath'
import { QrCode } from '../../components/domain/QrCode'
import { StatusPill } from '../../components/domain/StatusPill'
import { Stepper } from '../../components/domain/Stepper'
import { Timeline } from '../../components/domain/Timeline'
import { VaultCard } from '../../components/domain/VaultCard'
import { Banner } from '../../components/ui/Banner'
import { Button, type ButtonVariant } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Checkbox, RadioCardGroup } from '../../components/ui/Choice'
import { CodeCells } from '../../components/ui/CodeCells'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { DataTable } from '../../components/ui/DataTable'
import { EmptyState } from '../../components/ui/EmptyState'
import { TextArea, TextField } from '../../components/ui/Field'
import { ImageUploader } from '../../components/ui/ImageUploader'
import { MoneyText } from '../../components/ui/MoneyText'
import { Pagination } from '../../components/ui/Pagination'
import { PhoneField } from '../../components/ui/PhoneField'
import { SegmentedControl } from '../../components/ui/SegmentedControl'
import { Sheet } from '../../components/ui/Sheet'
import { Skeleton, SkeletonGroup } from '../../components/ui/Skeleton'
import { Tabs } from '../../components/ui/Tabs'

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="flex flex-col gap-4">
      <h2 id={id} className="type-headline border-b border-border pb-2">
        {title}
      </h2>
      {children}
    </section>
  )
}

const H = 3_600_000
const variants: ButtonVariant[] = ['primary', 'secondary', 'danger', 'destructive', 'ghost']

/** Dev-only gallery of every shared component and state from the Design System Sheet (design/D0). */
export function UiGallery() {
  const g = useUiGallery()
  const [phone, setPhone] = useState('712345678')
  const [code, setCode] = useState('4827')
  const [notes, setNotes] = useState('Seal was intact, box slightly dented.')
  const [policy, setPolicy] = useState<'refund' | 'repair'>('refund')
  const [segment, setSegment] = useState('all')
  const [tab, setTab] = useState('summary')
  const [page, setPage] = useState(1)
  const [sheet, setSheet] = useState(false)
  const [confirm, setConfirm] = useState(false)

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-12 px-5 py-8">
      <header className="flex flex-col gap-1">
        <span className="type-label text-text-muted">Dev only</span>
        <h1 className="type-display-lg">Vekro components</h1>
        <p className="type-body-md text-text-muted">
          Every shared component and state, built from design/D0.
        </p>
      </header>

      <Section id="buttons" title="Buttons">
        {variants.map((v) => (
          <div key={v} className="flex flex-wrap items-center gap-3">
            <Button variant={v}>
              {v === 'primary' && <Lock aria-hidden="true" className="size-4" />}
              {v === 'danger' || v === 'destructive' ? "Item isn't right, reject" : 'Pay KES 52,000'}
            </Button>
            <Button variant={v} disabled>
              Disabled
            </Button>
            <Button variant={v} loading>
              Pay KES 52,000
            </Button>
          </div>
        ))}
      </Section>

      <Section id="fields" title="Fields and choices">
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField label="Recipient name" placeholder="Your name (optional)" />
          <TextField label="Area" defaultValue="Kilimani, Nairobi" valid />
          <TextField
            label="Phone number"
            defaultValue="0712 345"
            error="Enter 9 digits starting with 7 or 1"
          />
          <TextField label="Currency" defaultValue="Kenyan Shilling (KES)" disabled />
          <PhoneField label="M-Pesa phone number" value={phone} onChange={setPhone} />
          <TextArea
            label="Inspection notes"
            maxLength={500}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
        <CodeCells label="Enter the code we sent you" value={code} onChange={setCode} />
        <CodeCells
          label="Wrong code"
          value="482711"
          onChange={() => {}}
          error="That code doesn't match. Try again."
        />
        <Checkbox defaultChecked>I agree to the terms and understand how Vekro escrow works.</Checkbox>
        <RadioCardGroup
          legend="If something is wrong"
          name="policy"
          value={policy}
          onChange={setPolicy}
          options={[
            { value: 'refund', title: 'Refund', description: 'Money goes back to the buyer' },
            {
              value: 'repair',
              title: 'Repair then release',
              description: "You fix it, buyer confirms, then you're paid",
            },
          ]}
        />
      </Section>

      <Section id="status" title="Status pills (buyer · seller)">
        <div className="flex flex-col gap-2">
          {g.statuses.map((s) => (
            <div key={s.key} className="flex flex-wrap gap-2">
              <StatusPill status={s.buyer} />
              <StatusPill status={s.seller} />
            </div>
          ))}
        </div>
      </Section>

      <Section id="vault" title="Vault, lock ring and money path">
        <div className="grid gap-4 md:grid-cols-3">
          {g.vaults.map((v) => (
            <VaultCard
              key={v.status}
              reference="VK-7K3P9Q"
              amountLabel={v.amountLabel}
              amount={52000}
              status={v.view}
              ring={v.ring}
              ringRemaining={0.4}
              hint={v.hint}
            />
          ))}
        </div>
        <div className="flex flex-wrap gap-3 rounded-lg bg-vault p-4">
          {(
            [
              'open',
              'locked',
              'pulse',
              'draining',
              'releasing',
              'released',
              'refunded',
              'returned',
              'coral',
              'lake',
              'plum',
            ] as const
          ).map((s) => (
            <LockRing key={s} state={s} remaining={0.4} />
          ))}
        </div>
        <Card>
          <MoneyPath
            position="vault"
            buyer={{ title: 'Buyer', detail: '+254 712 *** 678', note: 'Paid with M-Pesa' }}
            vault={{ title: 'Vekro vault', detail: 'KES 52,000 held' }}
            seller={{ title: 'Seller', detail: 'Amina Gadgets', note: 'Paid after you confirm' }}
          />
        </Card>
      </Section>

      <Section id="time" title="Time and progress">
        <div className="flex flex-wrap gap-6">
          <CountdownRing deadline={g.deadlines.dispatch} totalMs={48 * H} label="Time left to dispatch" />
          <CountdownRing deadline={g.deadlines.hold} totalMs={24 * H} label="Report within" />
          <CountdownRing deadline={g.deadlines.door} totalMs={H} label="Inspection time" />
          <QrCode value="https://vekro.co.ke/pay/7K3P9Q" label="QR code for the Trust Link" size={120} />
        </div>
        <Card>
          <Timeline
            entries={[
              { id: '4', text: 'Funds release to the seller after you give your code', upcoming: true },
              {
                id: '3',
                time: 'Today 11:20',
                actor: 'seller',
                text: 'Amina Gadgets dispatched your order',
                quote: 'Packed with charger and original box.',
              },
              {
                id: '2',
                time: 'Today 09:05',
                actor: 'vekro',
                text: 'Payment received. KES 52,000 held safely',
              },
              { id: '1', time: 'Today 09:03', actor: 'you', text: 'Started payment with M-Pesa' },
            ]}
          />
        </Card>
        <Stepper steps={['Paid', 'Dispatched', 'At your door', 'Inspected', 'Complete']} current={2} />
      </Section>

      <Section id="feedback" title="Feedback">
        <div className="grid gap-3 sm:grid-cols-2">
          <Banner tone="info" title="Your payment is being confirmed">
            This usually takes a few seconds.
          </Banner>
          <Banner tone="warning" title="M-Pesa is slow right now. You can still try" />
          <Banner tone="danger" title="M-Pesa didn't go through. Check your balance and try again" />
          <Banner tone="escalation" title="Vekro support is reviewing this. We'll message you by SMS." />
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" onClick={() => toast.show('Link copied')}>
            Show toast
          </Button>
          <Button variant="secondary" onClick={() => setSheet(true)}>
            Open sheet
          </Button>
          <Button variant="danger" onClick={() => setConfirm(true)}>
            Open confirm dialog
          </Button>
        </div>
        <Card>
          <SkeletonGroup label="Loading example">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-10 w-2/3" />
            <Skeleton className="h-16 w-full rounded-md" />
          </SkeletonGroup>
        </Card>
        <div className="grid gap-4 sm:grid-cols-3">
          <Card padded={false}>
            <EmptyState
              illustration="done"
              title="You're all caught up"
              body="Nothing needs your action right now."
            />
          </Card>
          <Card padded={false}>
            <EmptyState
              illustration="listing"
              title="Create your first listing"
              body="Make a Trust Link and share it."
            />
          </Card>
          <Card padded={false}>
            <EmptyState
              illustration="parcel"
              title="No orders yet"
              body="When you buy with a Vekro link, it shows up here."
            />
          </Card>
        </div>
      </Section>

      <Section id="display" title="Display">
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <p className="type-label text-text-muted">In escrow</p>
            <MoneyText amount={143500} countUp className="type-amount" />
          </Card>
          <Card interactive>
            <p className="type-label text-text-muted">Interactive card</p>
            <p className="type-body-md">Press me</p>
          </Card>
        </div>
        <Tabs
          label="Example tabs"
          value={tab}
          onValueChange={setTab}
          items={[
            { value: 'summary', label: 'Summary', content: <p className="type-body-md">Summary panel</p> },
            { value: 'timeline', label: 'Timeline', content: <p className="type-body-md">Timeline panel</p> },
          ]}
        />
        <SegmentedControl
          label="Filter orders"
          value={segment}
          onChange={setSegment}
          segments={[
            { value: 'all', label: 'All', count: 12 },
            { value: 'action', label: 'Needs action', count: 3 },
            { value: 'done', label: 'Done' },
          ]}
        />
        <DataTable
          caption="Recent orders"
          rowKey={(r) => r.id}
          cardTitle={(r) => r.item}
          rows={[
            { id: 'VK-7K3P9Q', item: 'iPhone 13, 128GB', amount: 52000, status: g.tableStatus.locked },
            { id: 'VK-3MW8TR', item: 'Nike Air Force 1', amount: 6500, status: g.tableStatus.onTheWay },
            { id: 'VK-9QX2LA', item: 'HP Pavilion 15', amount: 68500, status: g.tableStatus.hold },
          ]}
          columns={[
            { key: 'item', header: 'Item', cell: (r) => r.item, hideOnCard: true },
            { key: 'order', header: 'Order', cell: (r) => <span className="type-mono">{r.id}</span> },
            { key: 'amount', header: 'Amount', sortable: true, cell: (r) => <MoneyText amount={r.amount} /> },
            { key: 'status', header: 'Status', cell: (r) => <StatusPill status={r.status} /> },
          ]}
          sort={{ key: 'amount', direction: 'desc' }}
          onSortChange={() => {}}
        />
        <Pagination page={page} pageCount={3} onPageChange={setPage} />
      </Section>

      <Section id="uploader" title="Image uploader (live)">
        <ImageUploader
          label="Photos"
          hint="Add up to 4 clear photos. The first one is the cover buyers see."
          photos={g.photos.photos}
          max={g.photos.max}
          onAdd={g.photos.add}
          onRemove={g.photos.remove}
          onMove={g.photos.move}
          onRetry={g.photos.retry}
        />
      </Section>

      <Sheet
        open={sheet}
        onOpenChange={setSheet}
        title="What's wrong?"
        description="Your code stays hidden. The item goes back to the seller and you're refunded."
        footer={
          <>
            <Button variant="destructive" fullWidth onClick={() => setSheet(false)}>
              Confirm rejection
            </Button>
            <Button variant="ghost" fullWidth onClick={() => setSheet(false)}>
              Go back
            </Button>
          </>
        }
      >
        <p className="type-body-md">Sheet content.</p>
      </Sheet>
      <ConfirmDialog
        open={confirm}
        onOpenChange={setConfirm}
        destructive
        title="Refund KES 52,000 to the buyer?"
        body="This releases KES 52,000 to Brian Otieno now. You can't undo this."
        confirmLabel="Refund KES 52,000"
        onConfirm={() => setConfirm(false)}
      />
    </main>
  )
}
