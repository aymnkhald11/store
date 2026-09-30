const $ = s => document.querySelector(s);
const money = n => n.toLocaleString('en-US') + ' EGP';
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const store = {
  get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} }
};

/* ---------- Products (edit names, prices and photos here) ---------- */
const PRODUCTS = [
  {id:1,  n:'Classic T-Shirt',     c:'men',   p:250,  img:'images/products/tshirt.jpg'},
  {id:2,  n:'Plaid Flannel Shirt', c:'men',   p:550,  img:'images/products/flannel.jpg'},
  {id:3,  n:'Oversized Hoodie',    c:'men',   p:700,  img:'images/products/hoodie.jpg'},
  {id:4,  n:'Slim Fit Jeans',      c:'men',   p:650,  img:'images/products/jeans.jpg'},
  {id:5,  n:'Leather Jacket',      c:'men',   p:1800, img:'images/products/jacket.jpg'},
  {id:6,  n:'Summer Dress',        c:'women', p:800,  img:'images/products/dress.jpg', ic:'fa-person-dress'},
  {id:7,  n:'Knit Sweater',        c:'women', p:600,  img:'images/products/sweater.jpg'},
  {id:8,  n:'Everyday Blouse',     c:'women', p:450,  img:'images/products/blouse.jpg'},
  {id:9,  n:'Kids Polo Set',       c:'kids',  p:350,  img:'images/products/kids-polo.jpg'},
  {id:10, n:'Kids Hoodie',         c:'kids',  p:400,  img:'images/products/kids-hoodie.jpg'}
];
const SIZES = {kids:['4Y','6Y','8Y','10Y'], def:['S','M','L','XL']};
const FREE_SHIP_FROM = 1500, SHIPPING = 60;

/* ---------- Cart state ---------- */
let cart = store.get('cart', []);
const saveCart = () => { store.set('cart', cart); updateCount(); renderCart(); };
const updateCount = () => { $('#count').textContent = cart.reduce((a, i) => a + i.q, 0); };
const totals = () => {
  const sub = cart.reduce((a, i) => a + PRODUCTS.find(p => p.id === i.id).p * i.q, 0);
  const ship = sub === 0 || sub >= FREE_SHIP_FROM ? 0 : SHIPPING;
  return {sub, ship, total: sub + ship};
};

/* ---------- Shared: nav, footer ---------- */
$('#burger').onclick = () => $('#links').classList.toggle('open');
document.querySelectorAll('#links a').forEach(a => a.addEventListener('click', () => $('#links').classList.remove('open')));
$('#yr').textContent = new Date().getFullYear();
$('#news').onsubmit = e => { e.preventDefault(); $('#newsMsg').textContent = 'Thanks for joining!'; e.target.reset(); };
updateCount();

