import { Eye } from 'lucide-react'
import { Controller } from 'react-hook-form'
import { Link } from 'react-router'
import { useListingWizard } from '@/controllers/useListingWizard'
import { BuyerPreview } from '../../components/domain/BuyerPreview'
import { Stepper } from '../../components/domain/Stepper'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Field, TextArea, TextField } from '../../components/ui/Field'
import { ImageUploader } from '../../components/ui/ImageUploader'
import { PriceField } from '../../components/ui/PriceField'
import { Sheet } from '../../components/ui/Sheet'

const selectClass =
  'type-body-lg h-14 w-full appearance-none rounded-md border border-border bg-surface px-4 text-text focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 focus:outline-none'

/** S7 Create listing (design/S7-create-listing). */
export function CreateListingPage() {
  const w = useListingWizard()
  const { register, control, formState } = w.form
  const errors = formState.errors.item

  return (
    <div className="flex flex-col gap-6 pb-24 lg:pb-0">
      <div className="flex flex-col gap-4">
        <nav aria-label="Breadcrumb" className="type-body-sm text-text-muted">
          <Link to="/seller/listings" className="hover:text-text">
            Listings
          </Link>{' '}
          / <span className="text-text">New listing</span>
        </nav>
        <h1 className="type-display-lg text-text">Create a listing</h1>
        <Card padded={false} className="px-5 py-4">
          <Stepper steps={[...w.steps]} current={w.step} label="Listing steps" />
        </Card>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <Card className="flex flex-col gap-5 p-6 sm:p-8">
          {w.step === 0 && (
            <>
              <div>
                <h2 className="type-headline text-text">Item details</h2>
                <p className="type-body-md mt-1 text-text-muted">Buyers see this on your Trust Link.</p>
              </div>
              <ImageUploader
                label="Photos"
                hint="Up to 4 photos. The first is the cover."
                photos={w.photos.photos}
                max={w.photos.max}
                onAdd={w.photos.add}
                onRemove={w.photos.remove}
                onMove={w.photos.move}
                onRetry={w.photos.retry}
              />
              <TextField label="Title" error={errors?.title?.message} {...register('item.title')} />
              <Field label="Category" error={errors?.category?.message}>
                {({ id, describedBy }) => (
                  <select
                    id={id}
                    aria-describedby={describedBy}
                    className={selectClass}
                    {...register('item.category')}
                  >
                    {w.categories.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                )}
              </Field>
              <Controller
                control={control}
                name="item.description"
                render={({ field }) => (
                  <TextArea
                    label="Description"
                    maxLength={600}
                    error={errors?.description?.message}
                    {...field}
                  />
                )}
              />
              <Controller
                control={control}
                name="item.price"
                render={({ field }) => (
                  <PriceField
                    label="Price"
                    error={errors?.price?.message}
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    name={field.name}
                    ref={field.ref}
                  />
                )}
              />
              <TextField
                label="Buyer name (optional)"
                hint="For a private link to one buyer."
                error={errors?.buyerName?.message}
                {...register('item.buyerName')}
              />
            </>
          )}
          {w.step > 0 && (
            <div className="flex flex-col gap-2">
              <h2 className="type-headline text-text">{w.steps[w.step]}</h2>
              <p className="type-body-md text-text-muted">
                This step arrives with the next part of the wizard.
              </p>
            </div>
          )}

          <div className="hidden items-center gap-3 border-t border-border pt-5 lg:flex">
            {w.step > 0 && (
              <Button variant="ghost" onClick={w.back}>
                Back
              </Button>
            )}
            <Button variant="ghost" onClick={w.saveDraft}>
              Save draft
            </Button>
            <Button className="ml-auto" onClick={w.next} disabled={w.step === w.steps.length - 1}>
              Next
            </Button>
          </div>
        </Card>

        <aside aria-label="Live buyer preview" className="sticky top-24 hidden flex-col gap-3 lg:flex">
          <p className="type-label text-ink-600">Live buyer preview</p>
          <BuyerPreview data={w.preview} />
        </aside>
      </div>

      <div className="fixed inset-x-0 bottom-16 z-20 flex gap-3 border-t border-border bg-surface/85 p-4 backdrop-blur-lg lg:hidden">
        <Button variant="secondary" onClick={() => w.setPreviewOpen(true)}>
          <Eye aria-hidden="true" className="size-4" />
          Preview
        </Button>
        <Button fullWidth onClick={w.next} disabled={w.step === w.steps.length - 1}>
          Next
        </Button>
      </div>
      <Sheet open={w.previewOpen} onOpenChange={w.setPreviewOpen} title="What the buyer sees">
        <BuyerPreview data={w.preview} />
      </Sheet>
    </div>
  )
}
