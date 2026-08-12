import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/lib/**/*.test.ts'],
    // Every tested module is pure and must never touch the DOM. If a test here
    // ever needs jsdom, that is a signal the module has lost its purity.
    environment: 'node',
  },
});
