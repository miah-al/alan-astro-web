// Second retake pass: the plan with every device connected and all three targets up,
// the phone atlas on every catalogue, and M42 framed with object labels off.
//   node reshoot3.mjs <outDir> [plan] [phone] [m42]
import { createRequire } from 'node:module'
import fs from 'node:fs'
const require = createRequire('D:/tmp/site-shots/web/package.json')
const { chromium } = require('playwright')
const [out, ...only] = process.argv.slice(2)
const want = (s) => !only.length || only.includes(s)
const BASE = 'http://127.0.0.1:5570'
fs.mkdirSync(out, { recursive: true })
const sleep = (ms) => new Promise(r => setTimeout(r, ms))
const api = async (method, p, body) => {
  const res = await fetch(BASE + '/api' + p, { method, headers: body ? { 'Content-Type': 'application/json' } : {}, body: body ? JSON.stringify(body) : undefined })
  const t = await res.text(); if (!res.ok) throw new Error(`${method} ${p} -> ${res.status} ${t.slice(0, 200)}`)
  try { return JSON.parse(t) } catch { return t }
}
const DEVICES = ['sim-camera-osc', 'sim-mount', 'sim-filterwheel', 'sim-focuser', 'sim-rotator', 'sim-flatpanel', 'sim-safety', 'sim-switch', 'sim-weather', 'sim-guidecam', 'native-guider']
const connectAll = async () => { for (const id of DEVICES) await api('POST', '/devices/connect', { deviceId: id }).catch(e => console.log('connect', id, e.message)) }
const SITE_WEST = { latitudeDeg: 40.0, longitudeEastDeg: -120.0, elevationM: 80, name: 'Example site', observer: '', horizonFile: '', pushToMount: true }
const SITE_UK = { latitudeDeg: 51.75, longitudeEastDeg: -1.25, elevationM: 80, name: 'Example site', observer: '', horizonFile: '', pushToMount: true }
const browser = await chromium.launch()
async function open(route, { w = 1440, h = 900, scale = 1.25, theme = 'day', mobile = false, storage = {}, tz = 'America/Los_Angeles' } = {}) {
  const context = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: scale, timezoneId: tz, isMobile: mobile, hasTouch: mobile })
  await context.addInitScript(({ theme, storage }) => { try { localStorage.setItem('alanastro.theme', theme); localStorage.removeItem('alanastro.sky.search'); for (const [k, v] of Object.entries(storage)) localStorage.setItem(k, v) } catch {} }, { theme, storage })
  const page = await context.newPage(); page.setDefaultTimeout(20000)
  await page.goto(BASE + route, { waitUntil: 'domcontentloaded' })
  return { context, page }
}
const closeCentring = async (page) => {
  const c = page.locator('[aria-label="Close centring"]').first()
  if (await c.isVisible().catch(() => false)) { await c.click(); await page.waitForTimeout(400) }
}
const clickVisible = async (page, text, filter = () => true) => {
  const loc = page.getByText(text, { exact: true }); const n = await loc.count()
  for (let i = 0; i < n; i++) { const el = loc.nth(i); if (!(await el.isVisible())) continue; const b = await el.boundingBox(); if (b && filter(b)) { await el.click({ force: true }); return true } }
  return false
}
async function pickTarget(page, query, card) {
  await page.locator('button[title="Search"]').first().click({ force: true }); await page.waitForTimeout(3000)
  await clickVisible(page, 'All', b => b.y < 260); await page.waitForTimeout(800)
  const input = page.locator('input[placeholder*="M31, Orion"]').first()
  await input.fill(query); await input.press('Enter'); await page.waitForTimeout(4000)
  if (!(await clickVisible(page, card, b => b.y > 150))) throw new Error('no card ' + card)
  await page.waitForTimeout(4500)
}

