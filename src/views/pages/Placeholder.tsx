/** Temporary route target until the page's design is approved and built. */
export function Placeholder({ id, title }: { id: string; title: string }) {
  return (
    <div className="flex min-h-[60dvh] flex-col items-center justify-center gap-2 px-5 text-center">
      <span className="type-label text-text-muted">{id}</span>
      <h1 className="type-headline text-text">{title}</h1>
    </div>
  )
}

// eslint-disable-next-line react-refresh/only-export-components -- factory for temporary route targets
export const placeholder = (id: string, title: string) =>
  function PlaceholderPage() {
    return <Placeholder id={id} title={title} />
  }
