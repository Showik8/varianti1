/* ============================================================
   FIT FACTORY — Interactions & GSAP animations
   ============================================================ */
(function () {
  'use strict';

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasGSAP = typeof gsap !== 'undefined';

  /* ---------- Preloader ---------- */
  const preloader = document.getElementById('preloader');
  const preloaderBar = document.getElementById('preloaderBar');
  let progress = 0;
  const fakeLoad = setInterval(() => {
    progress = Math.min(100, progress + Math.random() * 18 + 6);
    if (preloaderBar) preloaderBar.style.width = progress + '%';
    if (progress >= 100) { clearInterval(fakeLoad); finishLoad(); }
  }, 130);

  function finishLoad() {
    setTimeout(() => {
      preloader && preloader.classList.add('is-done');
      document.body.style.overflow = '';
      startHeroIntro();
    }, 260);
  }
  document.body.style.overflow = 'hidden';
  window.addEventListener('load', () => { progress = Math.max(progress, 88); });

  /* ---------- Year ---------- */
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- Header scroll state ---------- */
  const header = document.getElementById('header');
  const onScroll = () => {
    if (header) header.classList.toggle('is-scrolled', window.scrollY > 40);
    // scroll progress bar
    const sp = document.getElementById('scrollProgress');
    if (sp) {
      const h = document.documentElement;
      const scrolled = (h.scrollTop) / (h.scrollHeight - h.clientHeight);
      sp.style.width = (scrolled * 100) + '%';
    }
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Mobile nav ---------- */
  const burger = document.getElementById('burger');
  const nav = document.getElementById('nav');
  const toggleNav = (open) => {
    const isOpen = open !== undefined ? open : !nav.classList.contains('is-open');
    nav.classList.toggle('is-open', isOpen);
    burger.classList.toggle('is-open', isOpen);
    burger.setAttribute('aria-expanded', String(isOpen));
    document.body.style.overflow = isOpen ? 'hidden' : '';
  };
  if (burger) burger.addEventListener('click', () => toggleNav());
  nav && nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => toggleNav(false)));

  /* ---------- Active nav link on scroll ---------- */
  const navLinks = Array.from(document.querySelectorAll('.nav a'));
  const sections = navLinks.map(a => document.querySelector(a.getAttribute('href'))).filter(Boolean);
  const spy = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        navLinks.forEach(l => l.classList.toggle('is-active', l.getAttribute('href') === '#' + e.target.id));
      }
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  sections.forEach(s => spy.observe(s));

  /* ---------- Cursor glow ---------- */
  const glow = document.getElementById('cursorGlow');
  if (glow && window.matchMedia('(pointer:fine)').matches) {
    let gx = 0, gy = 0, cx = 0, cy = 0;
    window.addEventListener('mousemove', (e) => { gx = e.clientX; gy = e.clientY; glow.style.opacity = '1'; });
    const loop = () => { cx += (gx - cx) * 0.12; cy += (gy - cy) * 0.12; glow.style.transform = `translate(${cx - 240}px, ${cy - 240}px)`; requestAnimationFrame(loop); };
    loop();
  }

  /* ---------- Hero intro (GSAP) ---------- */
  function startHeroIntro() {
    if (!hasGSAP || prefersReduced) {
      document.querySelectorAll('.reveal-up').forEach(el => { el.style.opacity = 1; el.style.transform = 'none'; });
      document.querySelectorAll('.hero__title .line > span').forEach(el => { el.style.transform = 'none'; });
      animateCounters();
      return;
    }
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    tl.set('.hero__title .line > span', { yPercent: 110 })
      .to('.hero__title .line > span', { yPercent: 0, duration: 1, stagger: 0.12 }, 0.1)
      .to('.hero__eyebrow', { opacity: 1, y: 0, duration: .8 }, 0.2)
      .fromTo('.hero__sub', { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: .8 }, 0.7)
      .fromTo('.hero__cta', { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: .8 }, 0.85)
      .fromTo('.hero__stats', { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: .8, onComplete: animateCounters }, 1.0)
      .fromTo('.hero__scroll', { opacity: 0 }, { opacity: 1, duration: .8 }, 1.2);
  }

  /* set initial states for reveal-up (so they can animate in) */
  if (hasGSAP && !prefersReduced) {
    gsap.set('.hero__eyebrow', { opacity: 0, y: 20 });
  }

  /* ---------- Scroll reveal (GSAP ScrollTrigger) ---------- */
  if (hasGSAP && typeof ScrollTrigger !== 'undefined' && !prefersReduced) {
    gsap.registerPlugin(ScrollTrigger);

    document.querySelectorAll('.section .reveal-up').forEach((el) => {
      gsap.fromTo(el, { opacity: 0, y: 44 }, {
        opacity: 1, y: 0, duration: 0.9, ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 88%' }
      });
    });

    // Stagger grids
    const stagger = (sel, childSel) => {
      document.querySelectorAll(sel).forEach(grid => {
        const kids = grid.querySelectorAll(childSel);
        gsap.fromTo(kids, { opacity: 0, y: 50 }, {
          opacity: 1, y: 0, duration: .8, ease: 'power3.out', stagger: .1,
          scrollTrigger: { trigger: grid, start: 'top 82%' }
        });
      });
    };
    // (reveal-up already handles these, but ensure grids w/o class still animate)

    // Hero parallax
    gsap.to('.hero__bg', {
      yPercent: 18, ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
    });

    // Section title subtle parallax
    document.querySelectorAll('.section__title').forEach(t => {
      gsap.fromTo(t, { letterSpacing: '-0.03em' }, {
        letterSpacing: '0em', ease: 'none',
        scrollTrigger: { trigger: t, start: 'top 90%', end: 'top 50%', scrub: true }
      });
    });
  } else {
    // Fallback: just show everything
    document.querySelectorAll('.reveal-up').forEach(el => { el.style.opacity = 1; el.style.transform = 'none'; });
  }

  /* ---------- Animated counters ---------- */
  let countersDone = false;
  function animateCounters() {
    if (countersDone) return; countersDone = true;
    document.querySelectorAll('[data-count]').forEach(el => {
      const target = parseInt(el.getAttribute('data-count'), 10);
      if (prefersReduced) { el.textContent = target.toLocaleString(); return; }
      const dur = 1600; const start = performance.now();
      const tick = (now) => {
        const p = Math.min(1, (now - start) / dur);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(target * eased).toLocaleString();
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  }

  /* ---------- Class schedule ---------- */
  const scheduleData = {
    Monday: [
      { time: '09:00', workout: 'PILATES' },
      { time: '19:00', workout: 'YOGA' },
      { time: '20:00', workout: 'PILATES REFORMER' },
      { time: '20:00', workout: 'GLUTE WORKOUT' },
      { time: '20:00', workout: 'HIIT' },
      { time: '21:00', workout: 'PILATES' },
      { time: '21:00', workout: 'ABS WORKOUT' }
    ],
    Tuesday: [
      { time: '11:00', workout: 'PILATES' },
      { time: '12:00', workout: 'FULL BODY WORKOUT' },
      { time: '13:00', workout: 'PILATES REFORMER' },
      { time: '20:00', workout: 'CROSSFIT' },
      { time: '21:00', workout: 'YOGA' }
    ],
    Wednesday: [
      { time: '09:00', workout: 'PILATES' },
      { time: '19:00', workout: 'YOGA' },
      { time: '20:00', workout: 'GLUTE WORKOUT' },
      { time: '20:00', workout: 'HIIT' },
      { time: '20:00', workout: 'PILATES REFORMER' },
      { time: '21:00', workout: 'PILATES' },
      { time: '21:00', workout: 'ABS WORKOUT' }
    ],
    Thursday: [
      { time: '11:00', workout: 'PILATES' },
      { time: '12:00', workout: 'FULL BODY WORKOUT' },
      { time: '13:00', workout: 'PILATES REFORMER' },
      { time: '20:00', workout: 'CROSSFIT' },
      { time: '21:00', workout: 'ABS WORKOUT' },
      { time: '21:00', workout: 'YOGA' }
    ],
    Friday: [
      { time: '09:00', workout: 'PILATES' },
      { time: '09:00', workout: 'ABS WORKOUT' },
      { time: '19:00', workout: 'YOGA' },
      { time: '20:00', workout: 'PILATES REFORMER' },
      { time: '20:00', workout: 'HIIT' },
      { time: '20:00', workout: 'GLUTE WORKOUT' }
    ],
    Saturday: [
      { time: '12:00', workout: 'PILATES' },
      { time: '13:00', workout: 'FULL BODY WORKOUT' },
      { time: '14:00', workout: 'PILATES REFORMER' },
      { time: '20:00', workout: 'CROSSFIT' },
      { time: '21:00', workout: 'ABS WORKOUT' }
    ],
    Sunday: [
      { time: '20:00', workout: 'HIIT' },
      { time: '21:00', workout: 'ABS WORKOUT' }
    ]
  };
  const workoutIcon = (w) => {
    if (w.includes('PILATES REFORMER')) return 'i-target';
    if (w.includes('PILATES')) return 'i-pulse';
    if (w.includes('YOGA')) return 'i-leaf';
    if (w.includes('HIIT')) return 'i-flame';
    if (w.includes('CROSSFIT')) return 'i-strength';
    return 'i-dumbbell'; // GLUTE / ABS / FULL BODY
  };
  const daysWrap = document.getElementById('scheduleDays');
  const schedulePanel = document.getElementById('schedulePanel');
  if (daysWrap && schedulePanel) {
    const days = Object.keys(scheduleData);
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    let activeDay = days.includes(today) ? today : 'Monday';

    days.forEach(day => {
      const btn = document.createElement('button');
      btn.className = 'schedule__day';
      btn.setAttribute('role', 'tab');
      btn.dataset.day = day;
      btn.innerHTML = `${day.slice(0, 3)}<small>${scheduleData[day].length} ${scheduleData[day].length === 1 ? 'class' : 'classes'}</small>`;
      btn.addEventListener('click', () => selectDay(day));
      daysWrap.appendChild(btn);
    });

    function renderDay(day) {
      const list = scheduleData[day].slice().sort((a, b) => a.time.localeCompare(b.time));
      if (!list.length) { schedulePanel.innerHTML = '<p class="sched-empty">Rest day — recover & come back stronger.</p>'; return; }
      schedulePanel.innerHTML = list.map(c => `
        <div class="sched-card">
          <div class="sched-card__time">${c.time}<span>${c.time < '12:00' ? 'Morning' : c.time < '17:00' ? 'Day' : 'Evening'}</span></div>
          <span class="sched-card__icon"><svg viewBox="0 0 24 24"><use href="#${workoutIcon(c.workout)}"/></svg></span>
          <div class="sched-card__body">
            <p class="sched-card__name">${c.workout}</p>
            <p class="sched-card__meta">60 min · Group class</p>
          </div>
        </div>`).join('');
      if (hasGSAP && !prefersReduced) {
        gsap.fromTo('#schedulePanel .sched-card', { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: .5, ease: 'power3.out', stagger: .05 });
      }
    }

    function selectDay(day) {
      activeDay = day;
      daysWrap.querySelectorAll('.schedule__day').forEach(b => b.classList.toggle('is-active', b.dataset.day === day));
      renderDay(day);
    }
    selectDay(activeDay);
  }

  /* ---------- Trainers showcase (horizontal scroll + 3D tilt) ---------- */
  (function setupTrainers() {
    const section = document.getElementById('trainers');
    if (!section) return;
    const viewport = section.querySelector('.trainers__viewport');
    const track = document.getElementById('trainersTrack');
    const progress = document.getElementById('trainersProgress');
    const cards = Array.from(track.querySelectorAll('.tcard'));

    /* 3D tilt on hover (desktop pointer only) */
    if (hasGSAP && !prefersReduced && window.matchMedia('(pointer:fine)').matches) {
      cards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
          const r = card.getBoundingClientRect();
          const px = (e.clientX - r.left) / r.width - 0.5;
          const py = (e.clientY - r.top) / r.height - 0.5;
          gsap.to(card, { rotateY: px * 11, rotateX: -py * 11, duration: 0.5, ease: 'power2.out', transformPerspective: 900, transformOrigin: 'center' });
        });
        card.addEventListener('mouseleave', () => {
          gsap.to(card, { rotateX: 0, rotateY: 0, duration: 0.7, ease: 'power3.out' });
        });
      });
    }

    const desktop = window.matchMedia('(min-width: 861px)').matches;

    if (hasGSAP && typeof ScrollTrigger !== 'undefined' && !prefersReduced && desktop) {
      section.classList.add('is-pinned');

      /* entrance: cards rise + fade as the section approaches */
      gsap.from(cards, {
        opacity: 0, y: 70, rotateZ: 1.5, duration: 0.9, ease: 'power3.out', stagger: 0.09,
        scrollTrigger: { trigger: section, start: 'top 65%' }
      });

      /* horizontal pin-scroll */
      const distance = () => Math.max(0, track.scrollWidth - viewport.clientWidth);
      gsap.to(track, {
        x: () => -distance(),
        ease: 'none',
        scrollTrigger: {
          trigger: viewport,
          start: 'top top',
          end: () => '+=' + distance(),
          pin: true,
          scrub: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => { if (progress) progress.style.width = (self.progress * 100) + '%'; }
        }
      });

      window.addEventListener('load', () => ScrollTrigger.refresh());
    } else {
      /* fallback: native horizontal scroll — sync progress bar */
      const sync = () => {
        const max = track.scrollWidth - viewport.clientWidth;
        if (progress) progress.style.width = (max > 0 ? (viewport.scrollLeft / max) * 100 : 0) + '%';
      };
      viewport.addEventListener('scroll', sync, { passive: true });
      sync();
    }
  })();

  /* ---------- FAQ accordion ---------- */
  document.querySelectorAll('.faq__item').forEach(item => {
    const q = item.querySelector('.faq__q');
    const a = item.querySelector('.faq__a');
    q.addEventListener('click', () => {
      const open = item.classList.contains('is-open');
      // close others
      document.querySelectorAll('.faq__item.is-open').forEach(other => {
        if (other !== item) { other.classList.remove('is-open'); other.querySelector('.faq__a').style.maxHeight = null; other.querySelector('.faq__q').setAttribute('aria-expanded', 'false'); }
      });
      item.classList.toggle('is-open', !open);
      q.setAttribute('aria-expanded', String(!open));
      a.style.maxHeight = !open ? a.scrollHeight + 'px' : null;
    });
  });

  /* ---------- Testimonials carousel ---------- */
  const track = document.getElementById('carouselTrack');
  if (track) {
    const slides = Array.from(track.children);
    const dotsWrap = document.getElementById('carouselDots');
    let index = 0;
    slides.forEach((_, i) => {
      const dot = document.createElement('button');
      dot.setAttribute('aria-label', 'Go to slide ' + (i + 1));
      dot.addEventListener('click', () => go(i));
      dotsWrap.appendChild(dot);
    });
    const dots = Array.from(dotsWrap.children);
    function go(i) {
      index = (i + slides.length) % slides.length;
      track.style.transform = `translateX(-${index * 100}%)`;
      dots.forEach((d, di) => d.classList.toggle('is-active', di === index));
    }
    document.getElementById('nextBtn').addEventListener('click', () => { go(index + 1); resetAuto(); });
    document.getElementById('prevBtn').addEventListener('click', () => { go(index - 1); resetAuto(); });
    go(0);
    let auto = setInterval(() => go(index + 1), 5500);
    const resetAuto = () => { clearInterval(auto); auto = setInterval(() => go(index + 1), 5500); };
    const carousel = document.getElementById('carousel');
    carousel.addEventListener('mouseenter', () => clearInterval(auto));
    carousel.addEventListener('mouseleave', resetAuto);
    // swipe
    let sx = 0;
    carousel.addEventListener('touchstart', e => sx = e.touches[0].clientX, { passive: true });
    carousel.addEventListener('touchend', e => {
      const dx = e.changedTouches[0].clientX - sx;
      if (Math.abs(dx) > 50) { go(index + (dx < 0 ? 1 : -1)); resetAuto(); }
    });
  }

  /* ---------- Contact form ---------- */
  const form = document.getElementById('contactForm');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      let valid = true;
      ['name', 'email', 'goal'].forEach(id => {
        const el = document.getElementById(id);
        const ok = el.value.trim() !== '' && !(id === 'email' && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(el.value));
        el.classList.toggle('invalid', !ok);
        if (!ok) valid = false;
      });
      if (!valid) return;
      const note = document.getElementById('formNote');
      note.hidden = false;
      form.querySelector('button[type=submit]').textContent = 'Sent ✓';
      if (hasGSAP) gsap.fromTo(note, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: .5 });
      setTimeout(() => {
        form.reset();
        form.querySelector('button[type=submit]').textContent = 'Claim Free Trial';
      }, 2500);
    });
  }
})();
