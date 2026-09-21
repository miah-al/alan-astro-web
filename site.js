(function () {
  var root = document.documentElement
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  // ── Night mode ────────────────────────────────────────────────────────
  function toggleTheme() {
    var night = root.dataset.theme !== 'night'
    if (night) root.dataset.theme = 'night'; else delete root.dataset.theme
    try { localStorage.setItem('theme', night ? 'night' : 'day') } catch (e) {}
    starColour = readStar()
  }
  document.querySelectorAll('.theme-toggle, .theme-toggle-inline').forEach(function (b) { b.addEventListener('click', toggleTheme) })
  document.getElementById('yr').textContent = new Date().getFullYear()

  // ── Nav solidifies once the hero has scrolled away ────────────────────
  var nav = document.getElementById('nav')
  function onScroll() { nav.classList.toggle('scrolled', window.scrollY > 40) }
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll()

  // ── Reveal on scroll, count-ups, timeline ─────────────────────────────
  function countUp(el) {
    var target = parseFloat(el.dataset.count), dec = +(el.dataset.dec || 0)
    var fmt = function (v) { return dec ? v.toFixed(dec) : Math.round(v).toLocaleString('en-US') }
    if (reduced) { el.textContent = fmt(target); return }
    var t0 = null, dur = 1600
    function step(t) {
      if (!t0) t0 = t
      var p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 4)
      el.textContent = fmt(target * e)
      if (p < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (!en.isIntersecting) return
      en.target.classList.add('in')
      en.target.querySelectorAll('[data-count]').forEach(countUp)
      io.unobserve(en.target)
    })
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' })
  document.querySelectorAll('.reveal, .night, .ladder').forEach(function (el) { io.observe(el) })

  // ── Pointer light on cards ────────────────────────────────────────────
  document.querySelectorAll('.card').forEach(function (c) {
    c.addEventListener('pointermove', function (e) {
      var r = c.getBoundingClientRect()
      c.style.setProperty('--mx', (e.clientX - r.left) + 'px')
      c.style.setProperty('--my', (e.clientY - r.top) + 'px')
    })
  })

  // ── Tour tabs, auto-advancing until someone picks one ─────────────────
  var captions = [
    '<b>Frame.</b> Search a target and see your camera’s real field of view over it, with every object nearby labelled. Then slew and centre with one tap. Works offline.',
    '<b>Atlas.</b> Over 12,500 objects, filtered to what clears your horizon tonight, each with its altitude curve, transit time and distance from the Moon.',
    '<b>Plan.</b> Targets, startup and shutdown actions, meridian flips and refocus triggers, with the whole night’s time estimated.',
    '<b>Guide.</b> Several guide stars, a star profile, and a trace with labelled axes, so you can read the size of an error at a glance.'
  ]
  var tabs = [].slice.call(document.querySelectorAll('.tab'))
  var slides = [].slice.call(document.querySelectorAll('.stage img'))
  var caption = document.querySelector('.caption')
  var bar = document.querySelector('.progress i')
  var current = 0, timer = null, auto = !reduced
  function show(i) {
    current = i
    tabs.forEach(function (t, k) { t.setAttribute('aria-selected', k === i ? 'true' : 'false') })
    slides.forEach(function (s, k) { s.classList.toggle('on', k === i) })
    caption.innerHTML = captions[i]
    bar.classList.remove('run'); void bar.offsetWidth
    if (auto) bar.classList.add('run')
  }
  function schedule() { clearInterval(timer); if (auto) timer = setInterval(function () { show((current + 1) % tabs.length) }, 7000) }
  tabs.forEach(function (t, k) { t.addEventListener('click', function () { auto = false; clearInterval(timer); show(k) }) })
  show(0); schedule()

  // ── Day / night comparison ────────────────────────────────────────────
  var cmp = document.getElementById('compare')
  function setPos(pct) {
    pct = Math.max(0, Math.min(100, pct))
    cmp.style.setProperty('--pos', pct + '%')
    cmp.setAttribute('aria-valuenow', Math.round(pct))
  }
  function fromEvent(e) { var r = cmp.getBoundingClientRect(); setPos((e.clientX - r.left) / r.width * 100) }
  var dragging = false
  cmp.addEventListener('pointerdown', function (e) { dragging = true; cmp.setPointerCapture(e.pointerId); fromEvent(e) })
  cmp.addEventListener('pointermove', function (e) { if (dragging || e.pointerType === 'mouse') fromEvent(e) })
  cmp.addEventListener('pointerup', function () { dragging = false })
  cmp.addEventListener('keydown', function (e) {
    var v = parseFloat(cmp.getAttribute('aria-valuenow'))
    if (e.key === 'ArrowLeft') { setPos(v - 5); e.preventDefault() }
    if (e.key === 'ArrowRight') { setPos(v + 5); e.preventDefault() }
  })

  // ── Starfield: twinkling stars and the odd meteor ─────────────────────
  var canvas = document.getElementById('sky')
  var ctx = canvas.getContext('2d')
  var stars = [], meteors = [], w = 0, h = 0, dpr = Math.min(2, window.devicePixelRatio || 1)
  function readStar() { return getComputedStyle(root).getPropertyValue('--star').trim().split(/\s+/).join(',') }
  var starColour = readStar()
  function resize() {
    w = canvas.clientWidth; h = canvas.clientHeight
    canvas.width = w * dpr; canvas.height = h * dpr
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    var n = Math.round(w * h / 5200)
    stars = []
    for (var i = 0; i < n; i++) stars.push({ x: Math.random() * w, y: Math.random() * h, r: Math.random() * 1.2 + .2, a: Math.random(), s: Math.random() * .02 + .004, p: Math.random() * 6.28 })
  }
  function frame(t) {
    ctx.clearRect(0, 0, w, h)
    for (var i = 0; i < stars.length; i++) {
      var s = stars[i], a = s.a * (.55 + .45 * Math.sin(t * s.s * .06 + s.p))
      ctx.fillStyle = 'rgba(' + starColour + ',' + a.toFixed(3) + ')'
      ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 6.2832); ctx.fill()
    }
    if (Math.random() < .004 && meteors.length < 2) meteors.push({ x: Math.random() * w * .8 + w * .2, y: Math.random() * h * .4, vx: -(6 + Math.random() * 5), vy: 2.5 + Math.random() * 2, life: 1 })
    for (var m = meteors.length - 1; m >= 0; m--) {
      var mt = meteors[m]
      var g = ctx.createLinearGradient(mt.x, mt.y, mt.x - mt.vx * 12, mt.y - mt.vy * 12)
      g.addColorStop(0, 'rgba(' + starColour + ',' + (.9 * mt.life).toFixed(3) + ')'); g.addColorStop(1, 'rgba(' + starColour + ',0)')
      ctx.strokeStyle = g; ctx.lineWidth = 1.4
      ctx.beginPath(); ctx.moveTo(mt.x, mt.y); ctx.lineTo(mt.x - mt.vx * 12, mt.y - mt.vy * 12); ctx.stroke()
      mt.x += mt.vx; mt.y += mt.vy; mt.life -= .018
      if (mt.life <= 0) meteors.splice(m, 1)
    }
    if (running) requestAnimationFrame(frame)
  }
  var running = false
  resize()
  window.addEventListener('resize', resize)
  if (reduced) { running = false; frame(0) }
  else {
    // Only animate while the hero is on screen; no point burning a laptop
    // battery at the mount on stars nobody is looking at.
    new IntersectionObserver(function (e) {
      var vis = e[0].isIntersecting
      if (vis && !running) { running = true; requestAnimationFrame(frame) }
      else if (!vis) running = false
    }).observe(canvas)
  }
})()