/* ---------- Home page ---------- */
if ($('#slide')) {
  $('#searchForm').onsubmit = e => {
    e.preventDefault();
    location.href = 'shop.html?q=' + encodeURIComponent($('#q').value.trim());
  };
  const pics = ['images/man1.jpg', 'images/man2.jpg', 'images/man3.jpg'];
  const slide = $('#slide'), dots = $('#dots');
  let cur = 0, timer;
  pics.forEach((_, i) => {
    const b = document.createElement('button');
    b.setAttribute('aria-label', 'Slide ' + (i + 1));
    b.onclick = () => { show(i); clearInterval(timer); timer = setInterval(() => show((cur + 1) % pics.length), 4000); };
    dots.append(b);
  });
  function show(i) {
    cur = i;
    [...dots.children].forEach((d, k) => d.classList.toggle('on', k === i));
    const im = new Image();
    im.onload = () => { slide.style.backgroundImage = `url(${pics[i]})`; slide.innerHTML = ''; };
    im.onerror = () => { slide.style.backgroundImage = ''; slide.innerHTML = '<i class="fa-regular fa-image"></i>'; };
    im.src = pics[i];
  }
  show(0);
  timer = setInterval(() => show((cur + 1) % pics.length), 4000);

  const counters = document.querySelectorAll('[data-n]');
  const run = el => {
    const end = +el.dataset.n, suf = el.dataset.s || '', t0 = performance.now();
    const step = t => {
      const k = Math.min((t - t0) / 1500, 1);
      el.textContent = Math.round(end * k) + suf;
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  const io = new IntersectionObserver(es => es.forEach(x => { if (x.isIntersecting) { run(x.target); io.unobserve(x.target); } }), {threshold: .4});
  counters.forEach(c => io.observe(c));
}

/* ---------- Shop page ---------- */
if ($('#grid')) {
  let cat = 'all', query = '';
  const params = new URLSearchParams(location.search);
  if (params.get('q')) { query = params.get('q').toLowerCase(); $('#q').value = params.get('q'); }

  const thumb = p => `<img src="${p.img}" alt="" loading="lazy" onerror="this.remove()">`;
  const icon = p => `<i class="fa-solid ${p.ic || 'fa-shirt'}"></i>`;

  function renderGrid() {
    const list = PRODUCTS.filter(p => (cat === 'all' || p.c === cat) && p.n.toLowerCase().includes(query));
    $('#grid').innerHTML = list.length ? list.map(p => `
      <article class="prod">
        <div class="pimg">${icon(p)}${thumb(p)}</div>
        <div class="pbody">
          <h3>${esc(p.n)}</h3>
          <div class="price">${money(p.p)}</div>
          <div class="row">
            <select aria-label="Size for ${esc(p.n)}" id="size${p.id}">${(SIZES[p.c] || SIZES.def).map(s => `<option>${s}</option>`).join('')}</select>
            <button class="add" data-id="${p.id}"><i class="fa-solid fa-cart-plus"></i> Add to cart</button>
          </div>
        </div>
      </article>`).join('') : '<p class="empty">No products match your search.</p>';
  }
  $('#filters').onclick = e => {
    const b = e.target.closest('button'); if (!b) return;
    cat = b.dataset.c;
    document.querySelectorAll('#filters button').forEach(x => x.classList.toggle('on', x === b));
    renderGrid();
  };
  $('#searchForm').onsubmit = e => e.preventDefault();
  $('#q').oninput = e => { query = e.target.value.trim().toLowerCase(); renderGrid(); };
  $('#grid').onclick = e => {
    const b = e.target.closest('.add'); if (!b) return;
    const id = +b.dataset.id, size = $('#size' + id).value;
    const ex = cart.find(i => i.id === id && i.size === size);
    ex ? ex.q++ : cart.push({id, size, q: 1});
    saveCart();
    b.innerHTML = '<i class="fa-solid fa-check"></i> Added';
    setTimeout(() => b.innerHTML = '<i class="fa-solid fa-cart-plus"></i> Add to cart', 900);
  };

  /* Drawer */
  const drawer = $('#drawer'), shade = $('#shade');
  const openCart = () => { drawer.classList.add('open'); shade.classList.add('open'); };
  const closeCart = () => { drawer.classList.remove('open'); shade.classList.remove('open'); };
  $('#cartBtn').onclick = openCart;
  $('#orderLink').onclick = e => { e.preventDefault(); openCart(); };
  $('#closeCart').onclick = closeCart;
  shade.onclick = () => { closeCart(); closeModal(); };
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeCart(); closeModal(); } });

  window.renderCart = function () {
    const box = $('#items');
    if (!cart.length) {
      box.innerHTML = '<p class="empty" style="padding:40px 0;text-align:center;color:#8a5a12">Your cart is empty.<br>Pick something you like from the collection.</p>';
      $('#sum').innerHTML = '';
      return;
    }
    box.innerHTML = cart.map((it, k) => {
      const p = PRODUCTS.find(x => x.id === it.id);
      return `<div class="item">
        <div class="t" style="position:relative;overflow:hidden">${icon(p)}<img src="${p.img}" alt="" onerror="this.remove()" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover"></div>
        <div><b>${esc(p.n)}</b><small>Size ${it.size} · ${money(p.p)}</small>
          <div class="qty"><button data-k="${k}" data-d="-1" aria-label="Less">−</button><span>${it.q}</span><button data-k="${k}" data-d="1" aria-label="More">+</button></div></div>
        <button class="rm" data-k="${k}" data-d="0" aria-label="Remove"><i class="fa-solid fa-trash"></i></button></div>`;
    }).join('');
    const t = totals();
    $('#sum').innerHTML = `
      <div><span>Subtotal</span><span>${money(t.sub)}</span></div>
      <div><span>Shipping</span><span>${t.ship ? money(t.ship) : 'Free'}</span></div>
      ${t.ship ? `<small style="color:#777">Free shipping from ${money(FREE_SHIP_FROM)}</small>` : ''}
      <div class="tot"><span>Total</span><span>${money(t.total)}</span></div>
      <button class="btn gold" id="checkout">Checkout</button>`;
    $('#checkout').onclick = openCheckout;
  };
  $('#items').onclick = e => {
    const b = e.target.closest('button'); if (!b) return;
    const k = +b.dataset.k, d = +b.dataset.d;
    if (d === 0) cart.splice(k, 1);
    else { cart[k].q += d; if (cart[k].q < 1) cart.splice(k, 1); }
    saveCart();
  };

  /* Checkout */
  const modal = $('#modal'), mbox = $('#box');
  function closeModal() { modal.classList.remove('open'); shade.classList.remove('open'); }
  modal.onclick = e => { if (e.target === modal) closeModal(); };

  function openCheckout() {
    if (!cart.length) return;
    const t = totals();
    closeCart();
    mbox.innerHTML = `
      <h2>Checkout</h2>
      <form id="form" novalidate>
        <label for="nm">Full name</label><input type="text" id="nm" autocomplete="name">
        <div class="two">
          <div><label for="ph">Phone</label><input type="tel" id="ph" placeholder="01xxxxxxxxx" autocomplete="tel"></div>
          <div><label for="ct">City</label><input type="text" id="ct" autocomplete="address-level2"></div>
        </div>
        <label for="ad">Address</label><input type="text" id="ad" autocomplete="street-address">
        <label>Payment method</label>
        <div class="pay">
          <label><input type="radio" name="pm" value="cod" checked> <i class="fa-solid fa-money-bill-wave"></i> Cash on delivery</label>
          <label><input type="radio" name="pm" value="card"> <i class="fa-regular fa-credit-card"></i> Credit / debit card</label>
          <label><input type="radio" name="pm" value="wallet"> <i class="fa-solid fa-mobile-screen"></i> Mobile wallet</label>
        </div>
        <div id="cardBox" style="display:none">
          <label for="cn">Card number</label><input type="text" id="cn" inputmode="numeric" placeholder="0000 0000 0000 0000" autocomplete="off">
          <div class="two"><div><label for="ce">Expiry (MM/YY)</label><input type="text" id="ce" placeholder="08/28" autocomplete="off"></div>
          <div><label for="cv">CVV</label><input type="text" id="cv" inputmode="numeric" maxlength="4" autocomplete="off"></div></div>
          <p class="note">Demo only: card details are checked but never saved or sent anywhere. Connect a payment gateway (Paymob, Fawry, Stripe) before taking real payments.</p>
        </div>
        <p class="err" id="err"></p>
        <div class="sum" style="padding:14px 0 0;border:0"><div class="tot"><span>Total to pay</span><span>${money(t.total)}</span></div>
        <button class="btn gold" type="submit">Confirm order</button></div>
      </form>`;
    modal.classList.add('open');
    shade.classList.add('open');
    const cardBox = $('#cardBox');
    document.querySelectorAll('[name=pm]').forEach(r => r.onchange = () => cardBox.style.display = r.value === 'card' && r.checked ? 'block' : 'none');
    $('#cn').oninput = e => e.target.value = e.target.value.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
    $('#ce').oninput = e => { let v = e.target.value.replace(/\D/g, '').slice(0, 4); e.target.value = v.length > 2 ? v.slice(0, 2) + '/' + v.slice(2) : v; };
    $('#form').onsubmit = submitOrder;
  }

  function submitOrder(e) {
    e.preventDefault();
    const v = id => $('#' + id).value.trim();
    const pm = document.querySelector('[name=pm]:checked').value;
    const bad = [];
    if (v('nm').length < 3) bad.push(['nm', 'Enter your full name.']);
    if (!/^01[0125]\d{8}$/.test(v('ph'))) bad.push(['ph', 'Enter a valid Egyptian mobile number (11 digits).']);
    if (v('ct').length < 2) bad.push(['ct', 'Enter your city.']);
    if (v('ad').length < 6) bad.push(['ad', 'Enter your full address.']);
    if (pm === 'card') {
      if (v('cn').replace(/\s/g, '').length !== 16) bad.push(['cn', 'Card number must be 16 digits.']);
      const m = v('ce').match(/^(0[1-9]|1[0-2])\/(\d{2})$/);
      if (!m || new Date(2000 + +m[2], +m[1]) <= new Date()) bad.push(['ce', 'Enter a valid, unexpired date.']);
      if (!/^\d{3,4}$/.test(v('cv'))) bad.push(['cv', 'CVV must be 3 or 4 digits.']);
    }
    document.querySelectorAll('.box input').forEach(i => i.classList.remove('bad'));
    if (bad.length) {
      bad.forEach(([id]) => $('#' + id).classList.add('bad'));
      $('#err').textContent = bad[0][1];
      $('#' + bad[0][0]).focus();
      return;
    }
    const t = totals();
    const no = 'OS-' + Date.now().toString().slice(-6) + Math.floor(Math.random() * 90 + 10);
    const orders = store.get('orders', []);
    orders.push({no, name: v('nm'), phone: v('ph'), city: v('ct'), address: v('ad'), pay: pm, items: cart, total: t.total, date: new Date().toISOString()});
    store.set('orders', orders);
    const labels = {cod: 'Cash on delivery', card: 'Card', wallet: 'Mobile wallet'};
    mbox.innerHTML = `<div class="done">
      <i class="fa-solid fa-circle-check"></i>
      <h2>Order confirmed</h2>
      <div class="no">${no}</div>
      <p>Thank you, ${esc(v('nm').split(' ')[0])}! We will call ${esc(v('ph'))} to confirm your delivery to ${esc(v('ct'))}.</p>
      <p><b>${money(t.total)}</b> · ${labels[pm]}</p>
      <button class="btn gold" id="again" style="margin-top:18px;cursor:pointer">Continue shopping</button></div>`;
    cart = []; saveCart();
    $('#again').onclick = closeModal;
  }

  renderGrid();
  renderCart();
  if (params.get('cart')) openCart();
}
