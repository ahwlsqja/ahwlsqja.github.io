/* =====================================================================
   portfolio design system — site.js
   1. 이메일 복사        [data-copy]
   2. 테마 버튼          .theme-btn
   3. 진입 효과          .reveal
   4. 현재 섹션 표시     .toc, .topnav[data-spy]
   5. 다이어그램 런타임  figure.dg[data-steps]
   외부 라이브러리 없음. 모듈 아님(일반 <script defer>로 불러옴).
   ===================================================================== */
(function () {
  'use strict';

  var doc = document;
  var root = doc.documentElement;
  root.classList.add('js');

  var reduceMq = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
  var hasIO = 'IntersectionObserver' in window;

  function $all(sel, ctx) { return Array.prototype.slice.call((ctx || doc).querySelectorAll(sel)); }

  function el(tag, attrs, html) {
    var n = doc.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) { n.setAttribute(k, attrs[k]); });
    }
    if (html != null) n.innerHTML = html;
    return n;
  }

  /* 화면 낭독기용 공용 알림 영역 */
  var live = null;
  function announce(msg) {
    if (!live) {
      live = el('div', { 'class': 'sr-only', 'aria-live': 'polite', 'role': 'status' });
      doc.body.appendChild(live);
    }
    live.textContent = '';
    window.setTimeout(function () { live.textContent = msg; }, 30);
  }

  /* ---------- 1. 이메일 복사 ----------
     <button class="btn" type="button" data-copy="me@example.com">
       <span class="copy-label">이메일 복사</span>
     </button>
     선택: data-copied-label="복사했습니다" */
  function fallbackCopy(text) {
    var ta = el('textarea', { 'readonly': '', 'aria-hidden': 'true' });
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.top = '-1000px';
    ta.style.opacity = '0';
    doc.body.appendChild(ta);
    ta.select();
    var ok = false;
    try { ok = doc.execCommand('copy'); } catch (e) { ok = false; }
    doc.body.removeChild(ta);
    return ok;
  }

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text).then(function () { return true; }, function () { return fallbackCopy(text); });
    }
    return Promise.resolve(fallbackCopy(text));
  }

  $all('[data-copy]').forEach(function (btn) {
    var label = btn.querySelector('.copy-label') || btn;
    var original = label.textContent;
    var timer = 0;
    btn.addEventListener('click', function () {
      var text = btn.getAttribute('data-copy');
      copyText(text).then(function (ok) {
        window.clearTimeout(timer);
        if (ok) {
          btn.setAttribute('data-copied', 'true');
          label.textContent = btn.getAttribute('data-copied-label') || '복사했습니다';
          announce(text + ' 주소를 복사했습니다.');
        } else {
          label.textContent = text;
          announce('복사하지 못했습니다. 주소는 ' + text + ' 입니다.');
        }
        timer = window.setTimeout(function () {
          btn.removeAttribute('data-copied');
          label.textContent = original;
        }, 2200);
      });
    });
  });

  /* ---------- 2. 테마 버튼 ----------
     <head>에 깜빡임 방지 한 줄을 둔다:
     <script>try{var t=localStorage.getItem('theme');if(t)document.documentElement.setAttribute('data-theme',t)}catch(e){}</script> */
  function currentTheme() {
    var t = root.getAttribute('data-theme');
    if (t === 'light' || t === 'dark') return t;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  }

  try {
    var saved = window.localStorage.getItem('theme');
    if ((saved === 'light' || saved === 'dark') && !root.hasAttribute('data-theme')) root.setAttribute('data-theme', saved);
  } catch (e) { /* 저장소를 못 쓰면 OS 설정을 따른다 */ }

  $all('.theme-btn').forEach(function (btn) {
    function sync() {
      var next = currentTheme() === 'dark' ? '라이트' : '다크';
      btn.setAttribute('aria-label', next + ' 테마로 바꾸기');
      btn.setAttribute('title', next + ' 테마');
    }
    sync();
    btn.addEventListener('click', function () {
      var next = currentTheme() === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      try { window.localStorage.setItem('theme', next); } catch (e) { /* 무시 */ }
      sync();
    });
  });

  /* ---------- 3. 진입 효과 ---------- */
  var reveals = $all('.reveal');
  if (!hasIO || reduceMq.matches) {
    reveals.forEach(function (n) { n.classList.add('in'); });
  } else if (reveals.length) {
    var rio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); rio.unobserve(en.target); }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
    reveals.forEach(function (n) { rio.observe(n); });
  }

  /* ---------- 4. 현재 섹션 표시 ---------- */
  $all('.toc, .topnav[data-spy]').forEach(function (nav) {
    if (!hasIO) return;
    var links = $all('a[href^="#"]', nav);
    var map = {};
    var targets = [];
    links.forEach(function (a) {
      var id = decodeURIComponent(a.getAttribute('href').slice(1));
      var t = id && doc.getElementById(id);
      if (t) { map[id] = a; targets.push(t); }
    });
    if (!targets.length) return;
    var visible = {};
    var sio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { visible[en.target.id] = en.isIntersecting; });
      var firstId = null;
      for (var i = 0; i < targets.length; i++) {
        if (visible[targets[i].id]) { firstId = targets[i].id; break; }
      }
      if (!firstId) return;
      links.forEach(function (a) { a.removeAttribute('aria-current'); });
      map[firstId].setAttribute('aria-current', 'true');
    }, { rootMargin: '-72px 0px -55% 0px', threshold: 0 });
    targets.forEach(function (t) { sio.observe(t); });
  });

  /* ---------- 5. 다이어그램 런타임 ----------
     규격: diagram-spec.md
     <figure class="dg" data-steps='[{"t":"단계 설명"},{"t":"...","d":4000}]'>
       <figcaption>그림 1. 제목</figcaption>
       <div class="dg__canvas"><svg viewBox="...">…[data-step="1,2"]…</svg></div>
     </figure> */
  var ICON = {
    prev: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 3h1.6v10H4zM13 3.2v9.6L6.4 8z"/></svg>',
    next: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M10.4 3H12v10h-1.6zM3 3.2v9.6L9.6 8z"/></svg>',
    play: '<svg class="i-play" viewBox="0 0 16 16" aria-hidden="true"><path d="M4.5 2.8v10.4L13 8z"/></svg>' +
          '<svg class="i-pause" viewBox="0 0 16 16" aria-hidden="true"><path d="M4 3h3v10H4zM9 3h3v10H9z"/></svg>'
  };

  function parseSteps(attr) {
    // "1,2" / "2-4" / "1, 3-5" → Set 같은 객체
    var set = {};
    String(attr || '').split(',').forEach(function (part) {
      part = part.trim();
      if (!part) return;
      var m = part.match(/^(\d+)\s*-\s*(\d+)$/);
      if (m) {
        for (var i = +m[1]; i <= +m[2]; i++) set[i] = true;
      } else if (/^\d+$/.test(part)) {
        set[+part] = true;
      }
    });
    return set;
  }

  function Diagram(fig, index) {
    var steps;
    try { steps = JSON.parse(fig.getAttribute('data-steps') || '[]'); } catch (e) { steps = []; }
    var svg = fig.querySelector('svg');
    if (!svg || !Array.isArray(steps) || !steps.length) return;

    var total = steps.length;
    var stepMs = parseInt(fig.getAttribute('data-step-ms'), 10) || 2800;
    var idleText = fig.getAttribute('data-idle') || '전체 그림입니다. 재생하거나 아래 단계를 누르면 해당 부분을 강조합니다.';
    var uid = fig.id || ('dg' + (index + 1));
    if (!fig.id) fig.id = uid;

    // 캔버스로 감싸기 (작성자가 안 감쌌을 때)
    if (!svg.parentNode.classList || !svg.parentNode.classList.contains('dg__canvas')) {
      var wrap = el('div', { 'class': 'dg__canvas' });
      svg.parentNode.insertBefore(wrap, svg);
      wrap.appendChild(svg);
    }
    var canvas = svg.parentNode;
    if (!svg.hasAttribute('role')) svg.setAttribute('role', 'img');
    var cap = fig.querySelector('figcaption');
    if (cap && !svg.hasAttribute('aria-labelledby') && !svg.hasAttribute('aria-label')) {
      if (!cap.id) cap.id = uid + '-cap';
      svg.setAttribute('aria-labelledby', cap.id);
    }

    var nodes = $all('[data-step]', svg).map(function (n) {
      return { el: n, set: parseSteps(n.getAttribute('data-step')) };
    });

    // 컨트롤 바
    var bar = el('div', { 'class': 'dg__bar' });
    var ctl = el('div', { 'class': 'dg__ctl', 'role': 'group', 'aria-label': '그림 단계 조작' });
    var bPrev = el('button', { 'type': 'button', 'class': 'dg__btn', 'aria-label': '이전 단계', 'aria-controls': uid }, ICON.prev);
    var bPlay = el('button', { 'type': 'button', 'class': 'dg__btn', 'aria-label': '자동 재생', 'aria-pressed': 'false', 'aria-controls': uid }, ICON.play);
    var bNext = el('button', { 'type': 'button', 'class': 'dg__btn', 'aria-label': '다음 단계', 'aria-controls': uid }, ICON.next);
    ctl.appendChild(bPrev); ctl.appendChild(bPlay); ctl.appendChild(bNext);
    var count = el('span', { 'class': 'dg__count', 'aria-hidden': 'true' });
    var now = el('p', { 'class': 'dg__now', 'aria-live': 'polite' });
    var prog = el('div', { 'class': 'dg__progress', 'aria-hidden': 'true' });
    for (var p = 0; p < total; p++) prog.appendChild(doc.createElement('span'));
    bar.appendChild(ctl); bar.appendChild(count); bar.appendChild(now); bar.appendChild(prog);
    canvas.parentNode.insertBefore(bar, canvas.nextSibling);

    // 단계 목록: 작성자가 넣은 ol.dg__steps가 있으면 그대로 쓰고, 없으면 만든다
    var list = fig.querySelector('ol.dg__steps');
    var items = [];
    if (!list) {
      list = el('ol', { 'class': 'dg__steps', 'aria-label': '단계' });
      steps.forEach(function (s) {
        var li = doc.createElement('li');
        var b = el('button', { 'type': 'button' });
        b.textContent = s.t || '';
        li.appendChild(b);
        list.appendChild(li);
      });
      bar.parentNode.insertBefore(list, bar.nextSibling);
    }
    items = $all('li', list).map(function (li) {
      var b = li.querySelector('button');
      if (!b) {
        b = el('button', { 'type': 'button' });
        while (li.firstChild) b.appendChild(li.firstChild);
        li.appendChild(b);
      }
      return b;
    });

    var cur = -1;
    var playing = false;
    var userPaused = false;
    var inView = false;
    var timer = 0;

    function pauseSmil() { if (typeof svg.pauseAnimations === 'function') { try { svg.pauseAnimations(); } catch (e) { /* 무시 */ } } }
    function playSmil() { if (typeof svg.unpauseAnimations === 'function') { try { svg.unpauseAnimations(); } catch (e) { /* 무시 */ } } }

    function show(i) {
      cur = i;
      var n = i + 1;
      nodes.forEach(function (x) { x.el.classList.toggle('on', i >= 0 && !!x.set[n]); });
      count.innerHTML = i >= 0 ? '<b>' + n + '</b> / ' + total : '– / ' + total;
      bar.setAttribute('data-step', i >= 0 ? String(n) : '0');
      now.textContent = i >= 0 ? (steps[i].t || '') : idleText;
      items.forEach(function (b, k) {
        if (k === i) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current');
      });
      $all('span', prog).forEach(function (s, k) {
        s.className = k < i ? 'done' : (k === i ? 'cur' : '');
      });
    }

    function schedule() {
      window.clearTimeout(timer);
      var d = (steps[cur] && +steps[cur].d) || stepMs;
      timer = window.setTimeout(function () {
        show((cur + 1) % total);
        schedule();
      }, d);
    }

    function play() {
      if (playing) return;
      playing = true;
      fig.classList.add('is-playing');
      bPlay.setAttribute('aria-pressed', 'true');
      if (!reduceMq.matches) playSmil();
      if (cur < 0) show(0);
      schedule();
    }

    function pause() {
      window.clearTimeout(timer);
      if (!playing) return;
      playing = false;
      fig.classList.remove('is-playing');
      bPlay.setAttribute('aria-pressed', 'false');
      pauseSmil();
    }

    function go(i) {
      userPaused = true;
      pause();
      show(((i % total) + total) % total);
    }

    bPlay.addEventListener('click', function () {
      if (playing) { userPaused = true; pause(); } else { userPaused = false; play(); }
    });
    bPrev.addEventListener('click', function () { go(cur < 0 ? total - 1 : cur - 1); });
    bNext.addEventListener('click', function () { go(cur + 1); });
    items.forEach(function (b, k) {
      b.addEventListener('click', function () {
        if (cur === k && !playing) { show(-1); return; } // 같은 단계를 다시 누르면 전체 그림으로
        go(k);
      });
    });

    fig.addEventListener('keydown', function (e) {
      if (e.target && /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
      if (e.key === 'ArrowRight') { e.preventDefault(); go(cur + 1); bNext.focus(); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); go(cur < 0 ? total - 1 : cur - 1); bPrev.focus(); }
      else if (e.key === 'Escape') { userPaused = true; pause(); show(-1); }
    });

    // 처음에는 정지 상태의 전체 그림
    pauseSmil();
    show(-1);

    // 화면에 보일 때만 자동 재생. 동작 줄이기 설정이면 자동 재생하지 않음
    if (hasIO) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          inView = en.isIntersecting && en.intersectionRatio >= 0.45;
          if (inView) {
            if (!userPaused && !reduceMq.matches) play();
          } else if (playing) {
            pause();
          }
        });
      }, { threshold: [0, 0.45, 0.9] });
      io.observe(fig);
    }

    doc.addEventListener('visibilitychange', function () {
      if (doc.hidden) pause();
      else if (inView && !userPaused && !reduceMq.matches) play();
    });

    var onReduce = function () { if (reduceMq.matches) { userPaused = true; pause(); } };
    if (reduceMq.addEventListener) reduceMq.addEventListener('change', onReduce);
    else if (reduceMq.addListener) reduceMq.addListener(onReduce);

    fig.setAttribute('data-ready', 'true');
  }

  $all('figure.dg[data-steps]').forEach(function (fig, i) { Diagram(fig, i); });
})();

