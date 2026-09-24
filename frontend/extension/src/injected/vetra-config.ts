/**
 * Build-time flags for injected (MAIN world) behavior.
 * Must NOT reference import.meta — Chrome injects this as a classic script.
 * Default ON: wait for analysis before signing.
 */
export const VETRA_AWAIT_ANALYSIS = true;
