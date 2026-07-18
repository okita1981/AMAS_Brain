import { defineConfig } from 'vitest/config';

// Minimal Unit A test config: plain Node environment, no jsdom, no Firebase
// or Firestore emulators. Server (lib/) and client (src/lib/) helpers are
// both pure functions/mockable modules, so no browser DOM is required here.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['lib/**/*.test.ts', 'src/**/*.test.ts'],
  },
});
