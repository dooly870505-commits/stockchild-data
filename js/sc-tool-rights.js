/* stockchild.com 유상증자 전후 주가 추적기 (sc-tool-rights) v1.0 (2026-10-17)
   id: rights-offering
   필요 파일: sc-ui.js
   데이터 (서버 수정 없음, 기존 ro-widget.js 와 같은 주소)
   - 목록: 허브 Apps Script ?tool=rightsoffering  { updated, totalEvents, events:[{eventId, corpName, stockCode, market, boardResolutionDate, offeringType, estimatedPrice, finalPrice, status}] }
   - 상세: GitHub 조각 파일 s00～s29.json  { shard, events:{ eventId: {...일정, 발행 정보, prices:[{date, close, days}], cohort:[{day, avgPct, sampleCount}], cohortLabel} } }
   - 조각 번호 계산식은 Apps Script roHashShard_ 와 반드시 같아야 함 */
(function () {
  'use strict';

  var WEBAPP_URL = 'https://script.google.com/macros/s/AKfycbx3rYebPAr6ReE4UoBivkKGRiCZIg_wukexmykPRxpMKriSvYDnYrmJblyvEAZPzZ7I/exec';
  var SHARD_BASE = 'https://dooly870505-commits.github.io/stockchild-data/data/rightsoffering-shard/';
  var SHARD_COUNT = 30;
  var PAGE = 20;
  var WD = ['일', '월', '화', '수', '목', '금', '토'];
  var MKT_KO = { KOSDAQ: '코스닥', KOSPI: '코스피', KONEX: '코넥스', E: '기타', Y: '코스피', K: '코스닥', N: '코넥스' };

  // ---------- 날짜 도우미 (내부는 YYYYMMDD 문자열) ----------
  function digits(v) { return String(v == null ? '' : v).replace(/[^0-9]/g, ''); }
  function ymdOf(v) { var d = digits(v); return d.length >= 8 ? d.slice(0, 8) : ''; }
  function kstToday() {
    var s = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
    return digits(s).slice(0, 8);
  }
  function utc(ymd) { return Date.UTC(+ymd.slice(0, 4), +ymd.slice(4, 6) - 1, +ymd.slice(6, 8)); }
  function diffDays(from, to) { return Math.round((utc(to) - utc(from)) / 86400000); }
  function addDays(ymd, n) { var d = new Date(utc(ymd) + n * 86400000); return d.getUTCFullYear() + ('0' + (d.getUTCMonth() + 1)).slice(-2) + ('0' + d.getUTCDate()).slice(-2); }
  function fmtFull(ymd) { return ymd ? ymd.slice(0, 4) + '.' + ymd.slice(4, 6) + '.' + ymd.slice(6, 8) : ''; }
  function fmtFullWd(ymd) { return ymd ? fmtFull(ymd) + '(' + WD[new Date(utc(ymd)).getUTCDay()] + ')' : ''; }
  function fmtMD(ymd) { return ymd ? ymd.slice(4, 6) + '.' + ymd.slice(6, 8) : ''; }
  function fmtYM(ymd) { return ymd ? ymd.slice(2, 4) + '.' + ymd.slice(4, 6) : ''; }
  function ddayText(n) { return n > 0 ? 'D-' + n : n === 0 ? 'D-DAY' : 'D+' + (-n); }

  function num(v) { var n = parseFloat(String(v == null ? '' : v).replace(/[^0-9.\-]/g, '')); return isFinite(n) ? n : NaN; }
  function pos(v) { var n = num(v); return n > 0 ? n : NaN; }
  function disp(name) { return String(name || '').replace(/^\s*(주식회사|㈜|\(주\))\s*/, '').replace(/\s*(주식회사|㈜|\(주\))\s*$/, '').trim(); }
  function mktKo(m) { m = String(m || '').trim(); return MKT_KO[m.toUpperCase()] || m; }
  function codeOf(eventId, stockCode) {
    var p = String(eventId || '').split('_')[0];
    if (/^[0-9A-Z]{6}$/i.test(p)) return p.toUpperCase();
    var c = String(stockCode == null ? '' : stockCode).trim().toUpperCase();
    return /^\d+$/.test(c) && c.length < 6 ? ('000000' + c).slice(-6) : c;
  }

  /* Apps Script roHashShard_ 와 완전히 같은 계산식 */
  function shardNo(eventId) {
    var h = 0;
    for (var i = 0; i < eventId.length; i++) h = (h * 31 + eventId.charCodeAt(i)) >>> 0;
    return h % SHARD_COUNT;
  }

  // ---------- 목록 정제 ----------
  function normList(json) {
    if (!json || typeof json !== 'object') throw new Error('데이터 형식이 올바르지 않아요');
    if (json.error) throw new Error(String(json.error));
    var raw = Array.isArray(json.events) ? json.events : [];
    var out = [];
    raw.forEach(function (e) {
      if (!e || typeof e !== 'object' || !e.eventId) return;
      var name = disp(e.corpName);
      var board = ymdOf(e.boardResolutionDate);
      if (!name || !board) return;
      out.push({
        id: String(e.eventId), name: name, code: codeOf(e.eventId, e.stockCode),
        mkt: mktKo(e.market), type: String(e.offeringType || '').trim() || '기타',
        board: board, fin: pos(e.finalPrice), est: pos(e.estimatedPrice)
      });
    });
    out.sort(function (a, b) { return a.board < b.board ? 1 : a.board > b.board ? -1 : 0; });
    return { updated: String(json.updated || ''), items: out };
  }

  // ---------- 상세 정제 ----------
  function normDetail(e, id) {
    if (!e || typeof e !== 'object') return null;
    var listing = ymdOf(e.listingDate);
    var seen = {};
    var prices = (Array.isArray(e.prices) ? e.prices : []).map(function (p) {
      return p && typeof p === 'object' ? { d: ymdOf(p.date), c: pos(p.close) } : null;
    }).filter(function (p) {
      if (!p || !p.d || !isFinite(p.c) || seen[p.d]) return false;
      seen[p.d] = 1; return true;
    }).sort(function (a, b) { return a.d < b.d ? -1 : 1; });
    // 상장일 기준 경과일은 서버 값 대신 날짜로 다시 계산 (일부 어긋난 건 대비)
    prices.forEach(function (p) { p.days = listing ? diffDays(listing, p.d) : null; });
    var cohort = (Array.isArray(e.cohort) ? e.cohort : []).map(function (c) {
      return c && typeof c === 'object' ? { day: Math.round(num(c.day)), pct: num(c.avgPct), n: Math.round(num(c.sampleCount)) } : null;
    }).filter(function (c) { return c && isFinite(c.day) && isFinite(c.pct); });
    return {
      id: id || String(e.eventId || ''), name: disp(e.corpName), code: codeOf(id || e.eventId, e.stockCode),
      mkt: mktKo(e.market), type: String(e.offeringType || '').trim() || '기타',
      board: ymdOf(e.boardResolutionDate), record: ymdOf(e.recordDate),
      subStart: ymdOf(e.subStartDate), subEnd: ymdOf(e.subEndDate),
      payment: ymdOf(e.paymentDate), listing: listing,
      fin: pos(e.finalPrice), est: pos(e.estimatedPrice),
      shares: pos(e.sharesIssued), before: pos(e.sharesBeforeOffering),
      amount: pos(e.fundingAmount), ratio: pos(e.fundingRatio),
      underwriter: String(e.underwriter || '').trim(),
      prices: prices, cohort: cohort, cohortLabel: String(e.cohortLabel || '').trim()
    };
  }

  function issuePrice(d) { return isFinite(d.fin) ? { v: d.fin, kind: '확정' } : isFinite(d.est) ? { v: d.est, kind: '예정' } : null; }

  // 차트에 쓸 구간: 상장일 앞뒤 months 개월 (상장일이 없으면 최근 2×months 개월)
  function seriesFor(d, months, today) {
    var span = months * 30;
    var ps = d.prices;
    if (!ps.length) return { pts: [], from: '', to: '' };
    var from, to;
    if (d.listing) { from = addDays(d.listing, -span); to = addDays(d.listing, span); }
    else { to = ps[ps.length - 1].d; from = addDays(to, -span * 2); }
    var pts = ps.filter(function (p) { return p.d >= from && p.d <= to; });
    // 비교 평균선: 상장 후 첫 거래일 종가를 기준(100%)으로 환산
    var base = null;
    for (var i = 0; i < pts.length; i++) { if (pts[i].days !== null && pts[i].days >= 0) { base = pts[i]; break; } }
    var cmap = {};
    d.cohort.forEach(function (c) { cmap[c.day] = c; });
    var minN = null;
    pts = pts.map(function (p) {
      var cv = null;
      if (base && p.days !== null && p.days >= 0 && d.cohort.length) {
        var day = p.days;  // 서버 비교 평균도 상장일 기준 경과일(캘린더)로 계산됨
        var b3 = day - (day % 3);
        var c = cmap[day] || cmap[b3] || cmap[b3 + 1] || cmap[b3 + 2];
        if (c) { cv = Math.round(base.c * c.pct) / 100; if (minN === null || c.n < minN) minN = c.n; }
      }
      return { d: p.d, c: p.c, days: p.days, cv: cv };
    });
    var dEnd = pts.length ? pts[pts.length - 1].d : to;
    if (d.listing && d.listing > dEnd && d.listing <= to) dEnd = d.listing;
    return { pts: pts, from: pts.length ? pts[0].d : from, to: dEnd, base: base, minN: minN, hasCohort: pts.some(function (p) { return p.cv !== null; }) };
  }

  // ---------- SVG 차트 (외부 라이브러리 없음) ----------
  function chartSvg(s, d, W, H) {
    var pts = s.pts;
    if (pts.length < 2) return '';
    var pL = 8, pR = 58, pT = 22, pB = 24;
    var iw = W - pL - pR, ih = H - pT - pB;
    var ip = issuePrice(d);
    var vals = [];
    pts.forEach(function (p) { vals.push(p.c); if (p.cv !== null) vals.push(p.cv); });
    if (ip) vals.push(ip.v);
    var lo = Math.min.apply(null, vals), hi = Math.max.apply(null, vals);
    if (hi === lo) { hi = hi * 1.05 + 1; lo = lo * 0.95; }
    var pad = (hi - lo) * 0.08; lo = Math.max(0, lo - pad); hi = hi + pad;
    var t0 = utc(s.from), t1 = utc(s.to); if (t1 === t0) t1 = t0 + 86400000;
    function X(ymd) { return pL + (utc(ymd) - t0) / (t1 - t0) * iw; }
    function Y(v) { return pT + (1 - (v - lo) / (hi - lo)) * ih; }
    function f(n) { return n.toFixed(1); }
    var g = '';
    for (var i = 0; i <= 3; i++) {
      var v = lo + (hi - lo) * i / 3, y = Y(v);
      g += '<line x1="' + pL + '" x2="' + (W - pR) + '" y1="' + f(y) + '" y2="' + f(y) + '" class="gl"/>' +
        '<text x="' + (W - pR + 6) + '" y="' + f(y + 4) + '" class="ax">' + Math.round(v).toLocaleString('ko-KR') + '</text>';
    }
    g += '<text x="' + pL + '" y="' + (H - 6) + '" class="ax">' + fmtYM(s.from) + '</text>' +
      '<text x="' + (W - pR) + '" y="' + (H - 6) + '" class="ax" text-anchor="end">' + fmtYM(s.to) + '</text>';
    if (ip && ip.v >= lo && ip.v <= hi) {
      var iy = Y(ip.v);
      g += '<line x1="' + pL + '" x2="' + (W - pR) + '" y1="' + f(iy) + '" y2="' + f(iy) + '" class="ipl"/>' +
        '<text x="' + (pL + 2) + '" y="' + f(iy - 5) + '" class="ipt">' + ip.kind + ' 발행가 ' + Math.round(ip.v).toLocaleString('ko-KR') + '</text>';
    }
    if (d.listing && d.listing >= s.from && d.listing <= s.to) {
      var lx = X(d.listing);
      g += '<line x1="' + f(lx) + '" x2="' + f(lx) + '" y1="' + pT + '" y2="' + (H - pB) + '" class="lsl"/>' +
        '<text x="' + f(Math.min(lx, W - pR - 2)) + '" y="' + (pT - 8) + '" class="lst" text-anchor="' + (lx > W - pR - 40 ? 'end' : 'middle') + '">신주상장</text>';
    }
    var cp = pts.filter(function (p) { return p.cv !== null; });
    if (cp.length > 1) g += '<polyline class="cl" points="' + cp.map(function (p) { return f(X(p.d)) + ',' + f(Y(p.cv)); }).join(' ') + '"/>';
    g += '<polyline class="pl" points="' + pts.map(function (p) { return f(X(p.d)) + ',' + f(Y(p.c)); }).join(' ') + '"/>';
    g += '<line class="hg" id="hg" x1="0" x2="0" y1="' + pT + '" y2="' + (H - pB) + '" style="display:none"/><circle class="hd" id="hd" r="4" cx="0" cy="0" style="display:none"/>';
    g += '<rect class="ov" id="ov" x="' + pL + '" y="0" width="' + iw + '" height="' + H + '"/>';
    return { svg: '<svg width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="주가 흐름 그래프">' + g + '</svg>', X: X, Y: Y };
  }

  window.SCRights = { normList: normList, normDetail: normDetail, seriesFor: seriesFor, chartSvg: chartSvg, shardNo: shardNo, codeOf: codeOf, diffDays: diffDays };

  // ---------- 화면 ----------
  var CSS = [
    '.rk-search{display:flex;align-items:center;height:48px;padding:0 14px;border:1px solid var(--line2);border-radius:var(--r-sm);background:#fff;transition:border-color .15s,box-shadow .15s}',
    '.rk-search:focus-within{border-color:var(--ink);box-shadow:0 0 0 3px rgba(22,24,29,.08)}',
    '.rk-search .ic{color:var(--muted);margin-right:8px;font-size:15px}',
    '.rk-search input{flex:1;min-width:0;border:0;outline:0;background:transparent;font:inherit;font-size:16px;color:var(--ink)}',
    '.rk-search input::placeholder{color:var(--muted)}',
    '.rk-filters{display:flex;flex-direction:column;gap:8px;margin-top:12px}',
    '.rk-frow{display:flex;flex-wrap:wrap;gap:6px}',
    '.sc-chip .c{margin-left:5px;opacity:.55;font-weight:700}',
    '.rk-count{margin-top:16px;font-size:12px;color:var(--sub)}',
    '.rk-list{margin-top:8px;display:grid;gap:8px}',
    '.rk-item{display:flex;justify-content:space-between;align-items:center;gap:14px;width:100%;text-align:left;padding:14px 16px;border:1px solid var(--line);border-radius:var(--r-md);background:#fff;font:inherit;color:var(--ink);cursor:pointer;transition:border-color .15s}',
    '.rk-item:hover{border-color:var(--line2)}',
    '.rk-item:focus-visible{outline:2px solid var(--focus);outline-offset:2px}',
    '.rk-l{flex:1;min-width:0}',
    '.rk-name{display:flex;align-items:center;gap:6px;font-size:15px;font-weight:700;min-width:0}',
    '.rk-name .n{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
    '.rk-tag{flex:none;font-size:11px;font-weight:600;color:var(--sub);background:var(--soft);border-radius:6px;padding:2px 6px}',
    '.rk-tag.t3{color:var(--brand);background:var(--brand-bg)}',
    '.rk-meta{font-size:12.5px;color:var(--sub);margin-top:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '.rk-r{flex:none;text-align:right}',
    '.rk-p{font-size:16px;font-weight:700}',
    '.rk-p.est{color:var(--sub);font-weight:600}',
    '.rk-pk{font-size:11.5px;color:var(--muted);margin-top:3px;white-space:nowrap}',
    '.rk-chev{flex:none;color:var(--muted);font-size:18px;margin-left:-4px}',
    '.rk-empty{padding:28px 16px;text-align:center;color:var(--muted);font-size:14px;border:1px dashed var(--line2);border-radius:var(--r-md)}',
    '.rk-skel{height:66px;border-radius:var(--r-md);background:linear-gradient(90deg,var(--soft),#fafbfc,var(--soft));background-size:200% 100%;animation:rk-sh 1.2s infinite}',
    '@keyframes rk-sh{0%{background-position:200% 0}100%{background-position:-200% 0}}',
    '.rk-more{width:100%;margin-top:12px}',
    '#kpis,#dk{grid-template-columns:2fr 1fr 1fr}',
    '.rk-back{display:inline-flex;align-items:center;gap:4px;border:0;background:none;font:inherit;font-size:14px;font-weight:600;color:var(--sub);cursor:pointer;padding:4px 0;margin-bottom:12px}',
    '.rk-back:hover{color:var(--ink)}',
    '.rk-dname{display:flex;align-items:center;flex-wrap:wrap;gap:6px;font-size:22px;font-weight:700;letter-spacing:-0.02em}',
    '.rk-dcode{font-size:13px;color:var(--sub);margin-top:4px}',
    '.rk-tl{position:relative;margin-left:6px;padding-left:20px;border-left:2px solid var(--line)}',
    '.rk-tr{position:relative;display:flex;justify-content:space-between;align-items:baseline;gap:10px;padding:9px 0}',
    '.rk-tr::before{content:"";position:absolute;left:-27px;top:13px;width:10px;height:10px;border-radius:50%;background:#fff;border:2px solid var(--line2)}',
    '.rk-tr.past::before{background:var(--ink);border-color:var(--ink)}',
    '.rk-tr.next::before{background:#fff;border-color:var(--brand)}',
    '.rk-tr .k{font-size:14px;color:var(--sub)}',
    '.rk-tr .v{font-size:14px;font-weight:600;text-align:right}',
    '.rk-tr .v.none{color:var(--muted);font-weight:400}',
    '.rk-tr .dd{margin-left:6px;font-size:12px;font-weight:700;color:var(--brand)}',
    '.rk-rows{border-top:1px solid var(--line)}',
    '.rk-rows .r{display:flex;justify-content:space-between;gap:12px;padding:11px 0;border-bottom:1px solid var(--line);font-size:14px}',
    '.rk-rows .r .k{color:var(--sub)}',
    '.rk-rows .r .v{font-weight:600;text-align:right}',
    '.rk-chips{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px}',
    '.rk-chart{position:relative;min-height:120px}',
    '.rk-chart svg{display:block;overflow:visible;touch-action:pan-y}',
    '.rk-chart .gl{stroke:var(--line);stroke-width:1}',
    '.rk-chart .ax{font-size:11px;fill:var(--muted)}',
    '.rk-chart .pl{fill:none;stroke:var(--ink);stroke-width:2;stroke-linejoin:round;stroke-linecap:round}',
    '.rk-chart .cl{fill:none;stroke:var(--muted);stroke-width:1.6;stroke-dasharray:5 4}',
    '.rk-chart .ipl{stroke:var(--sub);stroke-width:1;stroke-dasharray:2 3}',
    '.rk-chart .ipt{font-size:11px;fill:var(--sub);font-weight:600}',
    '.rk-chart .lsl{stroke:var(--brand);stroke-width:1.2;stroke-dasharray:3 3}',
    '.rk-chart .lst{font-size:11px;fill:var(--brand);font-weight:700}',
    '.rk-chart .hg{stroke:var(--line2);stroke-width:1}',
    '.rk-chart .hd{fill:var(--ink);stroke:#fff;stroke-width:2}',
    '.rk-chart .ov{fill:transparent;cursor:crosshair}',
    '.rk-tip{position:absolute;top:0;pointer-events:none;background:var(--ink);color:#fff;border-radius:8px;padding:6px 9px;font-size:12px;line-height:1.5;white-space:nowrap;display:none;transform:translateX(-50%)}',
    '.rk-tip b{font-size:13px}',
    '.rk-legend{display:flex;flex-wrap:wrap;gap:6px 14px;margin-top:10px;font-size:12px;color:var(--sub)}',
    '.rk-legend i{display:inline-block;width:16px;height:0;vertical-align:middle;margin-right:5px;border-top:2px solid var(--ink)}',
    '.rk-legend i.c{border-top:2px dashed var(--muted)}',
    '.rk-legend i.l{border-top:2px dashed var(--brand);width:10px}',
    '.rk-legend i.p{border-top:2px dotted var(--sub)}',
    '.rk-cempty{padding:30px 16px;text-align:center;color:var(--muted);font-size:13px;background:var(--soft);border-radius:var(--r-sm)}',
    '@media (max-width:640px){#kpis,#dk{grid-template-columns:1fr 1fr}#kpis .sc-kpi.main,#dk .sc-kpi.main{grid-column:1/-1}}',
    '@media (max-width:480px){.rk-item{padding:12px 14px;gap:10px}.rk-dname{font-size:20px}}'
  ].join('');

  function render(wrap, U) {
    var today = kstToday();
    var DATA = null;
    var shardCache = {};
    var st = { type: 'all', period: 'all', q: '', shown: PAGE };
    var cur = null, curMonths = 6, ro = null, savedY = 0;

    wrap.innerHTML =
      '<div class="sc-card">' +
      '<div id="vList">' +
      U.header('공시·기업 이력', '유상증자 전후 주가 추적기', '유상증자를 결의한 종목의 일정과 신주상장 전후 주가 흐름을 모았어요.') +
      '<div class="sc-sec"><div class="sc-kpis" id="kpis">' + U.kpi('추적 중인 유상증자', '-', '불러오는 중', true) + U.kpi('최근 30일 새 결의', '-', '') + U.kpi('올해 결의', '-', '') + '</div></div>' +
      '<div class="sc-sec">' +
      '<label class="rk-search"><span class="ic">🔍</span><input id="q" type="search" placeholder="종목명 또는 종목코드" autocomplete="off"></label>' +
      '<div class="rk-filters" id="filters"></div>' +
      '<div class="rk-count" id="count"></div>' +
      '<div class="rk-list" id="list"><div class="rk-skel"></div><div class="rk-skel"></div><div class="rk-skel"></div></div>' +
      '<div id="more"></div>' +
      '</div></div>' +
      '<div id="vDetail" style="display:none"></div>' +
      '<div class="sc-sec"><div class="sc-note">유상증자 자체는 <b>호재도 악재도 아닙니다.</b> 자금을 어디에 쓰는지, 누가 얼마에 사는지에 따라 의미가 달라져요. ' +
      '다만 신주가 상장되면 유통 주식이 늘어나고, 주가가 발행가보다 높으면 차익 매물이 나올 수 있어요.</div></div>' +
      '<div class="sc-foot">공시 출처: DART · 시세 출처: 네이버페이 증권(KRX 기준). 비교 평균선은 같은 유형·비슷한 조달 규모 종목들의 평균 흐름이며, 개별 종목의 미래를 보장하지 않습니다. 투자 참고용이며 매수/매도 추천이 아닙니다. | stockchild.com</div>' +
      '</div>';

    var $ = function (id) { return wrap.querySelector('#' + id); };

    function chip(k, v, label, on, count) {
      return '<button type="button" class="sc-chip' + (on ? ' on' : '') + '" data-k="' + k + '" data-v="' + U.esc(v) + '">' +
        U.esc(label) + (count != null ? '<span class="c">' + U.int(count) + '</span>' : '') + '</button>';
    }

    function periodFrom(p) { return p === '30' ? addDays(today, -30) : p === '365' ? addDays(today, -365) : ''; }

    function typeList(items) {
      var cnt = {};
      items.forEach(function (it) { cnt[it.type] = (cnt[it.type] || 0) + 1; });
      return Object.keys(cnt).sort(function (a, b) { return cnt[b] - cnt[a]; }).map(function (t) { return { t: t, n: cnt[t] }; });
    }

    function filtered() {
      var q = st.q.trim().toUpperCase();
      var from = periodFrom(st.period);
      return DATA.items.filter(function (it) {
        if (st.type !== 'all' && it.type !== st.type) return false;
        if (from && it.board < from) return false;
        if (q && it.name.toUpperCase().indexOf(q) === -1 && it.code.indexOf(q) === -1) return false;
        return true;
      });
    }

    function drawKpis() {
      var base = DATA.items.filter(function (it) { return st.type === 'all' || it.type === st.type; });
      var d30 = addDays(today, -30), y0 = today.slice(0, 4) + '0101';
      var n30 = base.filter(function (it) { return it.board >= d30; }).length;
      var ny = base.filter(function (it) { return it.board >= y0; }).length;
      var lbl = st.type === 'all' ? '추적 중인 유상증자' : st.type + ' 유상증자';
      $('kpis').innerHTML =
        U.kpi(U.esc(lbl), U.int(base.length) + '<small>건</small>', DATA.updated ? '갱신 ' + U.esc(DATA.updated) : '', true) +
        U.kpi('최근 30일 새 결의', U.int(n30) + '<small>건</small>', fmtMD(d30) + '부터 오늘까지') +
        U.kpi(today.slice(0, 4) + '년 결의', U.int(ny) + '<small>건</small>', '이사회결의일 기준');
    }

    function drawFilters() {
      var row1 = chip('type', 'all', '전체', st.type === 'all', DATA.items.length) +
        typeList(DATA.items).map(function (x) { return chip('type', x.t, x.t, st.type === x.t, x.n); }).join('');
      var row2 = chip('period', 'all', '전체 기간', st.period === 'all') + chip('period', '30', '최근 30일', st.period === '30') + chip('period', '365', '최근 1년', st.period === '365');
      $('filters').innerHTML = '<div class="rk-frow">' + row1 + '</div><div class="rk-frow">' + row2 + '</div>';
    }

    function itemHtml(it) {
      var price = isFinite(it.fin) ? '<div class="rk-p">' + U.won(it.fin) + '원</div><div class="rk-pk">확정 발행가</div>'
        : isFinite(it.est) ? '<div class="rk-p est">' + U.won(it.est) + '원</div><div class="rk-pk">예정 발행가</div>'
          : '<div class="rk-p est">-</div><div class="rk-pk">발행가 미확인</div>';
      return '<button type="button" class="rk-item" data-id="' + U.esc(it.id) + '"><div class="rk-l">' +
        '<div class="rk-name"><span class="n">' + U.esc(it.name) + '</span>' +
        (it.mkt ? '<span class="rk-tag">' + U.esc(it.mkt) + '</span>' : '') +
        '<span class="rk-tag' + (it.type === '제3자배정' ? ' t3' : '') + '">' + U.esc(it.type) + '</span></div>' +
        '<div class="rk-meta">' + U.esc(it.code) + ' · 결의 ' + fmtFull(it.board) + '</div></div>' +
        '<div class="rk-r">' + price + '</div><span class="rk-chev">›</span></button>';
    }

    function drawList() {
      var list = filtered();
      $('count').textContent = list.length ? '조건에 맞는 유상증자 ' + U.int(list.length) + '건 · 최신 결의순' : '';
      if (!list.length) {
        $('list').innerHTML = '<div class="rk-empty">' + (st.q.trim() ? '검색 결과가 없어요. 기간을 넓혀 보세요.' : '이 조건에 맞는 유상증자가 없어요.') + '</div>';
        $('more').innerHTML = '';
        return;
      }
      $('list').innerHTML = list.slice(0, st.shown).map(itemHtml).join('');
      var rest = list.length - st.shown;
      $('more').innerHTML = rest > 0 ? '<button type="button" class="sc-btn ghost rk-more" id="moreBtn">' + Math.min(rest, PAGE) + '건 더 보기 <span style="color:var(--muted);margin-left:6px">' + U.int(rest) + '건 남음</span></button>' : '';
    }

    function drawAll() { drawKpis(); drawFilters(); drawList(); }

    // ----- 상세 -----
    function hostTop() {
      var host = wrap.getRootNode().host || wrap;
      return host.getBoundingClientRect().top + window.pageYOffset - 12;
    }

    function openDetail(it) {
      savedY = window.pageYOffset;
      $('vList').style.display = 'none';
      var v = $('vDetail');
      v.style.display = 'block';
      v.innerHTML = '<button type="button" class="rk-back" data-back="1">‹ 목록으로</button>' + headHtml(it) +
        '<div class="sc-sec"><div class="rk-skel"></div></div><div class="sc-sec"><div class="rk-skel" style="height:200px"></div></div>';
      window.scrollTo(0, Math.max(0, hostTop()));
      var no = shardNo(it.id);
      var p = shardCache[no] ? Promise.resolve(shardCache[no]) :
        fetch(SHARD_BASE + 's' + (no < 10 ? '0' + no : no) + '.json').then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
          .then(function (j) { shardCache[no] = (j && j.events) || {}; return shardCache[no]; });
      p.then(function (evs) {
        if (cur !== 'loading:' + it.id) return;  // 그사이 목록으로 돌아갔거나 다른 종목을 열었으면 무시
        var d = normDetail(evs[it.id], it.id);
        if (!d) { v.innerHTML = backAndMsg(it, '상세 정보를 찾지 못했어요.'); return; }
        // 목록 쪽 값이 더 최신일 수 있으니 이름·시장은 목록 기준으로 맞춤
        d.name = it.name; d.mkt = it.mkt || d.mkt;
        if (!isFinite(d.fin) && isFinite(it.fin)) d.fin = it.fin;
        if (!isFinite(d.est) && isFinite(it.est)) d.est = it.est;
        cur = d; curMonths = 6;
        drawDetail();
      }).catch(function (err) {
        v.innerHTML = backAndMsg(it, '상세 정보를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.');
        if (window.console) console.error(err);
      });
      cur = 'loading:' + it.id;
    }

    function backAndMsg(it, msg) {
      return '<button type="button" class="rk-back" data-back="1">‹ 목록으로</button>' + headHtml(it) + '<div class="sc-sec"><div class="sc-note warn">' + msg + '</div></div>';
    }

    function headHtml(d) {
      return '<div class="rk-dname">' + U.esc(d.name) +
        (d.mkt ? '<span class="rk-tag">' + U.esc(d.mkt) + '</span>' : '') +
        '<span class="rk-tag' + (d.type === '제3자배정' ? ' t3' : '') + '">' + U.esc(d.type) + '</span></div>' +
        '<div class="rk-dcode">' + U.esc(d.code) + (d.board ? ' · 이사회결의 ' + fmtFull(d.board) : '') + '</div>';
    }

    function lastPrice(d) { return d.prices.length ? d.prices[d.prices.length - 1] : null; }

    function drawDetail() {
      var d = cur;
      var ip = issuePrice(d), lp = lastPrice(d);
      // 핵심 결과 3칸
      var k1 = d.listing ? U.kpi('신주상장', ddayText(diffDays(today, d.listing)), fmtFullWd(d.listing), true) : U.kpi('신주상장', '미정', '상장예정일 미확인', true);
      var k2;
      if (ip && lp) {
        var gap = lp.c / ip.v - 1;
        k2 = U.kpi('발행가 대비 최근 종가', '<span class="' + U.tone(gap) + '">' + U.pct(gap, 1, true) + '</span>',
          '종가 ' + U.won(lp.c) + '원 (' + fmtMD(lp.d) + ') · ' + ip.kind + ' ' + U.won(ip.v) + '원');
      } else k2 = U.kpi('발행가 대비 최근 종가', '-', ip ? '시세 데이터 없음' : '발행가 미확인');
      // 발행 주식 수와 증자 전 주식 수가 똑같으면 원본 파싱 오류일 가능성이 커서 증가율을 계산하지 않음
      var dil = isFinite(d.shares) && isFinite(d.before) && d.shares !== d.before ? d.shares / d.before : NaN;
      var k3 = isFinite(d.ratio) ? U.kpi('조달 비율', d.ratio + '<small>%</small>', '결의 당시 시가총액 대비')
        : isFinite(dil) ? U.kpi('주식 수 증가', U.pct(dil, 1) , '기존 발행주식 대비') : U.kpi('조달 비율', '-', '미확인');

      // 일정 타임라인
      var steps = [
        { k: '이사회 결의', d: d.board },
        { k: '신주배정 기준일', d: d.record },
        { k: '청약', d: d.subStart || d.subEnd, d2: d.subStart && d.subEnd && d.subEnd !== d.subStart ? d.subEnd : '' },
        { k: '납입일', d: d.payment },
        { k: '신주상장', d: d.listing }
      ];
      if (d.type === '제3자배정') steps = steps.filter(function (s) { return s.d || (s.k !== '신주배정 기준일' && s.k !== '청약'); });
      var nextMarked = false;
      var tl = steps.map(function (s) {
        var cls = '', dd = '';
        var endD = s.d2 || s.d;
        if (s.d) {
          if (endD < today) cls = 'past';
          else if (!nextMarked) { cls = 'next'; nextMarked = true; dd = '<span class="dd">' + ddayText(diffDays(today, s.d)) + '</span>'; }
        }
        var val = s.d ? fmtFullWd(s.d) + (s.d2 ? ' ～ ' + fmtMD(s.d2) : '') : '미확인';
        return '<div class="rk-tr ' + cls + '"><span class="k">' + s.k + '</span><span class="v' + (s.d ? '' : ' none') + '">' + val + dd + '</span></div>';
      }).join('');

      // 발행 정보
      var rows = [];
      rows.push(['확정 발행가', isFinite(d.fin) ? U.won(d.fin) + '원' : '미확정']);
      if (isFinite(d.est)) rows.push(['예정 발행가', U.won(d.est) + '원']);
      if (isFinite(d.shares)) rows.push(['발행 주식 수', U.int(d.shares) + '주']);
      if (isFinite(d.before)) rows.push(['증자 전 주식 수', U.int(d.before) + '주']);
      if (isFinite(dil)) rows.push(['주식 수 증가율', U.pct(dil, 1)]);
      if (isFinite(d.amount)) rows.push(['조달 금액', d.amount >= 1e8 ? U.int(d.amount / 1e8) + '억원' : U.won(d.amount) + '원']);
      if (d.underwriter) rows.push(['대표 주관회사', U.esc(d.underwriter)]);

      $('vDetail').innerHTML =
        '<button type="button" class="rk-back" data-back="1">‹ 목록으로</button>' + headHtml(d) +
        '<div class="sc-sec"><div class="sc-kpis" id="dk">' + k1 + k2 + k3 + '</div></div>' +
        '<div class="sc-sec"><div class="sc-sec-t">진행 일정</div><div class="rk-tl">' + tl + '</div></div>' +
        '<div class="sc-sec"><div class="sc-sec-t">주가 흐름</div>' +
        '<div class="rk-chips">' + [3, 6, 12].map(function (m) { return chip('months', m, (d.listing ? '상장 전후 ' : '최근 ') + m + '개월', curMonths === m); }).join('') + '</div>' +
        '<div class="rk-chart" id="chart"></div><div id="legend"></div></div>' +
        '<div class="sc-sec"><div class="sc-sec-t">발행 정보</div><div class="rk-rows">' +
        rows.map(function (r) { return '<div class="r"><span class="k">' + r[0] + '</span><span class="v">' + r[1] + '</span></div>'; }).join('') + '</div></div>';
      drawChart();
      if (window.ResizeObserver && !ro) {
        var lastW = 0;
        ro = new ResizeObserver(function () {
          var c = $('chart'); if (!c || !cur || typeof cur !== 'object') return;
          var w = c.clientWidth; if (Math.abs(w - lastW) > 4) { lastW = w; drawChart(); }
        });
        ro.observe(wrap);
      }
    }

    function drawChart() {
      var d = cur, box = $('chart'), lg = $('legend');
      if (!box || !d || typeof d !== 'object') return;
      var s = seriesFor(d, curMonths, today);
      var W = Math.max(280, box.clientWidth || 600), H = W < 420 ? 220 : 260;
      var c = chartSvg(s, d, W, H);
      if (!c) {
        box.innerHTML = '<div class="rk-cempty">이 기간에는 쌓인 시세 데이터가 적어요.</div>';
        lg.innerHTML = '';
        return;
      }
      box.innerHTML = c.svg + '<div class="rk-tip" id="tip"></div>';
      var ip = issuePrice(d);
      lg.innerHTML = '<div class="rk-legend"><span><i></i>이 종목 종가</span>' +
        (s.hasCohort ? '<span><i class="c"></i>같은 유형·규모 평균</span>' : '') +
        (d.listing && d.listing >= s.from && d.listing <= s.to ? '<span><i class="l"></i>신주상장일</span>' : '') +
        (ip ? '<span><i class="p"></i>' + ip.kind + ' 발행가</span>' : '') + '</div>' +
        (s.hasCohort ? '<div class="sc-note" style="margin-top:10px">비교 그룹: ' + U.esc(d.cohortLabel || '같은 유형·규모') +
          (s.minN !== null && s.minN < 5 ? ' · <b>표본 ' + s.minN + '건이라 참고만 하세요</b>' : '') + '</div>' : '');
      bindHover(box, s, c);
    }

    function bindHover(box, s, c) {
      var svg = box.querySelector('svg'), ov = box.querySelector('#ov'), hg = box.querySelector('#hg'), hd = box.querySelector('#hd'), tip = box.querySelector('#tip');
      if (!svg || !ov) return;
      var xs = s.pts.map(function (p) { return c.X(p.d); });
      function show(clientX) {
        var r = svg.getBoundingClientRect();
        var x = clientX - r.left;
        var bi = 0, bd = Infinity;
        for (var i = 0; i < xs.length; i++) { var dd = Math.abs(xs[i] - x); if (dd < bd) { bd = dd; bi = i; } }
        var p = s.pts[bi], px = xs[bi], py = c.Y(p.c);
        hg.setAttribute('x1', px); hg.setAttribute('x2', px); hg.style.display = '';
        hd.setAttribute('cx', px); hd.setAttribute('cy', py); hd.style.display = '';
        var lbl = p.days !== null ? (p.days === 0 ? '상장일' : p.days > 0 ? '상장 ' + p.days + '일 후' : '상장 ' + (-p.days) + '일 전') : '';
        tip.innerHTML = fmtFull(p.d) + (lbl ? ' · ' + lbl : '') + '<br><b>' + U.won(p.c) + '원</b>' + (p.cv !== null ? ' <span style="opacity:.7">평균 ' + U.won(p.cv) + '원</span>' : '');
        tip.style.display = 'block';
        var half = tip.offsetWidth / 2;
        tip.style.left = Math.min(Math.max(px, half), r.width - half) + 'px';
      }
      function hide() { hg.style.display = 'none'; hd.style.display = 'none'; tip.style.display = 'none'; }
      ov.addEventListener('mousemove', function (e) { show(e.clientX); });
      ov.addEventListener('mouseleave', hide);
      ov.addEventListener('touchstart', function (e) { if (e.touches[0]) show(e.touches[0].clientX); }, { passive: true });
      ov.addEventListener('touchmove', function (e) { if (e.touches[0]) show(e.touches[0].clientX); }, { passive: true });
      ov.addEventListener('touchend', function () { setTimeout(hide, 1800); });
    }

    function closeDetail() {
      cur = null;
      $('vDetail').style.display = 'none';
      $('vDetail').innerHTML = '';
      $('vList').style.display = '';
      window.scrollTo(0, savedY);
    }

    // ----- 이벤트 -----
    wrap.addEventListener('click', function (e) {
      var t = e.target.closest('button');
      if (!t || !DATA) return;
      if (t.getAttribute('data-back')) { closeDetail(); return; }
      if (t.id === 'moreBtn') { st.shown += PAGE; drawList(); return; }
      var id = t.getAttribute('data-id');
      if (id) {
        var it = DATA.items.filter(function (x) { return x.id === id; })[0];
        if (it) openDetail(it);
        return;
      }
      var k = t.getAttribute('data-k'), v = t.getAttribute('data-v');
      if (k === 'months') { curMonths = Number(v); wrap.querySelectorAll('[data-k="months"]').forEach(function (b) { b.classList.toggle('on', b === t); }); drawChart(); return; }
      if (k === 'type') st.type = v;
      else if (k === 'period') st.period = v;
      else return;
      st.shown = PAGE;
      drawAll();
    });

    $('q').addEventListener('input', function (e) { st.q = e.target.value; st.shown = PAGE; if (DATA) drawList(); });

    function load(retry) {
      var ctl = typeof AbortController !== 'undefined' ? new AbortController() : null;
      var timer = ctl ? setTimeout(function () { ctl.abort(); }, 25000) : null;
      fetch(WEBAPP_URL + '?tool=rightsoffering', { cache: 'no-store', signal: ctl ? ctl.signal : undefined })
        .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
        .then(function (j) { if (timer) clearTimeout(timer); DATA = normList(j); drawAll(); })
        .catch(function (err) {
          if (timer) clearTimeout(timer);
          if (!retry) { setTimeout(function () { load(true); }, 1500); return; }
          $('list').innerHTML = '<div class="sc-note warn">데이터를 불러오지 못했어요. 잠시 후 새로고침해 주세요.<br><span style="font-size:12px">' +
            U.esc(err && err.name === 'AbortError' ? '응답 시간 초과' : String(err && err.message || err)) + '</span></div>';
          $('kpis').innerHTML = U.kpi('추적 중인 유상증자', '-', '불러오기 실패', true);
        });
    }
    load(false);
  }

  function reg() { window.SCTools.register({ id: 'rights-offering', css: CSS, render: render }); }
  if (window.SCTools) reg(); else document.addEventListener('DOMContentLoaded', function () { if (window.SCTools) reg(); });
})();
