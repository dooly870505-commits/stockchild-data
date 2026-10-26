/* stockchild.com 내 종목 공시 레이더 (sc-tool-radar) v1.0 (2026-10-22)
   id: disclosure-radar
   필요 파일: sc-ui.js
   데이터 (서버 수정 없음, 기존 stock-radar-widget.js v8 과 같은 주소)
   - 색인: stock-radar-idx.json { meta, tags[5], grades[5],
       corps:[[code, name, mkt, 기재정정, 최대주주변경, 국민연금, 상호변경, 감자, 최근일YYYYMMDD, 지수, 등급]],
       feed:[[code, YYYYMMDD, tag, 공시명, 종목명, 건수, 정형여부]] }
   - 구조 이력: stock-radar-evt.json { dict[], ev:{ code:[[YYMMDD, tag, dictIdx, 건수?, 정형?]] } }  (첫 사용 때만 불러옴)
   - 전체 공시: 허브 ?tool=fullfeed&code=..(&full=1)  { names[], filers[], rows:[[YYMMDD, nameIdx, filerIdx, flags(1 정정, 2 지분)]] }
   - 관심종목은 방문자 브라우저 localStorage 'stockchild_radar_watch' (기존 위젯과 같은 키, 바꾸면 기존 관심종목이 사라짐) */
