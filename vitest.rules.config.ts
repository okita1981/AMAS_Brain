import { defineConfig } from 'vitest/config';

// Unit B1: Firestore Rules test config. Separate from vitest.config.ts
// (Unit A) because these tests need a running Firestore emulator and must
// not run concurrently against it (multiple test files sharing one
// emulator instance would clear each other's seeded data mid-run).
export default defineConfig({
  test: {
    environment: 'node',
    include: ['firestore-rules/**/*.rules.test.ts'],
    fileParallelism: false,
    testTimeout: 20000,
    hookTimeout: 20000,
  },
});
