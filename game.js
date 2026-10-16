// Glitter Rain — catch the cute things, dodge the storms.
(() => {
  'use strict';

  // ---------- start.ng connect page ----------
  const START_NG = 'https://start.ng';
  let frame;

  function connectFrame() {
    frame ??= new Promise((resolve, reject) => {
      const el = document.createElement('iframe');
      el.src = `${START_NG}/connect`;
      el.hidden = true;
      el.onload = () => resolve(el);
      el.onerror = reject;
      document.body.append(el);
    });
    return frame;
  }

  // Sends a message and resolves to start.ng's reply, or null if it didn't answer.
  async function askStartNg(message, replyType, timeoutMs = 5000) {
    let el;
    try { el = await connectFrame(); } catch { return null; }
    return new Promise((resolve) => {
      const requestId = Math.random().toString(36).slice(2);
      const done = (reply) => { clearTimeout(timer); removeEventListener('message', onMessage); resolve(reply); };
      const timer = setTimeout(() => done(null), timeoutMs);
      function onMessage(e) {
        if (e.origin !== START_NG || e.source !== el.contentWindow) return;
        if (e.data?.type === replyType && e.data.requestId === requestId) done(e.data);
      }
      addEventListener('message', onMessage);
      el.contentWindow.postMessage({ ...message, requestId }, START_NG);
    });
  }

  const signInUrl = () => `${START_NG}/?return_to=${encodeURIComponent(location.origin + location.pathname)}`;

  // ---------- character style ----------
  const HEX = /^#[0-9a-f]{6}$/i;
  const DEFAULT_STYLE = {
    body: 'female', primaryColor: '#ff6fb5', secondaryColor: '#b07cff', skinColor: '#8d5524',
    hairColor: '#2b1a12', hair: 'ponytail', hat: 'none', accessory: 'earrings',
  };
  const OPTIONS = {
    body: ['female', 'male'],
    hair: ['short', 'afro', 'braids', 'bun', 'ponytail', 'dreads', 'bald'],
    hat: ['none', 'cap', 'beanie', 'tophat', 'crown'],
    accessory: ['none', 'glasses', 'earrings', 'beard', 'scarf', 'backpack'],
  };

  // Baskets unlock with your best score (kept in this browser).
  const BASKETS = [
    { id: 'pink', name: 'Pink Picnic', need: 0, body: '#ff8cc0', rim: '#f7b6d2', weave: '#ff5fa8', bow: '#fff' },
    { id: 'lilac', name: 'Lilac Lace', need: 400, body: '#c6a6ff', rim: '#ebe0ff', weave: '#9b6dff', bow: '#ff5fa8' },
    { id: 'gold', name: 'Golden Glam', need: 1200, body: '#ffd24d', rim: '#fff0a8', weave: '#e0a800', bow: '#ff4f9a', glint: true },
    { id: 'rainbow', name: 'Rainbow Dream', need: 2500, body: '#ff8cc0', rim: '#fff', weave: 'rgba(255,255,255,.7)', bow: '#fff', rainbow: true },
    { id: 'diamond', name: 'Diamond Deluxe', need: 5000, body: '#a8e6ff', rim: '#effbff', weave: '#4aa3ff', bow: '#fff', glint: true },
  ];

  function normalizeStyle(s) {
    s = s && typeof s === 'object' ? s : {};
    const out = {};
    for (const k of ['primaryColor', 'secondaryColor', 'skinColor', 'hairColor']) {
      out[k] = HEX.test(s[k]) ? s[k] : DEFAULT_STYLE[k];
    }
    for (const k of Object.keys(OPTIONS)) {
      out[k] = OPTIONS[k].includes(s[k]) ? s[k] : DEFAULT_STYLE[k];
    }
    return out;
  }

  function shade(hex, amt) {
    const n = parseInt(hex.slice(1), 16);
    let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
    const f = (c) => Math.max(0, Math.min(255, Math.round(amt < 0 ? c * (1 + amt) : c + (255 - c) * amt)));
    return `rgb(${f(r)},${f(g)},${f(b)})`;
  }

  function rrect(c, x, y, w, h, r) {
    c.beginPath();
    c.moveTo(x + r, y);
    c.arcTo(x + w, y, x + w, y + h, r);
    c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r);
    c.arcTo(x, y, x + w, y, r);
    c.closePath();
  }

  // Draws the character with feet at (0,0), about 140 units tall, holding a basket.
  // o: { t, walk, moving, mood: 'happy'|'sad', blink, basket }
  function drawCharacter(c, st, o = {}) {
    const t = o.t || 0;
    const walk = o.walk || 0;
    const mv = o.moving || 0;
    const female = st.body === 'female';
    const skin = st.skinColor, top = st.primaryColor, bottom = st.secondaryColor, hairC = st.hairColor;
    const swing = Math.sin(walk) * mv;
    const bob = Math.abs(Math.sin(walk)) * 2 * mv;

    c.save();
    c.lineCap = 'round';
    c.lineJoin = 'round';

    // shadow
    c.fillStyle = 'rgba(120, 40, 100, 0.18)';
    c.beginPath(); c.ellipse(0, 2, 30, 6, 0, 0, Math.PI * 2); c.fill();

    c.translate(0, -bob);

    // legs + shoes
    const shoe = female ? '#c2185b' : '#3b2b3a';
    for (const side of [-1, 1]) {
      const fx = side * 8 + swing * 6 * side;
      if (female) {
        c.strokeStyle = skin; c.lineWidth = 8;
        c.beginPath(); c.moveTo(side * 7, -34); c.lineTo(fx, -4); c.stroke();
      } else {
        c.strokeStyle = bottom; c.lineWidth = 11;
        c.beginPath(); c.moveTo(side * 8, -50); c.lineTo(fx, -6); c.stroke();
      }
      c.fillStyle = shoe;
      c.beginPath(); c.ellipse(fx + side * 2, -3, 7, 4.5, 0, 0, Math.PI * 2); c.fill();
    }

    // backpack (behind torso)
    if (st.accessory === 'backpack') {
      c.fillStyle = shade(top, -0.4);
      rrect(c, -23, -84, 46, 40, 10); c.fill();
    }

    // hair behind head
    const hy = -108; // head centre
    c.fillStyle = hairC; c.strokeStyle = hairC;
    if (st.hair === 'afro') {
      c.beginPath(); c.arc(0, hy - 6, 33, 0, Math.PI * 2); c.fill();
    } else if (st.hair === 'ponytail') {
      const sway = Math.sin(t * 4) * 4 + swing * 6;
      c.lineWidth = 11;
      c.beginPath(); c.moveTo(14, hy - 14); c.quadraticCurveTo(36 + sway, hy - 4, 28 + sway, hy + 28); c.stroke();
    } else if (st.hair === 'braids') {
      for (const side of [-1, 1]) {
        for (let i = 0; i < 6; i++) {
          c.beginPath(); c.arc(side * (19 + i * 0.6), hy + 2 + i * 8, 5, 0, Math.PI * 2); c.fill();
        }
      }
    } else if (st.hair === 'dreads') {
      c.lineWidth = 5;
      for (let i = 0; i < 8; i++) {
        const a = Math.PI * (0.95 + i * 0.16);
        const x0 = Math.cos(a) * 20, y0 = hy + Math.sin(a) * 20;
        const xs = x0 < 0 ? -1 : 1;
        c.beginPath(); c.moveTo(x0, y0); c.lineTo(x0 + xs * 4 + swing * 3, hy + 32); c.stroke();
      }
    } else if (st.hair === 'bun') {
      c.beginPath(); c.arc(0, hy - 26, 11, 0, Math.PI * 2); c.fill();
    }

    // skirt / trousers top
    if (female) {
      c.fillStyle = bottom;
      c.beginPath(); c.moveTo(-15, -56); c.lineTo(15, -56); c.lineTo(24, -30); c.quadraticCurveTo(0, -24, -24, -30); c.closePath(); c.fill();
      c.strokeStyle = shade(bottom, 0.35); c.lineWidth = 2;
      c.beginPath(); c.moveTo(-22, -32); c.quadraticCurveTo(0, -27, 22, -32); c.stroke();
    } else {
      c.fillStyle = bottom; rrect(c, -15, -58, 30, 12, 4); c.fill();
    }

    // torso
    c.fillStyle = top;
    rrect(c, -17, -88, 34, 36, 11); c.fill();
    if (female) { // little heart on the top
      c.fillStyle = shade(top, 0.55);
      heartPath(c, 0, -74, 5); c.fill();
    }
    if (st.accessory === 'backpack') {
      c.strokeStyle = shade(top, -0.45); c.lineWidth = 4;
      c.beginPath(); c.moveTo(-10, -87); c.lineTo(-12, -60); c.moveTo(10, -87); c.lineTo(12, -60); c.stroke();
    }

    // neck
    c.fillStyle = skin; rrect(c, -5, -92, 10, 8, 3); c.fill();

    // scarf
    if (st.accessory === 'scarf') {
      c.fillStyle = '#ff4f9a';
      rrect(c, -16, -92, 32, 9, 4); c.fill();
      c.beginPath(); c.moveTo(6, -86); c.lineTo(15, -66); c.lineTo(6, -66); c.closePath(); c.fill();
    }

    // arms reaching to basket
    const basketY = -56;
    for (const side of [-1, 1]) {
      c.strokeStyle = top; c.lineWidth = 10;
      c.beginPath(); c.moveTo(side * 15, -82); c.lineTo(side * 21, -74); c.stroke();
      c.strokeStyle = skin; c.lineWidth = 7.5;
      c.beginPath(); c.moveTo(side * 21, -74); c.lineTo(side * 28, basketY - 2); c.stroke();
    }

    // head
    c.fillStyle = skin;
    c.beginPath(); c.arc(0, hy, 21, 0, Math.PI * 2); c.fill();
    // ears
    c.beginPath(); c.arc(-20, hy + 2, 4.5, 0, Math.PI * 2); c.arc(20, hy + 2, 4.5, 0, Math.PI * 2); c.fill();

    // front hair
    c.fillStyle = hairC;
    if (st.hair !== 'bald') {
      c.beginPath();
      const r = st.hair === 'afro' ? 23 : 22;
      c.arc(0, hy - 1, r, Math.PI * 1.02, Math.PI * 1.98);
      if (st.hair === 'short' || st.hair === 'dreads') {
        c.quadraticCurveTo(10, hy - 12, 0, hy - 13);
        c.quadraticCurveTo(-12, hy - 12, -r, hy - 2);
      } else {
        // soft side-swept fringe
        c.quadraticCurveTo(14, hy - 6, 4, hy - 13);
        c.quadraticCurveTo(-10, hy - 8, -r, hy + 2);
      }
      c.closePath(); c.fill();
    } else {
      c.fillStyle = 'rgba(255,255,255,0.25)';
      c.beginPath(); c.ellipse(-7, hy - 13, 6, 3, -0.4, 0, Math.PI * 2); c.fill();
    }

    // face
    const blink = o.blink;
    c.fillStyle = '#2a1430'; c.strokeStyle = '#2a1430';
    for (const side of [-1, 1]) {
      if (blink) {
        c.lineWidth = 2; c.beginPath(); c.moveTo(side * 7 - 3, hy); c.lineTo(side * 7 + 3, hy); c.stroke();
      } else {
        c.beginPath(); c.ellipse(side * 7, hy, 2.6, 3.2, 0, 0, Math.PI * 2); c.fill();
        c.fillStyle = '#fff';
        c.beginPath(); c.arc(side * 7 + 0.9, hy - 1.2, 0.9, 0, Math.PI * 2); c.fill();
        c.fillStyle = '#2a1430';
      }
      if (female) { // lashes
        c.lineWidth = 1.4;
        c.beginPath(); c.moveTo(side * 9.5, hy - 2.5); c.lineTo(side * 11.5, hy - 4.5); c.stroke();
      }
    }
    c.fillStyle = 'rgba(255, 105, 160, 0.45)';
    c.beginPath(); c.ellipse(-12, hy + 6, 4, 2.6, 0, 0, Math.PI * 2); c.ellipse(12, hy + 6, 4, 2.6, 0, 0, Math.PI * 2); c.fill();
    c.lineWidth = 2; c.strokeStyle = '#7a2340';
    c.beginPath();
    if (o.mood === 'sad') c.arc(0, hy + 13, 4.5, Math.PI * 1.15, Math.PI * 1.85);
    else c.arc(0, hy + 6, 5, Math.PI * 0.15, Math.PI * 0.85);
    c.stroke();

    // accessories on face
    if (st.accessory === 'glasses') {
      c.strokeStyle = '#3a2340'; c.lineWidth = 2;
      c.beginPath(); c.arc(-7.5, hy, 5.5, 0, Math.PI * 2); c.moveTo(13, hy); c.arc(7.5, hy, 5.5, 0, Math.PI * 2);
      c.moveTo(-2, hy); c.lineTo(2, hy); c.stroke();
    } else if (st.accessory === 'earrings') {
      c.fillStyle = '#ffcf3f';
      c.beginPath(); c.arc(-20, hy + 9, 3, 0, Math.PI * 2); c.arc(20, hy + 9, 3, 0, Math.PI * 2); c.fill();
    } else if (st.accessory === 'beard') {
      c.fillStyle = hairC;
      c.beginPath(); c.moveTo(-19, hy + 2); c.quadraticCurveTo(-16, hy + 24, 0, hy + 25); c.quadraticCurveTo(16, hy + 24, 19, hy + 2);
      c.quadraticCurveTo(12, hy + 14, 0, hy + 13); c.quadraticCurveTo(-12, hy + 14, -19, hy + 2); c.fill();
    }

    // hats
    const hatTop = st.hair === 'afro' ? hy - 34 : hy - 20;
    if (st.hat === 'cap') {
      c.fillStyle = shade(top, -0.15);
      c.beginPath(); c.arc(0, hatTop + 8, 21, Math.PI, 0); c.closePath(); c.fill();
      c.beginPath(); c.ellipse(16, hatTop + 8, 16, 4, 0, 0, Math.PI * 2); c.fill();
    } else if (st.hat === 'beanie') {
      c.fillStyle = '#ff8cc6';
      c.beginPath(); c.arc(0, hatTop + 8, 22, Math.PI, 0); c.closePath(); c.fill();
      c.fillStyle = '#fff'; rrect(c, -23, hatTop + 4, 46, 8, 4); c.fill();
      c.beginPath(); c.arc(0, hatTop - 16, 6, 0, Math.PI * 2); c.fill();
    } else if (st.hat === 'tophat') {
      c.fillStyle = '#2b2233';
      c.fillRect(-14, hatTop - 30, 28, 34);
      rrect(c, -25, hatTop + 1, 50, 6, 3); c.fill();
      c.fillStyle = top; c.fillRect(-14, hatTop - 6, 28, 6);
    } else if (st.hat === 'crown') {
      c.fillStyle = '#ffcf3f'; c.strokeStyle = '#e0a800'; c.lineWidth = 1.5;
      c.beginPath();
      c.moveTo(-16, hatTop + 4); c.lineTo(-18, hatTop - 14); c.lineTo(-9, hatTop - 5); c.lineTo(0, hatTop - 18);
      c.lineTo(9, hatTop - 5); c.lineTo(18, hatTop - 14); c.lineTo(16, hatTop + 4); c.closePath(); c.fill(); c.stroke();
      c.fillStyle = '#ff4f9a'; c.beginPath(); c.arc(0, hatTop - 2, 2.8, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#7fd8ff'; c.beginPath(); c.arc(-9, hatTop, 2, 0, Math.PI * 2); c.arc(9, hatTop, 2, 0, Math.PI * 2); c.fill();
    } else if (female && st.hair !== 'bald') {
      // a little bow in her hair
      drawBow(c, -13, hy - 18, 0.55, '#ff4f9a');
    }

    // basket (in front)
    if (o.basket !== false) {
      const bk = o.basket || BASKETS[0];
      c.fillStyle = bk.rim;
      c.beginPath(); c.ellipse(0, basketY - 4, 34, 7, 0, 0, Math.PI * 2); c.fill();
      if (bk.rainbow) {
        const rg = c.createLinearGradient(-34, 0, 34, 0);
        ['#ff6b9a', '#ffb14a', '#ffe066', '#7ee0a0', '#6cc4ff', '#b38aff'].forEach((col, i) => rg.addColorStop(i / 5, col));
        c.fillStyle = rg;
      } else c.fillStyle = bk.body;
      c.beginPath();
      c.moveTo(-34, basketY - 4); c.lineTo(-27, basketY + 18); c.quadraticCurveTo(0, basketY + 24, 27, basketY + 18); c.lineTo(34, basketY - 4);
      c.quadraticCurveTo(0, basketY + 4, -34, basketY - 4); c.fill();
      c.strokeStyle = bk.weave; c.lineWidth = 1.6;
      for (let i = -3; i <= 3; i++) {
        c.beginPath(); c.moveTo(i * 9, basketY + 1); c.lineTo(i * 7.5, basketY + 20); c.stroke();
      }
      c.beginPath(); c.moveTo(-31, basketY + 7); c.quadraticCurveTo(0, basketY + 14, 31, basketY + 7); c.stroke();
      c.strokeStyle = '#fff'; c.lineWidth = 3;
      c.beginPath(); c.ellipse(0, basketY - 4, 34, 7, 0, Math.PI * 0.05, Math.PI * 0.95); c.stroke();
      drawBow(c, 0, basketY + 10, 0.6, bk.bow);
      if (bk.glint) { // twinkling glints on fancy baskets
        c.fillStyle = '#fff';
        for (let i = 0; i < 3; i++) {
          const a = Math.max(0, Math.sin(t * 3 + i * 2.1));
          if (a > 0.2) sparkleShape(c, -20 + i * 20, basketY + 4 + (i % 2) * 8, 3.5 * a);
        }
      }
      // hands over the rim
      c.fillStyle = skin;
      c.beginPath(); c.arc(-29, basketY - 2, 4.5, 0, Math.PI * 2); c.arc(29, basketY - 2, 4.5, 0, Math.PI * 2); c.fill();
    }

    c.restore();
  }

  function heartPath(c, x, y, s) {
    c.beginPath();
    c.moveTo(x, y + s * 0.9);
    c.bezierCurveTo(x - s * 1.6, y - s * 0.2, x - s * 0.8, y - s * 1.4, x, y - s * 0.5);
    c.bezierCurveTo(x + s * 0.8, y - s * 1.4, x + s * 1.6, y - s * 0.2, x, y + s * 0.9);
    c.closePath();
  }

  function drawBow(c, x, y, s, color) {
    c.save(); c.translate(x, y); c.scale(s, s);
    c.fillStyle = color;
    c.beginPath(); c.moveTo(0, 0); c.lineTo(-12, -8); c.lineTo(-12, 8); c.closePath();
    c.moveTo(0, 0); c.lineTo(12, -8); c.lineTo(12, 8); c.closePath(); c.fill();
    c.beginPath(); c.arc(0, 0, 3.5, 0, Math.PI * 2); c.fill();
    c.restore();
  }

  // ---------- items ----------
  const ITEMS = {
    heart:   { emoji: '💖', pts: 10, weight: 30 },
    bow:     { emoji: '🎀', pts: 15, weight: 20 },
    lipstick:{ emoji: '💄', pts: 20, weight: 14 },
    cupcake: { emoji: '🧁', pts: 15, weight: 18 },
    diamond: { emoji: '💎', pts: 50, weight: 4 },
    unicorn: { emoji: '🦄', pts: 100, weight: 1.2 },
    star:    { emoji: '⭐', power: 'shield', weight: 2 },
    magnet:  { emoji: '🧲', power: 'magnet', weight: 2 },
    rainbow: { emoji: '🌈', power: 'slow', weight: 1.5 },
    life:    { emoji: '💝', power: 'life', weight: 1 },
    storm:   { emoji: '⛈️', bad: true },
    broken:  { emoji: '💔', bad: true },
  };
  const GOOD_KEYS = Object.keys(ITEMS).filter((k) => !ITEMS[k].bad);
  const GOOD_TOTAL = GOOD_KEYS.reduce((s, k) => s + ITEMS[k].weight, 0);

  const sprites = {};
  function sprite(key) {
    if (sprites[key]) return sprites[key];
    const size = 72;
    const cv = document.createElement('canvas');
    cv.width = cv.height = size;
    const c = cv.getContext('2d');
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.font = `${size * 0.8}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`;
    c.fillText(ITEMS[key].emoji, size / 2, size / 2 + 3);
    return (sprites[key] = cv);
  }

  // expose drawing for tools (cover art)
  window.GlitterRain = { drawCharacter, normalizeStyle, sprite, ITEMS, drawCloud, flower, sparkleShape, drawBow, heartPath };
  if (window.GLITTER_COVER_MODE) return;

  // ---------- canvas ----------
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  let W = 0, H = 0, DPR = 1, S = 1, GROUND = 0;

  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = innerWidth; H = innerHeight;
    canvas.width = Math.round(W * DPR); canvas.height = Math.round(H * DPR);
    S = Math.max(0.6, Math.min(1.25, Math.min(H / 760, W / 420)));
    GROUND = H - 28 * S;
    initBackdrop();
  }

  // background clouds and twinkles
  let clouds = [], twinkles = [];
  function initBackdrop() {
    clouds = Array.from({ length: 6 }, (_, i) => ({
      x: Math.random() * W, y: 60 + Math.random() * H * 0.45, s: 0.6 + Math.random() * 0.9, v: 6 + Math.random() * 12,
    }));
    twinkles = Array.from({ length: Math.round(W * H / 14000) }, () => ({
      x: Math.random() * W, y: Math.random() * H * 0.8, p: Math.random() * 6.28, r: 1 + Math.random() * 2.2,
    }));
  }

  function drawCloud(c, x, y, s, color) {
    c.fillStyle = color;
    c.beginPath();
    c.arc(x, y, 26 * s, 0, Math.PI * 2);
    c.arc(x + 30 * s, y - 12 * s, 32 * s, 0, Math.PI * 2);
    c.arc(x + 64 * s, y, 24 * s, 0, Math.PI * 2);
    c.rect(x, y - 4 * s, 64 * s, 28 * s);
    c.fill();
  }

  // Sky levels: the day turns to a starry night as your score climbs.
  const LEVELS = [
    { name: 'Sunny Day', at: 0, sky: ['#ffc6e6', '#f3d4ff', '#ffe9f4'], ground: ['#ffb3d6', '#ff94c6'], stars: 0.35, sun: 1 },
    { name: 'Golden Hour', at: 300, sky: ['#ffcfb8', '#ffc6e0', '#fff0de'], ground: ['#ffb0c8', '#ff8fb8'], stars: 0.35, sun: 1 },
    { name: 'Pink Sunset', at: 800, sky: ['#ff8fbf', '#ffaa8c', '#ffd8a8'], ground: ['#ff9cc4', '#f57fb2'], stars: 0.45, sun: 0.8 },
    { name: 'Twilight', at: 1600, sky: ['#8f6fd6', '#de86c0', '#ffbfd2'], ground: ['#d886c4', '#b766ad'], stars: 0.75, sun: 0.2 },
    { name: 'Starry Night', at: 3000, sky: ['#2b1f5c', '#5f3a96', '#b873b8'], ground: ['#9c5aa0', '#7a3f86'], stars: 1, sun: 0 },
  ];
  let skyPos = 0; // eases toward the current level index

  function hexRgb(h) { const n = parseInt(h.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; }
  function mixHex(a, b, f) {
    const x = hexRgb(a), y = hexRgb(b);
    return `rgb(${x.map((v, i) => Math.round(v + (y[i] - v) * f)).join(',')})`;
  }
  function skyAt(pos) {
    const i = Math.min(LEVELS.length - 1, Math.floor(pos)), j = Math.min(LEVELS.length - 1, i + 1), f = pos - i;
    const A = LEVELS[i], B = LEVELS[j];
    return {
      sky: A.sky.map((c, k) => mixHex(c, B.sky[k], f)),
      ground: A.ground.map((c, k) => mixHex(c, B.ground[k], f)),
      stars: A.stars + (B.stars - A.stars) * f,
      sun: A.sun + (B.sun - A.sun) * f,
    };
  }

  function drawBackdrop(c, t, dt, levelIdx = 0) {
    skyPos += (levelIdx - skyPos) * Math.min(1, dt * 0.8);
    if (Math.abs(levelIdx - skyPos) < 0.001) skyPos = levelIdx;
    const P_ = skyAt(skyPos);
    const g = c.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, P_.sky[0]);
    g.addColorStop(0.55, P_.sky[1]);
    g.addColorStop(1, P_.sky[2]);
    c.fillStyle = g; c.fillRect(0, 0, W, H);

    // soft sun, which turns into a moon at night
    if (P_.sun > 0.01) {
      const sy = H * (0.16 + (1 - P_.sun) * 0.3);
      const sg = c.createRadialGradient(W * 0.82, sy, 0, W * 0.82, sy, 140 * S);
      sg.addColorStop(0, `rgba(255,250,210,${0.9 * P_.sun})`); sg.addColorStop(1, 'rgba(255,250,210,0)');
      c.fillStyle = sg; c.fillRect(0, 0, W, H);
    }
    const moon = 1 - Math.min(1, P_.sun * 3);
    if (moon > 0.01) {
      c.fillStyle = `rgba(255,248,225,${moon})`;
      c.beginPath(); c.arc(W * 0.8, H * 0.14, 30 * S, 0, Math.PI * 2); c.fill();
      c.fillStyle = mixHex(LEVELS[3].sky[0], LEVELS[4].sky[0], Math.min(1, Math.max(0, skyPos - 3)));
      c.beginPath(); c.arc(W * 0.8 + 12 * S, H * 0.14 - 8 * S, 26 * S, 0, Math.PI * 2); c.fill();
    }

    for (const tw of twinkles) {
      const a = (0.35 + 0.35 * Math.sin(t * 2 + tw.p)) * (0.6 + P_.stars * 0.6);
      c.fillStyle = `rgba(255,255,255,${Math.min(1, a)})`;
      sparkleShape(c, tw.x, tw.y, tw.r * (2.2 + P_.stars) * S);
    }
    const cloudA = 0.7 - P_.stars * 0.45;
    for (const cl of clouds) {
      cl.x += cl.v * dt;
      if (cl.x > W + 40) { cl.x = -140 * cl.s * S; cl.y = 60 + Math.random() * H * 0.45; }
      drawCloud(c, cl.x, cl.y, cl.s * S, `rgba(255,255,255,${cloudA})`);
    }

    // ground: a frilly hill with flowers
    c.fillStyle = P_.ground[0];
    c.beginPath(); c.moveTo(0, H);
    c.lineTo(0, GROUND);
    for (let x = 0; x <= W + 20; x += 20) c.quadraticCurveTo(x + 10, GROUND - 8 * S, x + 20, GROUND);
    c.lineTo(W, H); c.closePath(); c.fill();
    c.fillStyle = P_.ground[1];
    c.fillRect(0, GROUND + 10 * S, W, H);
    for (let x = 18; x < W; x += 70) {
      flower(c, x + ((x * 37) % 23), GROUND + 6 * S, 4 * S, x % 140 ? '#fff' : '#ffe066');
    }
  }

  function flower(c, x, y, r, col) {
    c.fillStyle = col;
    for (let i = 0; i < 5; i++) {
      const a = i * 1.2566;
      c.beginPath(); c.arc(x + Math.cos(a) * r, y + Math.sin(a) * r, r * 0.8, 0, Math.PI * 2); c.fill();
    }
    c.fillStyle = '#ffcf3f'; c.beginPath(); c.arc(x, y, r * 0.6, 0, Math.PI * 2); c.fill();
  }

  function sparkleShape(c, x, y, r) {
    c.beginPath();
    c.moveTo(x, y - r); c.quadraticCurveTo(x, y, x + r, y); c.quadraticCurveTo(x, y, x, y + r);
    c.quadraticCurveTo(x, y, x - r, y); c.quadraticCurveTo(x, y, x, y - r); c.fill();
  }

  // ---------- sound ----------
  let audio = null;
  let muted = false;
  try { muted = localStorage.getItem('glitter_muted') === '1'; } catch {}

  function tone(freq, dur = 0.12, type = 'sine', vol = 0.15, delay = 0, slide = 0) {
    if (!muted) playTone(freq, dur, type, vol, delay, slide);
  }
  function playTone(freq, dur, type, vol, delay = 0, slide = 0) {
    try {
      audio ??= new (window.AudioContext || window.webkitAudioContext)();
      if (audio.state === 'suspended') audio.resume();
      const t0 = audio.currentTime + delay;
      const o = audio.createOscillator(), g = audio.createGain();
      o.type = type; o.frequency.setValueAtTime(freq, t0);
      if (slide) o.frequency.exponentialRampToValueAtTime(freq * slide, t0 + dur);
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(vol, t0 + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      o.connect(g).connect(audio.destination);
      o.start(t0); o.stop(t0 + dur + 0.02);
    } catch {}
  }
  const sfx = {
    catch: (combo) => { const f = 660 * Math.pow(1.03, Math.min(combo, 24)); tone(f, 0.1, 'triangle', 0.12); tone(f * 1.5, 0.12, 'sine', 0.06, 0.04); },
    diamond: () => [880, 1108, 1318, 1760].forEach((f, i) => tone(f, 0.14, 'triangle', 0.1, i * 0.05)),
    power: () => [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.16, 'sine', 0.12, i * 0.06)),
    hurt: () => { tone(220, 0.3, 'sawtooth', 0.08, 0, 0.5); tone(160, 0.35, 'square', 0.04, 0.02, 0.6); },
    pop: () => tone(900, 0.08, 'sine', 0.1, 0, 0.4),
    over: () => [659, 523, 440, 330].forEach((f, i) => tone(f, 0.25, 'triangle', 0.1, i * 0.14)),
    start: () => [523, 659, 784].forEach((f, i) => tone(f, 0.12, 'triangle', 0.1, i * 0.07)),
    level: () => [784, 988, 1175, 1568, 1975].forEach((f, i) => tone(f, 0.18, 'sine', 0.09, i * 0.07)),
  };

  // Background music: a soft music-box loop over C - Am - F - G.
  const music = { on: true, timer: null, step: 0, next: 0 };
  try { music.on = localStorage.getItem('glitter_music') !== '0'; } catch {}
  const CHORDS = [[60, 64, 67], [57, 60, 64], [53, 57, 60], [55, 59, 62]];
  const ARP = [0, 1, 2, 1, 2, 1, 0, 1];
  const midi = (n) => 440 * Math.pow(2, (n - 69) / 12);

  function musicTick() {
    if (!audio) return;
    const step = 60 / 100 / 2; // eighth notes at 100 bpm
    while (music.next < audio.currentTime + 0.2) {
      const s = music.step, ch = CHORDS[Math.floor(s / 8) % 4];
      const d = Math.max(0, music.next - audio.currentTime);
      if (s % 8 === 0) playTone(midi(ch[0] - 12), step * 7.5, 'sine', 0.05, d);
      playTone(midi(ch[ARP[s % 8]] + 12), step * 0.95, 'triangle', 0.028, d);
      if (s % 4 === 2 && (s * 7) % 3 === 0) playTone(midi(ch[(s >> 2) % 3] + 24), step * 1.6, 'sine', 0.018, d);
      music.step++; music.next += step;
    }
  }
  function startMusic() {
    stopMusic();
    if (!music.on) return;
    try {
      audio ??= new (window.AudioContext || window.webkitAudioContext)();
      if (audio.state === 'suspended') audio.resume();
    } catch { return; }
    music.next = audio.currentTime + 0.05;
    music.timer = setInterval(musicTick, 50);
    musicTick();
  }
  function stopMusic() { clearInterval(music.timer); music.timer = null; }

  // ---------- daily challenge ----------
  function localDay(offset = 0) {
    const d = new Date(); d.setDate(d.getDate() + offset);
    return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
  }
  function hashStr(s) { let h = 2166136261; for (const ch of s) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
  const CHALLENGES = [
    (r) => { const n = 3 + r % 3; return { text: `Catch ${n} 💎 diamonds in one run`, done: (run) => (run.caught.diamond || 0) >= n }; },
    (r) => { const n = 600 + (r % 5) * 150; return { text: `Score ${n} points in one run`, done: (run) => run.score >= n }; },
    (r) => { const n = 15 + (r % 4) * 5; return { text: `Reach a ${n} catch combo`, done: (run) => run.maxCombo >= n }; },
    (r) => { const n = 10 + (r % 3) * 4; return { text: `Catch ${n} 🎀 bows in one run`, done: (run) => (run.caught.bow || 0) >= n }; },
    () => ({ text: 'Catch a 🦄 unicorn', done: (run) => (run.caught.unicorn || 0) >= 1 }),
    (r) => { const n = 8 + (r % 3) * 3; return { text: `Catch ${n} 💄 lipsticks in one run`, done: (run) => (run.caught.lipstick || 0) >= n }; },
  ];
  const TODAY = localDay();
  const daySeed = hashStr(TODAY);
  const challenge = CHALLENGES[daySeed % CHALLENGES.length](daySeed >>> 8);
  let daily = { lastDone: '', streak: 0 };
  try { daily = { ...daily, ...JSON.parse(localStorage.getItem('glitter_daily') || '{}') }; } catch {}
  const dailyDone = () => daily.lastDone === TODAY;

  function completeDaily() {
    daily.streak = daily.lastDone === localDay(-1) ? daily.streak + 1 : 1;
    daily.lastDone = TODAY;
    try { localStorage.setItem('glitter_daily', JSON.stringify(daily)); } catch {}
    renderDaily();
  }
  function renderDaily() {
    const el = $('daily');
    const streak = daily.lastDone === TODAY || daily.lastDone === localDay(-1) ? daily.streak : 0;
    el.replaceChildren();
    const h = document.createElement('b'); h.textContent = dailyDone() ? '🏆 Daily challenge done!' : "🌸 Today's challenge";
    const p = document.createElement('span'); p.textContent = challenge.text;
    el.append(h, p);
    if (streak > 0) { const s = document.createElement('em'); s.textContent = `🔥 ${streak}-day streak`; el.append(s); }
    el.classList.toggle('done', dailyDone());
  }

  // ---------- baskets ----------
  let basketId = 'pink';
  try { basketId = localStorage.getItem('glitter_basket') || 'pink'; } catch {}
  const unlocked = (b) => best >= b.need;
  function currentBasket() {
    const b = BASKETS.find((x) => x.id === basketId);
    return b && unlocked(b) ? b : BASKETS[0];
  }
  function renderBaskets() {
    const list = $('basket-list');
    list.replaceChildren(...BASKETS.map((b) => {
      const btn = document.createElement('button');
      const open = unlocked(b);
      btn.className = 'basket' + (currentBasket().id === b.id ? ' on' : '') + (open ? '' : ' locked');
      const sw = document.createElement('i');
      sw.style.background = b.rainbow ? 'linear-gradient(90deg,#ff6b9a,#ffb14a,#ffe066,#7ee0a0,#6cc4ff,#b38aff)' : b.body;
      const label = document.createElement('span');
      label.textContent = open ? b.name : `🔒 ${b.need.toLocaleString()}`;
      btn.append(sw, label);
      btn.title = open ? b.name : `${b.name}: reach ${b.need.toLocaleString()} points to unlock`;
      btn.disabled = !open;
      btn.onclick = () => {
        basketId = b.id;
        try { localStorage.setItem('glitter_basket', b.id); } catch {}
        renderBaskets(); sfx.pop();
      };
      return btn;
    }));
  }

  // ---------- player identity ----------
  let me = { user: null, name: 'Guest', account: null, id: null, style: normalizeStyle(null), face: '' };
  const $ = (id) => document.getElementById(id);

  function renderIdentity() {
    $('player-name').textContent = me.name;
    $('player-account').textContent = me.account ? `@${me.account}` : 'Not signed in';
    $('menu-name').textContent = me.user ? me.name : 'you';
    if (me.face) $('player-face').src = me.face; else $('player-face').removeAttribute('src');
    $('player-sign-in').hidden = !!me.user;
  }

  async function whoami() {
    const reply = await askStartNg({ type: 'startng:whoami' }, 'startng:user');
    if (!reply) return;
    const player = reply.user ?? reply.guest;
    me = {
      user: reply.user || null,
      id: reply.user?.id ?? null,
      name: player?.name || 'Guest',
      account: reply.user?.account || null,
      style: normalizeStyle(player?.style),
      face: player?.face || '',
    };
    renderIdentity();
  }

  $('player-sign-in').onclick = () => { location.href = signInUrl(); };
  addEventListener('focus', whoami);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') whoami();
    else if (state === 'play') setPaused(true);
  });

  // ---------- leaderboard ----------
  async function loadBoard(listEl) {
    const data = await askStartNg({ type: 'startng:leaderboard', limit: 10 }, 'startng:leaderboardData');
    const entries = data?.ok ? data.entries || [] : null;
    listEl.replaceChildren();
    if (!entries || !entries.length) {
      const li = document.createElement('li');
      li.className = 'empty';
      li.textContent = entries ? 'No scores yet. Be the first! 💖' : 'The board appears when you play on start.ng';
      listEl.append(li);
      return;
    }
    for (const e of entries) {
      const li = document.createElement('li');
      if (me.id != null && e.player_id === me.id) li.className = 'me';
      const rank = document.createElement('span'); rank.className = 'rank'; rank.textContent = `#${e.rank}`;
      const dot = document.createElement('span'); dot.className = 'dot'; dot.style.background = HEX.test(e.color) ? e.color : '#ff5fa8';
      const nm = document.createElement('span'); nm.className = 'nm'; nm.textContent = e.name;
      const pts = document.createElement('span'); pts.className = 'pts'; pts.textContent = (e.stats?.points ?? e.score ?? 0).toLocaleString();
      const dia = document.createElement('span'); dia.className = 'dia'; dia.textContent = `💎${e.stats?.diamonds ?? 0}`;
      li.append(rank, dot, nm, pts, dia);
      listEl.append(li);
    }
  }

  // ---------- game state ----------
  let state = 'menu'; // menu | play | paused | over
  let best = 0;
  try { best = +localStorage.getItem('glitter_best') || 0; } catch {}

  const P = { x: 0, vx: 0, walk: 0, moving: 0, hurtT: 0, happyT: 0, blinkT: 3 };
  let items = [], particles = [], floaters = [];
  let score = 0, diamonds = 0, lives = 3, combo = 0, elapsed = 0, spawnT = 0;
  let shieldT = 0, magnetT = 0, slowT = 0, shake = 0, levelIdx = 0;
  let run = { caught: {}, maxCombo: 0, score: 0 };
  const keys = { left: false, right: false };
  let pointerX = null;

  function resetGame() {
    items = []; particles = []; floaters = [];
    score = 0; diamonds = 0; lives = 3; combo = 0; elapsed = 0; spawnT = 0.6;
    shieldT = 0; magnetT = 0; slowT = 0; shake = 0; levelIdx = 0;
    run = { caught: {}, maxCombo: 0, score: 0 };
    P.x = W / 2; P.vx = 0; P.hurtT = 0; P.happyT = 0;
    updateHud();
  }

  function updateHud() {
    $('score').textContent = score.toLocaleString();
    const mult = multiplier();
    $('combo').textContent = combo >= 3 ? `combo ${combo}${mult > 1 ? ` · x${mult}` : ''}` : '';
    $('lives').textContent = '💗'.repeat(lives) + '🤍'.repeat(Math.max(0, 3 - lives));
    const pw = [];
    if (shieldT > 0) pw.push(`⭐ ${Math.ceil(shieldT)}s`);
    if (magnetT > 0) pw.push(`🧲 ${Math.ceil(magnetT)}s`);
    if (slowT > 0) pw.push(`🌈 ${Math.ceil(slowT)}s`);
    const box = $('powers');
    if (box.dataset.v !== pw.join('|')) {
      box.dataset.v = pw.join('|');
      box.replaceChildren(...pw.map((t) => Object.assign(document.createElement('div'), { textContent: t })));
    }
  }

  const multiplier = () => Math.min(5, 1 + Math.floor(combo / 6));

  function spawn() {
    const diff = Math.min(1, elapsed / 120);
    const badChance = 0.14 + diff * 0.2;
    let key;
    if (Math.random() < badChance) key = Math.random() < 0.55 ? 'storm' : 'broken';
    else {
      let r = Math.random() * GOOD_TOTAL;
      for (const k of GOOD_KEYS) { r -= ITEMS[k].weight; if (r <= 0) { key = k; break; } }
      key ??= 'heart';
      if (key === 'life' && lives >= 5) key = 'heart';
    }
    const size = (ITEMS[key].bad ? 46 : 40) * S;
    const speed = (150 + diff * 230 + Math.random() * 60) * S * (key === 'diamond' ? 1.25 : 1);
    items.push({
      key, x: size + Math.random() * (W - size * 2), y: -size, vy: speed, size,
      sway: Math.random() * 6.28, swayAmp: ITEMS[key].bad ? 0 : 14 * S, rot: (Math.random() - 0.5) * 0.6, spin: (Math.random() - 0.5) * 2,
    });
  }

  function burst(x, y, colors, n = 14, power = 1) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, v = (60 + Math.random() * 160) * S * power;
      particles.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 80 * S, life: 0.6 + Math.random() * 0.5, t: 0, r: (2 + Math.random() * 3.5) * S, col: colors[i % colors.length] });
    }
  }

  function floatText(x, y, text, col = '#e0407f') {
    floaters.push({ x, y, text, col, t: 0 });
  }

  // character hit boxes in screen space
  function basketBox() {
    const s = S * 0.95;
    return { x0: P.x - 38 * s, x1: P.x + 38 * s, y0: GROUND - 82 * s, y1: GROUND - 36 * s };
  }
  function bodyBox() {
    const s = S * 0.95;
    return { x0: P.x - 24 * s, x1: P.x + 24 * s, y0: GROUND - 132 * s, y1: GROUND - 10 * s };
  }
  const inBox = (b, x, y, pad = 0) => x > b.x0 - pad && x < b.x1 + pad && y > b.y0 - pad && y < b.y1 + pad;

  function collect(it) {
    const def = ITEMS[it.key];
    if (def.bad) {
      if (shieldT > 0) {
        sfx.pop(); burst(it.x, it.y, ['#fff', '#ffe066', '#bde0ff'], 12);
        floatText(it.x, it.y, 'blocked!', '#9b5de5');
        return;
      }
      if (P.hurtT > 0) return;
      lives--; combo = 0; P.hurtT = 1.2; shake = 0.35;
      sfx.hurt(); burst(it.x, it.y, ['#8f86a8', '#c9c2dd', '#5d5677'], 16);
      floatText(it.x, it.y, 'ouch!', '#6b6280');
      if (lives <= 0) gameOver();
      return;
    }
    combo++;
    P.happyT = 0.5;
    run.caught[it.key] = (run.caught[it.key] || 0) + 1;
    run.maxCombo = Math.max(run.maxCombo, combo);
    if (def.power === 'shield') { shieldT = 6; sfx.power(); floatText(it.x, it.y, 'sparkle shield!', '#c08a00'); }
    else if (def.power === 'magnet') { magnetT = 7; sfx.power(); floatText(it.x, it.y, 'magnet!', '#d13c3c'); }
    else if (def.power === 'life') { lives = Math.min(5, lives + 1); sfx.power(); floatText(it.x, it.y, '+1 life', '#e0407f'); }
    else if (def.power === 'slow') { slowT = 6; sfx.power(); floatText(it.x, it.y, 'slow-mo rainbow!', '#9b5de5'); }
    else {
      const pts = def.pts * multiplier();
      score += pts;
      if (it.key === 'diamond' || it.key === 'unicorn') sfx.diamond(); else sfx.catch(combo);
      if (it.key === 'diamond') diamonds++;
      floatText(it.x, it.y, `+${pts}`, it.key === 'diamond' ? '#4aa3ff' : it.key === 'unicorn' ? '#9b5de5' : '#e0407f');
    }
    burst(it.x, it.y, ['#ff5fa8', '#ffd1e8', '#b693ff', '#ffe066', '#fff'], it.key === 'diamond' || it.key === 'unicorn' ? 24 : 12);
    run.score = score;
    checkProgress();
  }

  function checkProgress() {
    let lv = 0;
    for (let i = 0; i < LEVELS.length; i++) if (score >= LEVELS[i].at) lv = i;
    if (lv > levelIdx) {
      levelIdx = lv;
      sfx.level();
      toast(`${['☀️', '🌇', '🌅', '🌆', '🌙'][lv]} ${LEVELS[lv].name}!`);
    }
    if (!dailyDone() && challenge.done(run)) {
      completeDaily();
      setTimeout(() => { sfx.power(); toast('🏆 Daily challenge complete!'); }, 400);
    }
  }

  let toastTimer;
  function toast(text) {
    const el = $('toast');
    el.textContent = text;
    el.classList.remove('show'); void el.offsetWidth; el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 2200);
  }

  function update(dt) {
    elapsed += dt;
    const diff = Math.min(1, elapsed / 120);

    // movement
    const maxV = 620 * S;
    let dir = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
    if (pointerX != null && !dir) {
      const d = pointerX - P.x;
      P.vx = Math.abs(d) < 2 ? 0 : Math.max(-maxV * 1.3, Math.min(maxV * 1.3, d * 12));
    } else {
      const target = dir * maxV;
      P.vx += (target - P.vx) * Math.min(1, dt * 12);
    }
    P.x += P.vx * dt;
    const margin = 36 * S;
    P.x = Math.max(margin, Math.min(W - margin, P.x));
    const speedFrac = Math.min(1, Math.abs(P.vx) / maxV);
    P.moving += (speedFrac - P.moving) * Math.min(1, dt * 10);
    P.walk += dt * (6 + 10 * speedFrac);
    P.hurtT = Math.max(0, P.hurtT - dt);
    P.happyT = Math.max(0, P.happyT - dt);
    shieldT = Math.max(0, shieldT - dt);
    magnetT = Math.max(0, magnetT - dt);
    slowT = Math.max(0, slowT - dt);
    shake = Math.max(0, shake - dt);

    // spawning
    spawnT -= dt;
    if (spawnT <= 0) {
      spawn();
      if (diff > 0.5 && Math.random() < diff * 0.35) spawn();
      spawnT = 0.85 - diff * 0.45 + Math.random() * 0.25;
    }

    // items
    const bb = basketBox(), body = bodyBox();
    for (let i = items.length - 1; i >= 0; i--) {
      const it = items[i];
      const def = ITEMS[it.key];
      it.y += it.vy * dt * (slowT > 0 ? 0.5 : 1);
      it.sway += dt * 2.4;
      it.rot += it.spin * dt;
      let dx = Math.sin(it.sway) * it.swayAmp * dt;
      if (magnetT > 0 && !def.bad) {
        const d = P.x - it.x, dy = GROUND - 60 * S - it.y;
        if (Math.abs(d) < 260 * S && dy > -H) dx += Math.sign(d) * Math.min(Math.abs(d), 520 * S * dt);
      }
      it.x += dx;
      const caught = def.bad ? inBox(body, it.x, it.y, it.size * 0.3) || inBox(bb, it.x, it.y, it.size * 0.2)
                             : inBox(bb, it.x, it.y, it.size * 0.35);
      if (caught) {
        items.splice(i, 1);
        collect(it);
        if (state !== 'play') return;
        continue;
      }
      if (it.y > GROUND + it.size * 0.2) {
        items.splice(i, 1);
        if (!def.bad) {
          if (combo >= 3) floatText(it.x, GROUND - 20 * S, 'missed', '#9b8aa8');
          combo = 0;
          burst(it.x, GROUND, ['#ffd1e8', '#fff'], 5, 0.4);
        } else {
          burst(it.x, GROUND, ['#c9c2dd', '#8f86a8'], 6, 0.5);
        }
      }
    }

    // shield sparkles
    if (shieldT > 0 && Math.random() < 0.5) {
      const a = Math.random() * 6.28;
      particles.push({ x: P.x + Math.cos(a) * 70 * S, y: GROUND - 70 * S + Math.sin(a) * 80 * S, vx: 0, vy: -20 * S, life: 0.5, t: 0, r: 2.5 * S, col: '#ffe066' });
    }

    updateHud();
  }

  function stepFx(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.t += dt; p.vy += 380 * S * dt; p.x += p.vx * dt; p.y += p.vy * dt;
      if (p.t > p.life) particles.splice(i, 1);
    }
    for (let i = floaters.length - 1; i >= 0; i--) {
      floaters[i].t += dt;
      if (floaters[i].t > 0.9) floaters.splice(i, 1);
    }
  }

  function render(t, dt) {
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    if (shake > 0) ctx.translate((Math.random() - 0.5) * 12 * shake, (Math.random() - 0.5) * 12 * shake);
    drawBackdrop(ctx, t, dt, state === 'menu' ? 0 : levelIdx);

    // items
    for (const it of items) {
      const spr = sprite(it.key);
      ctx.save();
      ctx.translate(it.x, it.y);
      ctx.rotate(it.rot);
      if (ITEMS[it.key].bad) {
        ctx.fillStyle = 'rgba(70, 40, 90, 0.22)';
        ctx.beginPath(); ctx.arc(0, 0, it.size * 0.62, 0, Math.PI * 2); ctx.fill();
      } else if (it.key === 'unicorn' || it.key === 'diamond') {
        ctx.fillStyle = `rgba(255,255,255,${0.35 + 0.2 * Math.sin(t * 10)})`;
        sparkleShape(ctx, 0, 0, it.size * 0.85);
      } else if (ITEMS[it.key].power) {
        ctx.fillStyle = 'rgba(255,255,255,0.55)';
        ctx.beginPath(); ctx.arc(0, 0, it.size * 0.65 + Math.sin(t * 8) * 2, 0, Math.PI * 2); ctx.fill();
      }
      ctx.drawImage(spr, -it.size / 2, -it.size / 2, it.size, it.size);
      ctx.restore();
    }

    // player
    {
      P.blinkT -= dt;
      if (P.blinkT < -0.12) P.blinkT = 2 + Math.random() * 3;
      const flicker = P.hurtT > 0 && Math.floor(P.hurtT * 12) % 2 === 0;
      ctx.save();
      ctx.translate(P.x, GROUND);
      ctx.scale(S * 0.95, S * 0.95);
      ctx.rotate(Math.max(-0.12, Math.min(0.12, P.vx / (620 * S) * 0.12)));
      if (P.happyT > 0) ctx.translate(0, -Math.sin(P.happyT / 0.5 * Math.PI) * 6);
      ctx.globalAlpha = flicker ? 0.45 : 1;
      drawCharacter(ctx, me.style, { t, walk: P.walk, moving: P.moving, mood: P.hurtT > 0 ? 'sad' : 'happy', blink: P.blinkT < 0, basket: currentBasket() });
      ctx.globalAlpha = 1;
      if (shieldT > 0) {
        const a = shieldT < 1.5 ? 0.25 + 0.25 * Math.sin(t * 20) : 0.35;
        const g = ctx.createRadialGradient(0, -70, 20, 0, -70, 82);
        g.addColorStop(0, 'rgba(255,240,150,0)'); g.addColorStop(0.8, `rgba(255,224,102,${a * 0.5})`); g.addColorStop(1, `rgba(255,255,255,${a + 0.2})`);
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.ellipse(0, -70, 66, 82, 0, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
    }

    // particles
    for (const p of particles) {
      const a = 1 - p.t / p.life;
      ctx.globalAlpha = Math.max(0, a);
      ctx.fillStyle = p.col;
      sparkleShape(ctx, p.x, p.y, p.r * 1.6);
    }
    ctx.globalAlpha = 1;

    // floating text
    ctx.textAlign = 'center';
    ctx.font = `700 ${Math.round(20 * S)}px Fredoka, "Trebuchet MS", sans-serif`;
    for (const f of floaters) {
      const a = 1 - f.t / 0.9;
      ctx.globalAlpha = a;
      ctx.lineWidth = 4; ctx.strokeStyle = '#fff';
      ctx.strokeText(f.text, f.x, f.y - f.t * 50 * S);
      ctx.fillStyle = f.col;
      ctx.fillText(f.text, f.x, f.y - f.t * 50 * S);
    }
    ctx.globalAlpha = 1;
  }

  // ---------- flow ----------
  function show(id, on) { $(id).hidden = !on; }

  function startGame() {
    resetGame();
    state = 'play';
    show('menu', false); show('over', false); show('paused', false);
    $('scorebox').hidden = false; $('pause').hidden = false;
    sfx.start();
    startMusic();
  }

  function setPaused(p) {
    if (p && state === 'play') { state = 'paused'; show('paused', true); stopMusic(); }
    else if (!p && state === 'paused') { state = 'play'; show('paused', false); last = performance.now(); startMusic(); }
  }

  function toMenu() {
    state = 'menu';
    items = []; floaters = [];
    show('over', false);
    $('scorebox').hidden = true;
    renderBaskets(); renderDaily();
    show('menu', true);
    loadBoard($('board-menu'));
  }

  async function gameOver() {
    state = 'over';
    stopMusic();
    sfx.over();
    keys.left = keys.right = false;
    $('pause').hidden = true;
    const oldBest = best;
    if (score > best) { best = score; try { localStorage.setItem('glitter_best', String(best)); } catch {} }
    const fresh = BASKETS.filter((b) => b.need > oldBest && b.need <= best);
    const extra = $('over-extra');
    extra.replaceChildren();
    if (fresh.length) {
      const d = document.createElement('div'); d.className = 'unlock';
      d.textContent = `🎁 New basket unlocked: ${fresh.map((b) => b.name).join(', ')}! Pick it from the menu.`;
      extra.append(d);
    }
    const next = BASKETS.find((b) => b.need > best);
    if (next) {
      const d = document.createElement('div'); d.className = 'next';
      d.textContent = `${(next.need - best).toLocaleString()} more points to unlock ${next.name}`;
      extra.append(d);
    }
    const dc = document.createElement('div'); dc.className = 'next';
    dc.textContent = dailyDone() ? `🏆 Daily challenge done (🔥 ${daily.streak}-day streak)` : `🌸 Daily: ${challenge.text}`;
    extra.append(dc);
    $('final-score').textContent = score.toLocaleString();
    $('final-diamonds').textContent = diamonds;
    $('final-best').textContent = best.toLocaleString();
    const msg = $('save-msg');
    msg.textContent = '';
    setTimeout(() => show('over', true), 700);

    const listEl = $('board-over');
    if (me.user) {
      msg.textContent = 'Saving your sparkle…';
      const saved = await askStartNg({ type: 'startng:score', stats: { points: score, diamonds } }, 'startng:scoreSaved');
      if (saved?.ok) {
        const r = saved.result || {};
        msg.textContent = r.improved ? `New best! You're #${r.rank} 👑` : `Not your best this time (you're #${r.rank})`;
      } else {
        msg.textContent = saved?.error || "Couldn't save your score this time.";
      }
    } else {
      msg.innerHTML = '';
      const a = document.createElement('a');
      a.href = signInUrl(); a.textContent = 'Sign in with start.ng';
      a.style.color = '#e0407f'; a.style.fontWeight = '700';
      msg.append(a, document.createTextNode(' to save your score 💖'));
    }
    loadBoard(listEl);
  }

  $('play').onclick = startGame;
  $('again').onclick = startGame;
  $('to-menu').onclick = toMenu;
  $('resume').onclick = () => setPaused(false);
  $('pause').onclick = () => setPaused(true);

  function renderMute() { $('mute').classList.toggle('off', muted); }
  $('mute').onclick = () => {
    muted = !muted;
    try { localStorage.setItem('glitter_muted', muted ? '1' : '0'); } catch {}
    renderMute();
    if (!muted) sfx.pop();
  };

  function renderMusic() { $('music').classList.toggle('off', !music.on); }
  $('music').onclick = () => {
    music.on = !music.on;
    try { localStorage.setItem('glitter_music', music.on ? '1' : '0'); } catch {}
    renderMusic();
    if (music.on && state === 'play') startMusic(); else stopMusic();
  };

  // ---------- input ----------
  addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') { keys.left = true; pointerX = null; }
    else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') { keys.right = true; pointerX = null; }
    else if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') { state === 'play' ? setPaused(true) : setPaused(false); }
    else if ((e.key === ' ' || e.key === 'Enter') && (state === 'menu' || state === 'over') && !e.repeat) { e.preventDefault(); startGame(); }
    else if (e.key === ' ' && state === 'paused') setPaused(false);
  });
  addEventListener('keyup', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keys.left = false;
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keys.right = false;
  });
  canvas.addEventListener('pointerdown', (e) => { pointerX = e.clientX; });
  canvas.addEventListener('pointermove', (e) => { if (e.pointerType === 'mouse' || e.buttons) pointerX = e.clientX; });
  canvas.addEventListener('pointerup', (e) => { if (e.pointerType !== 'mouse') pointerX = null; });
  canvas.addEventListener('pointerleave', () => { pointerX = null; });
  addEventListener('blur', () => { keys.left = keys.right = false; });

  // ---------- loop ----------
  let last = performance.now();
  function frameLoop(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    const t = now / 1000;
    if (state === 'play') update(dt);
    else if (state === 'menu') { // idle sway on the menu
      P.x += (W / 2 + Math.sin(t * 0.8) * Math.min(120, W * 0.2) - P.x) * Math.min(1, dt * 2);
      P.moving = 0.3; P.walk += dt * 5;
    }
    if (state !== 'paused') stepFx(dt);
    render(t, state === 'paused' ? 0 : dt);
    requestAnimationFrame(frameLoop);
  }

  addEventListener('resize', resize);
  resize();
  P.x = W / 2;
  renderIdentity();
  renderMute();
  renderMusic();
  renderBaskets();
  renderDaily();
  updateHud();
  requestAnimationFrame(frameLoop);

  // start.ng sign-in
  if (location.hash.includes('startng_session')) history.replaceState(null, '', location.pathname + location.search);
  whoami().then(() => loadBoard($('board-menu')));
})();
