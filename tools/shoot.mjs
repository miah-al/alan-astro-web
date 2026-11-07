// Captures the website's screenshots from the simulator server on 5570.
//   node shoot-site.mjs <outDir> [shotId ...]
// Day palette unless a shot says night; times in the simulated site's zone.
import { createRequire } from 'node:module'
import fs from 'node:fs'
import path from 'node:path'
const require = createRequire('D:/tmp/site-shots/web/package.json')
const { chromium } = require('playwright')

const out = process.argv[2]
const only = process.argv.slice(3)
const BASE = process.env.BASE ?? 'http://127.0.0.1:5570'
fs.mkdirSync(out, { recursive: true })

const sleep = (ms) => new Promise(r => setTimeout(r, ms))
const api = async (method, p, body) => {
  const res = await fetch(BASE + '/api' + p, { method, headers: body ? { 'Content-Type': 'application/json' } : {}, body: body ? JSON.stringify(body) : undefined })
  const text = await res.text()
  if (!res.ok) throw new Error(`${method} ${p} -> ${res.status} ${text.slice(0, 300)}`)
  try { return JSON.parse(text) } catch { return text }
}
// Clicks the visible element whose own text is exactly `text`, chosen by area.
const clickIn = async (page, text, where = 'any', nth = 0) => {
  const loc = page.getByText(text, { exact: true })
  const n = await loc.count()
  const hits = []
  for (let i = 0; i < n; i++) {
    const el = loc.nth(i)
    if (!(await el.isVisible())) continue
    const b = await el.boundingBox()
    if (!b) continue
    const vw = page.viewportSize().width
    if (where === 'top' && !(b.y < 70 && b.x > 300)) continue
    if (where === 'main' && !(b.x > 68 && b.x < vw - 80)) continue
    hits.push(el)
  }
  if (!hits[nth]) throw new Error(`no visible "${text}" in ${where} (${n} total)`)
  await hits[nth].click({ force: true })
}
const closeCentring = async (page) => {
  const close = page.locator('[aria-label="Close centring"]').first()
  if (await close.isVisible().catch(() => false)) { await close.click(); await page.waitForTimeout(400) }
}

const browser = await chromium.launch()
async function open(route, { w = 1440, h = 900, scale = 1.25, theme = 'day', storage = {}, mobile = false } = {}) {
  const context = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: scale, timezoneId: 'Europe/London', isMobile: mobile, hasTouch: mobile })
  await context.addInitScript(({ theme, storage }) => {
    try { localStorage.setItem('alanastro.theme', theme); for (const [k, v] of Object.entries(storage)) localStorage.setItem(k, v) } catch {}
  }, { theme, storage })
  const page = await context.newPage()
  page.setDefaultTimeout(20000)
  await page.goto(BASE + route, { waitUntil: 'domcontentloaded' })
  return { context, page }
}
async function snap(page, id, clip) {
  const file = path.join(out, id + '.jpg')
  await page.screenshot({ path: file, type: 'jpeg', quality: 86, ...(clip ? { clip } : {}) })
  console.log('ok', id)
}
const want = (id) => !only.length || only.includes(id)

// Stephan's Quintet (HCG 92), framed with the 2,800 mm profile.
const Q = { ra: 22.5993, dec: 33.96 }
const view = (t, fov) => ({ 'alanastro.sky.view': JSON.stringify({ ra: t.ra, dec: t.dec, fov, anchorRa: t.ra, anchorDec: t.dec }) })

