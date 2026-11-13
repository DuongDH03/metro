/** Node-side context handed to every adapter by the CLI (scripts/import/cli.ts). */
import type { CityConfig, DraftResult } from '../../src/importer/types';

export interface ImportContext {
  /** Project root (absolute). */
  root: string;
  /** Folder holding city.config.json and its input files (absolute). */
  cityDir: string;
  /** Per-city cache folder for downloaded data, e.g. <root>/cities/<id>/.cache (absolute). */
  cacheDir: string;
  config: CityConfig;
  /** Ignore caches and re-download. */
  refresh: boolean;
  log: (msg: string) => void;
}

export type Adapter<S> = (spec: S, ctx: ImportContext) => Promise<DraftResult>;
