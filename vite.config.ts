import { defineConfig } from 'vite'

// `process` is provided by Node when this config is evaluated, but the project
// intentionally has no @types/node (it's a browser app — pulling Node types in
// would also leak globals like NodeJS's setTimeout return type into the `src`
// build). Declare just the bit we read here so `tsc -b` passes in a clean CI.
declare const process: { env: Record<string, string | undefined> }

export default defineConfig({
  root: '.',
  publicDir: 'public',
  // GitHub Pages serves the build at https://ikerio.github.io/Nevula/, so every
  // asset URL needs the `/Nevula/` prefix or browsers 404 on JS/CSS imports.
  // A custom subpath deploy (e.g. Hostinger at nevula.com/landing) overrides
  // this at build time via the NEVULA_BASE env var:
  //   bash:        NEVULA_BASE=/landing/ npm run build
  //   PowerShell:  $env:NEVULA_BASE='/landing/'; npm run build
  // Leading + trailing slash matter. Dev server ignores `base`.
  base: process.env.NEVULA_BASE ?? '/Nevula/',
  server: {
    port: 5173,
    open: true,
  },
  build: {
    target: 'es2022',
    sourcemap: true,
    rollupOptions: {
      output: {
        // Function-form chunking so `three/examples/jsm/*` subpath imports
        // (GLTFLoader, MeshSurfaceSampler) land in the three chunk instead of
        // the entry chunk.
        manualChunks(id) {
          if (id.includes('node_modules/three') || id.includes('three/examples/jsm')) {
            return 'three'
          }
          if (id.includes('postprocessing')) return 'postfx'
          if (id.includes('node_modules/gsap')) return 'gsap'
          return undefined
        },
      },
    },
  },
  assetsInclude: ['**/*.glsl'],
})