const steps = {
  // The mount on Stephan's Quintet, the Sky screen framing it.
  async sky() {
    await api('POST', '/mount/slew', { rightAscensionHours: Q.ra, declinationDeg: Q.dec, epoch: 'J2000', force: false }).catch(e => console.log('slew', e.message))
    await sleep(8000)
    const { context, page } = await open('/sky', { storage: view(Q, 0.75) })
    await page.waitForTimeout(14000); await closeCentring(page); await page.waitForTimeout(800)
    await snap(page, 'app-sky')
    await context.close()
  },
  // The page's hero background: the same sky with the boxes, labels and crosshair
  // switched off, since the headline sits on top of it.
  async hero() {
    await api('POST', '/mount/slew', { rightAscensionHours: Q.ra, declinationDeg: Q.dec, epoch: 'J2000', force: false }).catch(e => console.log('slew', e.message))
    await sleep(8000)
    const { context, page } = await open('/sky', { scale: 2, storage: { ...view(Q, 0.33), 'alanastro.sky.framing': '0', 'alanastro.sky.labels': '0', 'alanastro.sky.pointing': '0' } })
    await page.waitForTimeout(14000); await closeCentring(page)
    await page.waitForTimeout(800)
    // Only the sky: clear of the rail, the zoom panel, the compass, the field readout and the buttons.
    await snap(page, 'hero-m31', { x: 160, y: 72, width: 1180, height: 720 })
    await context.close()
  },
  // The catalogue grid that the map's Search opens.
  async atlas() {
    const { context, page } = await open('/sky')
    await page.waitForTimeout(5000); await closeCentring(page)
    await clickIn(page, 'Search', 'top')
    await page.waitForTimeout(6000)
    await snap(page, 'atlas')
    await context.close()
  },
  // M42 picked from the catalogue: the Target box over it, neighbours labelled.
  async 'frame-m42'() {
    const { context, page } = await open('/sky')
    await page.waitForTimeout(5000); await closeCentring(page)
    await pickTarget(page, 'M42')
    await zoomTo(page, 4)
    await page.waitForTimeout(9000)
    await snap(page, 'app-frame-m42')
    await context.close()
  },
  // A plan of three targets, each added from the catalogue the way a user would.
  async plan() {
    const def = await api('GET', '/sequence')
    def.targets = []; def.name = 'Galaxies at 2,800 mm'
    await api('PUT', '/sequence', def)
    for (const [query, card] of [['Stephan', 'HCG 92'], ['NGC 7331', 'NGC 7331'], ['M1', 'M1']]) {
      const { context, page } = await open('/sky')
      await page.waitForTimeout(4500); await closeCentring(page)
      await pickTarget(page, query, card)
      await page.waitForTimeout(5000)
      await clickIn(page, 'Add to plan', 'main')
      await page.waitForTimeout(2500)
      await context.close()
    }
    const after = await api('GET', '/sequence')
    console.log('plan targets:', after.targets.map(t => t.name).join(', '))
    for (const theme of ['day', 'night']) {
      const { context, page } = await open('/sequence', { w: 1280, h: 800, scale: 1.25, theme })
      await page.waitForTimeout(5000)
      await snap(page, theme === 'day' ? 'app-plan' : 'app-plan-night')
      await context.close()
    }
  },
  // Guiding for real on the simulator: loop, calibrate, guide, then let the trace fill.
  async guide() {
    // A calibration at the default pointing (the pole) is refused: go south first.
    await api('POST', '/mount/slew', { rightAscensionHours: 23.6, declinationDeg: 12, epoch: 'J2000', force: false }).catch(e => console.log('slew', e.message))
    await sleep(8000)
    const { context, page } = await open('/guide')
    await page.waitForTimeout(3500)
    await clickIn(page, 'Loop'); await sleep(10000)
    await clickIn(page, 'Calib'); await sleep(600)
    await clickIn(page, 'Calibrate').catch(e => console.log('calibrate', e.message))
    let state = ''
    for (let i = 0; i < 60; i++) {
      const h = await api('GET', '/guiding/history?max=1')
      state = h.state
      if (state === 'Guiding') break
      if (state === 'Looping' && i > 16) await api('POST', '/guiding/start', { forceCalibration: false }).catch(() => {})
      await sleep(5000)
    }
    console.log('guide state', state)
    await sleep(80000)
    await snap(page, 'app-guide')
    await context.close()
    const phone = await open('/guide', { w: 915, h: 412, scale: 1.6, mobile: true })
    await phone.page.waitForTimeout(9000)
    await snap(phone.page, 'app-guide-phone')
    await phone.context.close()
  },
  // Autofocus on the simulator, started off focus so the curve has two sides.
  async autofocus() {
    await api('POST', '/guiding/stop').catch(() => {})
    const { context, page } = await open('/imaging')
    await page.waitForTimeout(4000)
    await clickIn(page, 'Focus', 'top'); await sleep(1500)
    await api('POST', '/focuser/move', { position: 24300 }).catch(e => console.log('move', e.message)); await sleep(2500)
    await page.locator('[aria-label="Run autofocus"]').first().click()
    await sleep(8000)
    await page.locator('[aria-label="Run autofocus"]').first().waitFor({ state: 'visible', timeout: 600000 })
    await sleep(4000)
    await snap(page, 'autofocus')
    await context.close()
  },
}

// Opens the catalogue from the map, searches, and picks the first card named `name`.
async function pickTarget(page, name, card = name) {
  await clickIn(page, 'Search', 'top')
  await page.waitForTimeout(2500)
  const input = page.locator('input[placeholder*="M31, Orion"]').first()
  await input.fill(name)
  await input.press('Enter')
  await page.waitForTimeout(3500)
  await clickIn(page, card, 'main')
  await page.waitForTimeout(4000)
}
// Presses the map's zoom buttons until the field reads about `deg` degrees.
async function zoomTo(page, deg) {
  for (let i = 0; i < 14; i++) {
    const txt = await page.locator('[aria-label="Zoom in"]').first().evaluate(b => b.parentElement?.innerText ?? '')
    const m = txt.match(/([\d.]+)°/)
    const fov = m ? Number(m[1]) : NaN
    if (!Number.isFinite(fov) || Math.abs(fov - deg) / deg < 0.08) break
    await page.locator(`[aria-label="${fov > deg ? 'Zoom in' : 'Zoom out'}"]`).first().click()
    await page.waitForTimeout(500)
  }
}

for (const [id, fn] of Object.entries(steps)) {
  if (!want(id)) continue
  try { await fn() } catch (e) { console.log('FAILED', id, e.message.split('\n')[0]) }
}
await browser.close()
