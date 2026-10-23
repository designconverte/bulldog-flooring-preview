/* site.js — interações e motion do site.
   Lenis, cabeçalho, barra fixa do celular, dropdown, pré-seleção do serviço, menu mobile, foto do hero montada
   em peças, frase que acende com o scroll, índice de serviços com foto no cursor, tabs de tom, trilho do processo,
   mosaico com paralaxe e contadores. Cada efeito procura o seu data-* e não faz nada se ele não existir.
   Tudo funciona sem GSAP/Lenis e nenhum conteúdo nasce escondido no CSS. */
(function () {
  'use strict';

  var root = document.documentElement;
  root.classList.remove('no-js');
  root.classList.add('js');

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var hasGsap = typeof window.gsap !== 'undefined';
  var hasST = hasGsap && typeof window.ScrollTrigger !== 'undefined';
  var gsap = window.gsap;
  var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };
  var headerH = function () { return parseInt(getComputedStyle(root).getPropertyValue('--header-h'), 10) || 76; };

  if (hasST) gsap.registerPlugin(window.ScrollTrigger);

  /* ── Lenis (desktop, ponteiro fino, sem reduced motion) ── */
  var lenis = null;
  if (!reduceMotion && finePointer && typeof window.Lenis !== 'undefined' && window.innerWidth >= 1024) {
    try {
      lenis = new window.Lenis({ lerp: 0.11, smoothWheel: true });
      if (hasST) {
        lenis.on('scroll', window.ScrollTrigger.update);
        gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
        gsap.ticker.lagSmoothing(0);
      } else {
        var raf = function (time) { lenis.raf(time); requestAnimationFrame(raf); };
        requestAnimationFrame(raf);
      }
      $$('a[href^="#"]').forEach(function (a) {
        a.addEventListener('click', function (e) {
          var id = a.getAttribute('href');
          if (id.length < 2) return;
          var target = document.querySelector(id);
          if (!target) return;
          e.preventDefault();
          lenis.scrollTo(target, { offset: -headerH() - 16 });
          var focusable = target.querySelector('input:not([type="hidden"]):not([tabindex="-1"]), button, a');
          if (focusable) setTimeout(function () { focusable.focus({ preventScroll: true }); }, 900);
        });
      });
    } catch (error) {
      console.warn('[site] Lenis off:', error && error.message);
      lenis = null;
    }
  }

  /* ── cabeçalho: vidro marinho depois do topo ── */
  var hdr = $('[data-hdr]');
  if (hdr) {
    var onScroll = function () { hdr.classList.toggle('is-scrolled', window.scrollY > 24); };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ── barra fixa no mobile: só quando o form do hero ficou para trás ── */
  var mbar = $('.mbar');
  var heroForm = $('[data-hero-form]');
  if (mbar && heroForm && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) { mbar.classList.toggle('is-visible', !entry.isIntersecting && entry.boundingClientRect.top < 0); });
    }).observe(heroForm);
  } else if (mbar) {
    mbar.classList.add('is-visible');
  }

  /* ── dropdown de serviços (desktop): disclosure com Escape e clique fora ── */
  $$('.nav-dd').forEach(function (dd) {
    var btn = $('.nav-dd__btn', dd);
    var list = $('.nav-dd__menu', dd);
    if (!btn || !list) return;
    var set = function (open) { btn.setAttribute('aria-expanded', String(open)); list.hidden = !open; };
    btn.addEventListener('click', function () { set(btn.getAttribute('aria-expanded') !== 'true'); });
    dd.addEventListener('keydown', function (e) { if (e.key === 'Escape') { set(false); btn.focus(); } });
    document.addEventListener('click', function (e) { if (!dd.contains(e.target)) set(false); });
    dd.addEventListener('focusout', function (e) { if (!dd.contains(e.relatedTarget)) set(false); });
  });

  /* ── serviço da página pré-selecionado no step 2 (editável) ── */
  $$('form[data-preselect]').forEach(function (form) {
    var value = form.getAttribute('data-preselect');
    if (!value) return;
    var radio = form.querySelector('input[name="service"][value="' + value.replace(/[^a-z-]/g, '') + '"]');
    if (radio) radio.checked = true;
  });

  /* ── menu mobile em camadas ── */
  (function menu() {
    var toggle = $('[data-menu-toggle]');
    var menuEl = document.getElementById('site-menu');
    if (!toggle || !menuEl) return;
    var panel = $('.smenu__panel', menuEl);
    var layers = $$('.smenu__layer', menuEl);
    var labels = $$('.smenu__link', menuEl);
    var textSlot = $('.menu-toggle__text span', toggle);
    var icon = $('.menu-toggle__icon', toggle);
    var backdrop = $('.smenu-backdrop', menuEl);
    var open = false;
    var openTl = null;
    var closeTl = null;
    var prevOverflow = '';
    menuEl.inert = true;

    var focusables = function () { return [toggle].concat($$('a[href], button:not([disabled])', menuEl)); };
    var setToggle = function (isOpen) {
      toggle.setAttribute('aria-expanded', String(isOpen));
      toggle.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu');
      if (textSlot) textSlot.textContent = isOpen ? 'Close' : 'Menu';
      if (hasGsap && !reduceMotion) gsap.to(icon, { rotate: isOpen ? 225 : 0, duration: 0.5, ease: 'power3.out', overwrite: 'auto' });
      else if (icon) icon.style.transform = isOpen ? 'rotate(225deg)' : '';
    };
    var openMenu = function () {
      if (open) return;
      open = true;
      menuEl.inert = false;
      menuEl.classList.add('is-open');
      root.classList.add('is-menu-open');
      prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      if (lenis) lenis.stop();
      setToggle(true);
      if (closeTl) closeTl.kill();
      if (hasGsap && !reduceMotion) {
        openTl = gsap.timeline();
        layers.forEach(function (el, i) { openTl.to(el, { xPercent: 0, duration: 0.5, ease: 'power4.out' }, i * 0.07); });
        var panelAt = layers.length * 0.07;
        openTl.to(panel, { xPercent: 0, duration: 0.65, ease: 'power4.out' }, panelAt);
        openTl.fromTo(labels, { yPercent: 140, rotate: 8 }, { yPercent: 0, rotate: 0, duration: 0.9, ease: 'power4.out', stagger: 0.08 }, panelAt + 0.1);
      } else {
        layers.concat([panel]).forEach(function (el) { el.style.transform = 'translateX(0)'; });
      }
      var first = focusables()[1];
      if (first) setTimeout(function () { first.focus(); }, reduceMotion ? 0 : 250);
    };
    var closeMenu = function (returnFocus) {
      if (!open) return;
      open = false;
      setToggle(false);
      menuEl.classList.remove('is-open');
      if (openTl) openTl.kill();
      var finish = function () {
        menuEl.inert = true;
        root.classList.remove('is-menu-open');
        document.body.style.overflow = prevOverflow;
        if (lenis) lenis.start();
      };
      if (hasGsap && !reduceMotion) {
        closeTl = gsap.timeline({ onComplete: finish });
        closeTl.to(panel, { xPercent: 100, duration: 0.4, ease: 'power3.in' }, 0);
        layers.slice().reverse().forEach(function (el, i) { closeTl.to(el, { xPercent: 100, duration: 0.4, ease: 'power3.in' }, 0.05 + i * 0.05); });
      } else {
        layers.concat([panel]).forEach(function (el) { el.style.transform = ''; });
        finish();
      }
      if (returnFocus !== false) toggle.focus();
    };
    // x: 0 zera o translateX(100%) do CSS para não somar com o xPercent
    if (hasGsap) gsap.set(layers.concat([panel]), { x: 0, xPercent: 100 });
    toggle.addEventListener('click', function () { if (open) closeMenu(); else openMenu(); });
    if (backdrop) backdrop.addEventListener('click', function () { closeMenu(); });
    menuEl.addEventListener('click', function (e) { if (e.target.closest('a[href]')) closeMenu(false); });
    document.addEventListener('keydown', function (e) {
      if (!open) return;
      if (e.key === 'Escape') { e.preventDefault(); closeMenu(); return; }
      if (e.key !== 'Tab') return;
      var items = focusables();
      if (e.shiftKey && document.activeElement === items[0]) { e.preventDefault(); items[items.length - 1].focus(); }
      else if (!e.shiftKey && document.activeElement === items[items.length - 1]) { e.preventDefault(); items[0].focus(); }
    });
    window.addEventListener('pagehide', function () { if (open) closeMenu(false); });
    window.matchMedia('(min-width: 1024px)').addEventListener('change', function (mq) { if (mq.matches) closeMenu(false); });
  })();

  /* ── tabs de cor: teclado completo (setas, Home, End); troca a foto com uma "pincelada" ── */
  (function tones() {
    var list = $('[data-tones]');
    var frame = $('[data-tone-frame]');
    if (!list || !frame) return;
    var tabs = $$('[role="tab"]', list);
    var imgs = $$('.stain__img', frame);
    var panel = document.getElementById('tone-panel');
    var label = $('[data-tone-label]');
    var text = $('[data-tone-text]');
    var current = 0;
    frame.setAttribute('data-js', '');

    var select = function (i, moveFocus) {
      if (i === current || !imgs[i]) { if (moveFocus) tabs[i].focus(); return; }
      var prev = imgs[current];
      var next = imgs[i];
      tabs.forEach(function (t, k) { t.setAttribute('aria-selected', String(k === i)); t.tabIndex = k === i ? 0 : -1; });
      if (panel) panel.setAttribute('aria-labelledby', tabs[i].id);
      if (label) label.textContent = tabs[i].getAttribute('data-tone-name');
      if (text) text.textContent = tabs[i].getAttribute('data-tone-cap');
      imgs.forEach(function (img) { img.classList.remove('is-prev', 'is-on'); });
      prev.classList.add('is-prev');
      next.classList.add('is-on');
      if (hasGsap && !reduceMotion) {
        gsap.killTweensOf(next);
        gsap.fromTo(next, { clipPath: 'inset(0% 100% 0% 0%)', scale: 1.06 }, {
          clipPath: 'inset(0% 0% 0% 0%)', scale: 1, duration: 0.95, ease: 'expo.inOut',
          onComplete: function () { prev.classList.remove('is-prev'); gsap.set(next, { clearProps: 'clipPath,scale' }); }
        });
      } else {
        prev.classList.remove('is-prev');
      }
      current = i;
      if (moveFocus) tabs[i].focus();
    };
    tabs.forEach(function (tab, i) {
      tab.addEventListener('click', function () { select(i, false); });
      tab.addEventListener('keydown', function (e) {
        var k = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
        if (k) { e.preventDefault(); select((current + k + tabs.length) % tabs.length, true); }
        else if (e.key === 'Home') { e.preventDefault(); select(0, true); }
        else if (e.key === 'End') { e.preventDefault(); select(tabs.length - 1, true); }
      });
    });
  })();

  /* ── balão de contato com o mascote ──
     Desktop: aparece depois que o form do hero sai da tela e some enquanto houver form à vista (a não ser que
     esteja aberto). Celular e tablet: fica na ponta da barra fixa e aparece junto com ela.
     Fala de abertura uma vez por sessão; na 1ª abertura a conversa entra em sequência, como num chat. */
  (function bubble() {
    var el = $('[data-bubble]');
    if (!el) return;
    root.classList.add('has-bubble');
    var fab = $('[data-bubble-toggle]', el);
    var panel = $('.bubble__panel', el);
    var closeBtn = $('[data-bubble-close]', el);
    var desktop = window.matchMedia('(min-width: 1024px)');
    var heroRef = $('[data-hero-form]');
    var visibleForms = new Set();
    var pastHero = !heroRef;
    var open = false;
    var seqDone = false;
    var timers = [];
    var later = function (fn, ms) { timers.push(setTimeout(fn, ms)); };
    var clearTimers = function () { timers.forEach(clearTimeout); timers = []; };
    var store = function (key, value) {
      try {
        if (value === undefined) return window.sessionStorage.getItem(key);
        window.sessionStorage.setItem(key, value);
      } catch (error) { /* sem storage: a fala de abertura só não fica lembrada */ }
      return null;
    };
    var tease = function (on, said) {
      el.classList.toggle('is-teasing', !!on);
      el.classList.toggle('is-said', !!said);
    };
    var autoTease = function () {
      if (reduceMotion) { tease(true, true); later(function () { tease(false); }, 5000); return; }
      later(function () {
        tease(true, false);
        later(function () {
          tease(true, true);
          later(function () { if (!open && !fab.matches(':hover')) tease(false); }, 5200);
        }, 1100);
      }, 900);
    };
    var update = function () {
      var show = open || (pastHero && (!desktop.matches || visibleForms.size === 0));
      el.classList.toggle('is-visible', show);
      if (!show) { clearTimers(); tease(false); return; }
      if (!open && !store('cs-bubble-teased')) { store('cs-bubble-teased', '1'); autoTease(); }
    };
    var runSequence = function () {
      var parts = $$('.bubble__msg, .bubble__actions', panel);
      var i = 0;
      panel.classList.add('is-seq');
      parts.forEach(function (p) { p.classList.remove('is-in'); });
      var step = function () {
        if (i >= parts.length) { panel.classList.remove('is-seq'); parts.forEach(function (p) { p.classList.remove('is-in'); }); return; }
        parts[i].classList.add('is-in');
        i += 1;
        later(step, i < parts.length ? 650 : 200);
      };
      later(step, 650);
    };
    var setOpen = function (value, fromKeyboard) {
      open = value;
      fab.setAttribute('aria-expanded', String(value));
      el.classList.toggle('is-open', value);
      panel.hidden = !value;
      clearTimers();
      tease(false);
      if (value) {
        if (!seqDone && !reduceMotion && !fromKeyboard) runSequence();
        else panel.classList.remove('is-seq');
        seqDone = true;
        panel.focus({ preventScroll: true });
      }
      update();
    };

    fab.addEventListener('click', function (e) { setOpen(!open, e.detail === 0); });
    if (closeBtn) closeBtn.addEventListener('click', function () { setOpen(false); fab.focus(); });
    $$('.bubble__act', panel).forEach(function (a) { a.addEventListener('click', function () { setOpen(false); }); });
    fab.addEventListener('mouseenter', function () { if (!open) { clearTimers(); tease(true, true); } });
    fab.addEventListener('mouseleave', function () { if (!open) tease(false); });
    fab.addEventListener('focus', function () { if (!open) tease(true, true); });
    fab.addEventListener('blur', function () { if (!open) tease(false); });
    document.addEventListener('keydown', function (e) { if (open && e.key === 'Escape') { setOpen(false); fab.focus(); } });
    document.addEventListener('click', function (e) { if (open && !el.contains(e.target)) setOpen(false); });
    desktop.addEventListener('change', function () { if (open) setOpen(false); update(); });

    if ('IntersectionObserver' in window) {
      if (heroRef) {
        new IntersectionObserver(function (entries) {
          entries.forEach(function (entry) { pastHero = !entry.isIntersecting && entry.boundingClientRect.top < 0; });
          update();
        }).observe(heroRef);
      }
      var formIo = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) { if (entry.isIntersecting) visibleForms.add(entry.target); else visibleForms.delete(entry.target); });
        update();
      }, { threshold: 0.15 });
      $$('form[data-cs-form]').forEach(function (f) { if (!heroRef || !heroRef.contains(f)) formIo.observe(f); });
    } else {
      pastHero = true;
    }
    update();
  })();

  /* ── vídeo de fundo do hero (celular e tablet) ──
     Só baixa depois do load e entra por cima da foto quando já está tocando (a foto segue sendo o LCP).
     Fica de fora com reduced motion, economia de dados ou rede 2G; pausa fora da tela e tem botão de pausa. */
  (function heroVideo() {
    var video = $('[data-hero-video]');
    if (!video) return;
    var toggle = $('[data-hero-video-toggle]');
    var small = window.matchMedia('(max-width: 1023px)');
    var conn = navigator.connection || {};
    if (reduceMotion || conn.saveData || /2g/.test(conn.effectiveType || '')) return;
    var loaded = false;
    var userPaused = false;
    var inView = true;

    var play = function () {
      var p = video.play();
      if (p && p.catch) p.catch(function () { /* autoplay bloqueado (ex.: modo economia do iOS): fica a foto */ });
    };
    var sync = function () {
      if (!loaded) return;
      if (small.matches && inView && !userPaused) play(); else video.pause();
    };
    var load = function () {
      if (loaded || !small.matches) return;
      loaded = true;
      video.muted = true;
      video.src = video.getAttribute('data-src');
      sync();
    };
    var label = function () {
      if (!toggle) return;
      toggle.classList.toggle('is-paused', video.paused);
      toggle.setAttribute('aria-label', video.paused ? 'Play the background video' : 'Pause the background video');
    };

    video.addEventListener('playing', function () {
      video.classList.add('is-playing');
      if (toggle) toggle.classList.add('is-on');
      label();
    });
    video.addEventListener('pause', label);
    if (toggle) {
      toggle.addEventListener('click', function () {
        userPaused = !video.paused;
        if (userPaused) video.pause(); else play();
      });
    }
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) { inView = entries[0].isIntersecting; sync(); }).observe(video.parentNode);
    }
    small.addEventListener('change', function () { load(); sync(); });

    var start = function () { setTimeout(load, 1200); };
    if (document.readyState === 'complete') start();
    else window.addEventListener('load', start, { once: true });
  })();

  /* ── galeria: as fotos do mosaico abrem num slider em tela cheia ──
     <dialog> modal (foco preso, Esc fecha, fundo inerte) criado no fim do body, fora do [data-gallery]: só a
     abertura conta como gallery_open. Setas do teclado, botões e arraste trocam a foto; ao fechar o foco volta
     para a foto de origem. */
  (function lightbox() {
    var gallery = $('[data-mosaic]');
    if (!gallery || typeof window.HTMLDialogElement === 'undefined') return;
    var shots = $$('.shot', gallery);
    if (!shots.length) return;
    var largest = function (img) {
      var list = (img.getAttribute('srcset') || '').split(',').map(function (s) { return s.trim().split(/\s+/)[0]; }).filter(Boolean);
      return list.length ? list[list.length - 1] : img.src;
    };
    var items = shots.map(function (shot) {
      var img = $('img', shot);
      var cap = $('figcaption', shot);
      return { src: largest(img), alt: img.alt, cap: cap ? cap.textContent.trim() : '', w: img.getAttribute('width'), h: img.getAttribute('height') };
    });

    var dlg = document.createElement('dialog');
    dlg.className = 'lbox';
    dlg.setAttribute('aria-label', 'Project photos');
    dlg.innerHTML =
      '<div class="lbox__top"><p class="lbox__count" aria-hidden="true"></p>' +
      '<button class="lbox__btn" type="button" aria-label="Close" data-lb-close><svg class="ic" aria-hidden="true"><use href="#i-close"></use></svg></button></div>' +
      '<div class="lbox__stage" data-lb-stage><img class="lbox__img" alt="" decoding="async"></div>' +
      '<div class="lbox__foot"><button class="lbox__btn" type="button" aria-label="Previous photo" data-lb-prev><svg class="ic" aria-hidden="true"><use href="#i-arrow-left"></use></svg></button>' +
      '<p class="lbox__cap"></p>' +
      '<button class="lbox__btn" type="button" aria-label="Next photo" data-lb-next><svg class="ic" aria-hidden="true"><use href="#i-arrow-right"></use></svg></button></div>' +
      '<p class="sr-only" aria-live="polite" data-lb-live></p>';
    document.body.appendChild(dlg);
    var stage = $('[data-lb-stage]', dlg);
    var view = $('.lbox__img', dlg);
    var count = $('.lbox__count', dlg);
    var cap = $('.lbox__cap', dlg);
    var live = $('[data-lb-live]', dlg);
    var current = 0;
    var opener = null;

    var show = function (i, dir) {
      current = (i + items.length) % items.length;
      var it = items[current];
      view.src = it.src;
      view.alt = it.alt;
      if (it.w && it.h) { view.width = it.w; view.height = it.h; }
      cap.textContent = it.cap;
      count.textContent = (current + 1) + ' / ' + items.length;
      live.textContent = 'Photo ' + (current + 1) + ' of ' + items.length + (it.cap ? ': ' + it.cap : '');
      if (dir && hasGsap && !reduceMotion) gsap.fromTo(view, { x: dir * 48, opacity: 0 }, { x: 0, opacity: 1, duration: 0.5, ease: 'expo.out', overwrite: true });
      [current + 1, current - 1].forEach(function (k) { new Image().src = items[(k + items.length) % items.length].src; });
    };
    var open = function (i, from) {
      opener = from;
      show(i, 0);
      dlg.showModal();
      root.classList.add('is-lbox-open');
      if (lenis) lenis.stop();
      if (hasGsap && !reduceMotion) {
        gsap.fromTo(dlg, { opacity: 0 }, { opacity: 1, duration: 0.3, ease: 'power2.out' });
        gsap.fromTo(view, { scale: 0.94, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.6, ease: 'expo.out', overwrite: true });
      }
    };
    dlg.addEventListener('close', function () {
      root.classList.remove('is-lbox-open');
      if (lenis) lenis.start();
      if (opener) opener.focus({ preventScroll: true });
    });
    $('[data-lb-close]', dlg).addEventListener('click', function () { dlg.close(); });
    $('[data-lb-prev]', dlg).addEventListener('click', function () { show(current - 1, -1); });
    $('[data-lb-next]', dlg).addEventListener('click', function () { show(current + 1, 1); });
    dlg.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') { e.preventDefault(); show(current - 1, -1); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); show(current + 1, 1); }
    });
    // arraste horizontal troca a foto; toque fora da foto fecha
    var startX = null;
    var startY = 0;
    var swiped = false;
    stage.addEventListener('pointerdown', function (e) { startX = e.clientX; startY = e.clientY; swiped = false; });
    stage.addEventListener('pointerup', function (e) {
      if (startX === null) return;
      var dx = e.clientX - startX;
      var dy = e.clientY - startY;
      startX = null;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) { swiped = true; show(current + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1); }
    });
    stage.addEventListener('click', function (e) { if (!swiped && e.target === stage) dlg.close(); });

    shots.forEach(function (shot, i) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'shot__open';
      btn.setAttribute('aria-label', 'View larger: ' + (items[i].cap || items[i].alt));
      btn.setAttribute('aria-haspopup', 'dialog');
      btn.innerHTML = '<span class="shot__zoom" aria-hidden="true"><svg class="ic"><use href="#i-expand"></use></svg></span>';
      btn.addEventListener('click', function () { open(i, btn); });
      shot.appendChild(btn);
    });
  })();

  /* sem GSAP: estados finais visíveis (trilho do processo cheio) */
  if (!hasGsap || !hasST || reduceMotion) {
    $$('.step').forEach(function (s) { s.classList.add('is-on'); });
  }
  if (!hasGsap || reduceMotion) return;

  var ST = window.ScrollTrigger;
  var EXPO = 'expo.out';
  var mm = gsap.matchMedia();

  /* ── hero: frases sobem da máscara; o resto entra em cascata ── */
  var heroLines = $$('.hero__title .ln > span');
  if (heroLines.length) gsap.from(heroLines, { yPercent: 108, duration: 1.15, ease: EXPO, stagger: 0.12, delay: 0.1 });
  var intro = $$('[data-intro]');
  if (intro.length) gsap.from(intro, { y: 22, opacity: 0, duration: 0.9, ease: EXPO, stagger: 0.07, delay: 0.35, clearProps: 'transform,opacity' });

  /* ── foto do hero montada tábua por tábua ──
     Fileiras com uma junta desencontrada cada (como um piso de verdade); as peças entram da esquerda, de baixo para
     cima, e no fim as juntas fecham (--seam 2px → -0.5px: 1px de sobreposição, sem fio de antialiasing).
     As peças ficam como a foto final (reexibir a original no fim geraria um LCP tardio). A original segue no DOM
     com opacity 0 (o alt continua para leitor de tela; sem JS ela aparece normal). */
  (function planks() {
    var media = $('[data-planks]');
    var img = media && $('.hero__img', media);
    if (!media || !img) return;
    // juntas entre 32% e 68%: nenhuma peça passa de ~70% da largura nem vira candidata a LCP maior que o H1
    var joints = [0.62, 0.36, 0.55, 0.41, 0.66, 0.33, 0.58, 0.45, 0.68, 0.38, 0.52, 0.64];

    var build = function () {
      var rows = window.innerWidth >= 1024 ? 12 : 8;
      var layer = document.createElement('div');
      layer.className = 'planks';
      layer.setAttribute('aria-hidden', 'true');
      var pieces = [];
      for (var r = 0; r < rows; r++) {
        var top = (r / rows) * 100;
        var bottom = 100 - ((r + 1) / rows) * 100;
        var j = joints[r % joints.length] * 100;
        [[0, 100 - j], [j, 0]].forEach(function (lr) {
          var piece = document.createElement('div');
          piece.className = 'plank';
          piece.style.clipPath = 'inset(calc(' + top.toFixed(3) + '% + var(--seam, 0px)) calc(' + lr[1].toFixed(3) + '% + var(--seam, 0px)) calc(' + bottom.toFixed(3) + '% + var(--seam, 0px)) calc(' + lr[0].toFixed(3) + '% + var(--seam, 0px)))';
          var clone = img.cloneNode(false);
          clone.removeAttribute('fetchpriority');
          clone.removeAttribute('class');
          clone.alt = '';
          piece.appendChild(clone);
          layer.appendChild(piece);
          pieces.push(piece);
        });
      }
      img.parentNode.appendChild(layer);
      media.classList.add('is-planked');
      return { layer: layer, pieces: pieces, rows: rows };
    };

    // montado já no load (peças escondidas pelo from), tocado quando a foto carrega e está à vista
    var p = build();
    var order = [];
    for (var r = p.rows - 1; r >= 0; r--) order.push(p.pieces[r * 2], p.pieces[r * 2 + 1]);
    var tl = gsap.timeline({
      paused: true,
      onComplete: function () { p.pieces.forEach(function (el) { el.style.willChange = 'auto'; }); }
    });
    // de baixo para cima, peça da esquerda e depois a da direita: o piso sendo assentado
    tl.from(order, { xPercent: -16, opacity: 0, duration: 0.95, ease: EXPO, stagger: 0.034 }, 0.05)
      .from($$('img', p.layer), { scale: 1.12, duration: 2.2, ease: EXPO }, 0)
      .to(media, { '--seam': '-0.5px', duration: 0.7, ease: 'power2.inOut' }, '-=0.45');

    var whenLoaded = function (fn) {
      if (img.complete && img.naturalWidth) fn();
      else {
        img.addEventListener('load', fn, { once: true });
        img.addEventListener('error', function () { tl.progress(1); }, { once: true });
      }
    };
    if (window.innerWidth >= 1024 || !hasST) whenLoaded(function () { tl.play(); });
    else ST.create({ trigger: media, start: 'top 85%', once: true, onEnter: function () { whenLoaded(function () { tl.play(); }); } });

    // paralaxe leve da foto (desktop): o miolo tem 12% de folga (inset -6%)
    mm.add('(min-width: 1024px)', function () {
      gsap.to($('.hero__media-in', media), { yPercent: 7, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
    });
  })();

  /* ── contadores (o HTML já traz o valor final: se nada rodar, o número certo aparece) ── */
  $$('[data-count]').forEach(function (el) {
    var end = parseFloat(el.getAttribute('data-count'));
    var decimals = parseInt(el.getAttribute('data-decimals') || '0', 10);
    if (isNaN(end) || !hasST) return;
    var obj = { v: 0 };
    el.textContent = (0).toFixed(decimals);
    gsap.to(obj, {
      v: end, duration: 1.6, ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 92%', once: true },
      onUpdate: function () { el.textContent = obj.v.toFixed(decimals); },
      onComplete: function () { el.textContent = end.toFixed(decimals); }
    });
  });

  if (!hasST) return;

  /* ── revelações de seção ── */
  $$('[data-reveal]').forEach(function (group) {
    var items = group.hasAttribute('data-reveal-children') ? group.children : [group];
    gsap.from(items, { y: 32, opacity: 0, duration: 1, ease: EXPO, stagger: 0.08, clearProps: 'transform,opacity', scrollTrigger: { trigger: group, start: 'top 86%', once: true } });
  });

  /* ── frase que acende com o scroll, palavra por palavra (35% → 100%, sem pin) ──
     Spans inline (não inline-block): o text-wrap: balance continua valendo e o leitor de tela lê a frase inteira. */
  $$('[data-statement]').forEach(function (el) {
    var words = [];
    var walk = function (node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (child) {
        if (child.nodeType === 3) {
          var frag = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach(function (part) {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
            var span = document.createElement('span');
            span.className = 'w';
            span.textContent = part;
            frag.appendChild(span);
            words.push(span);
          });
          node.replaceChild(frag, child);
        } else if (child.nodeType === 1) {
          walk(child);
        }
      });
    };
    walk(el);
    gsap.fromTo(words, { opacity: 0.35 }, { opacity: 1, ease: 'none', stagger: 0.1, scrollTrigger: { trigger: el, start: 'top 78%', end: 'bottom 42%', scrub: 0.6 } });
  });

  /* ── serviços: foto que segue o cursor (só desktop com ponteiro fino) ── */
  (function serviceFloat() {
    var list = $('[data-svc]');
    var float = $('.svc-float');
    if (!list || !float || !finePointer) return;
    mm.add('(min-width: 1024px)', function () {
      var rows = $$('.svc__row', list);
      var wrap = list.parentNode;
      var imgs = rows.map(function (row) {
        var src = $('.svc__thumb img', row);
        var img = document.createElement('img');
        img.alt = '';
        img.decoding = 'async';
        img.loading = 'lazy';
        img.sizes = '260px';
        if (src) { img.srcset = src.getAttribute('srcset'); img.src = src.getAttribute('src'); }
        float.appendChild(img);
        return img;
      });
      var xTo = gsap.quickTo(float, 'x', { duration: 0.7, ease: 'power3.out' });
      var yTo = gsap.quickTo(float, 'y', { duration: 0.7, ease: 'power3.out' });
      var active = -1;
      gsap.set(float, { xPercent: -50, yPercent: -50, scale: 0.85, rotate: -4 });
      var onMove = function (e) {
        var r = wrap.getBoundingClientRect();
        xTo(e.clientX - r.left + 150);
        yTo(e.clientY - r.top);
      };
      var show = function (i) {
        if (i === active) return;
        imgs.forEach(function (img, k) { gsap.to(img, { opacity: k === i ? 1 : 0, duration: 0.35, overwrite: 'auto' }); });
        if (active < 0) gsap.to(float, { autoAlpha: 1, scale: 1, rotate: 3, duration: 0.6, ease: EXPO, overwrite: 'auto' });
        active = i;
      };
      var hide = function () {
        active = -1;
        gsap.to(float, { autoAlpha: 0, scale: 0.85, rotate: -4, duration: 0.4, ease: 'power3.out', overwrite: 'auto' });
      };
      var enters = rows.map(function (row, i) { var fn = function () { show(i); }; row.addEventListener('pointerenter', fn); return fn; });
      // sobre a descrição a foto sai da frente: quem parou para ler não pode ter o texto coberto
      var descs = rows.map(function (row) { return $('.svc__desc', row); });
      var leaves = descs.map(function (desc, i) {
        var off = function () { hide(); };
        var on = function () { show(i); };
        if (desc) { desc.addEventListener('pointerenter', off); desc.addEventListener('pointerleave', on); }
        return [off, on];
      });
      list.addEventListener('pointermove', onMove);
      list.addEventListener('pointerleave', hide);
      return function () {
        descs.forEach(function (desc, i) { if (desc) { desc.removeEventListener('pointerenter', leaves[i][0]); desc.removeEventListener('pointerleave', leaves[i][1]); } });
        rows.forEach(function (row, i) { row.removeEventListener('pointerenter', enters[i]); });
        list.removeEventListener('pointermove', onMove);
        list.removeEventListener('pointerleave', hide);
        imgs.forEach(function (img) { img.remove(); });
      };
    });
  })();

  /* ── processo: o trilho enche com o scroll e cada passo acende ao ser alcançado ── */
  $$('[data-steps]').forEach(function (wrap) {
    var fill = $('.steps__rail i', wrap);
    if (fill) gsap.fromTo(fill, { scaleY: 0 }, { scaleY: 1, ease: 'none', scrollTrigger: { trigger: wrap, start: 'top 62%', end: 'bottom 62%', scrub: 0.4 } });
    $$('.step', wrap).forEach(function (step) {
      ST.create({ trigger: step, start: 'top 62%', onEnter: function () { step.classList.add('is-on'); }, onLeaveBack: function () { step.classList.remove('is-on'); } });
    });
  });

  /* ── mosaico: colunas em velocidades diferentes (só desktop) ── */
  mm.add('(min-width: 1024px)', function () {
    var mosaic = $('[data-mosaic]');
    if (!mosaic) return;
    $$('.mosaic__col', mosaic).forEach(function (col) {
      var speed = parseFloat(col.getAttribute('data-speed')) || 0;
      gsap.fromTo(col, { y: -speed }, { y: speed, ease: 'none', scrollTrigger: { trigger: mosaic, start: 'top bottom', end: 'bottom top', scrub: true } });
    });
  });
  mm.add('(max-width: 1023px)', function () {
    $$('.shot').forEach(function (shot) {
      gsap.from(shot, { y: 28, opacity: 0, duration: 0.9, ease: EXPO, scrollTrigger: { trigger: shot, start: 'top 92%', once: true } });
    });
  });
  mm.add('(min-width: 1024px)', function () {
    $$('.shot').forEach(function (shot, i) {
      gsap.from($('img', shot), { scale: 1.15, duration: 1.4, ease: EXPO, delay: (i % 3) * 0.06, scrollTrigger: { trigger: shot, start: 'top 95%', once: true } });
    });
  });

  /* ── fotos das seções internas (material, obra limpa, anatomia): a moldura abre de baixo e a foto assenta ── */
  $$('.feature__media, .anatomy__fig').forEach(function (fig) {
    var img = $('img', fig);
    if (!img) return;
    var tl = gsap.timeline({ scrollTrigger: { trigger: fig, start: 'top 85%', once: true } });
    tl.from(fig, { clipPath: 'inset(100% 0% 0% 0%)', duration: 1.1, ease: 'expo.inOut', clearProps: 'clipPath' })
      .from(img, { scale: 1.18, duration: 1.6, ease: EXPO }, 0.1);
  });

  /* ── selo: o anel de texto gira com o scroll ── */
  var seal = $('[data-seal]');
  if (seal) {
    gsap.to($('.story__ring', seal), { rotate: 140, ease: 'none', scrollTrigger: { trigger: seal, start: 'top bottom', end: 'bottom top', scrub: true } });
    gsap.from($('.story__mark', seal), { scale: 0.8, rotate: -8, opacity: 0, duration: 1.2, ease: EXPO, scrollTrigger: { trigger: seal, start: 'top 80%', once: true } });
  }

  /* ── rodapé: o slogan sobe da linha ── */
  var slogan = $$('.foot__slogan span');
  if (slogan.length) gsap.from(slogan, { yPercent: 40, opacity: 0, duration: 1.2, ease: EXPO, stagger: 0.12, scrollTrigger: { trigger: '.foot__slogan', start: 'top 88%', once: true } });

  /* imagens e fontes mudam alturas: recalcular */
  window.addEventListener('load', function () { ST.refresh(); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { ST.refresh(); });
})();
