/**
 * Build-time / env flags for injected (MAIN world) behavior.
 * Set VITE_VETRA_AWAIT_ANALYSIS=true to block signing until analysis response arrives.
 */
export const VETRA_AWAIT_ANALYSIS =
  typeof import.meta !== 'undefined' &&
  (import.meta as ImportMeta).env?.VITE_VETRA_AWAIT_ANALYSIS === 'true';
