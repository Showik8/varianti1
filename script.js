/* ============================================================
   FIT FACTORY — Interactions, i18n, GSAP + Lenis motion
   ============================================================ */
(function () {
  'use strict';

  const prefersReduced = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  ).matches;
  const finePointer = window.matchMedia('(pointer:fine)').matches;
  const hasGSAP = typeof gsap !== 'undefined';
  const hasST = hasGSAP && typeof ScrollTrigger !== 'undefined';
  if (hasST) gsap.registerPlugin(ScrollTrigger);

  /* ============================================================
     i18n  (ka default + en, persisted)
     ============================================================ */
  const DICT = window.I18N || { ka: {}, en: {} };
  const SUPPORTED = ['ka', 'en'];
  let lang = localStorage.getItem('ff_lang');
  if (!SUPPORTED.includes(lang)) lang = 'ka';

  const t = (key) =>
    (DICT[lang] && DICT[lang][key] != null
      ? DICT[lang][key]
      : DICT.ka && DICT.ka[key] != null
        ? DICT.ka[key]
        : key);

  function applyI18n(root) {
    root = root || document;
    root.querySelectorAll('[data-i18n]').forEach((el) => {
      const v = t(el.getAttribute('data-i18n'));
      if (v != null) el.textContent = v;
    });
    root.querySelectorAll('[data-i18n-html]').forEach((el) => {
      const v = t(el.getAttribute('data-i18n-html'));
      if (v != null) el.innerHTML = v;
    });
    root.querySelectorAll('[data-i18n-attr]').forEach((el) => {
      el.getAttribute('data-i18n-attr')
        .split(';')
        .forEach((pair) => {
          const idx = pair.indexOf(':');
          if (idx < 0) return;
          const attr = pair.slice(0, idx).trim();
          const v = t(pair.slice(idx + 1).trim());
          if (v != null) el.setAttribute(attr, v);
        });
    });
  }

  // English re-uses the original Latin webfonts (loaded on demand)
  function ensureLatinFonts() {
    if (document.getElementById('gfonts')) return;
    const l = document.createElement('link');
    l.id = 'gfonts';
    l.rel = 'stylesheet';
    l.href =
      'https://fonts.googleapis.com/css2?family=Oswald:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600;700&display=swap';
    document.head.appendChild(l);
  }

  const langButtons = Array.from(document.querySelectorAll('[data-set-lang]'));
  function markLangButtons() {
    langButtons.forEach((b) =>
      b.classList.toggle('is-active', b.getAttribute('data-set-lang') === lang)
    );
  }

  let onLangChange = null; // schedule re-render hook, set later
  function setLang(next) {
    if (!SUPPORTED.includes(next) || next === lang) return;
    lang = next;
    localStorage.setItem('ff_lang', lang);
    document.documentElement.lang = lang;
    if (lang === 'en') ensureLatinFonts();
    document.title = t('meta.title');
    applyI18n();
    markLangButtons();
    if (typeof onLangChange === 'function') onLangChange();
    if (hasST) ScrollTrigger.refresh();
  }

  // Apply immediately (runs behind the preloader → no flash of English)
  document.documentElement.lang = lang;
  if (lang === 'en') ensureLatinFonts();
  document.title = t('meta.title');
  applyI18n();
  markLangButtons();
  langButtons.forEach((b) =>
    b.addEventListener('click', () => setLang(b.getAttribute('data-set-lang')))
  );

  /* ============================================================
     Lenis smooth scroll  (graceful fallback)
     ============================================================ */
  let lenis = null;
  if (typeof Lenis !== 'undefined' && !prefersReduced) {
    lenis = new Lenis({
      duration: 1.1,
      easing: (x) => Math.min(1, 1.001 - Math.pow(2, -10 * x)),
      smoothWheel: true,
    });
    if (hasST) {
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add((time) => lenis.raf(time * 1000));
      gsap.ticker.lagSmoothing(0);
    } else {
      const raf = (time) => {
        lenis.raf(time);
        requestAnimationFrame(raf);
      };
      requestAnimationFrame(raf);
    }
    window.__lenis = lenis;
  }
  const HEADER_OFFSET = 72;
  function scrollToEl(el) {
    if (lenis) lenis.scrollTo(el, { offset: -HEADER_OFFSET });
    else {
      const y =
        el.getBoundingClientRect().top + window.scrollY - HEADER_OFFSET;
      window.scrollTo({ top: y, behavior: prefersReduced ? 'auto' : 'smooth' });
    }
  }
  function scrollToTop() {
    if (lenis) lenis.scrollTo(0);
    else window.scrollTo({ top: 0, behavior: prefersReduced ? 'auto' : 'smooth' });
  }

  /* ---------- Preloader ---------- */
  const preloader = document.getElementById('preloader');
  const preloaderBar = document.getElementById('preloaderBar');
  let progress = 0;
  const fakeLoad = setInterval(() => {
    progress = Math.min(100, progress + Math.random() * 18 + 6);
    if (preloaderBar) preloaderBar.style.width = progress + '%';
    if (progress >= 100) {
      clearInterval(fakeLoad);
      finishLoad();
    }
  }, 130);
  function finishLoad() {
    setTimeout(() => {
      preloader && preloader.classList.add('is-done');
      document.body.style.overflow = '';
      startHeroIntro();
      if (hasST) ScrollTrigger.refresh();
      // deep links: #join opens the modal, other hashes scroll into view
      const h = location.hash;
      if (h === '#join' && window.__ffOpenJoin) {
        window.__ffOpenJoin();
      } else if (h && h.length > 1) {
        const el = document.querySelector(h);
        if (el) setTimeout(() => scrollToEl(el), 120);
      }
    }, 260);
  }
  document.body.style.overflow = 'hidden';
  window.addEventListener('load', () => {
    progress = Math.max(progress, 88);
    if (hasST) ScrollTrigger.refresh();
  });

  /* ---------- Year ---------- */
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- Header scroll state + progress + back-to-top ---------- */
  const header = document.getElementById('header');
  const scrollProgress = document.getElementById('scrollProgress');
  const backTop = document.getElementById('backTop');
  const onScroll = () => {
    const y = window.scrollY;
    if (header) header.classList.toggle('is-scrolled', y > 40);
    if (scrollProgress) {
      const h = document.documentElement;
      const scrolled = h.scrollTop / (h.scrollHeight - h.clientHeight || 1);
      scrollProgress.style.width = scrolled * 100 + '%';
    }
    if (backTop) backTop.classList.toggle('is-visible', y > window.innerHeight * 0.9);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  if (backTop) backTop.addEventListener('click', scrollToTop);

  /* ---------- Mobile nav ---------- */
  const burger = document.getElementById('burger');
  const nav = document.getElementById('nav');
  const toggleNav = (open) => {
    if (!nav || !burger) return;
    const isOpen = open !== undefined ? open : !nav.classList.contains('is-open');
    nav.classList.toggle('is-open', isOpen);
    burger.classList.toggle('is-open', isOpen);
    burger.setAttribute('aria-expanded', String(isOpen));
    document.body.style.overflow = isOpen ? 'hidden' : '';
    if (lenis) isOpen ? lenis.stop() : lenis.start();
  };
  if (burger) burger.addEventListener('click', () => toggleNav());

  /* ---------- Smooth in-page anchors ---------- */
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    const id = a.getAttribute('href');
    if (!id || id.length < 2) return;
    a.addEventListener('click', (e) => {
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      if (nav && nav.classList.contains('is-open')) toggleNav(false);
      scrollToEl(target);
    });
  });

  /* ---------- Active nav link on scroll ---------- */
  const navLinks = Array.from(document.querySelectorAll('.nav a'));
  const sections = navLinks
    .map((a) => document.querySelector(a.getAttribute('href')))
    .filter(Boolean);
  if ('IntersectionObserver' in window) {
    const spy = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            navLinks.forEach((l) =>
              l.classList.toggle(
                'is-active',
                l.getAttribute('href') === '#' + e.target.id
              )
            );
          }
        });
      },
      { rootMargin: '-45% 0px -50% 0px' }
    );
    sections.forEach((s) => spy.observe(s));
  }

  /* ---------- Cursor glow ---------- */
  const glow = document.getElementById('cursorGlow');
  if (glow && finePointer && !prefersReduced) {
    let gx = 0, gy = 0, cx = 0, cy = 0;
    window.addEventListener('mousemove', (e) => {
      gx = e.clientX;
      gy = e.clientY;
      glow.style.opacity = '1';
    });
    const loop = () => {
      cx += (gx - cx) * 0.12;
      cy += (gy - cy) * 0.12;
      glow.style.transform = `translate(${cx - 240}px, ${cy - 240}px)`;
      requestAnimationFrame(loop);
    };
    loop();
  }

  /* ---------- Hero intro (GSAP) ---------- */
  function startHeroIntro() {
    if (!hasGSAP || prefersReduced) {
      document.querySelectorAll('.reveal-up').forEach((el) => {
        el.style.opacity = 1;
        el.style.transform = 'none';
      });
      document
        .querySelectorAll('.hero__title .line > span')
        .forEach((el) => (el.style.transform = 'none'));
      animateCounters();
      return;
    }
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    tl.set('.hero__title .line > span', { yPercent: 110 })
      .to('.hero__title .line > span', { yPercent: 0, duration: 1, stagger: 0.12 }, 0.1)
      .to('.hero__eyebrow', { opacity: 1, y: 0, duration: 0.8 }, 0.2)
      .fromTo('.hero__sub', { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.8 }, 0.7)
      .fromTo('.hero__cta', { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.8 }, 0.85)
      .fromTo('.hero__stats', { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.8, onComplete: animateCounters }, 1.0)
      .fromTo('.hero__scroll', { opacity: 0 }, { opacity: 1, duration: 0.8 }, 1.2);
  }
  if (hasGSAP && !prefersReduced) gsap.set('.hero__eyebrow', { opacity: 0, y: 20 });

  /* ---------- Scroll reveals + curtain depth ---------- */
  if (hasST && !prefersReduced) {
    document.querySelectorAll('.section .reveal-up').forEach((el) => {
      if (el.closest('#gallery')) return; // gallery uses the cover/curtain reveal
      gsap.fromTo(
        el,
        { opacity: 0, y: 44 },
        {
          opacity: 1,
          y: 0,
          duration: 0.9,
          ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 88%' },
        }
      );
    });

    // Hero recedes as the curtain (marquee + why) rises over it
    const curtain = document.querySelector('.curtain');
    if (curtain) {
      gsap.to('.hero__inner', {
        yPercent: -14,
        opacity: 0.2,
        ease: 'none',
        scrollTrigger: { trigger: curtain, start: 'top bottom', end: 'top top', scrub: true },
      });
      gsap.to('.hero__video', {
        scale: 1.14,
        ease: 'none',
        scrollTrigger: { trigger: curtain, start: 'top bottom', end: 'top top', scrub: true },
      });
    }

    // Section title micro letter-spacing parallax
    document.querySelectorAll('.section__title').forEach((title) => {
      gsap.fromTo(
        title,
        { letterSpacing: '-0.03em' },
        {
          letterSpacing: '0em',
          ease: 'none',
          scrollTrigger: { trigger: title, start: 'top 90%', end: 'top 50%', scrub: true },
        }
      );
    });
  } else {
    document.querySelectorAll('.reveal-up').forEach((el) => {
      el.style.opacity = 1;
      el.style.transform = 'none';
    });
  }

  /* ---------- Animated counters ---------- */
  let countersDone = false;
  function animateCounters() {
    if (countersDone) return;
    countersDone = true;
    document.querySelectorAll('[data-count]').forEach((el) => {
      const target = parseInt(el.getAttribute('data-count'), 10);
      if (prefersReduced) {
        el.textContent = target.toLocaleString();
        return;
      }
      const dur = 1600;
      const start = performance.now();
      const tick = (now) => {
        const p = Math.min(1, Math.max(0, (now - start) / dur));
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(target * eased).toLocaleString();
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  }

  /* ============================================================
     Class schedule (i18n + crossfade)
     ============================================================ */
  const scheduleData = {
    Monday: [
      { time: '09:00', workout: 'PILATES' },
      { time: '19:00', workout: 'YOGA' },
      { time: '20:00', workout: 'PILATES REFORMER' },
      { time: '20:00', workout: 'GLUTE WORKOUT' },
      { time: '20:00', workout: 'HIIT' },
      { time: '21:00', workout: 'PILATES' },
      { time: '21:00', workout: 'ABS WORKOUT' },
    ],
    Tuesday: [
      { time: '11:00', workout: 'PILATES' },
      { time: '12:00', workout: 'FULL BODY WORKOUT' },
      { time: '13:00', workout: 'PILATES REFORMER' },
      { time: '20:00', workout: 'CROSSFIT' },
      { time: '21:00', workout: 'YOGA' },
    ],
    Wednesday: [
      { time: '09:00', workout: 'PILATES' },
      { time: '19:00', workout: 'YOGA' },
      { time: '20:00', workout: 'GLUTE WORKOUT' },
      { time: '20:00', workout: 'HIIT' },
      { time: '20:00', workout: 'PILATES REFORMER' },
      { time: '21:00', workout: 'PILATES' },
      { time: '21:00', workout: 'ABS WORKOUT' },
    ],
    Thursday: [
      { time: '11:00', workout: 'PILATES' },
      { time: '12:00', workout: 'FULL BODY WORKOUT' },
      { time: '13:00', workout: 'PILATES REFORMER' },
      { time: '20:00', workout: 'CROSSFIT' },
      { time: '21:00', workout: 'ABS WORKOUT' },
      { time: '21:00', workout: 'YOGA' },
    ],
    Friday: [
      { time: '09:00', workout: 'PILATES' },
      { time: '09:00', workout: 'ABS WORKOUT' },
      { time: '19:00', workout: 'YOGA' },
      { time: '20:00', workout: 'PILATES REFORMER' },
      { time: '20:00', workout: 'HIIT' },
      { time: '20:00', workout: 'GLUTE WORKOUT' },
    ],
    Saturday: [
      { time: '12:00', workout: 'PILATES' },
      { time: '13:00', workout: 'FULL BODY WORKOUT' },
      { time: '14:00', workout: 'PILATES REFORMER' },
      { time: '20:00', workout: 'CROSSFIT' },
      { time: '21:00', workout: 'ABS WORKOUT' },
    ],
    Sunday: [
      { time: '20:00', workout: 'HIIT' },
      { time: '21:00', workout: 'ABS WORKOUT' },
    ],
  };
  const workoutIcon = (w) => {
    if (w.includes('PILATES REFORMER')) return 'i-target';
    if (w.includes('PILATES')) return 'i-pulse';
    if (w.includes('YOGA')) return 'i-leaf';
    if (w.includes('HIIT')) return 'i-flame';
    if (w.includes('CROSSFIT')) return 'i-strength';
    return 'i-dumbbell';
  };

  const daysWrap = document.getElementById('scheduleDays');
  const schedulePanel = document.getElementById('schedulePanel');
  let activeDay = null;

  if (daysWrap && schedulePanel) {
    const days = Object.keys(scheduleData);
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    activeDay = days.includes(today) ? today : 'Monday';

    function buildDayButtons() {
      daysWrap.innerHTML = '';
      days.forEach((day) => {
        const count = scheduleData[day].length;
        const btn = document.createElement('button');
        btn.className = 'schedule__day';
        btn.setAttribute('role', 'tab');
        btn.dataset.day = day;
        btn.innerHTML = `${t('day.short.' + day)}<small>${count} ${t(
          count === 1 ? 'sch.class' : 'sch.classes'
        )}</small>`;
        btn.addEventListener('click', () => selectDay(day));
        if (day === activeDay) btn.classList.add('is-active');
        daysWrap.appendChild(btn);
      });
    }

    function cardHTML(c) {
      const period =
        c.time < '12:00' ? 'sch.morning' : c.time < '17:00' ? 'sch.day' : 'sch.evening';
      return `
        <div class="sched-card">
          <div class="sched-card__time">${c.time}<span>${t(period)}</span></div>
          <span class="sched-card__icon"><svg viewBox="0 0 24 24"><use href="#${workoutIcon(
            c.workout
          )}"/></svg></span>
          <div class="sched-card__body">
            <p class="sched-card__name">${t('workout.' + c.workout)}</p>
            <p class="sched-card__meta">${t('sch.duration')}</p>
          </div>
        </div>`;
    }

    function renderDay(day, animate) {
      const list = scheduleData[day]
        .slice()
        .sort((a, b) => a.time.localeCompare(b.time));
      if (!list.length) {
        schedulePanel.innerHTML = `<p class="sched-empty">${t('sch.rest')}</p>`;
        return;
      }
      schedulePanel.innerHTML = list.map(cardHTML).join('');
      if (animate && hasGSAP && !prefersReduced) {
        gsap.fromTo(
          '#schedulePanel .sched-card',
          { opacity: 0, y: 18 },
          { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out', stagger: 0.05 }
        );
      }
    }

    function selectDay(day) {
      const changed = day !== activeDay;
      activeDay = day;
      daysWrap
        .querySelectorAll('.schedule__day')
        .forEach((b) => b.classList.toggle('is-active', b.dataset.day === day));
      const existing = schedulePanel.querySelectorAll('.sched-card');
      if (changed && existing.length && hasGSAP && !prefersReduced) {
        // crossfade: fade old out, then render + fade new in
        gsap.to(existing, {
          opacity: 0,
          y: -10,
          duration: 0.25,
          ease: 'power2.in',
          stagger: 0.03,
          onComplete: () => renderDay(day, true),
        });
      } else {
        renderDay(day, true);
      }
    }

    buildDayButtons();
    renderDay(activeDay, false);

    // refresh schedule text when language changes
    onLangChange = () => {
      buildDayButtons();
      renderDay(activeDay, false);
    };
  }

  /* ============================================================
     Trainers showcase (long pinned scroll + slide-in + tilt)
     ============================================================ */
  (function setupTrainers() {
    const section = document.getElementById('trainers');
    if (!section) return;
    const viewport = section.querySelector('.trainers__viewport');
    const track = document.getElementById('trainersTrack');
    const progress = document.getElementById('trainersProgress');
    if (!viewport || !track) return;
    const cards = Array.from(track.querySelectorAll('.tcard'));

    // 3D tilt on hover (desktop pointer)
    if (hasGSAP && !prefersReduced && finePointer) {
      cards.forEach((card) => {
        card.addEventListener('mousemove', (e) => {
          const r = card.getBoundingClientRect();
          const px = (e.clientX - r.left) / r.width - 0.5;
          const py = (e.clientY - r.top) / r.height - 0.5;
          gsap.to(card, {
            rotateY: px * 10,
            rotateX: -py * 10,
            duration: 0.5,
            ease: 'power2.out',
            transformPerspective: 900,
            transformOrigin: 'center',
          });
        });
        card.addEventListener('mouseleave', () => {
          gsap.to(card, { rotateX: 0, rotateY: 0, duration: 0.7, ease: 'power3.out' });
        });
      });
    }

    const desktop = window.matchMedia('(min-width: 861px)').matches;
    const travel = () =>
      Math.max(0, track.scrollWidth - viewport.clientWidth + 40);

    if (hasST && !prefersReduced && desktop) {
      section.classList.add('is-pinned');

      // start fully empty — every trainer (incl. the first) reveals on scroll
      gsap.set(cards, { opacity: 0, x: 70, scale: 0.94 });

      // pinned: trainers slide in one-by-one as you scroll through
      const steps = Math.max(1, cards.length - 1);
      const pinLen = () =>
        Math.max(travel() * 1.4, cards.length * window.innerHeight * 0.55);
      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: viewport,
          start: 'top top',
          end: () => '+=' + pinLen(),
          pin: true,
          scrub: 1,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            if (progress) progress.style.width = self.progress * 100 + '%';
          },
        },
      });
      // first card reveals in place, then each next one slides in
      tl.to(
        cards[0],
        { opacity: 1, x: 0, scale: 1, ease: 'power3.out', duration: 0.6 },
        0
      );
      for (let i = 1; i < cards.length; i++) {
        tl.to(track, { x: () => -travel() * (i / steps), duration: 1 }, i);
        tl.to(
          cards[i],
          { opacity: 1, x: 0, scale: 1, ease: 'power3.out', duration: 0.6 },
          i + 0.35
        );
      }
    } else {
      // mobile / reduced: native horizontal scroll + reveal each card as it enters
      if (hasGSAP && !prefersReduced && 'IntersectionObserver' in window) {
        gsap.set(cards, { opacity: 0, y: 30 });
        const io = new IntersectionObserver(
          (entries) => {
            entries.forEach((e) => {
              if (e.isIntersecting) {
                gsap.to(e.target, {
                  opacity: 1,
                  y: 0,
                  duration: 0.6,
                  ease: 'power3.out',
                });
                io.unobserve(e.target);
              }
            });
          },
          { root: viewport, threshold: 0.35 }
        );
        cards.forEach((c) => io.observe(c));
      }
      const sync = () => {
        const max = track.scrollWidth - viewport.clientWidth;
        if (progress)
          progress.style.width =
            (max > 0 ? (viewport.scrollLeft / max) * 100 : 0) + '%';
      };
      viewport.addEventListener('scroll', sync, { passive: true });
      sync();
    }
  })();

  /* ---------- Stacked section covers (each next rises over the previous) ---------- */
  (function setupStackCovers() {
    if (!hasST || prefersReduced) return;
    if (!window.matchMedia('(min-width: 861px)').matches) return;
    // why ← services ← plans ← schedule ← trainers (each is pinned as a
    // backdrop while the following section scrolls up and covers it).
    ['why', 'services', 'plans', 'schedule'].forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;
      ScrollTrigger.create({
        trigger: el,
        start: 'top top',
        end: () => '+=' + window.innerHeight,
        pin: true,
        pinSpacing: false,
        anticipatePin: 1,
        invalidateOnRefresh: true,
      });
    });
  })();

  /* ---------- Gallery covers Results like a curtain (left → right) ---------- */
  (function setupCover() {
    const results = document.getElementById('results');
    const gallery = document.getElementById('gallery');
    if (!gallery || !hasGSAP) return;
    // gallery content is shown together; the wipe carries the section in
    gsap.set(gallery.querySelectorAll('.reveal-up'), { opacity: 1, y: 0 });

    const desktop = window.matchMedia('(min-width: 861px)').matches;
    if (!hasST || prefersReduced || !desktop || !results) {
      gsap.set(gallery, { clipPath: 'none' });
      return;
    }

    // Pin Results as the backdrop; the Gallery (opaque, higher z) wipes over it
    // left → right — same "cover" idea as the hero curtain, but horizontal.
    // The gallery is lifted to sit on top of the pinned results and the `y`
    // tween cancels the pin-spacing rise, so only the clip moves → pure wipe.
    const gap = () => results.offsetHeight;
    gsap.fromTo(
      gallery,
      { y: () => -gap(), clipPath: 'inset(0 100% 0 0)' },
      {
        y: 0,
        clipPath: 'inset(0 0% 0 0)',
        ease: 'none',
        scrollTrigger: {
          trigger: results,
          start: 'top top',
          end: () => '+=' + gap(),
          pin: results,
          pinSpacing: false,
          scrub: true,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      }
    );
  })();

  /* ---------- Gallery parallax + hover zoom ---------- */
  (function setupGallery() {
    if (!hasGSAP) return;
    const items = Array.from(document.querySelectorAll('.gallery__item'));
    items.forEach((item) => {
      const img = item.querySelector('img');
      if (!img) return;
      if (hasST && !prefersReduced) {
        gsap.fromTo(
          img,
          { yPercent: -6 },
          {
            yPercent: 6,
            ease: 'none',
            scrollTrigger: {
              trigger: item,
              start: 'top bottom',
              end: 'bottom top',
              scrub: true,
            },
          }
        );
      }
      if (!prefersReduced && finePointer) {
        item.addEventListener('mouseenter', () =>
          gsap.to(img, { scale: 1.08, duration: 0.6, ease: 'power3.out' })
        );
        item.addEventListener('mouseleave', () =>
          gsap.to(img, { scale: 1, duration: 0.6, ease: 'power3.out' })
        );
      }
    });
  })();

  /* ---------- FAQ accordion ---------- */
  document.querySelectorAll('.faq__item').forEach((item) => {
    const q = item.querySelector('.faq__q');
    const a = item.querySelector('.faq__a');
    if (!q || !a) return;
    q.addEventListener('click', () => {
      const open = item.classList.contains('is-open');
      document.querySelectorAll('.faq__item.is-open').forEach((other) => {
        if (other !== item) {
          other.classList.remove('is-open');
          other.querySelector('.faq__a').style.maxHeight = null;
          other.querySelector('.faq__q').setAttribute('aria-expanded', 'false');
        }
      });
      item.classList.toggle('is-open', !open);
      q.setAttribute('aria-expanded', String(!open));
      a.style.maxHeight = !open ? a.scrollHeight + 'px' : null;
    });
  });

  /* ---------- Testimonials carousel ---------- */
  const cTrack = document.getElementById('carouselTrack');
  if (cTrack) {
    const slides = Array.from(cTrack.children);
    const dotsWrap = document.getElementById('carouselDots');
    let index = 0;
    slides.forEach((_, i) => {
      const dot = document.createElement('button');
      dot.setAttribute('aria-label', 'Go to slide ' + (i + 1));
      dot.addEventListener('click', () => {
        go(i);
        resetAuto();
      });
      dotsWrap.appendChild(dot);
    });
    const dots = Array.from(dotsWrap.children);
    function go(i) {
      index = (i + slides.length) % slides.length;
      cTrack.style.transform = `translateX(-${index * 100}%)`;
      dots.forEach((d, di) => d.classList.toggle('is-active', di === index));
    }
    const nextBtn = document.getElementById('nextBtn');
    const prevBtn = document.getElementById('prevBtn');
    nextBtn.addEventListener('click', () => {
      go(index + 1);
      resetAuto();
    });
    prevBtn.addEventListener('click', () => {
      go(index - 1);
      resetAuto();
    });
    go(0);
    let auto = setInterval(() => go(index + 1), 5500);
    const resetAuto = () => {
      clearInterval(auto);
      auto = setInterval(() => go(index + 1), 5500);
    };
    const carousel = document.getElementById('carousel');
    carousel.addEventListener('mouseenter', () => clearInterval(auto));
    carousel.addEventListener('mouseleave', resetAuto);
    let sx = 0;
    carousel.addEventListener('touchstart', (e) => (sx = e.touches[0].clientX), {
      passive: true,
    });
    carousel.addEventListener('touchend', (e) => {
      const dx = e.changedTouches[0].clientX - sx;
      if (Math.abs(dx) > 50) {
        go(index + (dx < 0 ? 1 : -1));
        resetAuto();
      }
    });
  }

  /* ---------- Contact form ---------- */
  const form = document.getElementById('contactForm');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      let valid = true;
      ['name', 'email', 'goal'].forEach((id) => {
        const el = document.getElementById(id);
        const ok =
          el.value.trim() !== '' &&
          !(id === 'email' && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(el.value));
        el.classList.toggle('invalid', !ok);
        if (!ok) valid = false;
      });
      if (!valid) return;
      const note = document.getElementById('formNote');
      note.hidden = false;
      const submit = form.querySelector('button[type=submit]');
      submit.textContent = t('form.sent');
      if (hasGSAP && !prefersReduced)
        gsap.fromTo(note, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.5 });
      setTimeout(() => {
        form.reset();
        submit.textContent = t('form.submit');
      }, 2500);
    });
  }

  /* ============================================================
     Join modal (multi-step)
     ============================================================ */
  (function setupJoinModal() {
    const modal = document.getElementById('joinModal');
    if (!modal) return;
    const panel = modal.querySelector('.jmodal__panel');
    const steps = Array.from(modal.querySelectorAll('.jmodal__step'));
    const dots = Array.from(modal.querySelectorAll('.jmodal__dot'));
    const titleEl = modal.querySelector('#jmTitle');
    const curEl = modal.querySelector('[data-jm-cur]');
    const summaryWrap = modal.querySelector('.jmodal__summary');
    const summaryEl = modal.querySelector('[data-jm-summary]');
    const planBtns = Array.from(modal.querySelectorAll('.jplan'));
    const backBtn = modal.querySelector('[data-jm-back]');
    const nextBtn = modal.querySelector('[data-jm-next]');
    const submitBtn = modal.querySelector('[data-jm-submit]');
    const doneBtn = modal.querySelector('[data-jm-done]');
    const jform = document.getElementById('joinForm');

    const PLAN_META = {
      basic: { nameKey: 'plan.basic.name', price: '$29' },
      std: { nameKey: 'plan.std.name', price: '$59' },
      prem: { nameKey: 'plan.prem.name', price: '$99' },
    };
    const TITLES = ['modal.t1', 'modal.t2', 'modal.t3'];

    let step = 1;
    let selectedPlan = null;
    let lastFocused = null;

    function updateSummary() {
      if (!selectedPlan || !summaryWrap) return;
      const m = PLAN_META[selectedPlan];
      summaryWrap.hidden = false;
      summaryEl.textContent = `${t(m.nameKey)} · ${m.price}${t('plan.per')}`;
    }

    function selectPlan(plan) {
      if (!PLAN_META[plan]) return;
      selectedPlan = plan;
      planBtns.forEach((b) =>
        b.classList.toggle('is-selected', b.getAttribute('data-plan') === plan)
      );
      updateSummary();
      if (nextBtn) nextBtn.disabled = false;
    }

    function setStep(n) {
      step = Math.min(3, Math.max(1, n));
      steps.forEach((s) =>
        s.classList.toggle('is-active', Number(s.dataset.step) === step)
      );
      dots.forEach((d) =>
        d.classList.toggle('is-active', Number(d.dataset.dot) <= step)
      );
      if (titleEl) titleEl.textContent = t(TITLES[step - 1]);
      if (curEl) curEl.textContent = step;
      if (backBtn) backBtn.hidden = step !== 2;
      if (nextBtn) nextBtn.hidden = step !== 1;
      if (submitBtn) submitBtn.hidden = step !== 2;
      if (doneBtn) doneBtn.hidden = step !== 3;
      // focus first useful control of the step
      const active = steps[step - 1];
      const f = active && active.querySelector('input, .jplan, button');
      if (f && modal.classList.contains('is-open')) setTimeout(() => f.focus(), 60);
    }

    function open(plan) {
      lastFocused = document.activeElement;
      if (plan) selectPlan(plan);
      setStep(plan ? 2 : 1);
      if (nextBtn) nextBtn.disabled = !selectedPlan;
      modal.classList.add('is-open');
      modal.setAttribute('aria-hidden', 'false');
      document.body.classList.add('modal-open');
      if (lenis) lenis.stop();
      const focusTarget = modal.querySelector(
        plan ? '#jName' : '.jplan.is-selected, .jplan'
      );
      setTimeout(() => focusTarget && focusTarget.focus(), 80);
    }

    function close() {
      modal.classList.remove('is-open');
      modal.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('modal-open');
      if (lenis) lenis.start();
      if (lastFocused) lastFocused.focus();
      // reset to clean state after the close transition
      setTimeout(() => {
        if (modal.classList.contains('is-open')) return;
        setStep(1);
      }, 400);
    }

    // expose for deep-link (#join) opening after preloader
    window.__ffOpenJoin = (plan) => open(plan);

    // triggers
    document.querySelectorAll('[data-open-join]').forEach((btn) => {
      btn.addEventListener('click', () => open(btn.getAttribute('data-plan')));
    });
    modal.querySelectorAll('[data-close-join]').forEach((btn) => {
      btn.addEventListener('click', close);
    });
    planBtns.forEach((b) =>
      b.addEventListener('click', () => selectPlan(b.getAttribute('data-plan')))
    );
    if (nextBtn) nextBtn.addEventListener('click', () => selectedPlan && setStep(2));
    if (backBtn) backBtn.addEventListener('click', () => setStep(1));
    if (submitBtn)
      submitBtn.addEventListener('click', () => {
        let valid = true;
        ['jName', 'jPhone', 'jEmail', 'jGoal'].forEach((id) => {
          const el = document.getElementById(id);
          if (!el) return;
          const ok =
            el.value.trim() !== '' &&
            !(id === 'jEmail' && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(el.value));
          el.classList.toggle('invalid', !ok);
          if (!ok) valid = false;
        });
        if (!valid) return;
        setStep(3);
        if (jform) jform.reset();
      });

    // keyboard: ESC + focus trap
    modal.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        close();
        return;
      }
      if (e.key !== 'Tab') return;
      const focusables = Array.from(
        panel.querySelectorAll(
          'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
      ).filter((el) => !el.hidden && el.offsetParent !== null);
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    });

    setStep(1);
  })();

  /* ---------- Magnetic primary buttons (desktop) ---------- */
  if (hasGSAP && !prefersReduced && finePointer) {
    document
      .querySelectorAll('.hero__cta .btn, .header__cta, .jmodal__actions .btn--solid')
      .forEach((btn) => {
        btn.addEventListener('mousemove', (e) => {
          const r = btn.getBoundingClientRect();
          gsap.to(btn, {
            x: (e.clientX - (r.left + r.width / 2)) * 0.25,
            y: (e.clientY - (r.top + r.height / 2)) * 0.35,
            duration: 0.4,
            ease: 'power3.out',
          });
        });
        btn.addEventListener('mouseleave', () => {
          gsap.to(btn, { x: 0, y: 0, duration: 0.5, ease: 'elastic.out(1, 0.4)' });
        });
      });
  }
})();
