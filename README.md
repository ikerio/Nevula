# Nevula — Cinematic Landing

A scroll-driven, particle-cinematic landing for **Nevula**, the SafeTech operating layer for the physical world.

Built with **Vite + TypeScript + three.js** (plus `postprocessing` for UnrealBloom + ACES filmic tonemap, and `gsap` for animation orchestration). 3,400 particles morph across nine states (logo, city, constellation, trails, building, home, device, nebula) driven by a 10-chapter scroll engine.

**Live:** https://ikerio.github.io/Nevula/

## Stack

- **Vite 5** (dev server + production bundle)
- **TypeScript 5.4** (strict)
- **three.js 0.170** (`MeshSurfaceSampler`, `GLTFLoader`, custom GLSL shaders)
- **postprocessing 6.36** (UnrealBloom, ToneMapping)
- **GSAP 3** (intro/dissolve choreography)
- Vanilla TS — no UI framework

## Scripts

```bash
npm install      # install deps
npm run dev      # vite dev server (defaults to http://localhost:5173)
npm run build    # tsc -b + vite build → ./dist
npm run preview  # serve the production build locally
```

## Project structure

```
src/
  main.ts                          # entry; intro orchestration; HMR dispose
  index.html                       # FOUC-critical inline <style>
  components/                      # logo, nav, chapter rail, intro overlay, atmospherics, dossier
  chapters/                        # ch-0..6 + ch-cmd/mkt/mfst + ch-3-console + ch-5 founder cards
  engine/                          # particle engine — states, behaviors, shaders, post-fx
  scroll/                          # scroll engine + chapter config
  styles/                          # tokens, layout, scrims, per-chapter CSS
public/
  assets/                          # NevulaLogo3D.glb + brand SVG
```

## Deployment

`main` branch auto-deploys to GitHub Pages via [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml). Build runs `npm ci && npm run build`, uploads `./dist` as the Pages artifact, then `actions/deploy-pages@v4` publishes it.

The Vite `base` is set to `/Nevula/` (the repo name) so asset URLs resolve correctly under `https://ikerio.github.io/Nevula/`.

To enable Pages on a fresh fork: **Settings → Pages → Build and deployment → Source: GitHub Actions**. Then push to `main` (or trigger the workflow manually from the Actions tab).
