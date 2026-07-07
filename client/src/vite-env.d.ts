/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Backend API origin for the two-service deploy. Empty in dev (Vite proxies /api). */
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
