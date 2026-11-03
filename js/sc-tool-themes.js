/* stockchild.com 테마주 검색기 (sc-tool-themes) v1.1 (2026-11-03)
   v1.1: 검색창 지우기 버튼이 두 개로 보이던 것 정리, 종목만 찾아지고 테마가 0개면 테마 칸 숨김
   id: theme-ledger   (예전 "테마 종목 원장"의 v2)
   필요 파일: sc-ui.js
   데이터: PC 테마 수집기(theme_builder.py)가 블로그 관련주 글에서 뽑아 GitHub에 올리는 파일
     themes-index.json        : 테마 목록 + 종목 코드·이름·업종 (먼저 읽음, 약 330KB)
     themes-cat-XXXXXXXX.json : 분류별 상세 (기업 개요 d, 편입 이유 w, 소분류 g). 테마를 열 때 그 분류만 읽음
   기능: 분류별 테마 보기 / 테마명 검색 / 종목명·코드 검색 → 그 종목이 속한 테마 전부 / 편입 이유 / 블로그 원문 이동 */
(function () {
  'use strict';

  // GitHub Pages 를 먼저 쓰고, 안 되면(새 파일 반영 지연 등) 원본 저장소 주소로 다시 시도
  var BASES = ['https://dooly870505-commits.github.io/stockchild-data/', 'https://raw.githubusercontent.com/dooly870505-commits/stockchild-data/main/'];
  var BASE = BASES[0];
  var PAGE = 24;

  function norm(s) { return String(s || '').toLowerCase().replace(/\s+/g, ''); }
  function fmtDate(d) { return d ? String(d).slice(0, 10).replace(/-/g, '.') : ''; }

  // 순수 함수 (테스트용으로 밖에 공개)
  function buildIndex(j) {
    if (!j || !Array.isArray(j.themes)) throw new Error('데이터 형식이 올바르지 않아요');
    var byCode = {};
    j.themes.forEach(function (t, i) {
      t._i = i;
      (t.stocks || []).forEach(function (s) {
        var e = byCode[s.c] || (byCode[s.c] = { c: s.c, n: s.n, m: s.m, themes: [] });
        e.themes.push(i);
      });
    });
    return { raw: j, themes: j.themes, cats: j.cats || [], byCode: byCode };
  }
  function searchThemes(I, q, cat) {
    var k = norm(q);
    return I.themes.filter(function (t) {
      if (cat && t.cat !== cat) return false;
      return !k || norm(t.name).indexOf(k) !== -1 || norm(t.title).indexOf(k) !== -1;
    }).sort(function (a, b) {   // 최근 수정한 글부터
      var ma = a.modified || a.date || '', mb = b.modified || b.date || '';
      return ma < mb ? 1 : ma > mb ? -1 : 0;
    });
  }
  function searchStocks(I, q) {
    var k = norm(q);
    if (!k) return [];
    var out = [];
    Object.keys(I.byCode).forEach(function (c) {
      var e = I.byCode[c];
      var n = norm(e.n);
      var score = c.toLowerCase() === k || n === k ? 0 : (n.indexOf(k) === 0 || c.toLowerCase().indexOf(k) === 0 ? 1 : (n.indexOf(k) !== -1 ? 2 : 9));
      if (score < 9) out.push({ e: e, s: score });
    });
    out.sort(function (a, b) { return a.s - b.s || b.e.themes.length - a.e.themes.length || (a.e.n < b.e.n ? -1 : 1); });
    return out.map(function (x) { return x.e; });
  }
  window.SCThemes = { buildIndex: buildIndex, searchThemes: searchThemes, searchStocks: searchStocks };

  var CSS = [
    '.th-search{display:flex;align-items:center;height:50px;padding:0 14px;border:1px solid var(--line2);border-radius:var(--r-sm);background:#fff}',
    '.th-search:focus-within{border-color:var(--ink);box-shadow:0 0 0 3px rgba(22,24,29,.08)}',
    '.th-search .ic{color:var(--muted);margin-right:8px}',
    '.th-search input{flex:1;min-width:0;border:0;outline:0;background:transparent;font:inherit;font-size:16px;color:var(--ink);-webkit-appearance:none;appearance:none}',
    '.th-search input::-webkit-search-cancel-button,.th-search input::-webkit-search-decoration{-webkit-appearance:none;display:none}',
    '.th-x{border:0;background:none;color:var(--muted);font-size:18px;cursor:pointer;padding:4px}',
    '.th-chips{display:flex;flex-wrap:wrap;gap:6px;margin-top:12px}',
    '.th-chips .sc-chip .n{color:var(--muted);margin-left:4px;font-weight:500}',
    '.th-chips .sc-chip.on .n{color:rgba(255,255,255,.7)}',
    '.th-h{display:flex;justify-content:space-between;align-items:baseline;gap:8px;margin:18px 0 8px}',
    '.th-h b{font-size:15px}',
    '.th-h span{font-size:12px;color:var(--sub)}',
    '.th-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:8px}',
    '.th-card{display:block;text-align:left;font:inherit;color:var(--ink);background:#fff;border:1px solid var(--line);border-radius:12px;padding:12px 14px;cursor:pointer}',
    '.th-card:hover{border-color:var(--ink)}',
    '.th-card .t{font-size:15px;font-weight:700;line-height:1.35}',
    '.th-card .m{font-size:12px;color:var(--sub);margin-top:6px}',
    '.th-card .p{font-size:12px;color:var(--muted);margin-top:6px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '.th-stock{display:flex;justify-content:space-between;align-items:center;gap:10px;width:100%;text-align:left;font:inherit;color:var(--ink);background:#fff;border:1px solid var(--line);border-radius:12px;padding:12px 14px;cursor:pointer;margin-bottom:6px}',
    '.th-stock:hover{border-color:var(--ink)}',
    '.th-stock .nm{font-size:15px;font-weight:700}',
    '.th-stock .cd{font-size:12px;color:var(--muted);margin-left:6px;font-variant-numeric:tabular-nums}',
    '.th-stock .cnt{font-size:12.5px;color:var(--brand);font-weight:700;white-space:nowrap}',
    '.th-back{border:0;background:none;font:inherit;font-size:14px;color:var(--sub);cursor:pointer;padding:0;margin-bottom:12px}',
    '.th-dh{display:flex;flex-wrap:wrap;justify-content:space-between;gap:10px;align-items:flex-start}',
    '.th-dt{font-size:20px;font-weight:800;line-height:1.3}',
    '.th-dm{font-size:13px;color:var(--sub);margin-top:4px}',
    '.th-link{display:inline-flex;align-items:center;gap:4px;height:38px;padding:0 14px;border-radius:999px;background:var(--ink);color:#fff;text-decoration:none;font-size:13.5px;font-weight:700;white-space:nowrap}',
    '.th-grp{font-size:13px;font-weight:800;color:var(--ink);margin:18px 0 8px;padding-left:8px;border-left:3px solid var(--brand)}',
    '.th-row{border:1px solid var(--line);border-radius:12px;padding:12px 14px;margin-bottom:8px;background:#fff}',
    '.th-row .top{display:flex;flex-wrap:wrap;align-items:baseline;gap:6px}',
    '.th-row .nm{font-size:15.5px;font-weight:800;cursor:pointer;text-decoration:underline;text-decoration-color:var(--line2);text-underline-offset:3px}',
    '.th-row .cd{font-size:12px;color:var(--muted);font-variant-numeric:tabular-nums}',
    '.th-row .sec{font-size:11.5px;color:var(--sub);background:var(--soft);border-radius:999px;padding:2px 8px}',
    '.th-row .lbl{font-size:11.5px;font-weight:700;color:var(--brand);margin-top:8px}',
    '.th-row .why{font-size:14px;line-height:1.6;margin-top:2px}',
    '.th-row .desc{font-size:13px;line-height:1.6;color:var(--sub);margin-top:2px}',
    '.th-row .more{border:0;background:none;font:inherit;font-size:12.5px;color:var(--focus);cursor:pointer;padding:0;margin-top:6px}',
    '.th-row .oth{display:flex;flex-wrap:wrap;gap:4px;margin-top:8px}',
    '.th-row .oth button{border:1px solid var(--line2);background:#fff;border-radius:999px;padding:3px 9px;font:inherit;font-size:12px;color:var(--sub);cursor:pointer}',
    '.th-row .oth button:hover{border-color:var(--ink);color:var(--ink)}',
    '.th-more{width:100%;margin-top:10px}',
    '.th-empty{padding:26px 16px;text-align:center;color:var(--muted);font-size:14px;border:1px dashed var(--line2);border-radius:12px}',
    '.th-skel{height:160px;border-radius:12px;background:linear-gradient(90deg,var(--soft),#fafbfc,var(--soft));background-size:200% 100%;animation:th-sh 1.2s infinite}',
    '@keyframes th-sh{0%{background-position:200% 0}100%{background-position:-200% 0}}',
    '#kpis{grid-template-columns:2fr 1fr 1fr}',
    '.th-row .ol{font-size:11.5px;color:var(--muted);margin-top:10px}',
    '@media (max-width:640px){#kpis{grid-template-columns:1fr 1fr}#kpis .sc-kpi.main{grid-column:1/-1}}',
    '@media (max-width:480px){.th-grid{grid-template-columns:1fr}.th-dt{font-size:18px}.th-link{width:100%;justify-content:center}}'
  ].join('');

  function render(wrap, U) {
    var I = null, catData = {}, st = { view: 'list', q: '', cat: '', shown: PAGE, theme: null, code: null };

    wrap.innerHTML =
      '<div class="sc-card">' +
      U.header('테마주', '주소남 테마주 검색기', '테마 이름으로 찾거나, 종목명·종목코드를 넣으면 그 종목이 들어 있는 테마를 모두 보여드려요.') +
      '<div class="sc-sec"><div class="sc-kpis" id="kpis">' + U.kpi('정리된 테마', '-', '불러오는 중', true) + U.kpi('담긴 종목', '-', '') + U.kpi('마지막 갱신', '-', '') + '</div></div>' +
      '<div class="sc-sec" id="body"><div class="th-skel"></div></div>' +
      '<div class="sc-sec"><div class="sc-note">종목과 편입 이유는 stockchild.com 테마주 총정리 글에서 자동으로 모은 것이에요. 새 글이나 수정된 글은 매일 저녁 반영돼요. 자세한 내용과 최신 흐름은 "블로그 원문 보기"에서 확인해 주세요.<br><b>테마에 포함됐다고 주가가 함께 움직인다는 보장은 없어요.</b> 투자 판단은 본인 책임입니다.</div></div>' +
      '<div class="sc-foot">출처: stockchild.com 테마주 총정리 글 모음. 투자 참고용이며 매수/매도 추천이 아닙니다. | stockchild.com</div>' +
      '</div>';
    var $ = function (id) { return wrap.querySelector('#' + id); };
    var body = $('body');

    function loadCat(cat, cb) {
      if (catData[cat]) { cb(catData[cat]); return; }
      var c = I.cats.filter(function (x) { return x.name === cat; })[0];
      if (!c) { cb(null); return; }
      fetch(BASE + c.file, { cache: 'no-cache' }).then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
        .then(function (j) {
          var m = {};
          (j.themes || []).forEach(function (t) { m[t.id] = t; });
          catData[cat] = m; cb(m);
        }).catch(function () { cb(null); });
    }

    function searchBox() {
      return '<label class="th-search"><span class="ic">🔍</span><input id="q" type="search" placeholder="테마명, 종목명 또는 종목코드 (예: 로봇, 한미반도체, 042700)" autocomplete="off" value="' + U.esc(st.q) + '">' +
        (st.q ? '<button type="button" class="th-x" data-act="clear" aria-label="지우기">✕</button>' : '') + '</label>';
    }
    function catChips() {
      var h = '<div class="th-chips"><button type="button" class="sc-chip' + (!st.cat ? ' on' : '') + '" data-cat="">전체<span class="n">' + I.themes.length + '</span></button>';
      I.cats.forEach(function (c) {
        h += '<button type="button" class="sc-chip' + (st.cat === c.name ? ' on' : '') + '" data-cat="' + U.esc(c.name) + '">' + U.esc(c.name) + '<span class="n">' + c.count + '</span></button>';
      });
      return h + '</div>';
    }
    function themeCard(t) {
      var preview = (t.stocks || []).slice(0, 4).map(function (s) { return s.n; }).join(', ');
      return '<button type="button" class="th-card" data-theme="' + t._i + '"><div class="t">' + U.esc(t.name) + '</div>' +
        '<div class="m">' + U.esc(t.cat) + ' · ' + (t.stocks || []).length + '종목' + (t.modified ? ' · ' + fmtDate(t.modified) : '') + '</div>' +
        '<div class="p">' + U.esc(preview) + '</div></button>';
    }
    function stockRow(e) {
      return '<button type="button" class="th-stock" data-code="' + U.esc(e.c) + '"><span><span class="nm">' + U.esc(e.n) + '</span><span class="cd">' + U.esc(e.c) + (e.m === 'US' ? ' · 미국' : '') + '</span></span>' +
        '<span class="cnt">테마 ' + e.themes.length + '개 ›</span></button>';
    }

    function drawList() {
      var themes = searchThemes(I, st.q, st.cat);
      var stocks = st.q ? searchStocks(I, st.q).slice(0, 12) : [];
      var h = searchBox() + catChips();
      if (stocks.length) {
        h += '<div class="th-h"><b>종목 ' + stocks.length + (stocks.length === 12 ? '+' : '') + '</b><span>누르면 이 종목이 속한 테마가 나와요</span></div>';
        h += stocks.map(stockRow).join('');
      }
      if (themes.length || !stocks.length) h += '<div class="th-h"><b>' + (st.cat ? U.esc(st.cat) + ' ' : '') + '테마 ' + themes.length + '개</b><span>' + (st.q ? '"' + U.esc(st.q) + '" 검색 · ' : '') + '최근 수정순' + '</span></div>';
      if (!themes.length && !stocks.length) {
        h += '<div class="th-empty">찾는 테마나 종목이 없어요. 다른 이름이나 6자리 종목코드로 검색해 보세요.</div>';
      } else if (themes.length) {
        h += '<div class="th-grid">' + themes.slice(0, st.shown).map(themeCard).join('') + '</div>';
        if (themes.length > st.shown) h += '<button type="button" class="sc-btn ghost th-more" data-act="more">' + Math.min(PAGE, themes.length - st.shown) + '개 더 보기 <span style="color:var(--muted);margin-left:6px">' + st.shown + ' / ' + themes.length + '</span></button>';
      }
      body.innerHTML = h;
      bindSearch();
    }

    function drawTheme() {
      var t = I.themes[st.theme];
      body.innerHTML = '<button type="button" class="th-back" data-act="back">‹ 목록으로</button>' +
        '<div class="th-dh"><div><div class="th-dt">' + U.esc(t.name) + '</div><div class="th-dm">' + U.esc(t.cat) + ' · ' + t.stocks.length + '종목' + (t.modified ? ' · 수정 ' + fmtDate(t.modified) : '') + '</div></div>' +
        '<a class="th-link" href="' + U.esc(t.url) + '" target="_blank" rel="noopener">블로그 원문 보기 ↗</a></div>' +
        '<div id="rows" style="margin-top:14px"><div class="th-skel"></div></div>';
      loadCat(t.cat, function (m) {
        var full = (m && m[t.id]) || t;
        var stocks = full.stocks || [];
        var h = '', lastG = null;
        stocks.forEach(function (s, i) {
          if (s.g && s.g !== lastG) { h += '<div class="th-grp">' + U.esc(s.g) + '</div>'; lastG = s.g; }
          var others = ((I.byCode[s.c] || {}).themes || []).filter(function (x) { return x !== t._i; });
          h += '<div class="th-row"><div class="top"><span class="nm" data-code="' + U.esc(s.c) + '">' + U.esc(s.n) + '</span><span class="cd">' + U.esc(s.c) + '</span>' + (s.s ? '<span class="sec">' + U.esc(s.s) + '</span>' : '') + '</div>' +
            (s.w ? '<div class="lbl">편입 이유</div><div class="why">' + U.esc(s.w) + '</div>' : '') +
            (s.d ? (s.w ? '<button type="button" class="more" data-desc="' + i + '">기업 개요 보기 ▾</button><div class="desc" id="d' + i + '" hidden>' + U.esc(s.d) + '</div>'
                        : '<div class="lbl">기업 개요</div><div class="desc">' + U.esc(s.d) + '</div>') : '') +
            (others.length ? '<div class="ol">함께 속한 테마</div><div class="oth">' + others.slice(0, 6).map(function (x) { return '<button type="button" data-theme="' + x + '">' + U.esc(I.themes[x].name) + '</button>'; }).join('') + (others.length > 6 ? '<button type="button" data-code="' + U.esc(s.c) + '">+' + (others.length - 6) + '</button>' : '') + '</div>' : '') +
            '</div>';
        });
        if (!m) h = '<div class="sc-note warn">상세 내용을 불러오지 못해 종목 이름만 보여드려요.</div>' + h;
        $('rows').innerHTML = h || '<div class="th-empty">종목 정보가 없어요.</div>';
      });
    }

    function drawStock() {
      var e = I.byCode[st.code];
      if (!e) { st.view = 'list'; drawList(); return; }
      var ts = e.themes.map(function (x) { return I.themes[x]; });
      body.innerHTML = '<button type="button" class="th-back" data-act="back">‹ 목록으로</button>' +
        '<div class="th-dt">' + U.esc(e.n) + ' <span style="font-size:14px;color:var(--muted);font-weight:500">' + U.esc(e.c) + '</span></div>' +
        '<div class="th-dm">테마 ' + ts.length + '개에 들어 있어요</div><div id="rows" style="margin-top:14px"><div class="th-skel"></div></div>';
      var cats = {};
      ts.forEach(function (t) { cats[t.cat] = 1; });
      var left = Object.keys(cats).length;
      Object.keys(cats).forEach(function (c) {
        loadCat(c, function () {
          if (--left > 0) return;
          var h = '';
          ts.forEach(function (t) {
            var full = (catData[t.cat] && catData[t.cat][t.id]) || t;
            var s = (full.stocks || []).filter(function (x) { return x.c === e.c; })[0] || {};
            h += '<div class="th-row"><div class="top"><span class="nm" data-theme="' + t._i + '">' + U.esc(t.name) + '</span><span class="sec">' + U.esc(t.cat) + '</span></div>' +
              (s.w ? '<div class="lbl">이 테마에 들어간 이유</div><div class="why">' + U.esc(s.w) + '</div>' : (s.d ? '<div class="desc">' + U.esc(s.d) + '</div>' : '')) +
              '<div class="oth"><button type="button" data-theme="' + t._i + '">테마 전체 보기 ›</button><button type="button" data-url="' + U.esc(t.url) + '">블로그 원문 ↗</button></div></div>';
          });
          $('rows').innerHTML = h;
        });
      });
    }

    function draw() { if (st.view === 'theme') drawTheme(); else if (st.view === 'stock') drawStock(); else drawList(); }

    var timer = null;
    function bindSearch() {
      var q = $('q');
      if (!q) return;
      q.addEventListener('input', function () {
        clearTimeout(timer);
        var v = q.value;
        timer = setTimeout(function () {
          st.q = v; st.shown = PAGE;
          var pos = v.length;
          drawList();
          var nq = $('q'); if (nq) { nq.focus(); try { nq.setSelectionRange(pos, pos); } catch (e2) {} }
        }, 180);
      });
    }

    wrap.addEventListener('click', function (ev) {
      var t = ev.target.closest('[data-act],[data-cat],[data-desc],[data-url],[data-theme],[data-code],a');
      if (!t || !I) return;
      if (t.tagName === 'A') return;
      var act = t.getAttribute('data-act');
      if (act === 'more') { st.shown += PAGE; drawList(); return; }
      if (act === 'clear') { st.q = ''; st.shown = PAGE; drawList(); return; }
      if (act === 'back') { st.view = 'list'; drawList(); wrap.scrollIntoView({ block: 'start', behavior: 'smooth' }); return; }
      if (t.hasAttribute('data-cat')) { st.cat = t.getAttribute('data-cat'); st.shown = PAGE; drawList(); return; }
      if (t.hasAttribute('data-desc')) {
        var d = wrap.querySelector('#d' + t.getAttribute('data-desc'));
        if (d) { d.hidden = !d.hidden; t.textContent = d.hidden ? '기업 개요 보기 ▾' : '기업 개요 접기 ▴'; }
        return;
      }
      if (t.hasAttribute('data-url')) { window.open(t.getAttribute('data-url'), '_blank', 'noopener'); return; }
      if (t.hasAttribute('data-theme')) { st.view = 'theme'; st.theme = +t.getAttribute('data-theme'); draw(); wrap.scrollIntoView({ block: 'start', behavior: 'smooth' }); return; }
      if (t.hasAttribute('data-code')) { st.view = 'stock'; st.code = t.getAttribute('data-code'); draw(); wrap.scrollIntoView({ block: 'start', behavior: 'smooth' }); return; }
    });

    function load(retry) {
      BASE = BASES[retry ? 1 : 0];
      fetch(BASE + 'themes-index.json', { cache: 'no-cache' }).then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
        .then(function (j) {
          I = buildIndex(j);
          $('kpis').innerHTML = U.kpi('정리된 테마', I.themes.length.toLocaleString('ko-KR') + '개', I.cats.length + '개 분류', true) +
            U.kpi('담긴 종목', Object.keys(I.byCode).length.toLocaleString('ko-KR') + '개', '중복 제외') +
            U.kpi('마지막 갱신', U.esc(String(j.updated || '').slice(5, 10).replace('-', '.')), '매일 저녁 갱신');
          drawList();
        })
        .catch(function (err) {
          if (!retry) { load(true); return; }
          body.innerHTML = '<div class="sc-note warn">테마 목록을 불러오지 못했어요. 잠시 후 새로고침해 주세요.<br><span style="font-size:12px">' + U.esc(String(err && err.message || err)) + '</span></div>';
        });
    }
    load(false);
  }

  function reg() { window.SCTools.register({ id: 'theme-ledger', css: CSS, render: render }); }
  if (window.SCTools) reg(); else document.addEventListener('DOMContentLoaded', function () { if (window.SCTools) reg(); });
})();
