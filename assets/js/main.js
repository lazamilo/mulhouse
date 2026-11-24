(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasGsap = window.gsap && window.ScrollTrigger;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];

  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  scrollTo(0, 0);
  if (hasGsap) gsap.registerPlugin(ScrollTrigger);

  /* Smooth scroll */
  let lenis = null;
  if (window.Lenis && !reduce) {
    lenis = new Lenis({ lerp: 0.09 });
    if (hasGsap) {
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(t => lenis.raf(t * 1000));
      gsap.ticker.lagSmoothing(0);
    } else {
      const raf = t => { lenis.raf(t); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
    }
  }

  /* Split hero title into masked lines */
  const title = $('.hero__title');
  const parts = title.innerHTML.split(/<br\s*\/?>/i);
  title.innerHTML = parts.map(p => `<span class="line"><span>${p.replace(/<\/?span>/g, '')}</span></span>`).join('');

  /* Loader + intro */
  const intro = () => {
    document.body.classList.remove('is-loading');
    if (!hasGsap || reduce) { $('.loader').remove(); startHero(); return; }
    const tl = gsap.timeline();
    tl.to('.loader__logo', { opacity: 1, y: 0, duration: .8, ease: 'power3.out', startAt: { y: 30 } })
      .to('.loader__logo', { opacity: 0, y: -30, duration: .5, ease: 'power2.in' }, '+=.35')
      .to('.loader', { clipPath: 'inset(0 0 100% 0)', duration: 1.1, ease: 'expo.inOut' }, '-=.1')
      .from('.hero__slide.is-active img', { scale: 1.35, duration: 2, ease: 'expo.out' }, '-=.9')
      .from('.hero__title .line > span', { yPercent: 110, duration: 1.3, stagger: .09, ease: 'expo.out' }, '-=1.6')
      .from('.header', { opacity: 0, duration: 1, ease: 'power3.out', clearProps: 'opacity' }, '-=1')
      .from('.hero__bottom', { opacity: 0, y: 20, duration: 1, ease: 'power3.out', clearProps: 'transform,opacity' }, '-=.9')
      .add(() => $('.loader').remove())
      .add(startHero, '-=.6');
  };
  if (document.readyState === 'complete') intro(); else addEventListener('load', intro);

  /* Hero slideshow */
  function startHero() {
    const slides = $$('.hero__slide');
    const num = $('.hero__counter b');
    const bar = $('.hero__counter em');
    let i = 0;
    const dur = 6000;
    const tick = () => {
      if (hasGsap) gsap.fromTo(bar, { scaleX: 0 }, { scaleX: 1, duration: dur / 1000, ease: 'none' });
    };
    tick();
    setInterval(() => {
      slides[i].classList.remove('is-active');
      i = (i + 1) % slides.length;
      slides[i].classList.add('is-active');
      num.textContent = String(i + 1).padStart(2, '0');
      tick();
    }, dur);
  }

  /* Header state */
  const header = $('#header');
  let last = 0;
  const onScroll = y => {
    header.classList.toggle('is-solid', y > innerHeight * 0.6);
    header.classList.toggle('is-hidden', y > last && y > innerHeight && !document.body.classList.contains('menu-open'));
    last = y;
  };
  if (lenis) lenis.on('scroll', e => onScroll(e.scroll));
  addEventListener('scroll', () => onScroll(scrollY), { passive: true });
  onScroll(scrollY);

  /* Mega menu */
  const menuBtn = $('[data-open-menu]');
  const mega = $('#mega');
  menuBtn.addEventListener('click', () => {
    const open = document.body.classList.toggle('menu-open');
    menuBtn.setAttribute('aria-expanded', open);
    mega.setAttribute('aria-hidden', !open);
    menuBtn.querySelector('span').textContent = open ? 'Fermer' : 'Menu';
    open ? lenis?.stop() : lenis?.start();
  });
  $$('.mega__cats button').forEach(b => {
    const act = () => {
      $$('.mega__cats button').forEach(x => x.classList.toggle('is-active', x === b));
      $$('.mega__panel').forEach((p, k) => p.classList.toggle('is-active', k === +b.dataset.cat));
    };
    b.addEventListener('mouseenter', act); b.addEventListener('click', act);
  });

  /* Search */
  const search = $('#search');
  $$('[data-open-search]').forEach(b => b.addEventListener('click', () => {
    search.classList.add('is-open'); search.setAttribute('aria-hidden', false);
    lenis?.stop(); setTimeout(() => $('input', search).focus(), 300);
  }));
  const closeSearch = () => { search.classList.remove('is-open'); search.setAttribute('aria-hidden', true); lenis?.start(); };
  $('[data-close-search]').addEventListener('click', closeSearch);
  addEventListener('keydown', e => { if (e.key === 'Escape') closeSearch(); });

  /* Quick links hover image */
  const float = $('.quick__float');
  const fImg = $('img', float);
  if (hasGsap && matchMedia('(hover:hover)').matches) {
    const xTo = gsap.quickTo(float, 'x', { duration: .6, ease: 'power3' });
    const yTo = gsap.quickTo(float, 'y', { duration: .6, ease: 'power3' });
    $('.quick__list').addEventListener('mousemove', e => { xTo(e.clientX + 40); yTo(e.clientY - 40); });
    $$('.quick__list a').forEach(a => {
      a.addEventListener('mouseenter', () => { fImg.src = a.dataset.img; gsap.to(float, { opacity: 1, scale: 1, rotate: -3, duration: .5, ease: 'power3' }); });
      a.addEventListener('mouseleave', () => gsap.to(float, { opacity: 0, scale: .6, rotate: 0, duration: .4, ease: 'power3' }));
    });
    gsap.set(float, { xPercent: 0, yPercent: -100 });
  }

  if (!hasGsap || reduce) { $$('.reveal').forEach(r => r.style.opacity = 1); $$('[data-words]').forEach(w => w.style.opacity = 1); return; }

  /* Reveals */
  $$('.reveal').forEach(el => gsap.to(el, { opacity: 1, y: 0, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 88%' } }));
  gsap.from('.quick__list li', { opacity: 0, y: 50, duration: 1, stagger: .07, ease: 'expo.out', scrollTrigger: { trigger: '.quick__list', start: 'top 80%' } });

  /* Parallax inside frames */
  $$('[data-parallax]').forEach(img => gsap.fromTo(img, { yPercent: -7 }, { yPercent: 7, ease: 'none', scrollTrigger: { trigger: img.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } }));
  gsap.to('.hero__media', { yPercent: 18, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
  gsap.to('.hero__content', { yPercent: -20, opacity: 0, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'center center', end: 'bottom top', scrub: true } });

  /* Manifesto word reveal */
  const m = $('[data-words]');
  m.innerHTML = m.textContent.trim().split(/\s+/).map(w => `<span class="w">${w}</span>`).join(' ');
  gsap.to($$('.w', m), { opacity: 1, stagger: .05, ease: 'none', scrollTrigger: { trigger: m, start: 'top 75%', end: 'bottom 40%', scrub: true } });
  gsap.fromTo('.manifesto__bg img', { yPercent: -10 }, { yPercent: 0, ease: 'none', scrollTrigger: { trigger: '.manifesto', start: 'top bottom', end: 'bottom top', scrub: true } });

  /* Counters */
  $$('[data-count]').forEach(el => {
    const o = { v: 0 };
    gsap.to(o, { v: +el.dataset.count, duration: 2.2, ease: 'expo.out', onUpdate: () => el.textContent = Math.round(o.v),
      scrollTrigger: { trigger: el, start: 'top 85%' } });
  });

  /* Horizontal projects */
  const mm = gsap.matchMedia();
  mm.add('(min-width: 761px)', () => {
    const track = $('.projects__track');
    const dist = () => track.scrollWidth - innerWidth;
    gsap.to(track, {
      x: () => -dist(), ease: 'none',
      scrollTrigger: { trigger: '.projects', pin: '.projects__pin', start: 'top top', end: () => '+=' + dist(), scrub: 1, invalidateOnRefresh: true,
        onUpdate: s => gsap.set('.projects__progress i', { scaleX: s.progress }) }
    });
  });

  /* Stack cards scale back */
  const cards = $$('.stack__card');
  cards.forEach((c, k) => {
    if (k === cards.length - 1) return;
    gsap.fromTo(c, { scale: 1, filter: 'brightness(1)' }, { scale: .92, filter: 'brightness(.5)', ease: 'none',
      scrollTrigger: { trigger: cards[k + 1], start: 'top bottom', end: 'top 15%', scrub: true } });
  });

  /* Map */
  gsap.from('.map__content > *', { opacity: 0, y: 50, stagger: .1, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: '.map', start: 'top 40%' } });

  /* Kiosk mags */
  gsap.from('.mag', { y: 160, opacity: 0, stagger: .08, duration: 1.4, ease: 'expo.out', scrollTrigger: { trigger: '.kiosk', start: 'top 70%' } });

  /* Footer logo */
  gsap.from('.footer__logo img', { yPercent: 40, opacity: 0, duration: 1.6, ease: 'expo.out', scrollTrigger: { trigger: '.footer__logo', start: 'top 95%' } });

  addEventListener('load', () => ScrollTrigger.refresh());
})();
