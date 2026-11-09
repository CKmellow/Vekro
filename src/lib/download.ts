/** Save JSON as a file the person keeps (the verification receipt). */
export function downloadJson(filename: string, data: unknown): void {
  const url = URL.createObjectURL(
    new Blob([`${JSON.stringify(data, null, 2)}\n`], { type: 'application/json' }),
  )
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.append(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