if (want('plan')) {
  await api('POST', '/profile/switch/a1e0c001-0000-4000-8000-00000000a011')
  await connectAll()
  await api('PATCH', '/profile', { site: SITE_WEST })
  // The Crab Nebula is barely up from this site tonight: swap it for another Pegasus galaxy.
  const def = await api('GET', '/sequence')
  def.targets = def.targets.filter(t => !/Crab/i.test(t.name))
  await api('PUT', '/sequence', def)
  if (def.targets.length < 3) {
    const { context, page } = await open('/sky')
    await page.waitForTimeout(4500); await closeCentring(page)
    await pickTarget(page, 'C43', 'C43')
    await clickVisible(page, 'Add to plan', b => b.y > 600); await page.waitForTimeout(2500)
    await context.close()
  }
  console.log('plan targets:', (await api('GET', '/sequence')).targets.map(t => t.name).join(', '))
  for (const theme of ['day', 'night']) {
    const { context, page } = await open('/sequence', { w: 1280, h: 800, theme })
    await page.waitForTimeout(5500)
    const chevron = page.locator('main button:has(svg.lucide-chevron-down)').first()
    if (await chevron.isVisible().catch(() => false)) { await chevron.click(); await page.waitForTimeout(1200) }
    const text = await page.evaluate(() => document.body.innerText)
    console.log(theme, 'warning text on screen:', /cannot be confirmed|not connected|disconnected/i.test(text))
    await page.screenshot({ path: `${out}/${theme === 'day' ? 'app-plan' : 'app-plan-night'}.jpg`, type: 'jpeg', quality: 86 })
    await context.close()
  }
}

if (want('phone')) {
  const { context, page } = await open('/sky', { w: 915, h: 412, scale: 1.6, mobile: true })
  await page.waitForTimeout(5000); await closeCentring(page)
  await page.locator('button[title="Search"]').first().click({ force: true }); await page.waitForTimeout(3500)
  // The catalogue is a drop-down here: open it and pick "All".
  await clickVisible(page, 'Messier', b => b.y < 200); await page.waitForTimeout(800)
  const opt = page.getByText('All catalogues', { exact: true })
  if (await opt.count()) await opt.first().click({ force: true })
  else if (!(await clickVisible(page, 'All', b => b.y > 180))) console.log('no All option')
  await page.waitForTimeout(1200)
  const input = page.locator('input[placeholder*="M31, Orion"]').first()
  await input.fill('Pegasus'); await input.press('Enter'); await page.waitForTimeout(8000)
  const text = await page.evaluate(() => document.body.innerText)
  console.log('phone: M31/Andromeda:', /Androm|\bM31\b/.test(text), '| Stephan:', /Stephan/.test(text), '| catalogue still Messier:', /Messier/.test(text))
  await page.screenshot({ path: `${out}/app-atlas-phone.jpg`, type: 'jpeg', quality: 86 })
  await context.close()
}

if (want('m42')) {
  // M42 is up from the English example site at this hour; the 700 mm refractor frames it.
  await api('POST', '/profile/switch/a1e0c001-0000-4000-8000-000000000103')
  await connectAll()
  await api('PATCH', '/profile', { site: SITE_UK })
  await api('PATCH', '/profile', { sky: { preferredSource: 'offline', preferredSurvey: '' } }).catch(() => {})
  const m42 = { ra: 5.5881, dec: -5.3911 }
  await api('POST', '/mount/slew', { rightAscensionHours: m42.ra, declinationDeg: m42.dec, epoch: 'J2000', force: false }).catch(e => console.log('slew', e.message))
  await sleep(9000)
  const storage = { 'alanastro.sky.labels': '0', 'alanastro.sky.view': JSON.stringify({ ra: m42.ra, dec: m42.dec, fov: 4, anchorRa: m42.ra, anchorDec: m42.dec }) }
  const { context, page } = await open('/sky', { storage, tz: 'Europe/London' })
  await page.waitForTimeout(12000); await closeCentring(page)
  await page.screenshot({ path: `${out}/app-frame.jpg`, type: 'jpeg', quality: 86 })
  console.log('ok m42')
  await context.close()
}
await browser.close()
