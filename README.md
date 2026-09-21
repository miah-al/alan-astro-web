# alan-astro-web

The public website for [Alan Astro](https://github.com/miah-al/alan-astro): one
static page (`index.html`, `styles.css`, `site.js`) with no build step, served
by GitHub Pages from `master`.

The palette, the mark and night mode are the app's own, copied from
`web/src/index.css` and `web/public/icon.svg` in the main repo. If those change,
change them here too, so the site keeps looking like the product.

## Downloads

- **Windows:** `https://github.com/miah-al/alan-astro-web/releases/latest/download/alan-astro.msi`.
  The file name must stay `alan-astro.msi`, because `latest/download` resolves by name.
  To publish a build:
  `gh release create v1.0.N ../alan-astro/web/public/alan-astro.msi -R miah-al/alan-astro-web --title "Alan Astro 1.0.N"`
- **Android:** Google Play, package `com.alanastro.app` (from `alan-astro-android`).
- **iOS:** shown as "Coming soon" until the app has an App Store listing. To switch it on, replace the
  `badge soon` element in `index.html` (add an `href`, drop `soon` and `aria-disabled`) with a link to `https://apps.apple.com/app/id<number>`.

## Local preview

Open `index.html` in a browser. Nothing needs to be built.

## Screenshots

The `assets/app-*.jpg` images are captured from a running server on a simulated rig, at 2x, in both palettes.
Night mode on this page uses an SVG colour matrix (`#redden` in `index.html`) rather than a CSS filter chain, because
sepia and hue-rotate clip a bright galaxy core to yellow.

## Claims

Every number on the page is a measurement recorded in the alan-astro issue register or given by the owner
(0.7″ RMS, consistently under 1″). Check before adding one. The Linux download stays "Coming soon" until a build is published.
