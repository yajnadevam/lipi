/* tslint:disable */
/* eslint-disable */
/**
 * Sandhi engine that joins SLP1-encoded words.
 */
export class Sandhi {
  private constructor();
  free(): void;
  /**
   * Initialize the sandhi engine by generating all rules.
   */
  static init(): Sandhi;
  /**
   * Join two SLP1-encoded words using external sandhi rules.
   * Returns the combined string after applying the best matching rule.
   */
  join(first: string, second: string): string;
  /**
   * Get all sandhi rules as JSON.
   */
  rules(): any;
}

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
  readonly memory: WebAssembly.Memory;
  readonly __wbg_sandhi_free: (a: number, b: number) => void;
  readonly sandhi_init: () => number;
  readonly sandhi_join: (a: number, b: number, c: number, d: number, e: number) => [number, number];
  readonly sandhi_rules: (a: number) => any;
  readonly __wbindgen_free: (a: number, b: number, c: number) => void;
  readonly __wbindgen_malloc: (a: number, b: number) => number;
  readonly __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number;
  readonly __wbindgen_export_3: WebAssembly.Table;
  readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;
/**
* Instantiates the given `module`, which can either be bytes or
* a precompiled `WebAssembly.Module`.
*
* @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
*
* @returns {InitOutput}
*/
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
* If `module_or_path` is {RequestInfo} or {URL}, makes a request and
* for everything else, calls `WebAssembly.instantiate` directly.
*
* @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
*
* @returns {Promise<InitOutput>}
*/
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