/* 발표 슬라이드 뷰어: 카드의 버튼으로 열고, 화살표 키·버튼·스와이프로 넘긴다 */
(function () {
  var talk = document.querySelector('.talk[data-talk]');
  var dlg = document.getElementById('talk-viewer');
  if (!talk || !dlg || typeof dlg.showModal !== 'function') return;
  var base = talk.getAttribute('data-talk');
  var total = parseInt(talk.getAttribute('data-pages'), 10) || 1;
  var img = dlg.querySelector('[data-v-img]');
  var cur = dlg.querySelector('[data-v-cur]');
  var strip = dlg.querySelector('[data-v-strip]');
  var prev = dlg.querySelector('[data-v-prev]');
  var next = dlg.querySelector('[data-v-next]');
  var page = 1, built = false;
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function build() {
    if (built) return; built = true;
    dlg.querySelector('[data-v-total]').textContent = total;
    for (var i = 1; i <= total; i++) {
      var b = document.createElement('button');
      b.type = 'button'; b.setAttribute('aria-label', i + '번 슬라이드');
      b.innerHTML = '<img loading="lazy" alt="" src="' + base + '/thumbs/' + pad(i) + '.jpg">';
      b.addEventListener('click', (function (n) { return function () { show(n); }; })(i));
      strip.appendChild(b);
    }
  }
  function show(n) {
    page = Math.max(1, Math.min(total, n));
    img.src = base + '/slides/' + pad(page) + '.jpg';
    img.alt = '슬라이드 ' + page + ' / ' + total;
    cur.textContent = page;
    prev.disabled = page === 1; next.disabled = page === total;
    Array.prototype.forEach.call(strip.children, function (b, i) {
      if (i + 1 === page) { b.setAttribute('aria-current', 'true'); b.scrollIntoView({ block: 'nearest', inline: 'nearest' }); }
      else b.removeAttribute('aria-current');
    });
    if (page < total) { var pre = new Image(); pre.src = base + '/slides/' + pad(page + 1) + '.jpg'; }
  }
  Array.prototype.forEach.call(document.querySelectorAll('[data-talk-open]'), function (b) {
    b.addEventListener('click', function () { build(); dlg.showModal(); show(parseInt(b.getAttribute('data-talk-open'), 10) || 1); });
  });
  prev.addEventListener('click', function () { show(page - 1); });
  next.addEventListener('click', function () { show(page + 1); });
  dlg.querySelector('[data-v-close]').addEventListener('click', function () { dlg.close(); });
  dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });
  dlg.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowRight') { e.preventDefault(); show(page + 1); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); show(page - 1); }
  });
  var x0 = null;
  var stage = dlg.querySelector('.viewer__stage');
  stage.addEventListener('pointerdown', function (e) { x0 = e.clientX; });
  stage.addEventListener('pointerup', function (e) {
    if (x0 === null) return; var dx = e.clientX - x0; x0 = null;
    if (Math.abs(dx) > 40) show(page + (dx < 0 ? 1 : -1));
  });
})();
