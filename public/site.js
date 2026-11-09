/* Nous Avons Des Elles: navigation, tabs, timed carousels, gallery filters, reveal. */
(function () {
  'use strict';

  var t = function (key, vars) { return window.I18N ? window.I18N.t(key, vars) : key; };
  var onLang = function (fn) { if (window.I18N) window.I18N.on(fn); };
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------- Header: scrolled state ---------------- */
  var header = document.querySelector('.header');
  var syncHeader = function () { header.classList.toggle('header-scrolled', window.scrollY > 50); };
  window.addEventListener('scroll', syncHeader, { passive: true });
  syncHeader();

  /* ---------------- Mobile menu ---------------- */
  var navToggle = document.querySelector('.nav-toggle');
  var navLinks = document.getElementById('nav-links');
  var setMenu = function (open) {
    navToggle.setAttribute('aria-expanded', String(open));
    navToggle.setAttribute('aria-label', t(open ? 'menu.close' : 'menu.open'));
    navLinks.classList.toggle('nav-open', open);
    document.body.classList.toggle('nav-is-open', open);
  };
  navToggle.addEventListener('click', function () { setMenu(navToggle.getAttribute('aria-expanded') !== 'true'); });
  navLinks.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && navToggle.getAttribute('aria-expanded') === 'true') { setMenu(false); navToggle.focus(); }
  });
  onLang(function () { setMenu(navToggle.getAttribute('aria-expanded') === 'true'); });

  /* ---------------- Tabs (WAI-ARIA tab pattern) ----------------
     Without JavaScript every panel shows, one under the other. */
  document.querySelectorAll('[data-tabs]').forEach(function (root) {
    var list = root.querySelector(':scope > [role="tablist"]');
    if (!list) return;
    var tabs = Array.prototype.slice.call(list.querySelectorAll(':scope > [role="tab"]'));
    var vertical = list.getAttribute('aria-orientation') === 'vertical';
    var select = function (tab, focus) {
      tabs.forEach(function (x) {
        var on = x === tab;
        x.setAttribute('aria-selected', String(on));
        x.tabIndex = on ? 0 : -1;
        document.getElementById(x.getAttribute('aria-controls')).hidden = !on;
      });
      if (focus) tab.focus();
      root.dispatchEvent(new CustomEvent('tabchange', { bubbles: true }));
    };
    tabs.forEach(function (tab, i) {
      tab.addEventListener('click', function () { select(tab, false); });
      tab.addEventListener('keydown', function (e) {
        var next = vertical ? ['ArrowDown', 'ArrowRight'] : ['ArrowRight'];
        var prev = vertical ? ['ArrowUp', 'ArrowLeft'] : ['ArrowLeft'];
        var j = null;
        if (next.indexOf(e.key) !== -1) j = (i + 1) % tabs.length;
        if (prev.indexOf(e.key) !== -1) j = (i - 1 + tabs.length) % tabs.length;
        if (e.key === 'Home') j = 0;
        if (e.key === 'End') j = tabs.length - 1;
        if (j !== null) { e.preventDefault(); select(tabs[j], true); }
      });
    });
    select(tabs.filter(function (x) { return x.getAttribute('aria-selected') === 'true'; })[0] || tabs[0], false);
    root.selectTab = function (panelId) {
      var tab = tabs.filter(function (x) { return x.getAttribute('aria-controls') === panelId; })[0];
      if (tab) select(tab, false);
    };
  });

  /* A link to a panel (#station-coeur, #les-precieuses, #sc-activites…) opens its tab first. */
  var openTarget = function (hash) {
    if (!hash || hash.length < 2) return;
    var el = document.getElementById(decodeURIComponent(hash.slice(1)));
    for (var node = el; node; node = node.parentElement) {
      if (node.getAttribute && node.getAttribute('role') === 'tabpanel') {
        var root = node.closest('[data-tabs]');
        if (root && root.selectTab) root.selectTab(node.id);
      }
    }
  };
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href^="#"]');
    if (a) openTarget(a.getAttribute('href'));
  }, true);
  window.addEventListener('hashchange', function () { openTarget(location.hash); });
  if (location.hash) {
    openTarget(location.hash);
    var target = document.getElementById(decodeURIComponent(location.hash.slice(1)));
    if (target) setTimeout(function () { target.scrollIntoView({ behavior: 'instant' }); }, 0);
  }

  /* ---------------- Timed carousels (hero and gallery) ----------------
     The progress animation is the timer: when it ends, the carousel advances.
     It pauses on hover, on focus, while dragging, off screen and in a hidden tab;
     the play/pause button stops it for good. Reduced motion starts it stopped. */
  var pad = function (n) { return n < 10 ? '0' + n : String(n); };
  var restart = function (el) {
    if (!el) return;
    el.style.animation = 'none';
    el.getBoundingClientRect(); /* forces the reflow on HTML and SVG elements alike */
    el.style.animation = '';
  };

  function initCarousel(root) {
    var track = root.querySelector('[data-track]');
    var all = Array.prototype.slice.call(track.children);
    var segs = Array.prototype.slice.call(root.querySelectorAll('[data-segments] > button'));
    var toggle = root.querySelector('[data-toggle]');
    var ring = root.querySelector('.hero-ring circle');
    var timer = root.querySelector('[data-timer]');
    var current = root.querySelector('[data-counter-current]');
    var total = root.querySelector('[data-counter-total]');
    var viewport = track.parentElement;
    var interval = Number(root.getAttribute('data-interval')) || 5500;
    root.style.setProperty('--interval', interval + 'ms');

    var slides = all.slice();
    var index = 0;
    var stopped = reduceMotion;
    var holds = {};

    var held = function () { for (var k in holds) if (holds[k]) return true; return false; };
    var gap = function () { return parseFloat(getComputedStyle(track).columnGap) || 0; };
    var perView = function () {
      if (!slides.length) return 1;
      var w = slides[0].getBoundingClientRect().width;
      return Math.max(1, Math.round((viewport.clientWidth + gap()) / (w + gap())));
    };
    var maxIndex = function () { return Math.max(0, slides.length - perView()); };
    var offset = function () {
      if (!slides[index]) return 0;
      var maxShift = Math.max(0, track.scrollWidth - viewport.clientWidth);
      return Math.min(slides[index].offsetLeft, maxShift);
    };
    var place = function (dx) { track.style.transform = 'translateX(' + (-offset() + (dx || 0)) + 'px)'; };

    var syncPause = function () {
      var paused = stopped || held();
      root.classList.toggle('is-paused', paused);
      root.classList.toggle('is-stopped', stopped);
      if (toggle) {
        toggle.setAttribute('aria-pressed', String(stopped));
        toggle.setAttribute('aria-label', t(stopped ? 'carousel.play' : 'carousel.pause'));
      }
    };
    var hold = function (key, on) { holds[key] = on; syncPause(); };

    var labels = function () {
      slides.forEach(function (s, n) { s.setAttribute('aria-label', t('carousel.pos', { n: n + 1, total: slides.length })); });
      segs.forEach(function (seg, n) { seg.setAttribute('aria-label', t('carousel.goto', { n: n + 1 })); });
      syncPause();
    };

    var goTo = function (i) {
      var max = maxIndex();
      if (i > max) i = 0;
      if (i < 0) i = max;
      index = i;
      place(0);
      var pv = perView();
      all.forEach(function (s) {
        var n = slides.indexOf(s);
        var visible = n >= index && n < index + pv;
        s.classList.toggle('is-active', n === index);
        s.classList.toggle('is-visible', visible);
        if (n === -1) return;
        s.setAttribute('aria-hidden', String(!visible));
        s.querySelectorAll('a, button').forEach(function (a) { a.tabIndex = visible ? 0 : -1; });
        if (n < index + pv * 2) {
          var img = s.querySelector('img');
          if (img && img.loading === 'lazy' && n >= index - 1) img.loading = 'eager';
        }
      });
      segs.forEach(function (seg, n) {
        seg.classList.toggle('is-active', n === index);
        seg.classList.toggle('is-done', n < index);
        if (n === index) seg.setAttribute('aria-current', 'true'); else seg.removeAttribute('aria-current');
      });
      var last = Math.min(index + pv, slides.length);
      if (current) current.textContent = last - index > 1 ? pad(index + 1) + '–' + pad(last) : pad(index + 1);
      if (total) total.textContent = pad(slides.length);
      root.classList.toggle('is-static', maxIndex() === 0);
      restart(timer);
      restart(ring);
    };

    segs.forEach(function (seg, n) { seg.addEventListener('click', function () { goTo(n); }); });
    root.addEventListener('animationend', function (e) {
      if (e.animationName === 'progress-fill' && !stopped && !held()) goTo(index + 1);
    });
    var prev = root.querySelector('[data-prev]');
    var next = root.querySelector('[data-next]');
    if (prev) prev.addEventListener('click', function () { goTo(index - 1); });
    if (next) next.addEventListener('click', function () { goTo(index + 1); });
    if (toggle) toggle.addEventListener('click', function () { stopped = !stopped; syncPause(); });

    root.addEventListener('mouseenter', function () { hold('hover', true); });
    root.addEventListener('mouseleave', function () { hold('hover', false); });
    root.addEventListener('focusin', function () { hold('focus', true); });
    root.addEventListener('focusout', function (e) { if (!root.contains(e.relatedTarget)) hold('focus', false); });
    document.addEventListener('visibilitychange', function () { hold('hidden', document.hidden); });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) { hold('offscreen', !entries[0].isIntersecting); }, { threshold: 0.25 }).observe(root);
    }

    root.tabIndex = 0;
    root.addEventListener('keydown', function (e) {
      if (e.target !== root) return;
      if (e.key === 'ArrowLeft') { e.preventDefault(); goTo(index - 1); }
      if (e.key === 'ArrowRight') { e.preventDefault(); goTo(index + 1); }
    });

    /* Swipe and drag */
    var startX = 0, startY = 0, dx = 0, dragging = false, decided = false, horizontal = false;
    root.addEventListener('pointerdown', function (e) {
      if (e.button !== 0 || e.target.closest('button, a')) return;
      dragging = true; decided = false; horizontal = false; dx = 0;
      startX = e.clientX; startY = e.clientY;
    });
    root.addEventListener('pointermove', function (e) {
      if (!dragging) return;
      var mx = e.clientX - startX, my = e.clientY - startY;
      if (!decided && (Math.abs(mx) > 6 || Math.abs(my) > 6)) {
        decided = true;
        horizontal = Math.abs(mx) > Math.abs(my);
        if (!horizontal) { dragging = false; return; }
        root.setPointerCapture(e.pointerId);
        root.classList.add('is-dragging');
        hold('drag', true);
      }
      if (!horizontal) return;
      dx = mx;
      if ((index === 0 && dx > 0) || (index === maxIndex() && dx < 0)) dx *= 0.35;
      place(dx);
    });
    var end = function () {
      if (!dragging) return;
      dragging = false;
      if (!horizontal) return;
      root.classList.remove('is-dragging');
      hold('drag', false);
      var threshold = Math.min(80, (slides[0] ? slides[0].getBoundingClientRect().width : 300) * 0.18);
      if (dx < -threshold) goTo(index + 1);
      else if (dx > threshold) goTo(index - 1);
      else goTo(index);
    };
    root.addEventListener('pointerup', end);
    root.addEventListener('pointercancel', end);
    root.addEventListener('click', function (e) {
      if (horizontal && Math.abs(dx) > 6 && e.target.closest('a')) e.preventDefault();
      horizontal = false; dx = 0;
    }, true);

    var resizeTimer;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () { goTo(Math.min(index, maxIndex())); }, 120);
    });

    onLang(labels);
    labels();
    goTo(0);

    return {
      filter: function (cat) {
        all.forEach(function (s) { s.hidden = !(cat === 'all' || s.getAttribute('data-cat') === cat); });
        slides = all.filter(function (s) { return !s.hidden; });
        labels();
        goTo(0);
      },
      hold: hold
    };
  }

  var carousels = Array.prototype.slice.call(document.querySelectorAll('[data-carousel]')).map(function (root) {
    root.carousel = initCarousel(root);
    return root;
  });

  /* ---------------- The one reveal (content stays visible without script) ---------------- */
  if ('IntersectionObserver' in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { entry.target.classList.add('animate-in'); io.unobserve(entry.target); }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
    document.querySelectorAll('.section-header, .value-card, .audience, .impact-chain li').forEach(function (el) {
      el.classList.add('animate-ready');
      io.observe(el);
    });
  }

  void carousels;
})();
