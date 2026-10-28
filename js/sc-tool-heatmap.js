/* stockchild.com 투자자별 매매동향 히트맵 (sc-tool-heatmap) v1.0 (2026-10-27)
   id: investor-heatmap
   필요 파일: sc-ui.js
   데이터: investor-flow-heatmap.json (주소남 PC 수집기 toss_collector.py 가 매일 저녁 GitHub에 발행)
   { date, updatedAt, count, source, items:[{symbol, name, rank, lastPrice,
     individualNetAmt, foreignerNetAmt, institutionNetAmt,
     instBreakdown:{financialInvestment, insurance, trust, privateEquity, bank, otherFinancial, pensionFund},
     otherCorporationNetAmt, foreignerHoldingRate}] }
   금액은 투자자별 순매수 수량 × 당일 종가로 계산한 근사치 */
(function () {
  'use strict';

  var JSON_URL = 'https://dooly870505-commits.github.io/stockchild-data/investor-flow-heatmap.json';
  var PAGE = 30;
  var WD = ['일', '월', '화', '수', '목', '금', '토'];
  // ETF·ETN 운용사 브랜드 (이름 앞부분으로 구분하는 근사 규칙)
  var ETF_RE = /^(KODEX|TIGER|ACE|SOL|RISE|KBSTAR|HANARO|KOSEF|ARIRANG|PLUS|TIMEFOLIO|1Q|KIWOOM|WON|BNK|TRUSTON|마이다스|UNICORN|FOCUS|에셋플러스|ITF|파워|VITA|TREX|KoAct|히어로즈|DAISHIN343|N2|QV|신한|미래에셋|삼성|KB|하나|메리츠|대신|키움)\s/;
  var LENS = [
    { k: 'all', label: '3주체 비교' },
    { k: 'ind', label: '개인', f: 'individualNetAmt' },
    { k: 'frg', label: '외국인', f: 'foreignerNetAmt' },
    { k: 'ins', label: '기관', f: 'institutionNetAmt' },
    { k: 'pen', label: '연기금', f: 'pension' }
  ];
  var BD = [['financialInvestment', '금융투자'], ['insurance', '보험'], ['trust', '투신'], ['privateEquity', '사모펀드'], ['bank', '은행'], ['otherFinancial', '기타금융'], ['pensionFund', '연기금']];

  function num(v) { var n = Number(v); return isFinite(n) ? n : 0; }
  function digits(v) { return String(v == null ? '' : v).replace(/[^0-9]/g, ''); }
  function fmtAmt(v, sign) {
    var a = Math.abs(v), s = v < 0 ? '-' : (sign && v > 0 ? '+' : '');
    if (a >= 1e12) return s + (a / 1e12).toFixed(1).replace(/\.0$/, '') + '조';
    if (a >= 1e8) return s + Math.round(a / 1e8).toLocaleString('ko-KR') + '억';
    if (a >= 1e4) return s + Math.round(a / 1e4).toLocaleString('ko-KR') + '만';
    return s + Math.round(a).toLocaleString('ko-KR');
  }
  function fmtDate(d) {
    var y = digits(d);
    if (y.length < 8) return String(d || '');
    var w = new Date(Date.UTC(+y.slice(0, 4), +y.slice(4, 6) - 1, +y.slice(6, 8))).getUTCDay();
    return y.slice(0, 4) + '.' + y.slice(4, 6) + '.' + y.slice(6, 8) + '(' + WD[w] + ')';
  }
  function isEtf(name) { return ETF_RE.test(String(name || '') + ' '); }

  function normalize(j) {
    if (!j || typeof j !== 'object' || !Array.isArray(j.items)) throw new Error('데이터 형식이 올바르지 않아요');
    var items = j.items.map(function (x) {
      if (!x || !x.symbol) return null;
      var bd = x.instBreakdown || {};
      var o = {
        code: String(x.symbol).replace(/^'/, '').toUpperCase(), name: String(x.name || x.symbol), rank: num(x.rank) || 999, price: num(x.lastPrice),
        individualNetAmt: num(x.individualNetAmt), foreignerNetAmt: num(x.foreignerNetAmt), institutionNetAmt: num(x.institutionNetAmt),
        other: num(x.otherCorporationNetAmt), bd: {}, hold: x.foreignerHoldingRate == null ? null : num(x.foreignerHoldingRate)
      };
      BD.forEach(function (b) { o.bd[b[0]] = num(bd[b[0]]); });
      o.pension = o.bd.pensionFund;
      o.etf = isEtf(o.name);
      return o;
    }).filter(Boolean).sort(function (a, b) { return a.rank - b.rank; });
    var zeroInd = items.length > 0 && items.every(function (x) { return !x.individualNetAmt; });
    return { date: String(j.date || ''), updated: String(j.updatedAt || ''), items: items, zeroInd: zeroInd };
  }

  function lensOf(k) { return LENS.filter(function (l) { return l.k === k; })[0] || LENS[0]; }

  // s: { lens, kind: all|stock|etf, q, sort: rank|buy|sell }
  function applyFilter(D, s) {
    var q = String(s.q || '').trim().toUpperCase(), L = lensOf(s.lens);
    var out = D.items.filter(function (x) {
      if (s.kind === 'stock' && x.etf) return false;
      if (s.kind === 'etf' && !x.etf) return false;
      if (q && x.name.toUpperCase().indexOf(q) === -1 && x.code.indexOf(q) === -1) return false;
      return true;
    });
    if (L.f && s.sort === 'buy') out.sort(function (a, b) { return b[L.f] - a[L.f]; });
    else if (L.f && s.sort === 'sell') out.sort(function (a, b) { return a[L.f] - b[L.f]; });
    return out;
  }

  window.SCHeatmap = { normalize: normalize, applyFilter: applyFilter, fmtAmt: fmtAmt, isEtf: isEtf };

  var CSS = [
    '.hm-search{display:flex;align-items:center;height:48px;padding:0 14px;border:1px solid var(--line2);border-radius:var(--r-sm);background:#fff}',
    '.hm-search:focus-within{border-color:var(--ink);box-shadow:0 0 0 3px rgba(22,24,29,.08)}',
    '.hm-search .ic{color:var(--muted);margin-right:8px;font-size:15px}',
    '.hm-search input{flex:1;min-width:0;border:0;outline:0;background:transparent;font:inherit;font-size:16px;color:var(--ink)}',
    '.hm-filters{display:flex;flex-direction:column;gap:8px;margin-top:12px}',
    '.hm-frow{display:flex;flex-wrap:wrap;gap:6px}',
    '.hm-count{display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:4px 10px;margin-top:14px;font-size:12px;color:var(--sub)}',
    '.hm-sort{display:flex;gap:2px}',
    '.hm-sort button{border:0;background:none;font:inherit;font-size:12px;color:var(--muted);padding:4px 6px;cursor:pointer;border-radius:6px;white-space:nowrap}',
    '.hm-sort button.on{color:var(--ink);font-weight:700}',
    '.hm-legend{display:flex;align-items:center;gap:6px;font-size:12px;color:var(--sub);margin-top:8px}',
    '.hm-legend i{display:inline-block;width:46px;height:8px;border-radius:4px;background:linear-gradient(90deg,rgba(47,111,235,.6),#F4F5F7,rgba(229,56,59,.6))}',
    '.hm-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(112px,1fr));grid-auto-flow:dense;gap:6px;margin-top:10px}',
    '.hm-t{position:relative;display:flex;flex-direction:column;justify-content:space-between;min-height:68px;padding:9px 10px;border:1px solid var(--line);border-radius:10px;background:#fff;font:inherit;text-align:left;color:var(--ink);cursor:pointer;overflow:hidden;transition:border-color .15s}',
    '.hm-t:hover{border-color:var(--line2)}',
    '.hm-t.sel{border-color:var(--ink);box-shadow:0 0 0 1px var(--ink)}',
    '.hm-t.big{grid-column:span 2;min-height:84px}',
    '.hm-t .n{font-size:13px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '.hm-t.big .n{font-size:15px}',
    '.hm-t .r{font-size:10.5px;color:var(--sub);margin-top:1px}',
    '.hm-t .v{font-size:14px;font-weight:700;margin-top:6px;font-variant-numeric:tabular-nums}',
    '.hm-t.big .v{font-size:17px}',
    '.hm-bars{display:grid;grid-template-columns:repeat(3,1fr);gap:3px;margin-top:8px}',
    '.hm-bars span{display:block;height:7px;border-radius:2px}',
    '.hm-bl{display:grid;grid-template-columns:repeat(3,1fr);gap:3px;font-size:9.5px;color:var(--muted);margin-top:2px;text-align:center}',
    '.hm-det{grid-column:1/-1;border:1px solid var(--ink);border-radius:var(--r-md);padding:14px 16px;background:#fff}',
    '.hm-dh{display:flex;justify-content:space-between;align-items:flex-start;gap:10px}',
    '.hm-dn{font-size:17px;font-weight:700}',
    '.hm-dm{font-size:12.5px;color:var(--sub);margin-top:3px}',
    '.hm-x{border:1px solid var(--line2);background:#fff;font:inherit;font-size:12px;color:var(--sub);border-radius:999px;padding:4px 10px;cursor:pointer}',
    '.hm-rows{margin-top:12px;display:grid;gap:8px}',
    '.hm-row{display:grid;grid-template-columns:64px 1fr 84px;align-items:center;gap:8px;font-size:13px}',
    '.hm-row .k{white-space:nowrap}',
    '.hm-row .k{color:var(--sub)}',
    '.hm-row .a{text-align:right;font-weight:700;font-variant-numeric:tabular-nums}',
    '.hm-track{position:relative;height:10px;background:var(--soft);border-radius:5px}',
    '.hm-track::after{content:"";position:absolute;left:50%;top:-2px;bottom:-2px;width:1px;background:var(--line2)}',
    '.hm-track i{position:absolute;top:0;bottom:0;border-radius:5px}',
    '.hm-sub{font-size:12px;font-weight:700;color:var(--sub);margin:14px 0 6px}',
    '.hm-bd{display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:6px}',
    '.hm-bd div{display:flex;justify-content:space-between;gap:6px;background:var(--soft);border-radius:8px;padding:6px 9px;font-size:12.5px}',
    '.hm-bd b{font-variant-numeric:tabular-nums}',
    '.hm-more{width:100%;margin-top:12px}',
    '.hm-empty{padding:28px 16px;text-align:center;color:var(--muted);font-size:14px;border:1px dashed var(--line2);border-radius:var(--r-md)}',
    '.hm-skel{height:220px;border-radius:var(--r-md);background:linear-gradient(90deg,var(--soft),#fafbfc,var(--soft));background-size:200% 100%;animation:hm-sh 1.2s infinite}',
    '@keyframes hm-sh{0%{background-position:200% 0}100%{background-position:-200% 0}}',
    '#kpis{grid-template-columns:2fr 1fr 1fr}',
    '@media (max-width:640px){#kpis{grid-template-columns:1fr 1fr}#kpis .sc-kpi.main{grid-column:1/-1}}',
    '@media (max-width:480px){.hm-grid{grid-template-columns:repeat(auto-fill,minmax(96px,1fr))}.hm-t{min-height:62px;padding:8px}.hm-t .n{font-size:12.5px}.hm-row{grid-template-columns:58px 1fr 76px}}'
  ].join('');

  function render(wrap, U) {
    var D = null, st = { lens: 'all', kind: 'all', q: '', sort: 'rank', shown: PAGE, sel: null };

    wrap.innerHTML =
      '<div class="sc-card">' +
      U.header('시세·수급 모니터', '투자자별 매매동향 히트맵', '거래대금 상위 100종목에서 개인·외국인·기관 중 누가 사고 팔았는지 한눈에 봐요.') +
      '<div class="sc-sec"><div class="sc-kpis" id="kpis">' + U.kpi('개인 순매수 합계', '-', '불러오는 중', true) + U.kpi('외국인', '-', '') + U.kpi('기관', '-', '') + '</div><div id="warn"></div></div>' +
      '<div class="sc-sec">' +
      '<label class="hm-search"><span class="ic">🔍</span><input id="q" type="search" placeholder="종목명 또는 종목코드" autocomplete="off"></label>' +
      '<div class="hm-filters" id="filters"></div>' +
      '<div class="hm-count" id="count"></div><div id="legend"></div>' +
      '<div class="hm-grid" id="grid"><div class="hm-skel" style="grid-column:1/-1"></div></div>' +
      '<div id="more"></div></div>' +
      '<div class="sc-sec"><div class="sc-note">타일을 누르면 기관 세부(금융투자·보험·투신·사모펀드·은행·기타금융·연기금)와 외국인 보유율이 펼쳐져요. 빨간색은 순매수, 파란색은 순매도이고 색이 진할수록 금액이 커요.<br>' +
      '금액은 투자자별 순매수 수량에 당일 종가를 곱한 근사치라 실제 체결 금액과 다를 수 있어요. ETF 구분은 이름 앞부분(KODEX·TIGER 등)으로 나눈 것이에요. <b>특정 주체가 순매수했다고 주가 상승을 보장하지는 않아요.</b></div></div>' +
      '<div class="sc-foot" id="foot">출처: 토스증권 Open API. 매 영업일 저녁 갱신. 투자 참고용이며 매수/매도 추천이 아닙니다. | stockchild.com</div>' +
      '</div>';

    var $ = function (id) { return wrap.querySelector('#' + id); };
    function chip(k, v, label, on) { return '<button type="button" class="sc-chip' + (on ? ' on' : '') + '" data-k="' + k + '" data-v="' + U.esc(v) + '">' + U.esc(label) + '</button>'; }
    function tone(v) { return v > 0 ? 'up' : v < 0 ? 'down' : ''; }
    function tint(v, max, base) {
      if (!v || !max) return 'rgba(244,245,247,1)';
      var a = (base || 0.08) + Math.sqrt(Math.min(1, Math.abs(v) / max)) * 0.4;
      return v > 0 ? 'rgba(229,56,59,' + a.toFixed(3) + ')' : 'rgba(47,111,235,' + a.toFixed(3) + ')';
    }
    function pool() { return D.items.filter(function (x) { return st.kind === 'all' || (st.kind === 'stock' ? !x.etf : x.etf); }); }

    function drawKpis() {
      var p = pool();
      function sum(f) { return p.reduce(function (a, x) { return a + x[f]; }, 0); }
      var si = sum('individualNetAmt'), sf = sum('foreignerNetAmt'), sn = sum('institutionNetAmt');
      var lbl = st.kind === 'stock' ? '개별 종목 ' : st.kind === 'etf' ? 'ETF ' : '';
      $('kpis').innerHTML =
        U.kpi('개인 순매수 합계', '<span class="' + tone(si) + '">' + fmtAmt(si, true) + '</span>', fmtDate(D.date) + ' · ' + lbl + '상위 ' + p.length + '종목', true) +
        U.kpi('외국인', '<span class="' + tone(sf) + '">' + fmtAmt(sf, true) + '</span>', '같은 종목 합계') +
        U.kpi('기관', '<span class="' + tone(sn) + '">' + fmtAmt(sn, true) + '</span>', '같은 종목 합계');
      $('warn').innerHTML = D.zeroInd ? '<div class="sc-note warn" style="margin-top:10px">오늘 데이터는 개인 순매수가 모두 0으로 들어와 있어요. 확정 전 데이터일 수 있어요.</div>' : '';
    }

    function drawFilters() {
      $('filters').innerHTML =
        '<div class="hm-frow">' + LENS.map(function (l) { return chip('lens', l.k, l.label, st.lens === l.k); }).join('') + '</div>' +
        '<div class="hm-frow">' + chip('kind', 'all', '전체', st.kind === 'all') + chip('kind', 'stock', '개별 종목만', st.kind === 'stock') + chip('kind', 'etf', 'ETF만', st.kind === 'etf') + '</div>';
    }

    function tileHtml(x, max) {
      var L = lensOf(st.lens), big = st.sort === 'rank' && x.rank <= 3 && !st.q.trim();
      var head = '<span><span class="n" style="display:block">' + U.esc(x.name) + '</span><span class="r">' + x.rank + '위' + (x.etf ? ' · ETF' : '') + '</span></span>';
      var body, bg = '#fff';
      if (L.f) {
        var v = x[L.f];
        bg = tint(v, max);
        body = '<span class="v">' + fmtAmt(v, true) + '</span>';  // 배경색이 방향을 보여주므로 글자는 진한 검정으로 (가독성)
      } else {
        body = '<span><span class="hm-bars"><span style="background:' + tint(x.individualNetAmt, max, 0.2) + '"></span><span style="background:' + tint(x.foreignerNetAmt, max, 0.2) + '"></span><span style="background:' + tint(x.institutionNetAmt, max, 0.2) + '"></span></span>' +
          '<span class="hm-bl">' + (big ? '<span>개인</span><span>외국인</span><span>기관</span>' : '<span>개</span><span>외</span><span>기</span>') + '</span></span>';
      }
      return '<button type="button" class="hm-t' + (big ? ' big' : '') + (st.sel === x.code ? ' sel' : '') + '" data-code="' + U.esc(x.code) + '" style="background:' + bg + '">' + head + body + '</button>';
    }

    function detailHtml(x) {
      var rows = [['개인', x.individualNetAmt], ['외국인', x.foreignerNetAmt], ['기관', x.institutionNetAmt], ['기타법인', x.other]];
      var m = Math.max.apply(null, rows.map(function (r) { return Math.abs(r[1]); })) || 1;
      return '<div class="hm-det"><div class="hm-dh"><div><div class="hm-dn">' + U.esc(x.name) + '</div><div class="hm-dm">' + U.esc(x.code) + ' · 거래대금 ' + x.rank + '위' + (x.price ? ' · 종가 ' + U.won(x.price) + '원' : '') + '</div></div>' +
        '<button type="button" class="hm-x" data-close="1">닫기 ✕</button></div>' +
        '<div class="hm-rows">' + rows.map(function (r) {
          var w = Math.abs(r[1]) / m * 50, pos = r[1] >= 0;
          return '<div class="hm-row"><span class="k">' + r[0] + '</span><span class="hm-track"><i style="' + (pos ? 'left:50%' : 'right:50%') + ';width:' + w.toFixed(1) + '%;background:' + (pos ? 'var(--up)' : 'var(--down)') + '"></i></span><span class="a ' + tone(r[1]) + '">' + fmtAmt(r[1], true) + '</span></div>';
        }).join('') + '</div>' +
        '<div class="hm-sub">기관 세부</div><div class="hm-bd">' + BD.map(function (b) { var v = x.bd[b[0]]; return '<div><span>' + b[1] + '</span><b class="' + tone(v) + '">' + fmtAmt(v, true) + '</b></div>'; }).join('') + '</div>' +
        (x.hold != null ? '<div class="hm-dm" style="margin-top:10px">외국인 보유율 ' + (x.hold * 100).toFixed(2) + '%</div>' : '') + '</div>';
    }

    function drawGrid() {
      var list = applyFilter(D, st), L = lensOf(st.lens);
      var sortBtns = L.f ? '<span class="hm-sort"><button type="button" data-k="sort" data-v="rank" class="' + (st.sort === 'rank' ? 'on' : '') + '">거래대금순</button><button type="button" data-k="sort" data-v="buy" class="' + (st.sort === 'buy' ? 'on' : '') + '">순매수 큰순</button><button type="button" data-k="sort" data-v="sell" class="' + (st.sort === 'sell' ? 'on' : '') + '">순매도 큰순</button></span>' : '<span>거래대금순</span>';
      $('count').innerHTML = '<span>' + list.length + '종목' + (L.f ? ' · ' + L.label + ' 기준 색칠' : ' · 막대: 개인·외국인·기관') + '</span>' + sortBtns;
      $('legend').innerHTML = '<div class="hm-legend">순매도 <i></i> 순매수</div>';
      if (!list.length) { $('grid').innerHTML = '<div class="hm-empty" style="grid-column:1/-1">검색 결과가 없어요. 거래대금 상위 100종목만 보여드려요.</div>'; $('more').innerHTML = ''; return; }
      var vis = list.slice(0, st.shown);
      var fields = L.f ? [L.f] : ['individualNetAmt', 'foreignerNetAmt', 'institutionNetAmt'];
      var max = 0;
      list.forEach(function (x) { fields.forEach(function (f) { max = Math.max(max, Math.abs(x[f])); }); });
      var h = '';
      vis.forEach(function (x) { h += tileHtml(x, max); if (st.sel === x.code) h += detailHtml(x); });
      $('grid').innerHTML = h;
      var rest = list.length - st.shown;
      $('more').innerHTML = rest > 0 ? '<button type="button" class="sc-btn ghost hm-more" id="moreBtn">' + Math.min(rest, PAGE) + '종목 더 보기 <span style="color:var(--muted);margin-left:6px">' + st.shown + ' / ' + list.length + '</span></button>' : '';
    }

    function drawAll() { drawKpis(); drawFilters(); drawGrid(); }

    wrap.addEventListener('click', function (e) {
      var t = e.target.closest('button');
      if (!t || !D) return;
      if (t.id === 'moreBtn') { st.shown += PAGE; drawGrid(); return; }
      if (t.getAttribute('data-close')) { st.sel = null; drawGrid(); return; }
      var c = t.getAttribute('data-code');
      if (c) { st.sel = st.sel === c ? null : c; drawGrid(); return; }
      var k = t.getAttribute('data-k'), v = t.getAttribute('data-v');
      if (k === 'lens') { st.lens = v; if (!lensOf(v).f) st.sort = 'rank'; }
      else if (k === 'kind') st.kind = v;
      else if (k === 'sort') st.sort = v;
      else return;
      st.shown = PAGE;
      drawAll();
    });
    $('q').addEventListener('input', function (e) { st.q = e.target.value; st.shown = PAGE; if (D) drawGrid(); });

    function load(retry) {
      fetch(JSON_URL, { cache: 'no-store' }).then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
        .then(function (j) {
          D = normalize(j);
          $('foot').innerHTML = '출처: 토스증권 Open API. 기준일 ' + U.esc(fmtDate(D.date)) + ', 매 영업일 저녁 갱신. 투자 참고용이며 매수/매도 추천이 아닙니다. | stockchild.com';
          drawAll();
        })
        .catch(function (err) {
          if (!retry) { setTimeout(function () { load(true); }, 1500); return; }
          $('grid').innerHTML = '<div class="sc-note warn" style="grid-column:1/-1">데이터를 불러오지 못했어요. 잠시 후 새로고침해 주세요.<br><span style="font-size:12px">' + U.esc(String(err && err.message || err)) + '</span></div>';
          $('kpis').innerHTML = U.kpi('개인 순매수 합계', '-', '불러오기 실패', true);
        });
    }
    load(false);
  }

  function reg() { window.SCTools.register({ id: 'investor-heatmap', css: CSS, render: render }); }
  if (window.SCTools) reg(); else document.addEventListener('DOMContentLoaded', function () { if (window.SCTools) reg(); });
})();
