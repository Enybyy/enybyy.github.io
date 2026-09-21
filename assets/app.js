(function () {
  'use strict';

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- año ---------- */
  var yr = document.getElementById('yr');
  if (yr) yr.textContent = new Date().getFullYear();

  /* ---------- marquee ---------- */
  var STACK = [
    'Laravel', 'PHP 8.4', 'Vue 3', 'React 19', 'TypeScript', 'Python', 'Django', 'Flask',
    'Flutter', 'Dart', 'JavaScript', 'MySQL', 'MariaDB', 'SQLite', 'Pandas', 'Selenium',
    'Excel · VBA', 'REST APIs', 'Chart.js', 'Firebase', 'Vite', 'Tailwind', 'PWA', 'CI/CD'
  ];
  var mq = document.getElementById('mq');
  if (mq) {
    // duplicado para que el bucle sea continuo
    STACK.concat(STACK).forEach(function (s) {
      var el = document.createElement('span');
      el.textContent = s;
      mq.appendChild(el);
    });
  }

  /* ---------- barra de progreso ---------- */
  var bar = document.getElementById('progress');
  var nav = document.getElementById('nav');
  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      var h = document.documentElement.scrollHeight - window.innerHeight;
      var p = h > 0 ? window.scrollY / h : 0;
      if (bar) bar.style.transform = 'scaleX(' + p + ')';
      if (nav) nav.classList.toggle('stuck', window.scrollY > 40);
      ticking = false;
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- reveal al hacer scroll ---------- */
  var rvs = Array.prototype.slice.call(document.querySelectorAll('.rv'));
  if (reduce || !('IntersectionObserver' in window)) {
    rvs.forEach(function (el) { el.classList.add('in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var el = e.target;
        // escalona los hermanos para un efecto en cascada
        var sibs = el.parentElement ? Array.prototype.slice.call(el.parentElement.children).filter(function (c) { return c.classList.contains('rv'); }) : [];
        var i = Math.max(0, sibs.indexOf(el));
        el.style.transitionDelay = Math.min(i * 70, 420) + 'ms';
        el.classList.add('in');
        io.unobserve(el);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    rvs.forEach(function (el) { io.observe(el); });
  }

  /* ---------- contadores ---------- */
  function animateCount(el) {
    var target = parseFloat(el.getAttribute('data-count'));
    if (isNaN(target)) return;
    var suffix = el.getAttribute('data-suffix') || '';
    if (reduce || target === 0) { el.textContent = target.toLocaleString('en-US') + suffix; return; }
    var dur = 1500, t0 = null;
    function step(ts) {
      if (t0 === null) t0 = ts;
      var p = Math.min((ts - t0) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased).toLocaleString('en-US') + suffix;
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  var counters = Array.prototype.slice.call(document.querySelectorAll('[data-count]'));
  if ('IntersectionObserver' in window) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        animateCount(e.target);
        cio.unobserve(e.target);
      });
    }, { threshold: 0.6 });
    counters.forEach(function (el) { cio.observe(el); });
  } else {
    counters.forEach(animateCount);
  }

  /* ---------- parallax suave en los marcos ---------- */
  if (!reduce && 'IntersectionObserver' in window) {
    var frames = Array.prototype.slice.call(document.querySelectorAll('.frame img'));
    var visible = [];
    var pio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        var i = visible.indexOf(e.target);
        if (e.isIntersecting && i === -1) visible.push(e.target);
        else if (!e.isIntersecting && i > -1) visible.splice(i, 1);
      });
    }, { threshold: 0 });
    frames.forEach(function (f) { pio.observe(f); });

    var pTick = false;
    window.addEventListener('scroll', function () {
      if (pTick || !visible.length) return;
      pTick = true;
      requestAnimationFrame(function () {
        var vh = window.innerHeight;
        visible.forEach(function (img) {
          var r = img.getBoundingClientRect();
          var mid = r.top + r.height / 2;
          var off = ((mid - vh / 2) / vh) * -14; // px
          img.style.transform = 'translate3d(0,' + off.toFixed(2) + 'px,0)';
        });
        pTick = false;
      });
    }, { passive: true });
  }

  /* ---------- lightbox ---------- */
  var lb = document.getElementById('lb');
  if (lb) {
    var lbImg = lb.querySelector('img');
    var lbCap = lb.querySelector('.cap');
    var items = Array.prototype.slice.call(document.querySelectorAll('[data-lb]'));
    var idx = -1;

    function show(i) {
      if (!items.length) return;
      idx = (i + items.length) % items.length;
      var src = items[idx];
      lbImg.src = src.getAttribute('src');
      lbImg.alt = src.getAttribute('alt') || '';
      lbCap.textContent = src.getAttribute('data-lb') || '';
      lb.classList.add('on');
      document.body.style.overflow = 'hidden';
    }
    function close() {
      lb.classList.remove('on');
      lbImg.src = '';
      document.body.style.overflow = '';
      idx = -1;
    }

    items.forEach(function (el, i) {
      el.addEventListener('click', function (ev) {
        ev.preventDefault();
        show(i);
      });
    });

    lb.querySelector('.x').addEventListener('click', close);
    lb.querySelector('.prev').addEventListener('click', function (e) { e.stopPropagation(); show(idx - 1); });
    lb.querySelector('.next').addEventListener('click', function (e) { e.stopPropagation(); show(idx + 1); });
    lb.addEventListener('click', function (e) { if (e.target === lb || e.target === lbCap) close(); });
    document.addEventListener('keydown', function (e) {
      if (!lb.classList.contains('on')) return;
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowLeft') show(idx - 1);
      else if (e.key === 'ArrowRight') show(idx + 1);
    });
  }
})();
