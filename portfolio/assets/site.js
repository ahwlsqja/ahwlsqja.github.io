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

/* =====================================================================
   6. 시나리오 스테퍼  figure.dg.scn[data-scenarios]
   사용법: scenario-README.md. 기존 figure.dg[data-steps]와 독립이다.
   ===================================================================== */
(function () {
  'use strict';
  var doc = document;
  var NS = 'http://www.w3.org/2000/svg';
  var reduceMq = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
  var KINDS = [['on', 'sc-neutral'], ['ok', 'sc-ok'], ['fail', 'sc-fail'], ['recover', 'sc-recover']];
  var STATE_LABEL = { neutral: '진행', ok: '정상', fail: '실패', recover: '복구' };

  function el(tag, cls, text) {
    var n = doc.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function list(v) { return Array.isArray(v) ? v : []; }

  function Scenario(fig, index) {
    var data;
    try { data = JSON.parse(fig.getAttribute('data-scenarios') || '[]'); } catch (e) { data = []; }
    var svg = fig.querySelector('svg');
    if (!svg || !Array.isArray(data)) return;
    data = data.filter(function (s) { return s && Array.isArray(s.steps) && s.steps.length; });
    if (!data.length) return;

    var uid = fig.id || ('scn' + (index + 1));
    if (!fig.id) fig.id = uid;
    var stepMs = parseInt(fig.getAttribute('data-step-ms'), 10) || 1400;

    // 캔버스
    var canvas = svg.parentNode;
    if (!canvas.classList || !canvas.classList.contains('dg__canvas')) {
      var wrap = el('div', 'dg__canvas');
      svg.parentNode.insertBefore(wrap, svg);
      wrap.appendChild(svg);
      canvas = wrap;
    }
    if (!svg.hasAttribute('role')) svg.setAttribute('role', 'img');
    var cap0 = fig.querySelector('figcaption');
    if (cap0 && !svg.hasAttribute('aria-labelledby') && !svg.hasAttribute('aria-label')) {
      if (!cap0.id) cap0.id = uid + '-cap';
      svg.setAttribute('aria-labelledby', cap0.id);
    }

    // 관리 대상 요소: 어느 단계에서든 id로 언급된 것
    var managed = {};
    data.forEach(function (sc) {
      sc.steps.forEach(function (st) {
        KINDS.forEach(function (k) {
          list(st[k[0]]).forEach(function (id) {
            if (!managed[id]) {
              var n = doc.getElementById(id);
              if (n && fig.contains(n)) managed[id] = n;
            }
          });
        });
      });
    });
    var scopedEls = Array.prototype.slice.call(svg.querySelectorAll('[data-scn]'));

    // 탭
    var tabs = [];
    var tabBar = null;
    if (data.length > 1) {
      tabBar = el('div', 'scn__tabs');
      tabBar.setAttribute('role', 'tablist');
      tabBar.setAttribute('aria-label', '시나리오');
      data.forEach(function (sc, i) {
        var b = el('button', 'scn__tab', sc.label || ('시나리오 ' + (i + 1)));
        b.type = 'button';
        b.setAttribute('role', 'tab');
        b.setAttribute('aria-controls', uid);
        b.id = uid + '-tab' + i;
        b.addEventListener('click', function () { selectScenario(i, true); });
        tabs.push(b);
        tabBar.appendChild(b);
      });
      canvas.parentNode.insertBefore(tabBar, canvas);
    }

    // 컨트롤 바
    var bar = el('div', 'dg__bar scn__bar');
    var ctl = el('div', 'scn__ctl');
    ctl.setAttribute('role', 'group');
    ctl.setAttribute('aria-label', '단계 조작');
    function mk(label) { var b = el('button', 'scn__btn', label); b.type = 'button'; b.setAttribute('aria-controls', uid); return b; }
    var bFirst = mk('처음'), bPrev = mk('이전'), bNext = mk('다음'), bPlay = mk('재생');
    bPlay.setAttribute('aria-pressed', 'false');
    [bFirst, bPrev, bNext, bPlay].forEach(function (b) { ctl.appendChild(b); });
    var count = el('span', 'dg__count');
    count.setAttribute('aria-hidden', 'true');
    var chip = el('span', 'scn__chip');
    chip.setAttribute('aria-hidden', 'true');
    bar.appendChild(ctl); bar.appendChild(count); bar.appendChild(chip);
    var prog = el('div', 'dg__progress');
    prog.setAttribute('aria-hidden', 'true');
    bar.appendChild(prog);
    canvas.parentNode.insertBefore(bar, canvas.nextSibling);

    // 캡션 (aria-live)
    var cap = el('div', 'scn__cap');
    cap.setAttribute('aria-live', 'polite');
    cap.setAttribute('aria-atomic', 'true');
    bar.parentNode.insertBefore(cap, bar.nextSibling);

    // 단계 목록 (정적으로 읽는 용도)
    var ol = el('ol', 'dg__steps scn__steps');
    ol.setAttribute('aria-label', '단계 목록');
    var det = el('details', 'scn__all');
    var sum = el('summary', null, '모든 단계 글로 보기');
    det.appendChild(sum); det.appendChild(ol);
    bar.parentNode.insertBefore(det, cap.nextSibling);
    var printMq = window.matchMedia ? window.matchMedia('print') : { matches: false };
    if (printMq.addEventListener) printMq.addEventListener('change', function (e) { if (e.matches) det.open = true; });

    var sIdx = 0, cur = 0, playing = false, timer = 0;
    var badges = [];
    var itemBtns = [];

    function capText(st) {
      var t = st.t;
      if (Array.isArray(t)) return t.join(' ');
      return t || '';
    }
    function stateOf(st) {
      if (list(st.recover).length) return 'recover';
      if (list(st.fail).length) return 'fail';
      if (list(st.ok).length) return 'ok';
      return 'neutral';
    }

    function buildBadges() {
      badges.forEach(function (b) { if (b.parentNode) b.parentNode.removeChild(b); });
      badges = [];
      var steps = data[sIdx].steps;
      var seen = {};
      steps.forEach(function (st, i) {
        KINDS.forEach(function (k) {
          list(st[k[0]]).forEach(function (id) {
            var n = managed[id];
            if (!n || seen[id] || n.getAttribute('data-scn-badge') === 'off') return;
            if (/-l\d+$/.test(id) || /^text$/i.test(n.tagName) || (n.tagName.toLowerCase() === 'g' && !n.querySelector('rect,path,line,circle,ellipse,polygon'))) return;
            seen[id] = true;
            var bb;
            try { bb = n.getBBox(); } catch (e) { return; }
            if (!bb || (!bb.width && !bb.height)) return;
            var isLine = /^(path|line|polyline)$/i.test(n.tagName);
            var cx = bb.x + 2, cy = bb.y + 2;
            if (isLine) {
              cx = bb.x + bb.width / 2; cy = bb.y + bb.height / 2;
              if (typeof n.getTotalLength === 'function') {
                try { var pt = n.getPointAtLength(n.getTotalLength() * 0.2); cx = pt.x; cy = pt.y; } catch (e2) { /* 무시 */ }
              }
            }
            var g = doc.createElementNS(NS, 'g');
            g.setAttribute('class', 'sc-badge');
            g.setAttribute('aria-hidden', 'true');
            var c = doc.createElementNS(NS, 'circle');
            c.setAttribute('cx', cx); c.setAttribute('cy', cy); c.setAttribute('r', 9);
            var t = doc.createElementNS(NS, 'text');
            t.setAttribute('x', cx); t.setAttribute('y', cy + 4); t.setAttribute('text-anchor', 'middle');
            t.textContent = String(i + 1);
            g.appendChild(c); g.appendChild(t);
            svg.appendChild(g);
            badges.push(g);
          });
        });
      });
    }

    function buildSteps() {
      var steps = data[sIdx].steps;
      ol.innerHTML = '';
      itemBtns = [];
      prog.innerHTML = '';
      steps.forEach(function (st, i) {
        var li = doc.createElement('li');
        var b = el('button', null, capText(st));
        b.type = 'button';
        b.addEventListener('click', function () { go(i); });
        li.appendChild(b); ol.appendChild(li);
        itemBtns.push(b);
        prog.appendChild(doc.createElement('span'));
      });
    }

    function render() {
      var sc = data[sIdx];
      var steps = sc.steps;
      var st = steps[cur];
      // 요소별 마지막으로 켜진 단계
      Object.keys(managed).forEach(function (id) {
        var n = managed[id];
        var last = -1, kind = '';
        for (var i = 0; i <= cur; i++) {
          KINDS.forEach(function (k) {
            if (list(steps[i][k[0]]).indexOf(id) >= 0) { last = i; kind = k[1]; }
          });
        }
        var inScenario = steps.some(function (s) {
          return KINDS.some(function (k) { return list(s[k[0]]).indexOf(id) >= 0; });
        });
        n.classList.remove('sc-neutral', 'sc-ok', 'sc-fail', 'sc-recover', 'sc-now', 'sc-past', 'sc-dim', 'sc-idle');
        if (!inScenario) { n.classList.add('sc-idle'); return; }
        if (last < 0) { n.classList.add('sc-dim'); return; }
        n.classList.add(kind);
        n.classList.add(last === cur ? 'sc-now' : 'sc-past');
      });
      scopedEls.forEach(function (n) {
        var ids = (n.getAttribute('data-scn') || '').split(/\s+/);
        n.classList.toggle('sc-hide', ids.indexOf(sc.id || ('s' + sIdx)) < 0 && ids.indexOf(String(sIdx)) < 0);
      });
      var state = stateOf(st);
      fig.setAttribute('data-state', state);
      chip.textContent = STATE_LABEL[state];
      chip.className = 'scn__chip scn__chip--' + state;
      count.innerHTML = '<b>' + (cur + 1) + '</b> / ' + steps.length;
      // 캡션: 배열이면 3문장 분리 표시
      cap.innerHTML = '';
      var t = st.t;
      if (Array.isArray(t)) {
        t.forEach(function (s) { cap.appendChild(el('span', 'scn__line', s)); });
      } else {
        cap.appendChild(el('span', 'scn__line', t || ''));
      }
      itemBtns.forEach(function (b, k) {
        if (k === cur) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current');
      });
      Array.prototype.forEach.call(prog.children, function (s, k) {
        s.className = k < cur ? 'done' : (k === cur ? 'cur' : '');
      });
      revealNow();
      bFirst.disabled = cur === 0;
      bPrev.disabled = cur === 0;
      bNext.disabled = cur === steps.length - 1;
    }

    function revealNow() {
      try {
        if (canvas.scrollWidth <= canvas.clientWidth + 2) return;
        var vb = svg.viewBox && svg.viewBox.baseVal;
        if (!vb || !vb.width) return;
        var k = svg.getBoundingClientRect().width / vb.width;
        var minX = Infinity, maxX = -Infinity;
        Object.keys(managed).forEach(function (id) {
          var n = managed[id];
          if (!n.classList.contains('sc-now')) return;
          var bb = n.getBBox();
          minX = Math.min(minX, bb.x); maxX = Math.max(maxX, bb.x + bb.width);
        });
        if (minX === Infinity) return;
        var l = minX * k, r = maxX * k, w = canvas.clientWidth, sl = canvas.scrollLeft;
        if (l < sl + 8 || r > sl + w - 8) {
          var target = (r - l) > w ? l - 8 : (l + r) / 2 - w / 2;
          canvas.scrollTo ? canvas.scrollTo({ left: Math.max(0, target), behavior: reduceMq.matches ? 'auto' : 'smooth' }) : (canvas.scrollLeft = Math.max(0, target));
        }
      } catch (e) { /* 무시 */ }
    }
    function stopTimer() { window.clearTimeout(timer); timer = 0; }
    function pause() {
      stopTimer();
      playing = false;
      fig.classList.remove('is-playing');
      bPlay.setAttribute('aria-pressed', 'false');
      bPlay.textContent = '재생';
    }
    function schedule() {
      stopTimer();
      var st = data[sIdx].steps[cur];
      var d = (st && +st.d) || stepMs;
      timer = window.setTimeout(function () {
        if (cur >= data[sIdx].steps.length - 1) { pause(); return; }
        cur += 1; render(); schedule();
      }, d);
    }
    function play() {
      if (reduceMq.matches) return;
      if (cur >= data[sIdx].steps.length - 1) { cur = 0; render(); }
      playing = true;
      fig.classList.add('is-playing');
      bPlay.setAttribute('aria-pressed', 'true');
      bPlay.textContent = '정지';
      schedule();
    }
    function go(i) {
      pause();
      var n = data[sIdx].steps.length;
      cur = Math.max(0, Math.min(n - 1, i));
      render();
    }
    function selectScenario(i, focusTab) {
      pause();
      sIdx = i; cur = 0;
      tabs.forEach(function (b, k) {
        b.setAttribute('aria-selected', k === i ? 'true' : 'false');
        b.tabIndex = k === i ? 0 : -1;
        b.classList.toggle('is-on', k === i);
      });
      if (focusTab && tabs[i]) tabs[i].focus();
      buildSteps();
      buildBadges();
      render();
    }
    function syncMotion() {
      var r = reduceMq.matches;
      fig.classList.toggle('is-static', r);
      bPlay.disabled = r;
      bPlay.title = r ? '동작 줄이기 설정이 켜져 있어 자동 재생을 쓰지 않습니다. 다음 버튼으로 진행하세요.' : '';
      if (r) { pause(); det.open = true; }
    }

    bFirst.addEventListener('click', function () { go(0); });
    bPrev.addEventListener('click', function () { go(cur - 1); });
    bNext.addEventListener('click', function () { go(cur + 1); });
    bPlay.addEventListener('click', function () { if (playing) pause(); else play(); });

    fig.addEventListener('keydown', function (e) {
      var tg = e.target;
      if (tg && /^(INPUT|TEXTAREA|SELECT)$/.test(tg.tagName)) return;
      var onTab = tg && tg.getAttribute && tg.getAttribute('role') === 'tab';
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        e.preventDefault();
        var dir = e.key === 'ArrowRight' ? 1 : -1;
        if (onTab) selectScenario((sIdx + dir + data.length) % data.length, true);
        else go(cur + dir);
      } else if (e.key === 'Home' && !onTab) { e.preventDefault(); go(0); }
      else if (e.key === 'End' && !onTab) { e.preventDefault(); go(data[sIdx].steps.length - 1); }
      else if (e.key === 'Escape') { pause(); }
    });
    doc.addEventListener('visibilitychange', function () { if (doc.hidden) pause(); });
    if (reduceMq.addEventListener) reduceMq.addEventListener('change', syncMotion);
    else if (reduceMq.addListener) reduceMq.addListener(syncMotion);

    syncMotion();
    selectScenario(0, false);
    fig.setAttribute('data-ready', 'true');
  }

  Array.prototype.slice.call(doc.querySelectorAll('figure.scn[data-scenarios]')).forEach(Scenario);
})();
