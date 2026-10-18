/* stockchild.com 동전주 상장폐지 리스트 (sc-tool-penny) v1.0 (2026-10-17)
   id: penny-delisting
   필요 파일: market-calendar-core.js (지정일·시한 추정용, 없으면 추정만 빠짐), sc-ui.js
   데이터: 동전주 모니터링 Apps Script 웹앱 JSON (기존 위젯과 같은 주소, 서버 수정 없음)
   { 기준일자, 법적카운트시작일, 법적카운트활성, 갱신시각, 요약:{위험, 주의, 정상, 전체},
     위험목록:[{종목코드, 종목명, 시장구분, 최근종가, 참고연속일수, 법적연속일수, 표시연속일수, tier}], 주의목록:[...] }
   규정 (2026.7.1 시행): 종가 1,000원 미만 30거래일 연속 → 관리종목 지정,
   지정 후 90거래일 안에 45거래일 연속 1,000원 이상을 유지하지 못하면 상장폐지 */
(function () {
  'use strict';

  var API_URL = 'https://script.google.com/macros/s/AKfycbwQyi6fyoE8247FBZo8uumF60f9NrzUsBrCsz2p9--Z2aXE-irEW-LJhSpUDswMvo4A-Q/exec';
  var LIMIT = 1000, DESIG = 30, WINDOW = 90, RECOVER = 45, PAGE = 30;
  var WD = ['일', '월', '화', '수', '목', '금', '토'];
  var MKT_KO = { KOSDAQ: '코스닥', KOSPI: '코스피', KONEX: '코넥스' };

  // ---------- 날짜 도우미 (내부 YYYYMMDD, 엔진은 YYYY-MM-DD) ----------
  function digits(v) { return String(v == null ? '' : v).replace(/[^0-9]/g, ''); }
  function ymdOf(v) { var d = digits(v); return d.length >= 8 ? d.slice(0, 8) : ''; }
  function toDash(y) { return y.slice(0, 4) + '-' + y.slice(4, 6) + '-' + y.slice(6, 8); }
  function fromDash(s) { return s ? s.replace(/-/g, '') : ''; }
  function kstToday() {
    var s = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
    return digits(s).slice(0, 8);
  }
  function utc(y) { return Date.UTC(+y.slice(0, 4), +y.slice(4, 6) - 1, +y.slice(6, 8)); }
  function diffDays(a, b) { return Math.round((utc(b) - utc(a)) / 86400000); }
  function fmtFull(y) { return y ? y.slice(0, 4) + '.' + y.slice(4, 6) + '.' + y.slice(6, 8) : '-'; }
  function fmtMDw(y) { return y ? y.slice(4, 6) + '.' + y.slice(6, 8) + '(' + WD[new Date(utc(y)).getUTCDay()] + ')' : ''; }
  function ddayText(n) { return n > 0 ? 'D-' + n : n === 0 ? 'D-DAY' : 'D+' + (-n); }

  // 영업일 엔진으로 거래일 더하기·빼기 (엔진이 없거나 범위를 벗어나면 '')
  function cal() { return window.SCCal || null; }
  function addTD(y, n) {
    var C = cal(); if (!C || !y) return '';
    var d = toDash(y);
    for (var i = 0; i < Math.abs(n); i++) {
      d = n > 0 ? C.nextTradingDay('kr', d, false) : C.prevTradingDay('kr', d, false);
      if (!d) return '';
    }
    return C.coverage('kr', d) === 'none' ? '' : fromDash(d);
  }
  function tentative(y) { var C = cal(); return !!(C && y && C.coverage('kr', toDash(y)) === 'tentative'); }
  function tdBetween(a, b) { var C = cal(); return C && a && b ? C.tradingDaysBetween('kr', toDash(a), toDash(b)) : NaN; }

  function num(v) { var n = parseFloat(String(v == null ? '' : v).replace(/[^0-9.\-]/g, '')); return isFinite(n) ? n : NaN; }
  function disp(name) { return String(name || '').replace(/^\s*(주식회사|㈜|\(주\))\s*/, '').trim(); }
  function codeOf(c) { c = String(c == null ? '' : c).trim().toUpperCase(); return /^\d+$/.test(c) && c.length < 6 ? ('000000' + c).slice(-6) : c; }

  // ---------- 정제 + 추정 계산 ----------
  function normItem(it, tier, base) {
    if (!it || typeof it !== 'object') return null;
    var name = disp(it['종목명']);
    if (!name) return null;
    var streak = Math.round(num(it['법적연속일수']));
    if (!isFinite(streak)) streak = Math.round(num(it['표시연속일수']));
    if (!isFinite(streak) || streak < 0) streak = 0;
    var ref = Math.round(num(it['참고연속일수']));
    var m = String(it['시장구분'] || '').trim();
    var o = {
      code: codeOf(it['종목코드']), name: name, mkt: MKT_KO[m.toUpperCase()] || m,
      close: num(it['최근종가']), streak: streak, ref: isFinite(ref) ? ref : streak, tier: tier,
      need: NaN, day30: '', desig: '', end90: '', lastStart: ''
    };
    if (isFinite(o.close) && o.close > 0) o.need = LIMIT / o.close - 1;
    if (base && streak > 0) {
      if (streak >= DESIG) {
        // 연속일수가 30에 닿은 날 = 기준일에서 (연속일수 - 30) 거래일 전, 지정일은 그 다음 거래일
        o.day30 = addTD(base, -(streak - DESIG));
      } else {
        // 지금처럼 계속 1,000원 미만이면 30일째가 되는 날
        o.day30 = addTD(base, DESIG - streak);
      }
      if (o.day30) o.desig = addTD(o.day30, 1);
      if (o.desig) o.end90 = addTD(o.desig, WINDOW - 1);              // 지정일 포함 90번째 거래일
      if (o.end90) o.lastStart = addTD(o.end90, -(RECOVER - 1));      // 45거래일 연속을 채우려면 늦어도 시작해야 하는 날
    }
    return o;
  }

  function normalize(json) {
    if (!json || typeof json !== 'object') throw new Error('데이터 형식이 올바르지 않아요');
    if (json.error) throw new Error(String(json.error));
    var base = ymdOf(json['기준일자']);
    var sum = json['요약'] && typeof json['요약'] === 'object' ? json['요약'] : {};
    function list(arr, tier) {
      return (Array.isArray(arr) ? arr : []).map(function (it) { return normItem(it, tier, base); }).filter(Boolean);
    }
    var danger = list(json['위험목록'], 'danger'), warn = list(json['주의목록'], 'warn');
    function n(v, fb) { var x = num(v); return isFinite(x) ? x : fb; }
    return {
      base: base, updated: String(json['갱신시각'] || ''), active: json['법적카운트활성'] !== false,
      danger: danger, warn: warn,
      cnt: { danger: n(sum['위험'], danger.length), warn: n(sum['주의'], warn.length), safe: n(sum['정상'], NaN), all: n(sum['전체'], NaN) }
    };
  }

  // s: { tier, mkt, q, sort }
  function applyFilter(D, s) {
    var q = String(s.q || '').trim().toUpperCase();
    var out = (s.tier === 'warn' ? D.warn : D.danger).filter(function (it) {
      if (s.mkt && s.mkt !== 'all' && it.mkt !== s.mkt) return false;
      if (q && it.name.toUpperCase().indexOf(q) === -1 && it.code.indexOf(q) === -1) return false;
      return true;
    });
    out.sort(s.sort === 'price'
      ? function (a, b) { return (a.close || 0) - (b.close || 0) || b.streak - a.streak; }
      : function (a, b) { return b.streak - a.streak || (a.close || 0) - (b.close || 0); });
    return out;
  }

  window.SCPenny = { normalize: normalize, applyFilter: applyFilter, addTD: addTD };

  // ---------- 화면 ----------
  var CSS = [
    '.pn-search{display:flex;align-items:center;height:48px;padding:0 14px;border:1px solid var(--line2);border-radius:var(--r-sm);background:#fff;transition:border-color .15s,box-shadow .15s}',
    '.pn-search:focus-within{border-color:var(--ink);box-shadow:0 0 0 3px rgba(22,24,29,.08)}',
    '.pn-search .ic{color:var(--muted);margin-right:8px;font-size:15px}',
    '.pn-search input{flex:1;min-width:0;border:0;outline:0;background:transparent;font:inherit;font-size:16px;color:var(--ink)}',
    '.pn-search input::placeholder{color:var(--muted)}',
    '.pn-filters{display:flex;flex-direction:column;gap:8px;margin-top:12px}',
    '.pn-frow{display:flex;flex-wrap:wrap;gap:6px}',
    '.sc-chip .c{margin-left:5px;opacity:.55;font-weight:700}',
    '.sc-chip.on .c{opacity:.75}',
    '.pn-count{display:flex;justify-content:space-between;align-items:center;margin-top:16px;font-size:12px;color:var(--sub)}',
    '.pn-sort{display:flex;gap:2px}',
    '.pn-sort button{border:0;background:none;font:inherit;font-size:12px;color:var(--muted);padding:4px 6px;cursor:pointer;border-radius:6px}',
    '.pn-sort button.on{color:var(--ink);font-weight:700}',
    '.pn-list{margin-top:8px;display:grid;gap:8px}',
    '.pn-item{padding:14px 16px;border:1px solid var(--line);border-radius:var(--r-md);background:#fff}',
    '.pn-top{display:flex;justify-content:space-between;align-items:flex-start;gap:12px}',
    '.pn-l{flex:1;min-width:0}',
    '.pn-name{display:flex;align-items:center;gap:6px;font-size:15px;font-weight:700;min-width:0}',
    '.pn-name .n{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
    '.pn-tag{flex:none;font-size:11px;font-weight:600;color:var(--sub);background:var(--soft);border-radius:6px;padding:2px 6px}',
    '.pn-tag.hot{color:var(--brand);background:var(--brand-bg);font-weight:700}',
    '.pn-meta{font-size:12.5px;color:var(--sub);margin-top:4px}',
    '.pn-r{flex:none;text-align:right}',
    '.pn-p{font-size:17px;font-weight:700}',
    '.pn-need{font-size:12px;color:var(--sub);margin-top:3px;white-space:nowrap}',
    '.pn-bar{position:relative;height:6px;background:var(--soft);border-radius:3px;margin-top:12px;overflow:hidden}',
    '.pn-bar i{position:absolute;left:0;top:0;bottom:0;background:var(--line2);border-radius:3px}',
    '.pn-bar i.hot{background:var(--brand)}',
    '.pn-bar-l{display:flex;justify-content:space-between;font-size:12px;color:var(--sub);margin-top:6px}',
    '.pn-bar-l b{color:var(--ink)}',
    '.pn-steps{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-top:12px}',
    '.pn-step{background:var(--soft);border-radius:10px;padding:8px 10px;min-width:0}',
    '.pn-step .k{font-size:11px;color:var(--sub);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '.pn-step .v{font-size:13px;font-weight:700;margin-top:2px;white-space:nowrap}',
    '.pn-step .d{font-size:11px;font-weight:700;margin-left:4px}',
    '.pn-step.hot{background:var(--brand-bg)}',
    '.pn-step.hot .d{color:var(--brand)}',
    '.pn-step.over .v{color:var(--sub)}',
    '.pn-empty{padding:28px 16px;text-align:center;color:var(--muted);font-size:14px;border:1px dashed var(--line2);border-radius:var(--r-md)}',
    '.pn-skel{height:96px;border-radius:var(--r-md);background:linear-gradient(90deg,var(--soft),#fafbfc,var(--soft));background-size:200% 100%;animation:pn-sh 1.2s infinite}',
    '@keyframes pn-sh{0%{background-position:200% 0}100%{background-position:-200% 0}}',
    '.pn-more{width:100%;margin-top:12px}',
    '#kpis{grid-template-columns:2fr 1fr 1fr}',
    '@media (max-width:640px){#kpis{grid-template-columns:1fr 1fr}#kpis .sc-kpi.main{grid-column:1/-1}}',
    '@media (max-width:480px){.pn-item{padding:12px 14px}.pn-step{padding:7px 8px}.pn-step .v{font-size:12.5px}}'
  ].join('');

  function render(wrap, U) {
    var today = kstToday();
    var D = null;
    var st = { tier: 'danger', mkt: 'all', q: '', sort: 'streak', shown: PAGE };

    wrap.innerHTML =
      '<div class="sc-card">' +
      U.header('상장폐지 조기경보', '동전주 상장폐지 리스트', '종가 1,000원 미만이 이어지는 종목을 매일 확인해요. 관리종목 지정일과 회복 시한은 영업일로 계산한 추정치예요.') +
      '<div class="sc-sec"><div class="sc-kpis" id="kpis">' + U.kpi('관리종목 요건 충족', '-', '불러오는 중', true) + U.kpi('1,000원 미만 진행 중', '-', '') + U.kpi('정상 종목', '-', '') + '</div></div>' +
      '<div class="sc-sec" id="alert"></div>' +
      '<div class="sc-sec">' +
      '<label class="pn-search"><span class="ic">🔍</span><input id="q" type="search" placeholder="종목명 또는 종목코드" autocomplete="off"></label>' +
      '<div class="pn-filters" id="filters"></div>' +
      '<div class="pn-count" id="count"></div>' +
      '<div class="pn-list" id="list"><div class="pn-skel"></div><div class="pn-skel"></div></div>' +
      '<div id="more"></div>' +
      '</div>' +
      '<div class="sc-sec"><div class="sc-note">종가 1,000원 미만이 <b>30거래일 연속</b>이면 관리종목으로 지정되고, 지정 후 <b>90거래일 안에 45거래일 연속</b> 1,000원 이상을 유지하지 못하면 상장폐지돼요. ' +
      '관리종목 지정 자체가 곧 상장폐지는 아니며, 주식병합 등으로 기준을 회복하는 기업도 있어요.<br>' +
      '<b>시가총액 미달</b>에 따른 상장폐지 절차는 법원 가처분 이후 10월 2일부터 유예 중이지만, <b>동전주(주가 미달)</b> 상장폐지 절차는 거래소가 예정대로 진행한다는 방침이에요. (2026.10.16 기준) 두 사유가 겹친 종목은 동전주 기준이 그대로 적용돼요.<br>' +
      '이미 1,000원 이상으로 올라선 종목은 연속일수가 끊겨 이 목록에서 빠지지만, 관리종목이라면 45거래일 연속을 채워야 해제돼요. 그런 종목은 따로 보여주지 않아요.</div></div>' +
      '<div class="sc-foot" id="foot">한국거래소 상장규정(2026.7.1 시행)을 기준으로 한 참고용 자체 모니터링입니다. 지정일·시한은 현재 연속일수와 휴장일로 거꾸로 계산한 추정치예요. 연속일수가 중간에 끊겼다가 다시 시작된 종목은 실제 지정일이 더 빠를 수 있고, 하루 정도 차이가 날 수 있으며, 실제 관리종목 지정과 상장폐지는 한국거래소 공시를 따릅니다. 종가는 공공데이터포털(금융위원회) 시세 기준입니다. 투자 참고용이며 매수/매도 추천이 아닙니다. | stockchild.com</div>' +
      '</div>';

    var $ = function (id) { return wrap.querySelector('#' + id); };

    function chip(k, v, label, on, count) {
      return '<button type="button" class="sc-chip' + (on ? ' on' : '') + '" data-k="' + k + '" data-v="' + U.esc(v) + '">' +
        U.esc(label) + (count != null ? '<span class="c">' + U.int(count) + '</span>' : '') + '</button>';
    }

    function drawKpis() {
      var c = D.cnt;
      $('kpis').innerHTML =
        U.kpi('관리종목 요건 충족', U.int(c.danger) + '<small>종목</small>', DESIG + '거래일 연속 1,000원 미만 · 기준일 ' + fmtFull(D.base), true) +
        U.kpi('1,000원 미만 진행 중', U.int(c.warn) + '<small>종목</small>', '아직 ' + DESIG + '거래일 전') +
        U.kpi('정상 종목', isFinite(c.safe) ? U.int(c.safe) + '<small>종목</small>' : '-', isFinite(c.all) ? '전체 ' + U.int(c.all) + '종목 중' : '');
    }

    // 가장 많은 종목이 묶인 지정일 그룹의 회복 마지노선을 맨 위에 알림
    function drawAlert() {
      var g = {};
      D.danger.forEach(function (it) { if (it.desig && it.lastStart) { var k = it.desig + '|' + it.lastStart + '|' + it.end90; g[k] = (g[k] || 0) + 1; } });
      var keys = Object.keys(g).filter(function (k) { return k.split('|')[2] >= today; }).sort(function (a, b) { return a.split('|')[1] < b.split('|')[1] ? -1 : 1; });
      if (!keys.length) { $('alert').innerHTML = ''; $('alert').style.display = 'none'; return; }
      var k = keys[0].split('|'), n = g[keys[0]];
      var left = diffDays(today, k[1]);
      $('alert').style.display = '';
      $('alert').innerHTML = '<div class="sc-note warn">' +
        '<b>' + fmtMDw(k[0]) + ' 지정 추정 ' + n + '종목</b>은 90거래일 시한이 <b>' + fmtMDw(k[2]) + '</b>이에요. ' +
        '45거래일 연속 1,000원 이상을 채우려면 늦어도 <b>' + fmtMDw(k[1]) + '</b>' + (left >= 0 ? '(' + ddayText(left) + ')' : '') + '에는 회복을 시작해야 해요. (추정)' +
        '</div>';
    }

    function drawFilters() {
      var row1 = chip('tier', 'danger', '관리종목 요건 충족', st.tier === 'danger', D.danger.length) + chip('tier', 'warn', '1,000원 미만 진행 중', st.tier === 'warn', D.warn.length);
      var all = D.danger.concat(D.warn), cnt = {};
      all.forEach(function (it) { if (it.mkt) cnt[it.mkt] = (cnt[it.mkt] || 0) + 1; });
      var mk = Object.keys(cnt).sort(function (a, b) { return cnt[b] - cnt[a]; });
      var row2 = mk.length > 1 ? chip('mkt', 'all', '전체 시장', st.mkt === 'all') + mk.map(function (m) { return chip('mkt', m, m, st.mkt === m); }).join('') : '';
      $('filters').innerHTML = '<div class="pn-frow">' + row1 + '</div>' + (row2 ? '<div class="pn-frow">' + row2 + '</div>' : '');
    }

    function step(label, y, opt) {
      if (!y) return '<div class="pn-step"><div class="k">' + label + '</div><div class="v" style="color:var(--muted)">-</div></div>';
      var left = diffDays(today, y);
      var cls = opt && opt.hot && left >= 0 ? ' hot' : (left < 0 ? ' over' : '');
      var dd = opt && opt.dday && left >= 0 ? '<span class="d">' + ddayText(left) + '</span>' : (left < 0 && opt && opt.dday ? '<span class="d" style="color:var(--sub)">지남</span>' : '');
      return '<div class="pn-step' + cls + '"><div class="k">' + label + '</div><div class="v">' + fmtMDw(y) + (tentative(y) ? '*' : '') + dd + '</div></div>';
    }

    function itemHtml(it) {
      var danger = it.tier === 'danger';
      var head = '<div class="pn-top"><div class="pn-l">' +
        '<div class="pn-name"><span class="n">' + U.esc(it.name) + '</span>' +
        (it.mkt ? '<span class="pn-tag">' + U.esc(it.mkt) + '</span>' : '') +
        (danger ? '<span class="pn-tag hot">관리종목 요건</span>' : '') + '</div>' +
        '<div class="pn-meta">' + U.esc(it.code) + ' · 1,000원 미만 <b style="color:var(--ink)">' + it.streak + '거래일</b> 연속' +
        (it.ref > it.streak ? ' <span style="color:var(--muted)">(7/1 이전 포함 ' + it.ref + '일)</span>' : '') + '</div></div>' +
        '<div class="pn-r"><div class="pn-p">' + (isFinite(it.close) ? U.won(it.close) + '원' : '-') + '</div>' +
        '<div class="pn-need">' + (isFinite(it.need) && it.need > 0 ? '1,000원까지 <b class="up">+' + (it.need * 100).toFixed(1) + '%</b>' : '') + '</div></div></div>';
      var body;
      if (danger) {
        body = '<div class="pn-steps">' +
          step('관리종목 지정(추정)', it.desig) +
          step('회복 시작 마지노선', it.lastStart, { hot: true, dday: true }) +
          step('90거래일 시한', it.end90, { dday: true }) + '</div>';
      } else {
        var pct = Math.min(100, it.streak / DESIG * 100);
        var hot = it.streak >= 20;
        body = '<div class="pn-bar"><i class="' + (hot ? 'hot' : '') + '" style="width:' + Math.max(3, pct) + '%"></i></div>' +
          '<div class="pn-bar-l"><span>' + it.streak + ' / ' + DESIG + '거래일</span><span>' +
          (it.desig ? '이대로면 <b>' + fmtMDw(it.desig) + (tentative(it.desig) ? '*' : '') + '</b> 지정 (' + (DESIG - it.streak) + '거래일 남음)' : (DESIG - it.streak) + '거래일 남음') + '</span></div>';
      }
      return '<div class="pn-item">' + head + body + '</div>';
    }

    function drawList() {
      var list = applyFilter(D, st);
      $('count').innerHTML = '<span>' + (list.length ? U.int(list.length) + '종목' : '') + '</span>' +
        '<span class="pn-sort"><button type="button" data-k="sort" data-v="streak" class="' + (st.sort === 'streak' ? 'on' : '') + '">연속일수순</button>' +
        '<button type="button" data-k="sort" data-v="price" class="' + (st.sort === 'price' ? 'on' : '') + '">종가 낮은순</button></span>';
      if (!list.length) {
        $('list').innerHTML = '<div class="pn-empty">' + (st.q.trim() ? '검색 결과가 없어요. 1,000원 이상으로 거래 중인 종목일 수 있어요.' : '현재 해당하는 종목이 없어요.') + '</div>';
        $('more').innerHTML = '';
        return;
      }
      $('list').innerHTML = list.slice(0, st.shown).map(itemHtml).join('');
      var rest = list.length - st.shown;
      $('more').innerHTML = rest > 0 ? '<button type="button" class="sc-btn ghost pn-more" id="moreBtn">' + Math.min(rest, PAGE) + '종목 더 보기</button>' : '';
    }

    function drawAll() { drawKpis(); drawAlert(); drawFilters(); drawList(); }

    wrap.addEventListener('click', function (e) {
      var t = e.target.closest('button');
      if (!t || !D) return;
      if (t.id === 'moreBtn') { st.shown += PAGE; drawList(); return; }
      var k = t.getAttribute('data-k'), v = t.getAttribute('data-v');
      if (k === 'tier') st.tier = v;
      else if (k === 'mkt') st.mkt = v;
      else if (k === 'sort') st.sort = v;
      else return;
      st.shown = PAGE;
      drawFilters(); drawList();
    });
    $('q').addEventListener('input', function (e) { st.q = e.target.value; st.shown = PAGE; if (D) drawList(); });

    function load(retry) {
      var ctl = typeof AbortController !== 'undefined' ? new AbortController() : null;
      var timer = ctl ? setTimeout(function () { ctl.abort(); }, 20000) : null;
      fetch(API_URL, { cache: 'no-store', signal: ctl ? ctl.signal : undefined })
        .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
        .then(function (j) { if (timer) clearTimeout(timer); D = normalize(j); drawAll(); })
        .catch(function (err) {
          if (timer) clearTimeout(timer);
          if (!retry) { setTimeout(function () { load(true); }, 1500); return; }
          $('list').innerHTML = '<div class="sc-note warn">데이터를 불러오지 못했어요. 잠시 후 새로고침해 주세요.<br><span style="font-size:12px">' +
            U.esc(err && err.name === 'AbortError' ? '응답 시간 초과' : String(err && err.message || err)) + '</span></div>';
          $('kpis').innerHTML = U.kpi('관리종목 요건 충족', '-', '불러오기 실패', true);
        });
    }
    load(false);
  }

  function reg() { window.SCTools.register({ id: 'penny-delisting', css: CSS, render: render }); }
  if (window.SCTools) reg(); else document.addEventListener('DOMContentLoaded', function () { if (window.SCTools) reg(); });
})();
