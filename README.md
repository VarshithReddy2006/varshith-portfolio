# Shavva Varshith Reddy — Portfolio

An immersive developer portfolio built with **React 19 + TypeScript + Tailwind CSS 4** and **React Three Fiber**. The site is one persistent 3D world: a floating city with six landmarks. Selecting a landmark moves the camera to it and opens that section in a floating panel. Every decorative visual is generated in code (Three.js geometry and shaders, canvas gradients, SVG, CSS). The only image files the site expects are the owner's real photos.

## Quick start

Requires Node.js 20.19+ (tested with Node 24).

```bash
npm install        # install pinned dependencies
npm run dev        # dev server at http://localhost:5173
npm run build      # type-check (tsc -b) + production build to dist/
npm run preview    # serve the production build at http://localhost:4173
npm run typecheck  # type-check only
```

There is no lint or test setup in this project yet.

## Deploying to Vercel

`vercel.json` is already configured (framework `vite`, build `npm run build`, output `dist`, long-term caching for hashed assets, and basic security headers).

- **Dashboard:** import the repository in Vercel. The settings are picked up automatically.
- **CLI:** `npm i -g vercel`, then `vercel` for a preview deployment or `vercel --prod` for production.

## How navigation works

| Landmark | Hash | Building |
| --- | --- | --- |
| 01 Home | `#home` / none | Central Portal |
| 02 About | `#about` | Knowledge Tower |
| 03 Projects | `#projects`, `#projects/<id>` | Engineering District (one tower per project) |
| 04 Experience | `#experience` | Guild Hall |
| 05 Achievements | `#achievements` | Hall of Achievements |
| 06 Contact | `#contact` | Contact Gateway |

- Every entry point calls the same `select()` in `src/world/store.ts`: clicking a building, a landmark label, the top navigation, the left location rail, panel previous/next links, or pressing `1`–`6`. The URL hash stays in sync, so deep links and browser back/forward work.
- `Esc` closes a project detail (back to the list), then the panel (back to the overview). `←`/`→` step through sections while a panel is open.
- Camera viewpoints are data in `src/world/landmarks.ts` (`viewFor`, `districtTowers`). Each new selection starts a tween from wherever the camera is, so rapid clicks never conflict. Paths that cross the central island arc above its skyline. Reduced motion cuts instantly.
- **Take the Tour** flies through the five sections with captions. It stands in for an intro video until `profile.introVideoUrl` is set, and then the button becomes **Watch Intro**.

## The journey (stage → Home)

The site opens on a raised circular stage below the city. A character stands at its centre, facing a lit staircase that climbs to the Home island.

- **Begin Journey** starts the walk. The character crosses the stage and climbs the stairs, with the camera following from behind and above. Fog thins and the golden paths fade in as the climb goes on. On arrival the camera cranes up to the Home view and the six landmark labels appear.
- **Skip to the world**, the HUD's **Skip** button or `Esc` jumps straight to the arrived state.
- During the walk, hold `W`/`↑` to walk and `S`/`↓` to step back. Use **Walk automatically** to resume the automatic walk.
- Deep links such as `#projects/aria`, the tour and any non-Home selection skip the journey. So do reduced motion and the no-WebGL fallback.
- The character is built procedurally in `scene/Character.tsx` from a joint hierarchy, not loaded from a model. To use a rigged GLB instead, replace its meshes and keep the `runtime` contract from `journey.ts`.
- Path geometry and timing are in `src/world/journey.ts`. Bloom (`scene/Post.tsx`) only runs on high-tier desktop GPUs.

## Replacing placeholders

| What | Where | Notes |
| --- | --- | --- |
| About photo | `public/images/portrait-about.jpg` | Real photo of the owner, 4:5 portrait crop (e.g. 800×1000 px), compressed to under ~150 KB. |
| Hero photo | `public/images/portrait-hero.jpg` | Reserved in `content.ts`; the world hero currently shows no avatar. |
| Resume | `public/resume.pdf` | Until the PDF exists, every Resume action opens an email requesting it (no broken link). |
| Intro video (optional) | `profile.introVideoUrl` in `src/data/content.ts` | Enables a "Watch Intro" button. |
| OpenMRS link | `experience.href` in `src/data/content.ts` | Currently a GitHub search of the author's PRs in `openmrs/openmrs-core`. |

Until a photo exists, a neutral CSS placeholder with the "SVR" monogram is shown. **Do not substitute generated or AI portraits.**

All copy, links, stats and project details live in `src/data/content.ts`. Each project figure carries an evidence label (`verified`, `reported`, `target`, `architecture`) that is shown in the project detail view.

## Project structure

```
src/
  data/content.ts            all text, links, stats and evidence labels
  world/
    landmarks.ts             landmark layout, label anchors, camera viewpoints
    store.ts                 navigation state + hash routing (single select() entry point)
    labels.ts                screen-space label layout and collision avoidance
    WorldStage.tsx           static SVG world first, then lazy WebGL world cross-fade
    StaticWorld.tsx          SVG world for no-WebGL / Save-Data, with a CSS "camera"
    journey.ts               stage/stair geometry, walk path, journey runtime
    scene/                   R3F world: environment, landmarks, camera rig, stage, stairs,
                             character, journey driver, environment map + bloom, shared kit
    ui/                      hero overlay, labels, location rail, panel shell, tour, controls
  panels/                    About, Projects (list + detail), Experience, Achievements, Contact
  components/                navbar, ARIA graph SVG, shared UI
  hooks/                     media queries, WebGL probe, label exclusions, resume check
```

## Performance and accessibility

- One canvas and one render loop for the whole site. It is lazy-loaded (idle on desktop; first touch or ~2.5 s on phones) and never remounted. Geometries and materials are shared through `scene/kit.tsx` and disposed on unmount. Repeated buildings use instancing.
- Phones and tablets get a lighter world (fewer clouds, embers and buildings; lower pixel ratio). Pixel ratio also drops automatically if frames run slow.
- If WebGL is unavailable, Save-Data is on, or the context is lost, the SVG world stays and supports the same navigation.
- Keyboard: landmark labels, nav, rail and panels are all focusable. Focus moves to the panel heading on open and returns to the trigger on close. Changes in location are announced through a live region. `prefers-reduced-motion` stops ambient animation and makes camera moves instant.
