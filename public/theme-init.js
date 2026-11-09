// Sets light or dark before the first paint, so no page flashes the wrong theme (M25, #292).
// A file rather than an inline script, so the Content-Security-Policy needs no 'unsafe-inline'.
// Same rule as src/lib/theme.ts: the stored choice, else the device setting.
;(function () {
  var preference = 'system'
  try {
    preference = window.localStorage.getItem('vekro.theme') || 'system'
  } catch (e) {
    preference = 'system'
  }
  var dark =
    preference === 'dark' ||
    (preference !== 'light' &&
      !!window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)').matches)
  var root = document.documentElement
  if (dark) root.classList.add('dark')
  root.style.colorScheme = dark ? 'dark' : 'light'
  var meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.setAttribute('content', dark ? '#07110E' : '#FBF9F4')
})()
