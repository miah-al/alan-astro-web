// The atlas on the Caldwell list, on a desktop and on a phone held sideways.
import { createRequire } from 'node:module'
const require = createRequire('D:/tmp/site-shots/web/package.json')
const { chromium } = require('playwright')
const out = process.argv[2]
const browser = await chromium.launch()
for (const [file, w, h, scale, mobile] of [['atlas.jpg', 1440, 900, 1.25, false], ['app-atlas-phone.jpg', 915, 412, 1.6, true]]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: scale, isMobile: mobile, hasTouch: mobile, timezoneId: 'Europe/London' })
  await ctx.addInitScript(() => { try { localStorage.setItem('alanastro.theme', 'day'); localStorage.removeItem('alanastro.sky.search') } catch {} })
  const page = await ctx.newPage()
  await page.goto('http://127.0.0.1:5570/sky', { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(5000)
  await page.locator('button[title="Search"]').first().click({ force: true })
  await page.waitForTimeout(4000)
  const chip = page.getByText('Caldwell', { exact: true })
  for (let i = 0; i < await chip.count(); i++) { if (await chip.nth(i).isVisible()) { await chip.nth(i).click({ force: true }); break } }
  await page.waitForTimeout(7000)
  const text = await page.evaluate(() => document.body.innerText)
  console.log(file, 'mentions Andromeda Galaxy:', /Andromeda Galaxy|\bM31\b/.test(text))
  await page.screenshot({ path: `${out}/${file}`, type: 'jpeg', quality: 86 })
  await ctx.close()
}
await browser.close()
