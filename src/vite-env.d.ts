interface ImportMetaEnv {
  readonly VITE_AI_BASE_URL?: string;
  readonly VITE_PORT?: string;
  readonly PROD: boolean;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
