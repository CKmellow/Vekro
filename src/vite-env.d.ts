/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string
  // Support contacts on the help page (src/lib/support.ts); each is hidden when unset.
  readonly VITE_SUPPORT_PHONE?: string
  readonly VITE_SUPPORT_WHATSAPP?: string
  readonly VITE_SUPPORT_EMAIL?: string
  readonly VITE_SUPPORT_HOURS?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
