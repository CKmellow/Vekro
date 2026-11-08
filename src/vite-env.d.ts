/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string
  // Support contacts on the help page (src/lib/support.ts); each is hidden when unset.
  readonly VITE_SUPPORT_PHONE?: string
  readonly VITE_SUPPORT_WHATSAPP?: string
  readonly VITE_SUPPORT_EMAIL?: string
  readonly VITE_SUPPORT_HOURS?: string
  // The public AnchorRegistry the "Verified record" panel checks (src/models/api/registry.ts); the
  // panel is hidden unless all three are set.
  readonly VITE_ANCHOR_CHAIN_ID?: string
  readonly VITE_ANCHOR_REGISTRY_ADDRESS?: string
  readonly VITE_ANCHOR_RPC_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
