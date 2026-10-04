/* stockchild.com 투자도구 모음 랜딩페이지 셸 (sc-hub) v1.1 (2026-10-02): 카탈로그형
   왼쪽: 분류 탭 / 오른쪽: 검색 + 경로 + 분류 제목 + 도구 카드 목록 → 카드를 누르면 오른쪽 칸에 도구 표시
   주소: #분류아이디(예: #g2) 는 분류 목록, #도구아이디(예: #loss-recovery) 는 도구 화면
   v1.1: '페이지로 이동(link)' 카드를 진짜 링크(a href)로 그림: 검색엔진이 내부링크로 인식하고, 새 탭 열기도 됨 */
(function () {
  'use strict';
  var host = document.getElementById('sc-hub');
  if (!host || !window.SCTools) return;
  var T = window.SCTools, U = T.U, MF = window.SC_MANIFEST;
  var CFG = window.SC_HUB_CONFIG || {};
  T.ensureFont();

  var CSS = [
    '.hub{max-width:1240px;margin:0 auto;background:#fff;border:1px solid var(--line);border-radius:var(--r-lg);overflow:hidden}',
    '.top{background:var(--site);color:var(--site-ink);padding:28px 32px 26px;border-bottom:2px solid var(--site-ink)}',
    '.top .t{font-size:30px;font-weight:800;letter-spacing:-0.03em;line-height:1.25}',
    '.top .s{font-size:12px;font-weight:600;letter-spacing:.14em;color:rgba(34,34,34,.62);margin-top:6px}',
    '.lay{display:grid;grid-template-columns:250px minmax(0,1fr);align-items:start}',
    '.side{position:sticky;top:0;max-height:100vh;overflow-y:auto;background:#F8F9FA;border-right:1px solid var(--line);padding:22px 14px 28px;align-self:stretch}',
    '.side .lb{font-size:12px;font-weight:700;color:var(--sub);padding:0 10px 10px}',
    '.cat{width:100%;display:flex;justify-content:space-between;align-items:center;gap:8px;padding:11px 12px;margin-bottom:2px;border:0;background:none;border-radius:10px;font:inherit;font-size:14px;color:var(--ink);cursor:pointer;text-align:left}',
    '.cat:hover{background:#EEF0F3}',
    '.cat .c{flex:none;font-size:12px;font-weight:600;color:var(--muted)}',
    '.cat.on{background:var(--ink);color:#fff;font-weight:700}.cat.on .c{color:#B9BEC6}',
    '.main{padding:26px 30px 36px;min-height:640px}',
    '.srch .sc-input{height:50px}.srch input{text-align:left;font-size:16px;font-weight:500}',
    '.bar{display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;margin-top:18px}',
    '.bc{font-size:13px;color:var(--sub)}',
    '.bc a{color:var(--sub);text-decoration:none;cursor:pointer}.bc a:hover{color:var(--ink);text-decoration:underline}',
    '.bc .sep{margin:0 6px;color:var(--muted)}',
    '.flt{display:flex;gap:6px}.flt .sc-chip{padding:5px 11px;font-size:12px}',
    '.ctitle{font-size:26px;font-weight:800;letter-spacing:-0.02em;padding:6px 0 12px;margin-bottom:18px;border-bottom:2px solid var(--ink)}',
    '.cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:12px}',
    '.card{display:flex;flex-direction:column;gap:6px;min-height:104px;padding:18px 20px;border:1px solid var(--line);border-radius:14px;background:#fff;font:inherit;color:var(--ink);text-align:left;cursor:pointer;transition:border-color .15s,box-shadow .15s}',
    'a.card{text-decoration:none}.card:hover{border-color:var(--ink);box-shadow:0 4px 14px rgba(22,24,29,.06)}',
    '.card:focus-visible,.cat:focus-visible,.back:focus-visible{outline:2px solid var(--focus);outline-offset:2px}',
    '.card .nm{font-size:16px;font-weight:700;line-height:1.4}',
    '.card .ds{font-size:13px;color:var(--sub);line-height:1.5;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}',
    '.card .mt{display:flex;align-items:center;gap:6px;margin-top:auto;padding-top:4px;font-size:12px;color:var(--muted)}',
    '.tag{font-size:11px;font-weight:700;padding:2px 8px;border-radius:999px}',
    '.tag.ok{background:var(--ok-bg);color:var(--ok-tx)}.tag.soon{background:var(--soft);color:var(--muted)}.tag.link{background:#E8EFFE;color:#1F54C4}',
    '.acts{display:flex;gap:6px;flex-wrap:wrap}a.back{text-decoration:none}',
    '.card.soon .nm{color:#5F6670}',
    '.empty{padding:40px 10px;text-align:center;font-size:14px;color:var(--muted)}',
    '.back{display:inline-flex;align-items:center;gap:6px;height:36px;padding:0 14px;border:1px solid var(--line2);border-radius:999px;background:#fff;font:inherit;font-size:13px;font-weight:600;color:var(--ink);cursor:pointer}',
    '.back:hover{border-color:var(--ink)}',
    '.tool{margin-top:16px}',
    '@media (max-width:860px){.lay{grid-template-columns:1fr}',
    '.side{position:static;max-height:none;display:flex;gap:6px;overflow-x:auto;padding:12px 14px;border-right:0;border-bottom:1px solid var(--line);-webkit-overflow-scrolling:touch}',
    '.side .lb{display:none}.cat{flex:none;width:auto;margin:0;padding:8px 12px;border:1px solid var(--line);border-radius:999px;background:#fff;white-space:nowrap}',
    '.cat.on{border-color:var(--ink)}.main{padding:18px 16px 28px;min-height:0}.top{padding:20px 18px}.top .t{font-size:23px}}',
    '@media (max-width:560px){.cards{grid-template-columns:1fr}.ctitle{font-size:21px}.card{min-height:0}}'
  ].join('');

  var root = host.shadowRoot || host.attachShadow({ mode: 'open' });
  root.innerHTML = '<style>' + T.BASE_CSS + CSS + '</style>' +
    '<div class="sc hub"><div class="top"><div class="t">주소남 투자도구 모음</div><div class="s">STOCKCHILD.COM · INVESTOR TOOLKIT</div></div>' +
    '<div class="lay"><nav class="side" id="side" aria-label="도구 분류"></nav>' +
    '<div class="main"><div class="srch"><div class="sc-input"><input id="q" placeholder="도구 이름이나 궁금한 것으로 검색 (예: 본전, 배당, 세금)" autocomplete="off"></div></div>' +
    '<div id="view"></div></div></div></div>';

  var $ = function (s) { return root.querySelector(s); };
  var tools = MF.tools, byId = {}, gName = {};
  tools.forEach(function (t) { byId[t.id] = t; });
  MF.groups.forEach(function (g) { gName[g[0]] = g[1]; });

  var st = { cat: 'all', tool: null, onlyReady: CFG.onlyReadyDefault !== false };
  var LOADED = {};
  // 도구 파일을 필요할 때만 순서대로 불러오기 (이미 불러온 파일은 건너뜀)
  function loadScripts(list, done, fail) {
    var i = 0;
    (function next() {
      if (i >= list.length) { done(); return; }
      var src = MF.base + list[i++] + (MF.updated ? '?v=' + MF.updated : '');
      if (LOADED[src] || document.querySelector('script[src="' + src + '"]')) { next(); return; }
      var s = document.createElement('script'); s.src = src;
      s.onload = function () { LOADED[src] = true; next(); };
      s.onerror = fail;
      document.head.appendChild(s);
    })();
  }
  function noLabel(t) { return t.nos ? 'No.' + t.nos.join('·') : (t.no ? 'No.' + t.no : ''); }

  var RANK = { ready: 0, link: 1, soon: 2 };
  function visible(t) { return st.onlyReady ? t.status !== 'soon' : true; }
  function sortTools(a, b) { return RANK[a.status] - RANK[b.status] || a.no - b.no; }

  function renderSide() {
    var all = tools.filter(visible).length;
    var html = '<div class="lb">분류</div><button class="cat' + (st.cat === 'all' ? ' on' : '') + '" data-c="all"><span>전체</span><span class="c">' + all + '</span></button>';
    MF.groups.forEach(function (g) {
      var n = tools.filter(function (t) { return t.g === g[0] && visible(t); }).length;
      if (!n) return;
      html += '<button class="cat' + (st.cat === g[0] ? ' on' : '') + '" data-c="' + g[0] + '"><span>' + g[1] + '</span><span class="c">' + n + '</span></button>';
    });
    $('#side').innerHTML = html;
  }

  function crumb(parts) {
    return '<div class="bc">' + parts.map(function (p) { return p.go ? '<a data-go="' + p.go + '">' + p.t + '</a>' : '<span>' + p.t + '</span>'; }).join('<span class="sep">›</span>') + '</div>';
  }

  function renderList() {
    var q = $('#q').value.trim().toLowerCase();
    var list = tools.filter(function (t) {
      if (!visible(t)) return false;
      if (q) return (t.name + ' ' + t.desc + ' ' + (gName[t.g] || '')).toLowerCase().indexOf(q) !== -1;
      return st.cat === 'all' || t.g === st.cat;
    }).sort(sortTools);
    var title = q ? '“' + U.esc($('#q').value.trim()) + '” 검색 결과' : (st.cat === 'all' ? '전체 도구' : gName[st.cat]);
    var bc = q ? crumb([{ t: '전체 분류', go: 'all' }, { t: '검색 결과 (' + list.length + '개)' }])
      : crumb([{ t: '전체 분류', go: 'all' }].concat(st.cat === 'all' ? [] : [{ t: gName[st.cat] }]).concat([{ t: '도구 선택 (' + list.length + '개)' }]));
    var flt = '<div class="flt"><button class="sc-chip' + (!st.onlyReady ? ' on' : '') + '" data-f="all">전체 보기</button><button class="sc-chip' + (st.onlyReady ? ' on' : '') + '" data-f="ready">쓸 수 있는 도구만</button></div>';
    $('#view').innerHTML = '<div class="bar">' + bc + flt + '</div><div class="ctitle">' + title + '</div>' +
      (list.length ? '<div class="cards">' + list.map(function (t) {
        var tag = t.status === 'ready' ? '<span class="tag ok">바로 사용</span>' : (t.status === 'link' ? '<span class="tag link">페이지로 이동</span>' : '<span class="tag soon">준비 중</span>');
        var nl = noLabel(t);
        var isLink = t.status === 'link' && t.page;
        var open = isLink ? '<a class="card" href="' + U.esc(t.page) + '" data-id="' + t.id + '">' : '<button class="card' + (t.status === 'soon' ? ' soon' : '') + '" data-id="' + t.id + '">';
        return open + '<span class="nm">' + U.esc(t.name) + '</span><span class="ds">' + U.esc(t.desc) + '</span>' +
          '<span class="mt">' + tag + '<span>' + U.esc(gName[t.g] || '') + (nl ? ' · ' + nl : '') + '</span></span>' + (isLink ? '</a>' : '</button>');
      }).join('') + '</div>' : '<div class="empty">찾는 도구가 아직 없어요. 다른 말로 검색해 보세요.</div>');
  }

  function renderTool(t) {
    $('#view').innerHTML = '<div class="bar">' + crumb([{ t: '전체 분류', go: 'all' }, { t: gName[t.g], go: t.g }, { t: U.esc(t.name) }]) +
      '<span class="acts">' + (t.page ? '<a class="back" href="' + t.page + '">단독 페이지 ↗</a>' : '') + '<button class="back" data-go="' + t.g + '">‹ 목록으로</button></span></div><div class="tool" id="slot"></div>';
    var box = document.createElement('div');
    $('#slot').appendChild(box);
    if (t.status === 'ready') {
      if (T.has(t.id)) { T.mount(box, t.id); return; }
      box.innerHTML = '<div style="padding:40px 10px;text-align:center;color:#9AA0A8;font-size:14px">도구를 불러오는 중이에요...</div>';
      loadScripts(t.js || [], function () {
        if (st.tool !== t.id) return;
        box.innerHTML = '';
        if (!T.mount(box, t.id)) box.innerHTML = '<div style="padding:40px 10px;text-align:center;color:#9AA0A8;font-size:14px">도구를 불러오지 못했어요. 새로고침해 주세요.</div>';
      }, function () { box.innerHTML = '<div style="padding:40px 10px;text-align:center;color:#9AA0A8;font-size:14px">도구를 불러오지 못했어요. 새로고침해 주세요.</div>'; });
    } else {
      var r = box.attachShadow({ mode: 'open' });
      r.innerHTML = '<style>' + T.BASE_CSS + '</style><div class="sc"><div class="sc-card">' + U.header(gName[t.g], U.esc(t.name), U.esc(t.desc)) +
        '<div class="sc-sec"><div class="sc-note"><b>준비 중이에요.</b> ' + (t.no ? '로드맵 No.' + t.no + '로 ' : '') + '제작 예정이에요. 완성되면 이 자리에서 바로 쓸 수 있어요.</div></div></div></div>';
    }
  }

  function go(target, fromHash) {
    if (byId[target] && byId[target].status === 'link' && !fromHash) { location.href = byId[target].page; return; }
    if (byId[target] && byId[target].status === 'link') target = byId[target].g;
    if (byId[target]) { st.tool = target; st.cat = byId[target].g; }
    else { st.tool = null; st.cat = (target === 'all' || gName[target]) ? target : 'all'; }
    if (!fromHash) history.replaceState(null, '', '#' + (st.tool || st.cat));
    renderSide();
    if (st.tool) { $('#q').value = ''; renderTool(byId[st.tool]); } else renderList();
    var top = host.getBoundingClientRect().top;
    if (!fromHash && top < 0) host.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  $('#side').addEventListener('click', function (e) {
    var b = e.target.closest('.cat'); if (!b) return;
    $('#q').value = ''; go(b.dataset.c);
    var side = $('#side'); if (side.scrollWidth > side.clientWidth) b.scrollIntoView({ inline: 'center', block: 'nearest' });
  });
  $('#view').addEventListener('click', function (e) {
    var c = e.target.closest('.card'); if (c) { if (c.tagName === 'A') return; go(c.dataset.id); return; } // 링크 카드는 브라우저 기본 이동에 맡김
    var g = e.target.closest('[data-go]'); if (g) { $('#q').value = ''; go(g.dataset.go); return; }
    var f = e.target.closest('[data-f]'); if (f) { st.onlyReady = f.dataset.f === 'ready'; renderSide(); renderList(); }
  });
  $('#q').addEventListener('input', function () { if (st.tool) { st.tool = null; history.replaceState(null, '', '#all'); } st.cat = 'all'; renderSide(); renderList(); });
  window.addEventListener('hashchange', function () { go(location.hash.slice(1) || 'all', true); });

  go(location.hash.slice(1) || 'all', true);
})();
