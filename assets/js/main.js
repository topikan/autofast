/* AUTOFAST — интерактив главной страницы (демо, без отправки данных) */
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const fmt = (n) => Math.round(n).toLocaleString('ru-RU').replace(/,/g, ' ');
  const rub = (n) => fmt(n) + ' ₽';
  const isTouch = matchMedia('(hover: none)').matches;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Прелоадер (один раз за сессию) ---------- */
  const pre = $('#preloader');
  let seen = false;
  try { seen = sessionStorage.getItem('af_seen') === '1'; sessionStorage.setItem('af_seen', '1'); } catch (e) {}
  const revealDelay = (seen || reduce) ? 0 : 1000;
  if (seen || reduce) { pre.remove(); }
  else {
    const t0 = performance.now();
    const done = () => setTimeout(() => { pre.classList.add('is-done'); setTimeout(() => pre.remove(), 700); }, Math.max(0, 1100 - (performance.now() - t0)));
    if (document.readyState === 'complete') done(); else addEventListener('load', done);
    setTimeout(() => pre.isConnected && pre.classList.add('is-done'), 2600);
  }

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
  setTimeout(() => $$('.reveal').forEach((el) => io.observe(el)), revealDelay);

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
  let heroPaused = false, pauseAt = 0;
  const heroCard = $('.hero__card');
  heroCard.addEventListener('mouseenter', () => { heroPaused = true; pauseAt = performance.now(); });
  heroCard.addEventListener('mouseleave', () => { heroPaused = false; hStart += performance.now() - pauseAt; });
  (function heroLoop(t) {
    if (heroPaused) { requestAnimationFrame(heroLoop); return; }
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
    cn: { name: 'Китай', cur: '¥', rate: 11.4, min: 40000, max: 600000, step: 1000, delivery: 200000, time: '15–35 дней', img: 'assets/img/car-camry2.webp',
      models: [['Changan UNI-Z', 82000, '1.5', 0], ['Changan CS55 Plus', 68000, '1.5', 0], ['Geely Monjaro', 150000, '2.0', 0], ['Toyota RAV4 2.0', 145000, '2.0', 0], ['Toyota Highlander', 260000, '2.0', 0], ['Li Auto L7', 285000, '1.5', 0]] },
    kr: { name: 'Корея', cur: '₩', rate: 0.064, min: 5000000, max: 150000000, step: 500000, delivery: 260000, time: '35–60 дней', img: 'assets/img/calc-car.webp',
      models: [['Kia K5', 21000000, '2.0', 1], ['BMW 5 Series 520d', 39000000, '2.0', 1], ['Kia Carnival', 33000000, '3.0', 1], ['Genesis G80', 42000000, '3.0', 1], ['Hyundai Palisade', 38000000, '4.0', 1]] },
  };
  const EUR = 99;
  const cc = { '1.5': 1500, '2.0': 2000, '3.0': 3000, '4.0': 3500 };
  const UTIL = { '1.5': [3400, 5200], '2.0': [3400, 5200], '3.0': [745000, 1210000], '4.0': [1350000, 2050000] };
  const FEE = 100000;
  const KG = 0.33;   // растаможка в Кыргызстане относительно РФ
  const DOCS = 40000; // СБКТС + ЭПТС

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
    $('#calcRoute').textContent = `(${C.name} → Кыргызстан → ваш город)`;
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
    const car = Math.round(price * C.rate / 100) * 100;
    const custRF = customs(car / EUR, age, vol) + 12000;
    const cust = Math.round(custRF * KG / 100) * 100;
    const util = UTIL[vol][age === 0 ? 0 : 1] + DOCS;
    const total = car + C.delivery + cust + util + FEE;
    const market = Math.round((total - cust + custRF) / 10000) * 10000;
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
    { name: 'BMW X5 xDrive30d', img: 'car-x5w', year: 2022, km: '35 000', fuel: 'Дизель', price: 5900000, t: 'suv', c: 'kr' },
    { name: 'Mercedes-Benz GLE 300d', img: 'car-gle', year: 2023, km: '8 000', fuel: 'Дизель', price: 7400000, t: 'suv', c: 'kr' },
    { name: 'Kia K5', img: 'car-k5', year: 2022, km: '28 000', fuel: 'Бензин', price: 2150000, t: 'sedan', c: 'kr' },
    { name: 'Geely Preface', img: 'car-camry2', year: 2025, km: 'новый', fuel: 'Бензин', price: 2190000, t: 'sedan', c: 'cn' },
    { name: 'BMW 5 Series 520d', img: 'car-bmw5', year: 2021, km: '64 000', fuel: 'Дизель', price: 3990000, t: 'sedan', c: 'kr' },
    { name: 'BMW 3 Series 320i', img: 'car-camry', year: 2022, km: '31 000', fuel: 'Бензин', price: 3290000, t: 'sedan', c: 'kr' },
    { name: 'BMW 4 Gran Coupe', img: 'car-sonata', year: 2021, km: '42 000', fuel: 'Бензин', price: 3690000, t: 'sedan', c: 'kr' },
    { name: 'BMW 3 Series Touring', img: 'car-q7', year: 2021, km: '55 000', fuel: 'Дизель', price: 2990000, t: 'wagon', c: 'kr' },
  ];
  const typeName = { suv: 'Кроссовер', sedan: 'Седан', wagon: 'Универсал' };
  const flagOf = { cn: 'flag--cn', kr: 'flag--kr', kg: 'flag--kg' };
  const carsEl = $('#cars');
  carsEl.innerHTML = CARS.map((c, i) => `
    <article class="car reveal" data-i="${i}" data-t="${c.t}" data-c="${c.c}" tabindex="0">
      <div class="car__media">
        <img src="assets/img/${c.img}.webp" alt="${c.name}" loading="lazy">
        <div class="car__badges">
          <span class="tag tag--dark">${typeName[c.t]}</span>
          <i class="flag ${flagOf[c.c]}"></i>
        </div>
      </div>
      <div class="car__body">
        <h3 class="car__name">${c.name}</h3>
        <div class="car__specs">
          <span><svg><use href="#i-clock"/></svg>${c.year}</span>
          <span><svg><use href="#i-gauge"/></svg>${c.km === 'новый' ? 'новый' : c.km + ' км'}</span>
          <span><svg><use href="#i-fuel"/></svg>${c.fuel}</span>
        </div>
        <div class="car__foot">
          <div class="car__price"><small>под ключ от</small>${rub(c.price)}</div>
          <span class="round-btn"><svg><use href="#i-arrow"/></svg></span>
        </div>
      </div>
    </article>`).join('');
  $$('.car', carsEl).forEach((el) => io.observe(el));

  $$('.chip').forEach((ch) => ch.addEventListener('click', () => {
    $$('.chip').forEach((x) => x.classList.toggle('is-active', x === ch));
    const f = ch.dataset.f;
    $$('.car', carsEl).forEach((card) => {
      const show = f === 'all' || card.dataset.t === f || card.dataset.c === f;
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
        <div style="display:flex;gap:10px;align-items:center"><span class="tag tag--blue">Под заказ</span><i class="flag ${flagOf[c.c]}"></i></div>
        <h3>${c.name}</h3>
        <div class="car__specs"><span>${c.year} год</span><span>${c.km === 'новый' ? 'новый' : c.km + ' км'}</span><span>${c.fuel}</span></div>
        <p class="muted">Ориентировочная цена под ключ с растаможкой в Кыргызстане. Точную сумму рассчитает менеджер.</p>
        <div class="result-card__total">${rub(c.price)}</div>
        <div style="display:flex;gap:12px;flex-wrap:wrap">
          <a href="#lead" class="btn btn--primary" data-close data-book="${c.name}">Хочу такой <svg><use href="#i-arrow"/></svg></a>
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
    { t: 'Changan UNI-Z', c: 'cn', city: 'Челябинск', meta: 'Клиент — Филипп. Перевели деньги и на следующий день выкупили авто.', price: '1 475 000 ₽', sub: 'под ключ на КГ учёте', chips: ['Выкуп за 1 день'] },
    { t: 'Voyah Free 318 · 2025', c: 'cn', city: 'Челябинск', meta: 'Клиент — Наталья. Оформили прописку и КГ номера в Бишкеке.', price: 'Выкуплен', sub: 'оплата через USDT', chips: ['КГ номера', 'Второе авто в семье'] },
    { t: 'Toyota Highlander', c: null, city: 'Москва', meta: 'Клиент — Антон. Списали утильсбор, получили СБКТС и ЭПТС.', price: 'Выдан клиенту', sub: 'полный пакет документов', chips: ['СБКТС', 'ЭПТС'] },
    { t: 'Geely Monjaro · 2026 MY', c: 'cn', city: 'Россия', meta: 'Клиент — Олег. Это уже его второй автомобиль у нас. Проверили перед покупкой.', price: 'Выкуплен', sub: 'белый, 26 модельный год', chips: ['Второй авто клиента', 'Проверка перед покупкой'] },
    { t: 'Audi A5', c: null, city: 'Уфа', meta: 'Клиент — Артур забрал свой автомобиль 30 декабря.', price: 'Выдан клиенту', sub: 'под ключ на КГ учёте', chips: ['Выдача в Уфе'] },
    { t: 'Toyota RAV4 2.0', c: 'cn', city: 'Россия', meta: 'Клиент — Сергей. Перевели денежные средства за автомобиль.', price: 'Выкуплен', sub: 'цвет — чёрный', chips: ['Выкуп'] },
  ];
  const cname = { cn: 'Китай', kr: 'Корея' };
  const caseBox = $('.case'), dots = $('#caseDots');
  let ci = 0, caseTimer;
  dots.innerHTML = CASES.map((_, i) => `<button aria-label="Сделка ${i + 1}"${i ? '' : ' class="is-active"'}></button>`).join('');
  function renderCase(k) {
    $('#caseCountry').innerHTML = (k.c ? `<i class="flag ${flagOf[k.c]}"></i>${cname[k.c]} · ` : '<svg><use href="#i-pin"/></svg>') + k.city;
    $('#caseTitle').textContent = k.t; $('#caseMeta').textContent = k.meta;
    $('#casePrice').textContent = k.price; $('#caseMarket').textContent = k.sub;
    $('#caseChips').innerHTML = k.chips.map((c) => `<span class="tag tag--green"><svg><use href="#i-check"/></svg>${c}</span>`).join('');
  }
  function caseGo(n) {
    ci = (n + CASES.length) % CASES.length;
    caseBox.classList.add('is-swapping');
    setTimeout(() => {
      renderCase(CASES[ci]);
      $$('button', dots).forEach((d, i) => d.classList.toggle('is-active', i === ci));
      caseBox.classList.remove('is-swapping');
    }, 350);
    restartCases();
  }
  let casePaused = false;
  function restartCases() { clearInterval(caseTimer); caseTimer = setInterval(() => { if (!casePaused && !document.hidden) caseGo(ci + 1); }, 7000); }
  caseBox.addEventListener('mouseenter', () => { casePaused = true; });
  caseBox.addEventListener('mouseleave', () => { casePaused = false; });
  caseBox.addEventListener('touchstart', () => { casePaused = true; }, { passive: true });
  // свайп по кейсу на телефоне
  let tx = 0;
  caseBox.addEventListener('touchstart', (e) => { tx = e.touches[0].clientX; }, { passive: true });
  caseBox.addEventListener('touchend', (e) => { const dx = e.changedTouches[0].clientX - tx; if (Math.abs(dx) > 50) caseGo(ci + (dx < 0 ? 1 : -1)); }, { passive: true });
  $('#caseNext').addEventListener('click', () => caseGo(ci + 1));
  $('#casePrev').addEventListener('click', () => caseGo(ci - 1));
  $$('button', dots).forEach((d, i) => d.addEventListener('click', () => caseGo(i)));
  renderCase(CASES[0]);
  restartCases();

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
      wantCar(c.dataset.book);
      nameIn && (nameIn.placeholder = 'Ваше имя');
    }
    closeModal();
  });
  addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });

  $$('.js-video').forEach((b) => b.addEventListener('click', () => openModal(`
    <div class="vplayer" style="background-image:url(assets/img/hero-1.webp)">
      <div class="vplayer__inner">
        <span class="play-big"><svg><use href="#i-play"/></svg></span>
        <b>Как AUTO FAST привозит авто под ключ</b>
        <span class="muted">Здесь будет видео с выкупа и выдачи авто</span>
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
          <div class="line"><span>Доставка</span><b>${rub(k.delivery)}</b></div>
          <div class="line"><span>Растаможка в Кыргызстане</span><b>${rub(k.cust)}</b></div>
          <div class="line"><span>Утильсбор, СБКТС, ЭПТС</span><b>${rub(k.util)}</b></div>
          <div class="line"><span>Услуги AUTO FAST</span><b>${rub(k.fee)}</b></div>
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

  /* ---------- «Хочу такой» в блоке цен ---------- */
  function wantCar(name) {
    setTimeout(() => {
      toast(`Выбрано: ${name}`, 'Оставьте имя и телефон — пришлём точный расчёт');
      const n = $('#leadForm [name=name]'); n && n.focus({ preventScroll: true });
    }, 650);
  }
  $$('.offer .btn').forEach((b) => b.addEventListener('click', () => {
    const o = b.closest('.offer');
    wantCar(`${$('.offer__brand', o).textContent} ${$('.offer__model', o).textContent}`);
  }));

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
  $('.js-calc-lead').addEventListener('click', () => setTimeout(() => toast('Пришлём точный расчёт', 'Оставьте имя и телефон — менеджер свяжется с вами'), 600));

  addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();
