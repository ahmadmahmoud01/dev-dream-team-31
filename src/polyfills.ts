// src/polyfills.ts
import { Buffer } from 'buffer';

// Make Buffer available globally
if (typeof window !== 'undefined') {
  window.Buffer = window.Buffer || Buffer;
}

// Ensure global is defined
if (typeof global === 'undefined') {
  (globalThis as any).global = globalThis;
}