(function () {
  'use strict';

  var WEBAPP = 'https://script.google.com/macros/s/AKfycbx3rYebPAr6ReE4UoBivkKGRiCZIg_wukexmykPRxpMKriSvYDnYrmJblyvEAZPzZ7I/exec';
  var BASE = 'https://dooly870505-commits.github.io/stockchild-data/';
  var IDX_URL = BASE + 'stock-radar-idx.json';
  var EVT_URL = BASE + 'stock-radar-evt.json';
  var LS_KEY = 'stockchild_radar_watch';
  var PREVIEW = 3, RANK_N = 40, FEED_N = 160;
  var TAG_ICON = ['📝', '👤', '🏛️', '🔤', '✂️'];
  var WD = ['일', '월', '화', '수', '목', '금', '토'];

  // ---------- 도우미 ----------
  function digits(v) { return String(v == null ? '' : v).replace(/[^0-9]/g, ''); }
  function y8(v) { var s = digits(v); if (s.length === 6) s = '20' + s; return s.length >= 8 ? s.slice(0, 8) : ''; }
  function utc(y) { return Date.UTC(+y.slice(0, 4), +y.slice(4, 6) - 1, +y.slice(6, 8)); }
  function kstToday() {
    var s = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
    return digits(s).slice(0, 8);
  }
  function fmtFull(y) { return y ? y.slice(0, 4) + '.' + y.slice(4, 6) + '.' + y.slice(6, 8) : '-'; }
  function fmtFullWd(y) { return y ? fmtFull(y) + '(' + WD[new Date(utc(y)).getUTCDay()] + ')' : ''; }
  function agoTxt(y, today) {
    if (!y) return '';
    var n = Math.round((utc(today) - utc(y)) / 86400000);
    if (n <= 0) return '오늘';
    if (n === 1) return '어제';
    if (n < 30) return n + '일 전';
    if (n < 365) return Math.floor(n / 30) + '개월 전';
    return Math.floor(n / 365) + '년 전';
  }
  function num(v) { var n = Number(v); return isFinite(n) ? n : 0; }

  function getWatch() {
    try { var v = window.localStorage.getItem(LS_KEY); var a = v ? JSON.parse(v) : []; return Array.isArray(a) ? a.map(String) : []; }
    catch (e) { return []; }
  }
  function setWatch(a) { try { window.localStorage.setItem(LS_KEY, JSON.stringify(a)); } catch (e) {} }

  // ---------- 정제 ----------
  function normIdx(j) {
    if (!j || typeof j !== 'object' || !Array.isArray(j.corps)) throw new Error('데이터 형식이 올바르지 않아요');
    var tags = Array.isArray(j.tags) && j.tags.length >= 5 ? j.tags.map(String) : ['기재정정', '최대주주변경', '국민연금', '상호변경', '감자'];
    var grades = Array.isArray(j.grades) && j.grades.length >= 5 ? j.grades.map(String) : ['조용한 편', '보통', '잦은 편', '매우 잦음', '공시 폭풍'];
    var corps = [], map = {};
    j.corps.forEach(function (c) {
      if (!Array.isArray(c) || c.length < 11 || !c[0] || !c[1]) return;
      var o = {
        code: String(c[0]).toUpperCase(), name: String(c[1]).replace(/^\s*(주식회사|㈜|\(주\))\s*/, '').trim(), mkt: String(c[2] || ''),
        cnt: [num(c[3]), num(c[4]), num(c[5]), num(c[6]), num(c[7])], last: y8(c[8]), score: num(c[9]),
        grade: Math.max(0, Math.min(4, Math.round(num(c[10]))))
      };
      o.total = o.cnt.reduce(function (a, b) { return a + b; }, 0);
      corps.push(o); map[o.code] = o;
    });
    var feed = (Array.isArray(j.feed) ? j.feed : []).map(function (f) {
      if (!Array.isArray(f) || !f[0]) return null;
      return { code: String(f[0]).toUpperCase(), d: y8(f[1]), tag: Math.max(0, Math.min(4, Math.round(num(f[2])))), title: String(f[3] || ''), name: String(f[4] || ''), n: num(f[5]) || 1, routine: !!f[6] };
    }).filter(function (f) { return f && f.d; });
    var m = j.meta || {};
    return { tags: tags, grades: grades, corps: corps, map: map, feed: feed,
      meta: { total: num(m.total), corps: num(m.corps) || corps.length, from: y8(m.from), to: y8(m.to), gen: String(m.gen || '') } };
  }

  function evtRows(EVT, code) {
    if (!EVT || !EVT.ev || !Array.isArray(EVT.ev[code])) return [];
    return EVT.ev[code].map(function (r) {
      return { d: y8(r[0]), t: Math.max(0, Math.min(4, num(r[1]))), x: r[2] >= 0 && EVT.dict ? String(EVT.dict[r[2]] || '') : '', n: r.length > 3 ? num(r[3]) || 1 : 1, rt: r.length > 4 ? !!r[4] : false };
    }).filter(function (r) { return r.d; });
  }

  function ffRows(j) {
    if (!j || !Array.isArray(j.rows)) return [];
    return j.rows.map(function (r) {
      return { d: y8(r[0]), name: j.names ? String(j.names[r[1]] || '') : '', filer: r[2] >= 0 && j.filers ? String(j.filers[r[2]] || '') : '', fix: !!(num(r[3]) & 1), dim: !!(num(r[3]) & 2) };
    }).filter(function (r) { return r.d && r.name; });
  }

  function searchCorps(D, q, n) {
    q = String(q || '').trim().toUpperCase();
    if (!q) return [];
    var starts = [], has = [];
    for (var i = 0; i < D.corps.length; i++) {
      var c = D.corps[i], nm = c.name.toUpperCase();
      if (c.code === q || nm.indexOf(q) === 0) starts.push(c);
      else if (nm.indexOf(q) !== -1 || c.code.indexOf(q) !== -1) has.push(c);
      if (starts.length >= n) break;
    }
    return starts.concat(has).slice(0, n);
  }

  function rank(D, mkt) {
    return D.corps.filter(function (c) { return mkt === 'all' || c.mkt === mkt; })
      .sort(function (a, b) { return b.score - a.score || b.total - a.total; }).slice(0, RANK_N);
  }

  window.SCRadar = { normIdx: normIdx, evtRows: evtRows, ffRows: ffRows, searchCorps: searchCorps, rank: rank, y8: y8 };

  // ---------- 화면 ----------
  var CSS = [
    '.rd-srch{position:relative}',
    '.rd-search{display:flex;align-items:center;height:48px;padding:0 14px;border:1px solid var(--line2);border-radius:var(--r-sm);background:#fff;transition:border-color .15s,box-shadow .15s}',
    '.rd-search:focus-within{border-color:var(--ink);box-shadow:0 0 0 3px rgba(22,24,29,.08)}',
    '.rd-search .ic{color:var(--muted);margin-right:8px;font-size:15px}',
    '.rd-search input{flex:1;min-width:0;border:0;outline:0;background:transparent;font:inherit;font-size:16px;color:var(--ink)}',
    '.rd-search input::placeholder{color:var(--muted)}',
    '.rd-ac{position:absolute;top:calc(100% + 4px);left:0;right:0;background:#fff;border:1px solid var(--line2);border-radius:var(--r-sm);max-height:280px;overflow-y:auto;z-index:20;display:none;box-shadow:0 8px 24px rgba(22,24,29,.10)}',
    '.rd-ac button{display:flex;justify-content:space-between;gap:10px;width:100%;text-align:left;border:0;border-bottom:1px solid var(--line);background:#fff;font:inherit;font-size:14px;color:var(--ink);padding:11px 14px;cursor:pointer}',
    '.rd-ac button:last-child{border-bottom:0}',
    '.rd-ac button:hover,.rd-ac button:focus-visible{background:var(--soft);outline:none}',
    '.rd-ac .c{font-size:12px;color:var(--muted);white-space:nowrap}',
    '.rd-ac .none{padding:12px 14px;font-size:13px;color:var(--muted)}',
    '.rd-tabs{display:flex;flex-wrap:wrap;gap:6px}',
    '.rd-sub{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px}',
    '.sc-chip .c{margin-left:5px;opacity:.55;font-weight:700}',
    '.rd-list{display:grid;gap:8px;margin-top:12px}',
    '.rd-card{padding:14px 16px;border:1px solid var(--line);border-radius:var(--r-md);background:#fff}',
    '.rd-card.sel{border-color:var(--ink)}',
    '.rd-hd{display:flex;justify-content:space-between;align-items:flex-start;gap:12px}',
    '.rd-l{flex:1;min-width:0;display:flex;gap:10px}',
    '.rd-rk{flex:none;width:24px;font-size:14px;font-weight:700;color:var(--muted);padding-top:1px}',
    '.rd-nm{font-size:15px;font-weight:700;display:flex;align-items:center;flex-wrap:wrap;gap:6px}',
    '.rd-tag{flex:none;font-size:11px;font-weight:600;color:var(--sub);background:var(--soft);border-radius:6px;padding:2px 6px}',
    '.rd-meta{font-size:12.5px;color:var(--sub);margin-top:4px}',
    '.rd-gr{flex:none;font-size:12px;font-weight:700;border-radius:999px;padding:4px 10px;background:var(--soft);color:var(--sub);white-space:nowrap}',
    '.rd-gr.g2{background:#FFF4D6;color:#8A6100}',
    '.rd-gr.g3{background:var(--brand-bg);color:var(--brand)}',
    '.rd-gr.g4{background:var(--brand);color:#fff}',
    '.rd-cnts{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px}',
    '.rd-cnt{font-size:12px;color:var(--ink);border:1px solid var(--line);border-radius:8px;padding:3px 8px;background:#fff}',
    '.rd-cnt b{margin-left:3px}',
    '.rd-modes{display:flex;gap:6px;margin-top:12px;flex-wrap:wrap;align-items:center}',
    '.rd-wbtn{margin-left:auto;border:1px solid var(--line2);background:#fff;font:inherit;font-size:13px;font-weight:600;color:var(--ink);border-radius:999px;padding:6px 12px;cursor:pointer}',
    '.rd-wbtn.on{border-color:var(--brand);color:var(--brand)}',
    '.rd-wbtn:focus-visible{outline:2px solid var(--focus);outline-offset:2px}',
    '.rd-body{margin-top:10px;border-top:1px solid var(--line);padding-top:8px}',
    '.rd-bh{display:flex;justify-content:space-between;align-items:center;gap:8px;font-size:12px;color:var(--sub);margin:2px 0 4px}',
    '.rd-tog{border:1px solid var(--line2);background:#fff;font:inherit;font-size:12px;color:var(--sub);border-radius:999px;padding:3px 10px;cursor:pointer}',
    '.rd-tog.on{background:var(--ink);border-color:var(--ink);color:#fff}',
    '.rd-it{display:flex;gap:10px;padding:8px 0;font-size:13.5px;line-height:1.5}',
    '.rd-it+.rd-it{border-top:1px solid var(--line)}',
    '.rd-it.dim{opacity:.55}',
    '.rd-d{flex:none;width:78px;font-size:12px;color:var(--sub);padding-top:1px;font-variant-numeric:tabular-nums}',
    '.rd-x{flex:1;min-width:0;word-break:keep-all;overflow-wrap:anywhere}',
    '.rd-pill{display:inline-block;font-size:11px;font-weight:700;color:var(--sub);background:var(--soft);border-radius:6px;padding:1px 6px;margin-right:6px;vertical-align:1px}',
    '.rd-fix{color:var(--brand);font-weight:700;font-size:12px;margin-right:4px}',
    '.rd-small{font-size:12px;color:var(--muted);margin-left:5px}',
    '.rd-scroll{max-height:420px;overflow-y:auto;-webkit-overflow-scrolling:touch}',
    '.rd-more{width:100%;margin-top:8px}',
    '.rd-load{padding:14px 0;text-align:center;font-size:13px;color:var(--muted);line-height:1.6}',
    '.rd-day{font-size:12px;font-weight:700;color:var(--sub);margin:16px 0 6px}',
    '.rd-day:first-child{margin-top:4px}',
    '.rd-fd{display:block;width:100%;text-align:left;border:1px solid var(--line);border-radius:var(--r-sm);background:#fff;font:inherit;font-size:14px;color:var(--ink);padding:10px 12px;margin-bottom:6px;cursor:pointer;line-height:1.5}',
    '.rd-fd:hover{border-color:var(--line2)}',
    '.rd-fd.dim{opacity:.55}',
    '.rd-empty{padding:28px 16px;text-align:center;color:var(--muted);font-size:14px;line-height:1.7;border:1px dashed var(--line2);border-radius:var(--r-md)}',
    '.rd-skel{height:96px;border-radius:var(--r-md);background:linear-gradient(90deg,var(--soft),#fafbfc,var(--soft));background-size:200% 100%;animation:rd-sh 1.2s infinite}',
    '@keyframes rd-sh{0%{background-position:200% 0}100%{background-position:-200% 0}}',
    '#kpis{grid-template-columns:2fr 1fr 1fr}',
    '@media (max-width:640px){#kpis{grid-template-columns:1fr 1fr}#kpis .sc-kpi.main{grid-column:1/-1}}',
    '@media (max-width:480px){.rd-card{padding:12px 14px}.rd-d{width:68px;font-size:11.5px}.rd-it{font-size:13px}.rd-wbtn{margin-left:0}}'
  ].join('');

  function render(wrap, U) {
    var today = kstToday();
    var D = null, EVT = null, evtLoading = false;
    var st = { tab: 'watch', mkt: '코스닥', hideRoutine: true, sel: null };
    var open = {}, mode = {}, ffOn = {}, ffCache = {}, ffLoading = {};

    wrap.innerHTML =
      '<div class="sc-card">' +
      U.header('공시·기업 이력', '내 종목 공시 레이더', '관심 종목의 지배구조·자본구조 변동 공시와 최근 공시를 한곳에서 확인해요.') +
      '<div class="sc-sec"><div class="sc-kpis" id="kpis">' + U.kpi('최근 공시', '-', '불러오는 중', true) + U.kpi('내 관심종목', '-', '') + U.kpi('공시 폭풍 등급', '-', '') + '</div></div>' +
      '<div class="sc-sec"><div class="rd-srch"><label class="rd-search"><span class="ic">🔍</span><input id="q" type="search" placeholder="종목명 또는 종목코드 검색" autocomplete="off"></label><div class="rd-ac" id="ac"></div></div>' +
      '<div id="selBox"></div></div>' +
      '<div class="sc-sec"><div class="rd-tabs" id="tabs"></div><div id="body"><div class="rd-list"><div class="rd-skel"></div><div class="rd-skel"></div></div></div></div>' +
      '<div class="sc-sec"><div class="sc-note"><b>구조 이력</b>은 기재정정·최대주주변경·국민연금 지분변동·상호변경·감자 5종을 2016년부터 모은 기록이고, <b>전체 공시</b>는 최근 2년치를 DART에서 실시간으로 불러와요. 전체 공시에서 임원 소유상황보고 같은 지분공시는 기본으로 빼두었고, 버튼으로 켤 수 있어요.<br>' +
      '이벤트 지수와 등급은 공시가 얼마나 자주 나왔는지를 센 숫자일 뿐, <b>기업의 가치나 부실 여부를 판단하지 않아요.</b> 관심종목은 이 기기의 브라우저에만 저장돼요.</div></div>' +
      '<div class="sc-foot" id="foot">출처: 금융감독원 전자공시시스템(DART). 투자 참고용이며 매수/매도 추천이 아닙니다. | stockchild.com</div>' +
      '</div>';

    var $ = function (id) { return wrap.querySelector('#' + id); };

    function chip(attr, v, label, on, count) {
      return '<button type="button" class="sc-chip' + (on ? ' on' : '') + '" ' + attr + '="' + U.esc(v) + '">' +
        U.esc(label) + (count != null ? '<span class="c">' + U.int(count) + '</span>' : '') + '</button>';
    }

    function loadEvt() {
      if (EVT || evtLoading) return;
      evtLoading = true;
      fetch(EVT_URL).then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
        .then(function (j) { EVT = j; evtLoading = false; redraw(); })
        .catch(function () { evtLoading = false; EVT = { ev: {}, dict: [], failed: true }; redraw(); });
    }

    function ffKey(code) { return code + (ffOn[code] ? ':all' : ''); }
    function loadFF(code) {
      var k = ffKey(code);
      if (ffCache[k] || ffLoading[k]) return;
      ffLoading[k] = true;
      var url = WEBAPP + '?tool=fullfeed&code=' + encodeURIComponent(code) + (ffOn[code] ? '&full=1' : '');
      fetch(url).then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
        .then(function (j) { ffCache[k] = j && !j.error ? { rows: ffRows(j) } : { error: true }; ffLoading[k] = false; redraw(); })
        .catch(function () { ffCache[k] = { error: true }; ffLoading[k] = false; redraw(); });
    }

    function drawKpis() {
      var lastDay = D.feed.length ? D.feed.reduce(function (a, f) { return f.d > a ? f.d : a; }, '') : '';
      var nDay = D.feed.filter(function (f) { return f.d === lastDay; }).length;
      var w = getWatch().filter(function (c) { return D.map[c]; });
      var storm = D.corps.filter(function (c) { return c.grade === 4; }).length;
      $('kpis').innerHTML =
        U.kpi('최근 공시 (' + (lastDay ? lastDay.slice(4, 6) + '.' + lastDay.slice(6, 8) : '-') + ')', U.int(nDay) + '<small>건</small>', '구조 변동 ' + U.int(D.meta.total) + '건 · ' + U.int(D.meta.corps) + '종목 누적', true) +
        U.kpi('내 관심종목', U.int(w.length) + '<small>종목</small>', w.length ? '아래 내 종목 탭에서 확인' : '검색해서 등록해 보세요') +
        U.kpi('공시 폭풍 등급', U.int(storm) + '<small>종목</small>', '이벤트 지수 최상위 등급');
    }

    function drawTabs() {
      var w = getWatch().filter(function (c) { return D.map[c]; }).length;
      $('tabs').innerHTML = chip('data-tab', 'watch', '⭐ 내 종목', st.tab === 'watch', w) + chip('data-tab', 'feed', '📅 최근 공시', st.tab === 'feed') + chip('data-tab', 'rank', '🏆 이벤트 지수 랭킹', st.tab === 'rank');
    }

    function coreBlock(c) {
      if (!EVT) { loadEvt(); return '<div class="rd-load">구조 이력을 불러오는 중이에요.</div>'; }
      if (EVT.failed) return '<div class="rd-load">구조 이력을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.</div>';
      var rows = evtRows(EVT, c.code);
      if (!rows.length) return '<div class="rd-load">기록된 구조 변동 이력이 없어요.</div>';
      var full = !!open[c.code];
      var items = (full ? rows : rows.slice(0, PREVIEW)).map(function (r) {
        return '<div class="rd-it' + (r.rt ? ' dim' : '') + '"><div class="rd-d">' + fmtFull(r.d) + '</div><div class="rd-x"><span class="rd-pill">' + TAG_ICON[r.t] + ' ' + U.esc(D.tags[r.t]) + '</span>' + U.esc(r.x) +
          (r.n > 1 ? '<span class="rd-small">×' + r.n + '</span>' : '') + (r.rt ? '<span class="rd-small">정형</span>' : '') + '</div></div>';
      }).join('');
      return '<div class="rd-bh"><span>' + (full ? '구조 이력 전체 ' + rows.length + '건 · 2016년부터' : '최근 구조 변동') + '</span></div>' +
        (full ? '<div class="rd-scroll">' + items + '</div>' : items) +
        (rows.length > PREVIEW ? '<button type="button" class="sc-btn ghost rd-more" data-open="' + c.code + '">' + (full ? '접기' : '구조 이력 ' + rows.length + '건 전체 보기') + '</button>' : '');
    }

    function fullBlock(c) {
      var k = ffKey(c.code), on = !!ffOn[c.code];
      var head = '<div class="rd-bh"><span>최근 2년 전체 공시</span><button type="button" class="rd-tog' + (on ? ' on' : '') + '" data-ffon="' + c.code + '">' + (on ? '✓ 지분공시 포함' : '지분공시 포함') + '</button></div>';
      if (!ffCache[k]) { loadFF(c.code); return head + '<div class="rd-load">DART에서 불러오는 중이에요.<br><span style="font-size:12px">공시가 많은 대형주는 10초 넘게 걸릴 수 있어요.</span></div>'; }
      var j = ffCache[k];
      if (j.error) return head + '<div class="rd-load">불러오지 못했어요. 잠시 후 다시 시도해 주세요.</div>';
      if (!j.rows.length) return head + '<div class="rd-load">최근 2년간 공시가 없어요.</div>';
      var full = !!open[c.code];
      var items = (full ? j.rows : j.rows.slice(0, PREVIEW)).map(function (r) {
        return '<div class="rd-it' + (r.dim ? ' dim' : '') + '"><div class="rd-d">' + fmtFull(r.d) + '</div><div class="rd-x">' + (r.fix ? '<span class="rd-fix">[정정]</span>' : '') + U.esc(r.name) +
          (r.filer ? '<span class="rd-small">· ' + U.esc(r.filer) + '</span>' : '') + '</div></div>';
      }).join('');
      return head + (full ? '<div class="rd-scroll">' + items + '</div>' : items) +
        (j.rows.length > PREVIEW ? '<button type="button" class="sc-btn ghost rd-more" data-open="' + c.code + '">' + (full ? '접기' : '전체 공시 ' + j.rows.length + '건 보기') + '</button>' : '');
    }

    function card(c, opt) {
      opt = opt || {};
      var md = mode[c.code] || 'core', watched = getWatch().indexOf(c.code) !== -1;
      var cnts = c.cnt.map(function (n, i) { return n > 0 ? '<span class="rd-cnt">' + TAG_ICON[i] + ' ' + U.esc(D.tags[i]) + '<b>' + n + '</b></span>' : ''; }).join('');
      return '<div class="rd-card' + (opt.sel ? ' sel' : '') + '">' +
        '<div class="rd-hd"><div class="rd-l">' + (opt.rank ? '<span class="rd-rk">' + opt.rank + '</span>' : '') +
        '<div style="min-width:0"><div class="rd-nm">' + U.esc(c.name) + (c.mkt ? '<span class="rd-tag">' + U.esc(c.mkt) + '</span>' : '') + '</div>' +
        '<div class="rd-meta">' + U.esc(c.code) + ' · 구조 변동 ' + c.total + '건 · 지수 ' + c.score + '점' + (c.last ? ' · 최근 ' + agoTxt(c.last, today) : '') + '</div></div></div>' +
        '<span class="rd-gr g' + c.grade + '">' + U.esc(D.grades[c.grade]) + '</span></div>' +
        '<div class="rd-cnts">' + (cnts || '<span class="rd-cnt">구조 변동 없음</span>') + '</div>' +
        '<div class="rd-modes">' + chip('data-mode', 'core|' + c.code, '📜 구조 이력', md === 'core') + chip('data-mode', 'full|' + c.code, '📋 전체 공시', md === 'full') +
        '<button type="button" class="rd-wbtn' + (watched ? ' on' : '') + '" data-watch="' + c.code + '">' + (watched ? '⭐ 관심종목 해제' : '☆ 관심종목 등록') + '</button></div>' +
        '<div class="rd-body">' + (md === 'core' ? coreBlock(c) : fullBlock(c)) + '</div></div>';
    }

    function drawSel() {
      var c = st.sel && D.map[st.sel];
      $('selBox').innerHTML = c ? '<div class="rd-list">' + card(c, { sel: true }) + '</div>' : '';
    }

    function drawBody() {
      var h = '';
      if (st.tab === 'watch') {
        var list = getWatch().map(function (c) { return D.map[c]; }).filter(Boolean).filter(function (c) { return c.code !== st.sel; })
          .sort(function (a, b) { return a.last < b.last ? 1 : -1; });
        var any = getWatch().some(function (c) { return D.map[c]; });
        h = !any ? '<div class="rd-list"><div class="rd-empty">등록된 관심종목이 없어요.<br>위 검색창에서 종목을 찾아 <b>관심종목 등록</b>을 눌러 보세요.</div></div>'
          : '<div class="rd-list">' + (list.length ? list.map(function (c) { return card(c); }).join('') : '<div class="rd-empty">위에서 보고 있는 종목이 유일한 관심종목이에요.</div>') + '</div>';
      } else if (st.tab === 'feed') {
        h = '<div class="rd-sub">' + chip('data-rt', '1', '정형 공시 숨기기', st.hideRoutine) + chip('data-rt', '0', '전체 보기', !st.hideRoutine) + '</div><div style="margin-top:10px">';
        var last = '', n = 0;
        D.feed.forEach(function (f) {
          if ((st.hideRoutine && f.routine) || n >= FEED_N) return;
          n++;
          if (f.d !== last) { h += '<div class="rd-day">' + fmtFullWd(f.d) + '</div>'; last = f.d; }
          h += '<button type="button" class="rd-fd' + (f.routine ? ' dim' : '') + '" data-pick="' + U.esc(f.code) + '"><span class="rd-pill">' + TAG_ICON[f.tag] + ' ' + U.esc(D.tags[f.tag]) + '</span><b>' + U.esc(f.name) + '</b> ' + U.esc(f.title) +
            (f.n > 1 ? '<span class="rd-small">×' + f.n + '</span>' : '') + '</button>';
        });
        h += n ? '</div>' : '<div class="rd-empty">표시할 공시가 없어요.</div></div>';
      } else {
        var mk = ['코스닥', '코스피'];
        h = '<div class="rd-sub">' + mk.map(function (m) { return chip('data-mkt', m, m, st.mkt === m); }).join('') + chip('data-mkt', 'all', '전체', st.mkt === 'all') + '</div>' +
          '<div class="rd-list">' + rank(D, st.mkt).map(function (c, i) { return card(c, { rank: i + 1 }); }).join('') + '</div>' +
          (st.mkt === '코스피' ? '<div class="sc-note" style="margin-top:12px">코스피 대형주는 공시 총량 자체가 많아 지수가 높게 나오는 경향이 있어요. 규모가 비슷한 기업끼리 비교해 보시는 편이 정확해요.</div>' : '');
      }
      $('body').innerHTML = h;
    }

    function redraw() { if (!D) return; drawKpis(); drawTabs(); drawSel(); drawBody(); }

    function showAc(q) {
      var ac = $('ac');
      if (!D || !String(q).trim()) { ac.style.display = 'none'; return; }
      var hit = searchCorps(D, q, 20);
      ac.innerHTML = hit.length ? hit.map(function (c) { return '<button type="button" data-pick="' + U.esc(c.code) + '"><span>' + U.esc(c.name) + '</span><span class="c">' + U.esc(c.code) + (c.mkt ? ' · ' + U.esc(c.mkt) : '') + '</span></button>'; }).join('')
        : '<div class="none">검색 결과가 없어요.</div>';
      ac.style.display = 'block';
    }

    function pick(code) {
      st.sel = code; open[code] = false;
      $('q').value = ''; $('ac').style.display = 'none';
      redraw();
      var host = wrap.getRootNode().host || wrap;
      var top = $('selBox').getBoundingClientRect().top + window.pageYOffset - 16;
      if (host && isFinite(top)) window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
    }

    wrap.addEventListener('click', function (e) {
      var t = e.target.closest('button');
      if (!t || !D) return;
      var a;
      if ((a = t.getAttribute('data-pick'))) { pick(a); return; }
      if ((a = t.getAttribute('data-tab'))) { st.tab = a; redraw(); return; }
      if ((a = t.getAttribute('data-watch'))) {
        var w = getWatch(), i = w.indexOf(a);
        if (i === -1) w.push(a); else w.splice(i, 1);
        setWatch(w); redraw(); return;
      }
      if ((a = t.getAttribute('data-mode'))) { var p = a.split('|'); mode[p[1]] = p[0]; open[p[1]] = false; redraw(); return; }
      if ((a = t.getAttribute('data-ffon'))) { ffOn[a] = !ffOn[a]; redraw(); return; }
      if ((a = t.getAttribute('data-open'))) { open[a] = !open[a]; redraw(); return; }
      if ((a = t.getAttribute('data-mkt'))) { st.mkt = a; drawBody(); return; }
      if ((a = t.getAttribute('data-rt'))) { st.hideRoutine = a === '1'; drawBody(); return; }
    });
    var qi = $('q');
    qi.addEventListener('input', function () { showAc(qi.value); });
    qi.addEventListener('focus', function () { if (qi.value) showAc(qi.value); });
    qi.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { var b = $('ac').querySelector('button[data-pick]'); if (b) { e.preventDefault(); pick(b.getAttribute('data-pick')); } }
      if (e.key === 'Escape') $('ac').style.display = 'none';
    });
    wrap.addEventListener('focusout', function () { setTimeout(function () { var r = wrap.getRootNode(); var f = r.activeElement; if (!f || !f.closest || !f.closest('.rd-srch')) $('ac').style.display = 'none'; }, 250); });

    function load(retry) {
      fetch(IDX_URL, { cache: 'no-store' }).then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
        .then(function (j) {
          D = normIdx(j);
          if (!getWatch().some(function (c) { return D.map[c]; })) st.tab = 'feed';
          $('foot').innerHTML = '출처: 금융감독원 전자공시시스템(DART). 구조 이력 5종: ' + D.tags.map(U.esc).join(' · ') + '. 구조 이력 기준 ' + U.esc(D.meta.gen) + ' (' + fmtFull(D.meta.from) + '부터), 전체 공시는 조회 시점 기준이에요. 투자 참고용이며 매수/매도 추천이 아닙니다. | stockchild.com';
          redraw();
        })
        .catch(function (err) {
          if (!retry) { setTimeout(function () { load(true); }, 1500); return; }
          $('body').innerHTML = '<div class="sc-note warn">데이터를 불러오지 못했어요. 잠시 후 새로고침해 주세요.<br><span style="font-size:12px">' + U.esc(String(err && err.message || err)) + '</span></div>';
          $('kpis').innerHTML = U.kpi('최근 공시', '-', '불러오기 실패', true);
        });
    }
    load(false);
  }

  function reg() { window.SCTools.register({ id: 'disclosure-radar', css: CSS, render: render }); }
  if (window.SCTools) reg(); else document.addEventListener('DOMContentLoaded', function () { if (window.SCTools) reg(); });
})();
