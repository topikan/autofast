/* AUTOFAST — интерактив главной страницы (демо, без отправки данных) */
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const fmt = (n) => Math.round(n).toLocaleString('ru-RU').replace(/,/g, ' ');
  const rub = (n) => fmt(n) + ' ₽';
  const isTouch = matchMedia('(hover: none)').matches;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Toast ---------- */
  const toastEl = $('#toast');
  let toastT;
  function toast(title, sub = 'Демо-версия сайта — здесь будет реальное действие') {
    toastEl.innerHTML = `${title}${sub ? `<small>${sub}</small>` : ''}`;
    toastEl.classList.add('is-show');
    clearTimeout(toastT);
    toastT = setTimeout(() => toastEl.classList.remove('is-show'), 3200);
  }
  $$('.js-demo').forEach((a) => a.addEventListener('click', (e) => { e.preventDefault(); toast(a.dataset.demo || 'Демо-режим'); }));

  /* ---------- Header, progress, FAB ---------- */
  const header = $('#header');
  const progress = $('.scroll-progress');
  const fab = $('.fab');
  let lastY = 0;
  function onScroll() {
    const y = scrollY;
    header.classList.toggle('is-scrolled', y > 20);
    header.classList.toggle('is-hidden', y > 600 && y > lastY && !mnav.classList.contains('is-open'));
    lastY = y;
    const max = document.documentElement.scrollHeight - innerHeight;
    progress.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
    fab.classList.toggle('is-visible', y > innerHeight * 0.8);
    updateSteps();
  }

  /* ---------- Mobile nav ---------- */
  const burger = $('#burger');
  const mnav = $('#mnav');
  burger.addEventListener('click', () => {
    const open = !mnav.classList.contains('is-open');
    mnav.classList.toggle('is-open', open);
    burger.classList.toggle('is-open', open);
    document.body.style.overflow = open ? 'hidden' : '';
  });
  $$('a', mnav).forEach((a) => a.addEventListener('click', () => {
    mnav.classList.remove('is-open'); burger.classList.remove('is-open'); document.body.style.overflow = '';
  }));

  /* ---------- Активный пункт меню ---------- */
  const navLinks = $$('.nav a');
  const spy = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting) navLinks.forEach((l) => l.classList.toggle('is-active', l.getAttribute('href') === '#' + en.target.id));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  ['catalog', 'countries', 'steps', 'cases', 'reviews', 'faq', 'contacts'].forEach((id) => { const el = document.getElementById(id); el && spy.observe(el); });

  /* ---------- Reveal + счётчики ---------- */
  $$('.reveal').forEach((el) => {
    const sib = [...el.parentElement.children].filter((c) => c.classList.contains('reveal'));
    const i = sib.indexOf(el);
    if (i > 0) el.style.setProperty('--d', Math.min(i * 0.08, 0.5) + 's');
  });
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      en.target.classList.add('is-in');
      $$('[data-count]', en.target).forEach(countUp);
      io.unobserve(en.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  $$('.reveal').forEach((el) => io.observe(el));

  function countUp(el) {
    const end = parseFloat(el.dataset.count);
    const dec = +el.dataset.decimals || 0;
    const pre = el.dataset.prefix || '';
    const suf = el.dataset.suffix || '';
    const dur = 1800; const t0 = performance.now();
    const step = (t) => {
      const p = Math.min((t - t0) / dur, 1);
      const v = end * (1 - Math.pow(1 - p, 4));
      el.textContent = pre + (dec ? v.toFixed(dec).replace('.', ',') : fmt(v)) + suf;
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  /* ---------- Плавная анимация чисел ---------- */
  function tween(el, to, suffix = ' ₽') {
    const from = +el.dataset.v || 0;
    el.dataset.v = to;
    if (reduce) { el.textContent = fmt(to) + suffix; return; }
    const t0 = performance.now(); const dur = 650;
    const step = (t) => {
      const p = Math.min((t - t0) / dur, 1);
      const e = 1 - Math.pow(1 - p, 3);
      el.textContent = fmt(from + (to - from) * e) + suffix;
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  /* ---------- Hero-слайдер ---------- */
  const slides = $$('.hero__slide');
  const hModel = $('#heroModel'), hMeta = $('#heroMeta'), hPrice = $('#heroPrice'), hIdx = $('#heroIdx'), hBar = $('#heroBar');
  let hi = 0, hStart = performance.now();
  const H_DUR = 6500;
  function heroGo(n) {
    slides[hi].classList.remove('is-active');
    hi = (n + slides.length) % slides.length;
    const s = slides[hi];
    s.classList.add('is-active');
    [hModel, hMeta, hPrice].forEach((el) => { el.classList.remove('swap'); void el.offsetWidth; el.classList.add('swap'); });
    hModel.textContent = s.dataset.model; hMeta.textContent = s.dataset.meta; hPrice.textContent = s.dataset.price;
    hIdx.textContent = String(hi + 1).padStart(2, '0');
    hStart = performance.now();
  }
  $('#heroNext').addEventListener('click', () => heroGo(hi + 1));
  $('#heroPrev').addEventListener('click', () => heroGo(hi - 1));
  (function heroLoop(t) {
    const p = Math.min((t - hStart) / H_DUR, 1);
    hBar.style.width = p * 100 + '%';
    if (p >= 1 && !document.hidden) heroGo(hi + 1);
    requestAnimationFrame(heroLoop);
  })(performance.now());

  // лёгкий параллакс фона hero
  const heroBg = $('.hero__bg');
  if (!isTouch && !reduce) {
    $('#hero').addEventListener('mousemove', (e) => {
      const x = (e.clientX / innerWidth - 0.5) * 14, y = (e.clientY / innerHeight - 0.5) * 10;
      heroBg.style.transform = `translate3d(${-x}px, ${-y}px, 0) scale(1.03)`;
    });
  }

  /* ---------- Магнитные кнопки и подсветка ---------- */
  if (!isTouch) {
    $$('.magnetic').forEach((b) => {
      b.addEventListener('mousemove', (e) => {
        const r = b.getBoundingClientRect();
        const x = e.clientX - r.left, y = e.clientY - r.top;
        b.style.setProperty('--mx', x + 'px'); b.style.setProperty('--my', y + 'px');
        b.style.transform = `translate(${(x - r.width / 2) * 0.12}px, ${(y - r.height / 2) * 0.2}px)`;
      });
      b.addEventListener('mouseleave', () => { b.style.transform = ''; });
    });
  }

  /* ---------- Калькулятор ---------- */
  const COUNTRY = {
    cn: { name: 'Китай', cur: '¥', rate: 11.4, min: 50000, max: 800000, step: 5000, delivery: 190000, time: '25–45 дней', img: 'assets/img/car-camry2.webp',
      models: [['Geely Monjaro', 165000, '2.0', 0], ['Li Auto L7', 285000, '1.5', 0], ['Haval H6', 98000, '1.5', 0], ['Chery Tiggo 8 Pro', 125000, '2.0', 0], ['Toyota Camry', 150000, '2.0', 1]] },
    kr: { name: 'Корея', cur: '₩', rate: 0.064, min: 5000000, max: 150000000, step: 500000, delivery: 230000, time: '20–30 дней', img: 'assets/img/calc-car.webp',
      models: [['Kia K5', 21000000, '2.0', 1], ['BMW 5 Series 520d', 39000000, '2.0', 1], ['Hyundai Palisade', 38000000, '4.0', 1], ['Genesis G80', 42000000, '3.0', 1], ['BMW X5 xDrive30d', 62000000, '3.0', 1]] },
    eu: { name: 'Европа', cur: '€', rate: 99, min: 5000, max: 150000, step: 500, delivery: 380000, time: '30–50 дней', img: 'assets/img/car-gle.webp',
      models: [['Mercedes-Benz GLE 300d', 62000, '3.0', 1], ['BMW X5 xDrive30d', 55000, '3.0', 1], ['Audi Q7 45 TDI', 52000, '3.0', 1], ['Volkswagen Tiguan', 26000, '2.0', 1], ['Porsche Cayenne', 78000, '3.0', 1]] },
  };
  const EUR = 99;
  const cc = { '1.5': 1500, '2.0': 2000, '3.0': 3000, '4.0': 3500 };
  const UTIL = { '1.5': [3400, 5200], '2.0': [3400, 5200], '3.0': [745000, 1210000], '4.0': [1350000, 2050000] };
  const FEE = 90000;

  const tabsWrap = $('#calcTabs'), ink = $('.tabs__ink', tabsWrap);
  const mSel = $('#calcModel'), ySel = $('#calcYear'), eSel = $('#calcEngine');
  const priceIn = $('#calcPrice'), range = $('#calcRange');
  const calcCar = $('#calcCar');
  let country = 'cn';

  function moveInk() {
    const a = $('.tab.is-active', tabsWrap);
    ink.style.width = a.offsetWidth + 'px';
    ink.style.transform = `translateX(${a.offsetLeft - 4}px)`;
  }
  function setCountry(c, silent) {
    country = c;
    const C = COUNTRY[c];
    $$('.tab', tabsWrap).forEach((t) => t.classList.toggle('is-active', t.dataset.country === c));
    moveInk();
    mSel.innerHTML = C.models.map((m, i) => `<option value="${i}">${m[0]}</option>`).concat('<option value="custom">Другой автомобиль</option>').join('');
    range.min = C.min; range.max = C.max; range.step = C.step;
    $('#calcCur').textContent = C.cur;
    $('#calcRoute').textContent = `(${C.name} → Воронеж)`;
    $('#calcTime').textContent = C.time;
    if (!silent) {
      calcCar.classList.add('is-swapping');
      setTimeout(() => { calcCar.src = C.img; calcCar.onload = () => calcCar.classList.remove('is-swapping'); }, 250);
    }
    applyModel(0);
  }
  function applyModel(i) {
    const m = COUNTRY[country].models[i];
    if (!m) return;
    setPrice(m[1]); eSel.value = m[2]; ySel.value = String(m[3]);
    calc();
  }
  function setPrice(v) {
    priceIn.value = fmt(v);
    range.value = v;
    paintRange();
  }
  function paintRange() {
    const p = ((range.value - range.min) / (range.max - range.min)) * 100;
    range.style.setProperty('--p', Math.max(0, Math.min(100, p)) + '%');
  }
  function customs(eurPrice, age, vol) {
    const c = cc[vol];
    if (age === 0) {
      const tiers = [[8500, 0.54, 2.5], [16700, 0.48, 3.5], [42300, 0.48, 5.5], [84500, 0.48, 7.5], [169000, 0.48, 15], [Infinity, 0.48, 20]];
      const [, pct, min] = tiers.find((t) => eurPrice <= t[0]);
      return Math.max(eurPrice * pct, c * min) * EUR;
    }
    const perCc = age === 1 ? [[1000, 1.5], [1500, 1.7], [1800, 2.5], [2300, 2.7], [3000, 3.0], [Infinity, 3.6]]
                            : [[1000, 3.0], [1500, 3.2], [1800, 3.5], [2300, 4.8], [3000, 5.0], [Infinity, 5.7]];
    return c * perCc.find((t) => c <= t[0])[1] * EUR;
  }
  const out = (k) => $(`.breakdown [data-k="${k}"]`);
  function calc() {
    const C = COUNTRY[country];
    const price = +String(priceIn.value).replace(/\D/g, '') || 0;
    const age = +ySel.value, vol = eSel.value;
    const car = price * C.rate;
    const cust = customs(car / EUR, age, vol) + 12000;
    const util = UTIL[vol][age === 0 ? 0 : 1];
    const total = car + C.delivery + cust + util + FEE;
    const market = Math.round((total * 1.21) / 10000) * 10000;
    $('#calcRub').textContent = `≈ ${rub(car)} по курсу 1 ${C.cur} = ${String(C.rate).replace('.', ',')} ₽`;
    tween(out('car'), car); tween(out('delivery'), C.delivery); tween(out('customs'), cust); tween(out('util'), util); tween(out('fee'), FEE);
    tween($('#calcTotal'), total);
    $('#calcMarket').textContent = rub(market);
    tween($('#calcSave'), market - total);
    lastCalc = { model: mSel.options[mSel.selectedIndex]?.text, country: C.name, car, delivery: C.delivery, cust, util, fee: FEE, total };
  }
  let lastCalc = null;

  $$('.tab', tabsWrap).forEach((t) => t.addEventListener('click', () => setCountry(t.dataset.country)));
  mSel.addEventListener('change', () => { if (mSel.value !== 'custom') applyModel(+mSel.value); else calc(); });
  [ySel, eSel].forEach((s) => s.addEventListener('change', calc));
  range.addEventListener('input', () => { priceIn.value = fmt(range.value); paintRange(); calc(); });
  priceIn.addEventListener('input', () => {
    const v = +priceIn.value.replace(/\D/g, '') || 0;
    priceIn.value = v ? fmt(v) : '';
    range.value = v; paintRange(); calc();
  });
  addEventListener('resize', moveInk);
  document.fonts && document.fonts.ready.then(moveInk);
  setCountry('cn', true);

  $$('.js-country').forEach((a) => a.addEventListener('click', () => setTimeout(() => setCountry(a.dataset.country), 300)));

  /* ---------- Каталог ---------- */
  const CARS = [
    { name: 'BMW X5 xDrive30d', img: 'car-x5w', year: 2022, km: '35 000', fuel: 'Дизель', price: 6950000, st: 'stock', c: 'kr' },
    { name: 'Mercedes-Benz GLE 300d', img: 'car-gle', year: 2023, km: '8 000', fuel: 'Дизель', price: 8200000, st: 'order', c: 'eu' },
    { name: 'Kia K5', img: 'car-k5', year: 2022, km: '28 000', fuel: 'Бензин', price: 2450000, st: 'stock', c: 'kr' },
    { name: 'Geely Preface', img: 'car-camry2', year: 2024, km: '6 000', fuel: 'Бензин', price: 2690000, st: 'order', c: 'cn' },
    { name: 'BMW 5 Series 520d', img: 'car-bmw5', year: 2021, km: '64 000', fuel: 'Дизель', price: 4280000, st: 'stock', c: 'kr' },
    { name: 'BMW 3 Series 320i', img: 'car-camry', year: 2022, km: '31 000', fuel: 'Бензин', price: 3690000, st: 'order', c: 'eu' },
    { name: 'BMW 4 Gran Coupe', img: 'car-sonata', year: 2021, km: '42 000', fuel: 'Бензин', price: 4150000, st: 'stock', c: 'eu' },
    { name: 'BMW 3 Series Touring', img: 'car-q7', year: 2021, km: '55 000', fuel: 'Дизель', price: 3390000, st: 'order', c: 'eu' },
  ];
  const flagOf = { cn: 'flag--cn', kr: 'flag--kr', eu: 'flag--eu' };
  const carsEl = $('#cars');
  carsEl.innerHTML = CARS.map((c, i) => `
    <article class="car reveal" data-i="${i}" data-st="${c.st}" data-c="${c.c}" tabindex="0">
      <div class="car__media">
        <img src="assets/img/${c.img}.webp" alt="${c.name}" loading="lazy">
        <div class="car__badges">
          <span class="tag ${c.st === 'stock' ? 'tag--blue' : 'tag--dark'}">${c.st === 'stock' ? 'В наличии' : 'Под заказ'}</span>
          <i class="flag ${flagOf[c.c]}"></i>
        </div>
      </div>
      <div class="car__body">
        <h3 class="car__name">${c.name}</h3>
        <div class="car__specs">
          <span><svg><use href="#i-clock"/></svg>${c.year}</span>
          <span><svg><use href="#i-gauge"/></svg>${c.km} км</span>
          <span><svg><use href="#i-fuel"/></svg>${c.fuel}</span>
        </div>
        <div class="car__foot">
          <div class="car__price"><small>${c.st === 'stock' ? 'цена в Воронеже' : 'под ключ от'}</small>${rub(c.price)}</div>
          <span class="round-btn"><svg><use href="#i-arrow"/></svg></span>
        </div>
      </div>
    </article>`).join('');
  $$('.car', carsEl).forEach((el) => io.observe(el));

  $$('.chip').forEach((ch) => ch.addEventListener('click', () => {
    $$('.chip').forEach((x) => x.classList.toggle('is-active', x === ch));
    const f = ch.dataset.f;
    $$('.car', carsEl).forEach((card) => {
      const show = f === 'all' || card.dataset.st === f || card.dataset.c === f;
      card.classList.toggle('is-hidden', !show);
      if (show) { card.classList.remove('is-in-anim'); card.classList.remove('is-in'); void card.offsetWidth; card.classList.add('is-in'); }
    });
  }));

  if (!isTouch) {
    carsEl.addEventListener('mousemove', (e) => {
      const card = e.target.closest('.car'); if (!card) return;
      const r = card.getBoundingClientRect();
      card.style.setProperty('--mx', e.clientX - r.left + 'px');
      card.style.setProperty('--my', e.clientY - r.top + 'px');
    });
  }
  const openCar = (card) => {
    const c = CARS[+card.dataset.i];
    openModal(`
      <div class="vplayer" style="background-image:url(assets/img/${c.img}.webp)"></div>
      <div class="pdf">
        <div style="display:flex;gap:10px;align-items:center"><span class="tag ${c.st === 'stock' ? 'tag--blue' : 'tag--dark'}">${c.st === 'stock' ? 'В наличии' : 'Под заказ'}</span><i class="flag ${flagOf[c.c]}"></i></div>
        <h3>${c.name}</h3>
        <div class="car__specs"><span>${c.year} год</span><span>${c.km} км</span><span>${c.fuel}</span></div>
        <div class="result-card__total">${rub(c.price)}</div>
        <div style="display:flex;gap:12px;flex-wrap:wrap">
          <a href="#lead" class="btn btn--primary" data-close data-book="${c.name}">Забронировать <svg><use href="#i-arrow"/></svg></a>
          <a href="#calc" class="btn btn--ghost" data-close>Рассчитать похожий</a>
        </div>
      </div>`);
  };
  carsEl.addEventListener('click', (e) => { const card = e.target.closest('.car'); card && openCar(card); });
  carsEl.addEventListener('keydown', (e) => { if (e.key === 'Enter') { const card = e.target.closest('.car'); card && openCar(card); } });

  /* ---------- 3D-наклон ---------- */
  if (!isTouch && !reduce) {
    $$('.tilt').forEach((el) => {
      el.addEventListener('mousemove', (e) => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
        el.style.transform = `perspective(900px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg) translateY(-4px)`;
      });
      el.addEventListener('mouseleave', () => { el.style.transform = ''; });
    });
  }

  /* ---------- Шаги: заполнение линии ---------- */
  const stepsWrap = $('#stepsWrap'), stepsFill = $('#stepsFill'), stepEls = $$('.step');
  function updateSteps() {
    if (!stepsWrap) return;
    const r = stepsWrap.getBoundingClientRect();
    const p = Math.max(0, Math.min(1, (innerHeight * 0.75 - r.top) / (r.height + innerHeight * 0.25)));
    stepsFill.style.width = p * 100 + '%';
    const done = Math.round(p * stepEls.length);
    stepEls.forEach((s, i) => s.classList.toggle('is-done', i < done));
  }

  /* ---------- Кейсы ---------- */
  const CASES = [
    { t: 'BMW X5 xDrive30d', c: 'kr', meta: '2021 · 52 000 км · дизель 3.0', price: 6200000, market: 7500000, days: '28 дней', img: 'case-x5' },
    { t: 'Mercedes-Benz G 63 AMG', c: 'eu', meta: '2022 · 24 000 км · бензин 4.0', price: 12500000, market: 16800000, days: '41 день', img: 'case-g63' },
    { t: 'BMW 5 Series 520d', c: 'kr', meta: '2021 · 64 000 км · дизель 2.0', price: 4300000, market: 5100000, days: '24 дня', img: 'case-ship' },
    { t: 'Mercedes-Benz GLE 300d', c: 'eu', meta: '2023 · 8 000 км · дизель 2.0', price: 8150000, market: 9400000, days: '36 дней', img: 'case-gle' },
  ];
  const cname = { cn: 'Китай', kr: 'Корея', eu: 'Европа' };
  const caseBox = $('.case'), caseImg = $('#caseImg'), dots = $('#caseDots');
  let ci = 0, caseTimer;
  dots.innerHTML = CASES.map((_, i) => `<button aria-label="Кейс ${i + 1}"${i ? '' : ' class="is-active"'}></button>`).join('');
  function caseGo(n) {
    ci = (n + CASES.length) % CASES.length;
    const k = CASES[ci];
    caseBox.classList.add('is-swapping'); caseImg.classList.add('is-swapping');
    setTimeout(() => {
      caseImg.src = `assets/img/${k.img}.webp`;
      $('#caseCountry').innerHTML = `<i class="flag ${flagOf[k.c]}"></i>${cname[k.c]}`;
      $('#caseTitle').textContent = k.t; $('#caseMeta').textContent = k.meta;
      $('#casePrice').textContent = rub(k.price); $('#caseMarket').textContent = rub(k.market);
      $('#caseSave').textContent = rub(k.market - k.price); $('#caseDays').textContent = k.days;
      $$('button', dots).forEach((d, i) => d.classList.toggle('is-active', i === ci));
      caseBox.classList.remove('is-swapping');
      caseImg.onload = () => caseImg.classList.remove('is-swapping');
      if (caseImg.complete) caseImg.classList.remove('is-swapping');
    }, 350);
    restartCases();
  }
  function restartCases() { clearInterval(caseTimer); caseTimer = setInterval(() => caseGo(ci + 1), 7000); }
  $('#caseNext').addEventListener('click', () => caseGo(ci + 1));
  $('#casePrev').addEventListener('click', () => caseGo(ci - 1));
  $$('button', dots).forEach((d, i) => d.addEventListener('click', () => caseGo(i)));
  restartCases();
  CASES.forEach((k) => { const im = new Image(); im.src = `assets/img/${k.img}.webp`; });

  /* ---------- FAQ: плавное раскрытие ---------- */
  $$('.faq__item').forEach((d) => {
    const body = $('.faq__body', d);
    $('summary', d).addEventListener('click', (e) => {
      e.preventDefault();
      if (d.open) {
        body.animate([{ height: body.offsetHeight + 'px' }, { height: '0px' }], { duration: 300, easing: 'ease' }).onfinish = () => { d.open = false; };
      } else {
        d.open = true;
        body.animate([{ height: '0px' }, { height: body.offsetHeight + 'px' }], { duration: 350, easing: 'ease' });
      }
    });
  });

  /* ---------- Модалка ---------- */
  const modal = $('#modal'), modalBody = $('#modalBody');
  function openModal(html) {
    modalBody.innerHTML = html;
    modal.classList.add('is-open'); modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }
  function closeModal() {
    modal.classList.remove('is-open'); modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }
  modal.addEventListener('click', (e) => {
    const c = e.target.closest('[data-close]');
    if (!c) return;
    if (c.dataset.book) {
      const nameIn = $('#leadForm [name=name]');
      setTimeout(() => { toast(`Бронь: ${c.dataset.book}`, 'Оставьте телефон — закрепим авто за вами'); $('#phone').focus({ preventScroll: true }); }, 600);
      nameIn && (nameIn.placeholder = 'Ваше имя');
    }
    closeModal();
  });
  addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });

  $$('.js-video').forEach((b) => b.addEventListener('click', () => openModal(`
    <div class="vplayer" style="background-image:url(assets/img/hero-1.webp)">
      <div class="vplayer__inner">
        <span class="play-big"><svg><use href="#i-play"/></svg></span>
        <b>Как AUTOFAST привозит авто под ключ</b>
        <span class="muted">Здесь будет видео о компании — 1 минута</span>
      </div>
      <div class="vplayer__bar"><span></span></div>
    </div>`)));

  $('.js-pdf').addEventListener('click', () => {
    const k = lastCalc;
    openModal(`
      <div class="pdf">
        <span class="tag tag--blue" style="align-self:flex-start">Расчёт стоимости</span>
        <h3>${k.model} · ${k.country}</h3>
        <div class="pdf__bar"><span id="pdfBar"></span></div>
        <div class="pdf__rows breakdown" style="border:0;padding:0">
          <div class="line"><span>Цена автомобиля</span><b>${rub(k.car)}</b></div>
          <div class="line"><span>Доставка до Воронежа</span><b>${rub(k.delivery)}</b></div>
          <div class="line"><span>Растаможка и пошлины</span><b>${rub(k.cust)}</b></div>
          <div class="line"><span>Утилизационный сбор</span><b>${rub(k.util)}</b></div>
          <div class="line"><span>Услуги AUTOFAST</span><b>${rub(k.fee)}</b></div>
          <div class="line" style="font-size:18px"><span><b>Итого под ключ</b></span><b>${rub(k.total)}</b></div>
        </div>
        <div class="pdf__done" id="pdfDone" style="opacity:0;transition:opacity .4s">
          <span class="success-ico"><svg><use href="#i-check"/></svg></span>
          <div><b>Расчёт сформирован</b><p class="muted">Отправим PDF в Telegram или WhatsApp</p></div>
        </div>
        <a href="#lead" class="btn btn--primary" data-close>Получить расчёт <svg><use href="#i-arrow"/></svg></a>
      </div>`);
    requestAnimationFrame(() => requestAnimationFrame(() => { $('#pdfBar').style.width = '100%'; }));
    setTimeout(() => { const d = $('#pdfDone'); d && (d.style.opacity = 1); }, 1600);
  });

  /* ---------- Форма заявки ---------- */
  const phone = $('#phone');
  phone.addEventListener('input', () => {
    let d = phone.value.replace(/\D/g, '');
    if (d.startsWith('8')) d = '7' + d.slice(1);
    if (!d.startsWith('7')) d = '7' + d;
    d = d.slice(0, 11);
    const p = d.slice(1);
    let s = '+7';
    if (p.length) s += ' (' + p.slice(0, 3);
    if (p.length >= 3) s += ')';
    if (p.length > 3) s += ' ' + p.slice(3, 6);
    if (p.length > 6) s += '-' + p.slice(6, 8);
    if (p.length > 8) s += '-' + p.slice(8, 10);
    phone.value = s;
  });
  phone.addEventListener('blur', () => { if (phone.value.replace(/\D/g, '').length <= 1) phone.value = ''; });

  $('#leadForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const f = e.currentTarget;
    const name = f.name.value.trim();
    const ok = phone.value.replace(/\D/g, '').length === 11;
    f.name.classList.toggle('is-error', !name);
    phone.classList.toggle('is-error', !ok);
    if (!name || !ok) { toast('Заполните имя и телефон', ''); return; }
    const btn = $('button', f);
    btn.disabled = true; btn.innerHTML = 'Отправляем…';
    setTimeout(() => {
      f.hidden = true; $('.lead__policy').hidden = true;
      $('#leadSuccess').hidden = false;
      $('#leadSuccess b').textContent = `${name}, заявка принята!`;
    }, 900);
  });
  $$('#leadForm .input').forEach((i) => i.addEventListener('input', () => i.classList.remove('is-error')));
  $('.js-calc-lead').addEventListener('click', () => setTimeout(() => toast('Цена зафиксирована на 3 дня', 'Оставьте контакты — пришлём договор'), 600));

  addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();
