# alan-astro-web

The public website for [Alan Astro](https://github.com/miah-al/alan-astro): one
static page (`index.html`, `styles.css`, `site.js`) with no build step.

The palette, the mark and night mode are the app's own, copied from
`web/src/index.css` and `web/public/icon.svg` in the main repo. If those change,
change them here too, so the site keeps looking like the product.

## Where it is served

- **https://alanastro.com** (and www): a Cloudflare Worker that only serves this folder's files,
  set up in `wrangler.jsonc`. To publish, from this folder: `npx wrangler deploy`
  (run `npx wrangler login` once first). `.assetsignore` keeps the README, tools and config out of the upload.
- GitHub Pages also serves `master` at https://miah-al.github.io/alan-astro-web/. The page's
  canonical link points at alanastro.com.

## Contact

The "Contact us" button (top right), the hero button and the footer all use
`alan.astro.space@gmail.com`, the same address as the Cloudflare account.

## Downloads (all "Coming soon" since 2026-11-07)

Nothing can be downloaded yet: this repo has no GitHub release and there is no Play Store listing.
To switch one on:

- **Windows:** replace the `btn btn-block soon` span in the download section with
  `<a class="btn btn-block" href="https://github.com/miah-al/alan-astro-web/releases/latest/download/alan-astro.msi">`.
  The file name must stay `alan-astro.msi`, because `latest/download` resolves by name. To publish a build:
  `gh release create v1.0.N ../alan-astro/web/public/alan-astro.msi -R miah-al/alan-astro-web --title "Alan Astro 1.0.N"`
- **Android:** Google Play, package `com.alanastro.app` (from `alan-astro-android`). Replace the `badge soon`
  span with `<a class="badge" href="https://play.google.com/store/apps/details?id=com.alanastro.app">`.
- **iOS:** the same, with `https://apps.apple.com/app/id<number>`, once the app has an App Store listing.
- **Linux:** stays "Coming soon" until `miah-al/alan-astro-linux` publishes a build.
- Then put the hero's main button back to a download link, and change "Coming soon." in the download section.
- **The AI section, step 2:** take off "Coming with the release" once an installed build carries the
  self-describing API (alan-astro SV-108, merged 2026-11-11 as `a5cddf4d`). It serves `/api` and `/openapi/v1.json`;
  1.0.2505.0 and older do not.

## Local preview

Open `index.html` in a browser. Nothing needs to be built.

## Screenshots

Where each image comes from (2026-11-07):

- `hero.jpg`: the owner's own Stephan's Quintet, shot with Alan Astro on 2026-10-08 from a Bortle 8 backyard
  (2,800 mm, 38 × 180 s; the guide screen read 0.73″ RMS that night), processed in Alan Astro Suite. Source:
  `D:\Data\HCG92_Stephans_Quintet.png`, cropped so the galaxies sit right of the headline.
- `app-sky.jpg`, `app-guide.jpg`, `focus.jpg`: real screens from the 2026-10-26 field night
  (`docs/reference/images/2026-10-26/` in alan-astro). `focus.jpg` is cropped below the status row, which shows the site's name.
  Use real guide and focus captures: the simulator guides at an unbelievable 0.07″ and fits focus at R² 1.00.
- The rest (`app-frame-m42.jpg`, `app-plan.jpg`, `app-plan-night.jpg`, `sky.jpg`, `app-atlas-phone.jpg`) are from
  the simulator, taken from alan-astro master `cd447e8c` on an isolated server, never the desk rig:

1. A worktree of alan-astro at `D:\tmp\site-shots`, built (`dotnet build backend\AstroControl.Api -c Debug`,
   then `npm run build` in `web`).
2. `tools/start-sim.ps1` serves it on port 5570 with its own data root (`D:\tmp\site-sim-data`), the
   "Refractor 103 mm" sim profile (700 mm), and the sky imagery through `D:\tmp\sky-imagery`.
   Connect the sim devices with `POST /api/devices/connect` first.
3. `node tools/shoot.mjs <outDir> [shot ...]` captures them in the day palette (night for
   `app-plan-night.jpg`), with times in the simulated site's zone (England). Guiding and autofocus
   really run on the simulator, which takes a few minutes.

The phone and tablet shots use the Android emulators' screen sizes (915×412 and 1280×800).
`sky.jpg` is the atlas and `focus.jpg` is the autofocus panel; the names stayed so the page did not change.

Night mode on this page uses an SVG colour matrix (`#redden` in `index.html`) rather than a CSS filter chain, because
sepia and hue-rotate clip a bright galaxy core to yellow.

## The AI section (`#ai`)

Real messages from field nights on the 11-inch SCT at 2,800 mm (the Stephan's Quintet night and 26 October), where an AI ran the app. No test targets (M27 was a test). Rules: word for word,
"…" marks a cut, [brackets] replace equipment brand names, imaging only (no bug-fix talk), and no site name, PC
names, IPs, people or issue ids. Times are local (EDT until 1 November, EST after).

Sources, all in the alan-astro session transcript `498b3986-6101-47c6-a3c4-c6bd5d30fd16.jsonl` (line numbers):
- 8 October, Stephan's Quintet: 16355, 16409, 16543, 16728, 17277, 17282, 17688, 17691, 17923, 18401, 18434, 18915, 18918, 18937, 19061, 19076, 19109
- 26 October, the clock face: 59345, 59357, 59360, 59390, 59400, 59412, and 59961 for the 0.19′
- Sky and targets, 8 October: 18555, 18570, 18637

To check a quote: read that line of the JSONL, parse it, and print `message.content[].text`.

## Claims

Every number on the page is a measurement recorded in the alan-astro issue register, given by the owner,
or read from the running app (the atlas: 18,956 entries on 2026-11-07). Check before adding one.
On 2026-11-07 every claim was checked against master `cd447e8c`. Things that are **not** true and must not come back:

- INDI on Windows (it is only in the unreleased Linux server).
- "Won't autofocus until backlash is measured" (it runs without a backlash figure).
- "Learns each filter's focus offset" (the user sets them, or the filter wheel's driver supplies them).
- "Green and blue stay under half" and "even the guide image turns red" in night mode (guide and focus images stay grey).
- A download size (the installer grows; it was 63 MB on 2026-11-07).
- "Filters by your horizon" for the atlas (it filters by altitude in darkness and direction; the horizon is drawn on the curves).
- Vendor names: no ZWO anywhere, including camera model names in screenshots, and no Canon (it's "DSLRs").
