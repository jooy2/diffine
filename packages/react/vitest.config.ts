import { defineConfig } from 'vitest/config';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      // Tests import from 'diffine-react' exactly as a consumer would.
      'diffine-react': resolve(rootDir, 'src/index.ts')
    }
  },
  test: {
    include: ['test/**/*.test.{ts,tsx}'],
    // Node, and no DOM emulator. The comparison is arithmetic over arrays and
    // needs no browser at all, and the viewer is checked through
    // `react-dom/server` — real React, real markup, no layout. What the viewer
    // does with layout is measured from elements that exist, which a DOM
    // emulator cannot give an honest answer about, so those belong in a browser
    // runner rather than in a fake one.
    environment: 'node'
  }
});
