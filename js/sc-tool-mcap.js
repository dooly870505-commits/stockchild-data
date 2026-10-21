/* stockchild.com 시가총액 상장폐지 리스트 (sc-tool-mcap) v1.0 (2026-10-18)
   id: mcap-delisting
   필요 파일: sc-ui.js
   데이터: 동전주 모니터링 Apps Script 웹앱 ?type=mcap (정식 /exec 주소, 서버 수정 없음)
   { updatedAt, baseDate, legalStart, rule:{KOSPI:{legal, watch, next}, KOSDAQ:{...}},
     summary:{KOSPI:{danger, watch, next, qualified}, KOSDAQ:{...}},
     items:[{code, name, market, mcap(억원), tier(기준미달|경계|차기기준미달), legalGap, nextGap, refStreak, legalStreak, qualified}] }
   상황 메모 (2026.10.16 기준): 시총 미달 관리종목 지정은 유지, 이후 상장폐지 절차는 법원 가처분으로 10.2부터 유예.
   추가 상향(코스피 500억, 코스닥 300억)은 2027.7.1로 연기. 상황이 바뀌면 NOTICE 를 고친다. */
(function () {
  'use strict';

  var API_URL = 'https://script.google.com/macros/s/AKfycbwQyi6fyoE8247FBZo8uumF60f9NrzUsBrCsz2p9--Z2aXE-irEW-LJhSpUDswMvo4A-Q/exec?type=mcap';
  var PAGE = 20, DESIG = 30;
  var RULE_FB = { KOSPI: { legal: 300, watch: 350, next: 500 }, KOSDAQ: { legal: 200, watch: 250, next: 300 } };
  var MKT_KO = { KOSPI: '코스피', KOSDAQ: '코스닥', KONEX: '코넥스' };
  var NEXT_LABEL = '2027.7';

  var NOTICE = {
    date: '2026.10.16 기준',
    title: '관리종목 지정은 유지, 상장폐지 절차만 멈춘 상태예요',
    lines: [
      '<b>10.2</b> 법원이 시가총액 미달 상장폐지 결정에 대한 효력정지 가처분을 인용했어요. 관리종목 지정에 대한 신청은 기각됐어요.',
      '<b>10.7</b> 한국거래소는 관리종목 지정은 그대로 두고, 이후 상장폐지 절차를 10월 2일부터 유예한다고 밝혔어요.',
      '<b>예외</b> 10월 2일 이전 상장폐지가 결정돼 거래정지된 8개사는 거래정지가 유지돼요.',
      '<b>기준 상향 연기</b> 코스피 500억원, 코스닥 300억원 기준은 2027년 7월 1일로 미뤄졌어요.'
    ],
    foot: '유예는 상장폐지 사유가 해소됐다는 뜻이 아니에요. 법원 판단에 따라 절차가 재개될 수 있어요. 동전주(주가 1,000원 미만) 요건은 유예 대상이 아니에요.'
  };

  function digits(v) { return String(v == null ? '' : v).replace(/[^0-9]/g, ''); }
  function ymdOf(v) { var d = digits(v); return d.length >= 8 ? d.slice(0, 8) : ''; }
  function fmtFull(y) { return y ? y.slice(0, 4) + '.' + y.slice(4, 6) + '.' + y.slice(6, 8) : '-'; }
  function num(v) { var n = parseFloat(String(v == null ? '' : v).replace(/[^0-9.\-]/g, '')); return isFinite(n) ? n : NaN; }
  function eok(n) { return isFinite(n) ? Number(n).toLocaleString('ko-KR', { maximumFractionDigits: 1 }) : '-'; }
  function codeOf(c) { c = String(c == null ? '' : c).trim().toUpperCase(); return /^\d+$/.test(c) && c.length < 6 ? ('000000' + c).slice(-6) : c; }

  // ---------- 정제 ----------
  function normalize(json) {
    if (!json || typeof json !== 'object') throw new Error('데이터 형식이 올바르지 않아요');
    if (json.error) throw new Error(String(json.error));
    var rule = {};
    ['KOSPI', 'KOSDAQ'].forEach(function (m) {
      var r = (json.rule && json.rule[m]) || {};
      rule[m] = { legal: num(r.legal) || RULE_FB[m].legal, watch: num(r.watch) || RULE_FB[m].watch, next: num(r.next) || RULE_FB[m].next };
    });
    var items = (Array.isArray(json.items) ? json.items : []).map(function (it) {
      if (!it || typeof it !== 'object') return null;
      var name = String(it.name || '').replace(/^\s*(주식회사|㈜|\(주\))\s*/, '').trim();
      var m = String(it.market || '').trim().toUpperCase();
      var mcap = num(it.mcap);
      if (!name || !isFinite(mcap) || !rule[m]) return null;
      var tier = String(it.tier || '').trim();
      if (['기준미달', '경계', '차기기준미달'].indexOf(tier) === -1) {
        tier = mcap < rule[m].legal ? '기준미달' : mcap < rule[m].watch ? '경계' : '차기기준미달';
      }
      var streak = Math.round(num(it.legalStreak)); if (!isFinite(streak) || streak < 0) streak = 0;
      var ref = Math.round(num(it.refStreak));
      return {
        code: codeOf(it.code), name: name, m: m, mkt: MKT_KO[m] || m, mcap: mcap, tier: tier,
        streak: streak, ref: isFinite(ref) ? ref : streak,
        qualified: it.qualified === true || it.qualified === 'true' || streak >= DESIG,
        legal: rule[m].legal, next: rule[m].next
      };
    }).filter(Boolean);
    return { base: ymdOf(json.baseDate), updated: String(json.updatedAt || ''), rule: rule, items: items };
  }

  // s: { tab: qualified|기준미달|경계|차기기준미달, mkt, q, sort }
  function applyFilter(D, s) {
    var q = String(s.q || '').trim().toUpperCase();
    var out = D.items.filter(function (it) {
      if (s.mkt && s.mkt !== 'all' && it.m !== s.mkt) return false;
      if (q) return it.name.toUpperCase().indexOf(q) !== -1 || it.code.indexOf(q) !== -1; // 검색은 모든 구간에서
      if (s.tab === 'qualified') return it.qualified;
      return it.tier === s.tab;
    });
    var byStreak = function (a, b) { return b.streak - a.streak || a.mcap - b.mcap; };
    var byCap = function (a, b) { return a.mcap - b.mcap; };
    var byRoom = function (a, b) { return (a.mcap - a.legal) - (b.mcap - b.legal); };
    out.sort(s.sort === 'cap' ? byCap : (s.tab === '기준미달' || s.tab === 'qualified') ? byStreak : byRoom);
    return out;
  }

  window.SCMcap = { normalize: normalize, applyFilter: applyFilter };

  // ---------- 화면 ----------
  var CSS = [
    '.mc-search{display:flex;align-items:center;height:48px;padding:0 14px;border:1px solid var(--line2);border-radius:var(--r-sm);background:#fff;transition:border-color .15s,box-shadow .15s}',
    '.mc-search:focus-within{border-color:var(--ink);box-shadow:0 0 0 3px rgba(22,24,29,.08)}',
    '.mc-search .ic{color:var(--muted);margin-right:8px;font-size:15px}',
    '.mc-search input{flex:1;min-width:0;border:0;outline:0;background:transparent;font:inherit;font-size:16px;color:var(--ink)}',
    '.mc-search input::placeholder{color:var(--muted)}',
    '.mc-filters{display:flex;flex-direction:column;gap:8px;margin-top:12px}',
    '.mc-frow{display:flex;flex-wrap:wrap;gap:6px}',
    '.sc-chip .c{margin-left:5px;opacity:.55;font-weight:700}',
    '.sc-chip.on .c{opacity:.75}',
    '.mc-desc{font-size:12.5px;color:var(--sub);line-height:1.6;margin-top:12px}',
    '.mc-desc b{color:var(--ink)}',
    '.mc-count{display:flex;justify-content:space-between;align-items:center;margin-top:14px;font-size:12px;color:var(--sub)}',
    '.mc-sort{display:flex;gap:2px}',
    '.mc-sort button{border:0;background:none;font:inherit;font-size:12px;color:var(--muted);padding:4px 6px;cursor:pointer;border-radius:6px}',
    '.mc-sort button.on{color:var(--ink);font-weight:700}',
    '.mc-list{margin-top:8px;display:grid;gap:8px}',
    '.mc-item{padding:14px 16px;border:1px solid var(--line);border-radius:var(--r-md);background:#fff}',
    '.mc-top{display:flex;justify-content:space-between;align-items:flex-start;gap:12px}',
    '.mc-l{flex:1;min-width:0}',
    '.mc-name{display:flex;align-items:center;gap:6px;font-size:15px;font-weight:700;min-width:0;flex-wrap:wrap}',
    '.mc-tag{flex:none;font-size:11px;font-weight:600;color:var(--sub);background:var(--soft);border-radius:6px;padding:2px 6px}',
    '.mc-tag.hot{color:var(--brand);background:var(--brand-bg);font-weight:700}',
    '.mc-meta{font-size:12.5px;color:var(--sub);margin-top:4px}',
    '.mc-r{flex:none;text-align:right}',
    '.mc-cap{font-size:17px;font-weight:700}',
    '.mc-cap small{font-size:12px;font-weight:600;color:var(--sub);margin-left:2px}',
    '.mc-gap{font-size:12px;color:var(--sub);margin-top:3px;white-space:nowrap}',
    '.mc-bar{position:relative;height:6px;background:var(--soft);border-radius:3px;margin-top:12px;overflow:hidden}',
    '.mc-bar i{position:absolute;left:0;top:0;bottom:0;background:var(--line2);border-radius:3px}',
    '.mc-bar i.hot{background:var(--brand)}',
    '.mc-bar-l{display:flex;justify-content:space-between;font-size:12px;color:var(--sub);margin-top:6px}',
    '.mc-bar-l b{color:var(--ink)}',
    '.mc-mkts{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px}',
    '.mc-mk{border:1px solid var(--line);border-radius:var(--r-sm);padding:10px 12px}',
    '.mc-mk .h{font-size:12px;color:var(--sub);margin-bottom:6px}',
    '.mc-mk .r{display:flex;justify-content:space-between;font-size:13px;padding:2px 0}',
    '.mc-mk .r b{font-variant-numeric:tabular-nums}',
    '.mc-notice ul{margin:6px 0 0;padding-left:18px}',
    '.mc-notice li{margin-bottom:2px}',
    '.mc-notice .t{display:flex;flex-wrap:wrap;justify-content:space-between;gap:4px 10px;font-weight:700;color:var(--ink)}',
    '.mc-notice .t span{font-weight:400;font-size:12px;color:var(--sub)}',
    '.mc-notice .f{margin-top:6px;font-size:12px}',
    '.mc-empty{padding:28px 16px;text-align:center;color:var(--muted);font-size:14px;border:1px dashed var(--line2);border-radius:var(--r-md)}',
    '.mc-skel{height:80px;border-radius:var(--r-md);background:linear-gradient(90deg,var(--soft),#fafbfc,var(--soft));background-size:200% 100%;animation:mc-sh 1.2s infinite}',
    '@keyframes mc-sh{0%{background-position:200% 0}100%{background-position:-200% 0}}',
    '.mc-more{width:100%;margin-top:12px}',
    '#kpis{grid-template-columns:2fr 1fr 1fr}',
    '@media (max-width:640px){#kpis{grid-template-columns:1fr 1fr}#kpis .sc-kpi.main{grid-column:1/-1}}',
    '@media (max-width:480px){.mc-item{padding:12px 14px}.mc-mkts{grid-template-columns:1fr}}'
  ].join('');

  var TAB_LABEL = { qualified: '관리종목 요건 충족', '기준미달': '현행 기준 미달', '경계': '경계', '차기기준미달': NEXT_LABEL + ' 기준만 미달' };

  function render(wrap, U) {
    var D = null;
    var st = { tab: 'qualified', mkt: 'all', q: '', sort: 'auto', shown: PAGE };

    wrap.innerHTML =
      '<div class="sc-card">' +
      U.header('상장폐지 조기경보', '시가총액 상장폐지 리스트', '시가총액이 상장 유지 기준에 못 미치거나 가까운 종목을 매일 확인해요.') +
      '<div class="sc-sec"><div class="sc-note warn mc-notice"><div class="t">' + NOTICE.title + '<span>' + NOTICE.date + '</span></div><ul>' +
      NOTICE.lines.map(function (l) { return '<li>' + l + '</li>'; }).join('') + '</ul><div class="f">' + NOTICE.foot + '</div></div></div>' +
      '<div class="sc-sec"><div class="sc-kpis" id="kpis">' + U.kpi('관리종목 요건 충족', '-', '불러오는 중', true) + U.kpi('현행 기준 미달', '-', '') + U.kpi(NEXT_LABEL + ' 기준 미달 예상', '-', '') + '</div>' +
      '<div class="mc-mkts" id="mkts"></div></div>' +
      '<div class="sc-sec">' +
      '<label class="mc-search"><span class="ic">🔍</span><input id="q" type="search" placeholder="종목명 또는 종목코드 (모든 구간에서 검색)" autocomplete="off"></label>' +
      '<div class="mc-filters" id="filters"></div>' +
      '<div class="mc-desc" id="desc"></div>' +
      '<div class="mc-count" id="count"></div>' +
      '<div class="mc-list" id="list"><div class="mc-skel"></div><div class="mc-skel"></div></div>' +
      '<div id="more"></div>' +
      '</div>' +
      '<div class="sc-sec"><div class="sc-note">시가총액 기준에 <b>30거래일 연속</b> 못 미치면 관리종목 지정 요건이 돼요. 관리종목 지정 자체가 곧 상장폐지는 아니며, 시가총액 미달 관리종목 중 일정 재무요건을 갖춘 기업은 정리매매 없이 코넥스 이전상장을 신청할 수 있어요(자본잠식 기업 제외). SPAC과 우선주는 집계에서 뺐어요.</div></div>' +
      '<div class="sc-foot" id="foot">시가총액은 공공데이터포털(금융위원회 주식시세정보) 종가로 계산한 값이라 한국거래소 공식 산정치와 다를 수 있어요. 관리종목 요건 충족은 법적 연속일수로 계산한 추정치이며, 실제 지정 현황은 한국거래소 공시를 따릅니다. 투자 참고용이며 매수/매도 추천이 아닙니다. | stockchild.com</div>' +
      '</div>';

    var $ = function (id) { return wrap.querySelector('#' + id); };

    function chip(k, v, label, on, count) {
      return '<button type="button" class="sc-chip' + (on ? ' on' : '') + '" data-k="' + k + '" data-v="' + U.esc(v) + '">' +
        U.esc(label) + (count != null ? '<span class="c">' + U.int(count) + '</span>' : '') + '</button>';
    }

    function inMkt(it) { return st.mkt === 'all' || it.m === st.mkt; }
    function cnt(pred) { return D.items.filter(function (it) { return inMkt(it) && pred(it); }).length; }

    function drawKpis() {
      var q = cnt(function (x) { return x.qualified; }), d = cnt(function (x) { return x.tier === '기준미달'; });
      var nx = cnt(function (x) { return x.tier === '차기기준미달'; }) + d + cnt(function (x) { return x.tier === '경계'; });
      var r = D.rule;
      $('kpis').innerHTML =
        U.kpi('관리종목 요건 충족', U.int(q) + '<small>종목</small>', DESIG + '거래일 연속 기준 미달 · 기준일 ' + fmtFull(D.base), true) +
        U.kpi('현행 기준 미달', U.int(d) + '<small>종목</small>', '코스피 ' + r.KOSPI.legal + '억 · 코스닥 ' + r.KOSDAQ.legal + '억 미만') +
        U.kpi(NEXT_LABEL + ' 기준 미달 예상', U.int(nx) + '<small>종목</small>', '코스피 ' + r.KOSPI.next + '억 · 코스닥 ' + r.KOSDAQ.next + '억 미만, 현행 미달 포함');
      $('mkts').innerHTML = ['KOSPI', 'KOSDAQ'].map(function (m) {
        var xs = D.items.filter(function (x) { return x.m === m; });
        function c(p) { return xs.filter(p).length; }
        return '<div class="mc-mk"><div class="h">' + MKT_KO[m] + ' (현행 ' + r[m].legal + '억 · ' + NEXT_LABEL + ' ' + r[m].next + '억)</div>' +
          '<div class="r"><span>요건 충족</span><b>' + c(function (x) { return x.qualified; }) + '</b></div>' +
          '<div class="r"><span>현행 기준 미달</span><b>' + c(function (x) { return x.tier === '기준미달'; }) + '</b></div>' +
          '<div class="r"><span>경계 (' + r[m].legal + '～' + r[m].watch + '억)</span><b>' + c(function (x) { return x.tier === '경계'; }) + '</b></div>' +
          '<div class="r"><span>' + NEXT_LABEL + ' 기준만 미달</span><b>' + c(function (x) { return x.tier === '차기기준미달'; }) + '</b></div></div>';
      }).join('');
    }

    function drawFilters() {
      var row1 = ['qualified', '기준미달', '경계', '차기기준미달'].map(function (t) {
        return chip('tab', t, TAB_LABEL[t], st.tab === t, cnt(t === 'qualified' ? function (x) { return x.qualified; } : function (x) { return x.tier === t; }));
      }).join('');
      var row2 = chip('mkt', 'all', '전체 시장', st.mkt === 'all') + chip('mkt', 'KOSPI', '코스피', st.mkt === 'KOSPI') + chip('mkt', 'KOSDAQ', '코스닥', st.mkt === 'KOSDAQ');
      $('filters').innerHTML = '<div class="mc-frow">' + row1 + '</div><div class="mc-frow">' + row2 + '</div>';
      var r = D.rule, txt;
      if (st.tab === 'qualified') txt = '현행 기준 미달이 <b>' + DESIG + '거래일 연속</b> 이어져 관리종목 지정 요건을 채운 종목이에요. 지정은 유지되지만 이후 상장폐지 절차는 <b>10월 2일부터 유예 중</b>이에요.';
      else if (st.tab === '기준미달') txt = '현행 기준(<b>코스피 ' + r.KOSPI.legal + '억 · 코스닥 ' + r.KOSDAQ.legal + '억</b>)에 못 미치는 종목이에요. ' + DESIG + '거래일 연속이면 관리종목 지정 요건이 돼요.';
      else if (st.tab === '경계') txt = '기준선 바로 위(<b>코스피 ' + r.KOSPI.legal + '～' + r.KOSPI.watch + '억 · 코스닥 ' + r.KOSDAQ.legal + '～' + r.KOSDAQ.watch + '억</b>)에 있는 종목이에요. 주가가 내리면 기준 미달로 바뀔 수 있어요.';
      else txt = '지금은 기준을 넘지만 <b>' + NEXT_LABEL + ' 상향 기준(코스피 ' + r.KOSPI.next + '억 · 코스닥 ' + r.KOSDAQ.next + '억)</b>에는 못 미치는 종목이에요.';
      $('desc').innerHTML = st.q.trim() ? '모든 구간에서 검색한 결과예요.' : txt;
    }

    function itemHtml(it) {
      var searching = !!st.q.trim();
      var tierTag = searching && !it.qualified ? '<span class="mc-tag">' + TAB_LABEL[it.tier] + '</span>' : '';
      var gapTxt;
      if (it.tier === '기준미달') gapTxt = '기준까지 <b class="up">+' + ((it.legal / it.mcap - 1) * 100).toFixed(1) + '%</b> · ' + eok(it.legal - it.mcap) + '억 부족';
      else if (it.tier === '경계') gapTxt = '기준 위 여유 <b>' + eok(it.mcap - it.legal) + '억</b> (' + ((1 - it.legal / it.mcap) * 100).toFixed(1) + '%)';
      else gapTxt = NEXT_LABEL + ' 기준까지 <b class="up">+' + ((it.next / it.mcap - 1) * 100).toFixed(1) + '%</b>';
      var head = '<div class="mc-top"><div class="mc-l">' +
        '<div class="mc-name">' + U.esc(it.name) + '<span class="mc-tag">' + U.esc(it.mkt) + '</span>' +
        (it.qualified ? '<span class="mc-tag hot">관리종목 요건</span>' : '') + tierTag + '</div>' +
        '<div class="mc-meta">' + U.esc(it.code) + (it.streak > 0 ? ' · 기준 미달 <b style="color:var(--ink)">' + it.streak + '거래일</b> 연속' + (it.ref > it.streak ? ' <span style="color:var(--muted)">(7/1 이전 포함 ' + it.ref + '일)</span>' : '') : '') + '</div></div>' +
        '<div class="mc-r"><div class="mc-cap">' + eok(it.mcap) + '<small>억원</small></div><div class="mc-gap">' + gapTxt + '</div></div></div>';
      var body = '';
      if (it.tier === '기준미달' && !it.qualified) {
        var pct = Math.min(100, it.streak / DESIG * 100), hot = it.streak >= 20;
        body = '<div class="mc-bar"><i class="' + (hot ? 'hot' : '') + '" style="width:' + Math.max(3, pct) + '%"></i></div>' +
          '<div class="mc-bar-l"><span>' + it.streak + ' / ' + DESIG + '거래일</span><span><b>' + Math.max(0, DESIG - it.streak) + '거래일</b> 더 이어지면 요건 충족</span></div>';
      }
      return '<div class="mc-item">' + head + body + '</div>';
    }

    function drawList() {
      var list = applyFilter(D, st);
      var auto = st.tab === '기준미달' || st.tab === 'qualified' ? '연속일수순' : '기준선 가까운순';
      $('count').innerHTML = '<span>' + (list.length ? U.int(list.length) + '종목' : '') + '</span>' +
        '<span class="mc-sort"><button type="button" data-k="sort" data-v="auto" class="' + (st.sort === 'auto' ? 'on' : '') + '">' + auto + '</button>' +
        '<button type="button" data-k="sort" data-v="cap" class="' + (st.sort === 'cap' ? 'on' : '') + '">시총 작은순</button></span>';
      if (!list.length) {
        $('list').innerHTML = '<div class="mc-empty">' + (st.q.trim() ? '검색 결과가 없어요. 기준과 거리가 먼 종목은 목록에 없어요.' : '해당 구간에 종목이 없어요.') + '</div>';
        $('more').innerHTML = '';
        return;
      }
      $('list').innerHTML = list.slice(0, st.shown).map(itemHtml).join('');
      var rest = list.length - st.shown;
      $('more').innerHTML = rest > 0 ? '<button type="button" class="sc-btn ghost mc-more" id="moreBtn">' + Math.min(rest, PAGE) + '종목 더 보기 <span style="color:var(--muted);margin-left:6px">' + U.int(rest) + '종목 남음</span></button>' : '';
    }

    function drawAll() { drawKpis(); drawFilters(); drawList(); }

    wrap.addEventListener('click', function (e) {
      var t = e.target.closest('button');
      if (!t || !D) return;
      if (t.id === 'moreBtn') { st.shown += PAGE; drawList(); return; }
      var k = t.getAttribute('data-k'), v = t.getAttribute('data-v');
      if (k === 'tab') { st.tab = v; st.sort = 'auto'; }
      else if (k === 'mkt') st.mkt = v;
      else if (k === 'sort') st.sort = v;
      else return;
      st.shown = PAGE;
      drawAll();
    });
    $('q').addEventListener('input', function (e) { st.q = e.target.value; st.shown = PAGE; if (D) { drawFilters(); drawList(); } });

    function load(retry) {
      var ctl = typeof AbortController !== 'undefined' ? new AbortController() : null;
      var timer = ctl ? setTimeout(function () { ctl.abort(); }, 25000) : null;
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

  function reg() { window.SCTools.register({ id: 'mcap-delisting', css: CSS, render: render }); }
  if (window.SCTools) reg(); else document.addEventListener('DOMContentLoaded', function () { if (window.SCTools) reg(); });
})();
