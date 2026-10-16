/* stockchild.com 보호예수 해제 종목 (sc-tool-lockup) v1.0 (2026-10-16)
   id: lockup-release
   필요 파일: sc-ui.js
   데이터: 보호예수 모니터링 Apps Script 웹앱 JSON (기존 위젯과 같은 주소, 서버 수정 없음)
   { 기준일자:'YYYYMMDD', 요약:{전체건수, 대량해제건수},
     전체:[{해제일자, 종목코드, 종목명, 시장구분, 보호예수사유, 해제비율, 대량해제}] } */
(function () {
  'use strict';

  var API_URL = 'https://script.google.com/macros/s/AKfycbxgiFLQSKfVUuYOZMY-9oQ_ijobuhX5FYXnq0RPmkRa7VAS_xDNUG0kcjBGdjwIm6nnXw/exec';
  var PAGE = 30;      // 한 번에 보여줄 개수
  var BIG = 10;       // 대량해제 기준 (해제비율 %)
  var PERIODS = [7, 14, 30];
  var WD = ['일', '월', '화', '수', '목', '금', '토'];
  var MKT_KO = { KOSDAQ: '코스닥', KOSPI: '코스피', KONEX: '코넥스' };  // 화면 표시용 한글 시장명

  // ---------- 날짜 도우미 (YYYYMMDD 문자열) ----------
  function digits(v) { return String(v == null ? '' : v).replace(/[^0-9]/g, ''); }
  function normYmd(v) { var d = digits(v); return d.length >= 8 ? d.slice(0, 8) : ''; }
  function kstToday() {
    var s = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
    return digits(s).slice(0, 8);
  }
  function utc(ymd) { return Date.UTC(+ymd.slice(0, 4), +ymd.slice(4, 6) - 1, +ymd.slice(6, 8)); }
  function daysAgo(ymd, today) { return Math.round((utc(today) - utc(ymd)) / 86400000); }
  function fmtMD(ymd) { return ymd.slice(4, 6) + '.' + ymd.slice(6, 8) + '(' + WD[new Date(utc(ymd)).getUTCDay()] + ')'; }
  function fmtFull(ymd) { return ymd ? ymd.slice(0, 4) + '.' + ymd.slice(4, 6) + '.' + ymd.slice(6, 8) : '-'; }
  function agoText(n) { return n <= 0 ? '오늘' : n + '일 전'; }

  // ---------- 서버 JSON 방어적 정제 ----------
  function normalize(json) {
    if (!json || typeof json !== 'object') throw new Error('데이터 형식이 올바르지 않아요');
    if (json.error) throw new Error(String(json.error));
    var raw = Array.isArray(json['전체']) ? json['전체'] : [];
    var items = [];
    raw.forEach(function (it) {
      if (!it || typeof it !== 'object') return;
      var ymd = normYmd(it['해제일자']);
      var name = String(it['종목명'] || '').replace(/^\s*(주식회사|\(주\)|㈜)\s*/, '').trim();
      if (!ymd || !name) return;
      var code = String(it['종목코드'] == null ? '' : it['종목코드']).trim().toUpperCase();
      if (/^\d+$/.test(code) && code.length < 6) code = ('000000' + code).slice(-6);
      var ratio = parseFloat(String(it['해제비율']).replace(/[^0-9.\-]/g, ''));
      if (!isFinite(ratio)) ratio = NaN;
      var flag = it['대량해제'];
      var big = flag === true || flag === 'true' || flag === 'Y' || (isFinite(ratio) && ratio >= BIG);
      items.push({
        ymd: ymd, code: code, name: name,
        mkt: (function (m) { return MKT_KO[m.toUpperCase()] || m; })(String(it['시장구분'] || '').trim()),
        reason: String(it['보호예수사유'] || '').trim(),
        ratio: ratio, big: big
      });
    });
    items.sort(sortByDate);
    return { base: normYmd(json['기준일자']) || (items[0] ? items[0].ymd : ''), items: items };
  }
  function sortByDate(a, b) { return a.ymd < b.ymd ? 1 : a.ymd > b.ymd ? -1 : (b.ratio || 0) - (a.ratio || 0); }
  function sortByRatio(a, b) { return (isFinite(b.ratio) ? b.ratio : -1) - (isFinite(a.ratio) ? a.ratio : -1) || (a.ymd < b.ymd ? 1 : -1); }

  function inPeriod(it, period, today) { return daysAgo(it.ymd, today) <= period; }

  // s: { period, mkt, bigOnly, q, sort }
  function applyFilter(items, s, today) {
    var q = String(s.q || '').trim().toUpperCase();
    var out = items.filter(function (it) {
      if (!inPeriod(it, s.period, today)) return false;
      if (s.mkt && s.mkt !== 'all' && it.mkt !== s.mkt) return false;
      if (s.bigOnly && !it.big) return false;
      if (q && it.name.toUpperCase().indexOf(q) === -1 && it.code.indexOf(q) === -1) return false;
      return true;
    });
    out.sort(s.sort === 'ratio' ? sortByRatio : sortByDate);
    return out;
  }

  function markets(items) {
    var cnt = {};
    items.forEach(function (it) { if (it.mkt) cnt[it.mkt] = (cnt[it.mkt] || 0) + 1; });
    return Object.keys(cnt).sort(function (a, b) { return cnt[b] - cnt[a]; });
  }

  window.SCLockup = { normalize: normalize, applyFilter: applyFilter, daysAgo: daysAgo, markets: markets, fmtMD: fmtMD };

  // ---------- 화면 ----------
  var CSS = [
    '.lk-search{display:flex;align-items:center;height:48px;padding:0 14px;border:1px solid var(--line2);border-radius:var(--r-sm);background:#fff;transition:border-color .15s,box-shadow .15s}',
    '.lk-search:focus-within{border-color:var(--ink);box-shadow:0 0 0 3px rgba(22,24,29,.08)}',
    '.lk-search .ic{color:var(--muted);margin-right:8px;font-size:15px}',
    '.lk-search input{flex:1;min-width:0;border:0;outline:0;background:transparent;font:inherit;font-size:16px;color:var(--ink)}',
    '.lk-search input::placeholder{color:var(--muted)}',
    '.lk-filters{display:flex;flex-direction:column;gap:8px;margin-top:12px}',
    '.lk-frow{display:flex;flex-wrap:wrap;gap:6px}',
    '.sc-chip .c{margin-left:5px;opacity:.55;font-weight:700}',
    '.sc-chip.on .c{opacity:.75}',
    '.lk-list{margin-top:14px;display:grid;gap:8px}',
    '.lk-item{display:flex;justify-content:space-between;align-items:center;gap:14px;padding:14px 16px;border:1px solid var(--line);border-radius:var(--r-md);background:#fff}',
    '.lk-l{flex:1;min-width:0}',
    '.lk-name{display:flex;align-items:center;gap:6px;font-size:15px;font-weight:700;min-width:0}',
    '.lk-name .n{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
    '.lk-tag{flex:none;font-size:11px;font-weight:600;color:var(--sub);background:var(--soft);border-radius:6px;padding:2px 6px}',
    '.lk-big{flex:none;font-size:11px;font-weight:700;color:var(--brand);background:var(--brand-bg);border-radius:6px;padding:2px 6px}',
    '.lk-meta{font-size:12.5px;color:var(--sub);margin-top:4px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
    '.lk-r{flex:0 0 116px;text-align:right}',
    '.lk-pct{font-size:17px;font-weight:700;letter-spacing:-0.01em}',
    '.lk-pct.big{color:var(--brand)}',
    '.lk-bar{height:4px;background:var(--soft);border-radius:2px;margin-top:6px;overflow:hidden}',
    '.lk-bar i{display:block;height:100%;background:var(--line2);border-radius:2px}',
    '.lk-bar i.big{background:var(--brand)}',
    '.lk-date{font-size:12px;color:var(--muted);margin-top:6px;white-space:nowrap}',
    '.lk-empty{padding:28px 16px;text-align:center;color:var(--muted);font-size:14px;border:1px dashed var(--line2);border-radius:var(--r-md)}',
    '.lk-skel{height:66px;border-radius:var(--r-md);background:linear-gradient(90deg,var(--soft),#fafbfc,var(--soft));background-size:200% 100%;animation:lk-sh 1.2s infinite}',
    '@keyframes lk-sh{0%{background-position:200% 0}100%{background-position:-200% 0}}',
    '.lk-more{width:100%;margin-top:12px}',
    '.lk-count{display:flex;justify-content:space-between;align-items:center;margin-top:16px;font-size:12px;color:var(--sub)}',
    '.lk-sort{display:flex;gap:2px}',
    '.lk-sort button{border:0;background:none;font:inherit;font-size:12px;color:var(--muted);padding:4px 6px;cursor:pointer;border-radius:6px}',
    '.lk-sort button.on{color:var(--ink);font-weight:700}',
    '.lk-sort button:focus-visible{outline:2px solid var(--focus)}',
    '#kpis{grid-template-columns:2fr 1fr 1fr}',
    '@media (max-width:640px){#kpis{grid-template-columns:1fr 1fr}#kpis .sc-kpi.main{grid-column:1/-1}}',
    '@media (max-width:480px){.lk-item{padding:12px 14px;gap:10px}.lk-r{flex-basis:96px}.lk-pct{font-size:16px}}'
  ].join('');

  function render(wrap, U) {
    var today = kstToday();
    var DATA = null;
    var st = { period: 7, mkt: 'all', bigOnly: false, q: '', sort: 'date', shown: PAGE };

    wrap.innerHTML =
      '<div class="sc-card">' +
      U.header('공시·기업 이력', '보호예수 해제 종목', '의무보유 확약이 풀린 종목을 매일 모아요. 이미 해제된 내역이며, 앞으로의 일정표는 아니에요.') +
      '<div class="sc-sec"><div class="sc-kpis" id="kpis">' +
      U.kpi('최근 7일 해제', '-', '불러오는 중', true) + U.kpi('대량해제 (10%↑)', '-', '') + U.kpi('가장 큰 해제', '-', '') +
      '</div></div>' +
      '<div class="sc-sec">' +
      '<label class="lk-search"><span class="ic">🔍</span><input id="q" type="search" placeholder="종목명 또는 종목코드" autocomplete="off"></label>' +
      '<div class="lk-filters" id="filters"></div>' +
      '<div class="lk-count" id="count"></div>' +
      '<div class="lk-list" id="list"><div class="lk-skel"></div><div class="lk-skel"></div><div class="lk-skel"></div></div>' +
      '<div id="more"></div>' +
      '</div>' +
      '<div class="sc-sec"><div class="sc-note">보호예수(의무보유 확약)가 풀리면 그만큼의 주식이 시장에서 거래될 수 있어 단기 수급 부담이 생길 수 있어요. ' +
      '다만 해제됐다고 바로 매도되는 것은 아니며, <b>보호예수 해제 자체가 악재는 아닙니다.</b> 해제비율이 ' + BIG + '% 이상이면 대량해제로 표시했어요.</div></div>' +
      '<div class="sc-foot" id="foot">한국거래소·예탁결제원 보호예수 해제 이력 공공데이터를 자동 수집한 참고용 자료입니다. 영업일 다음 날 오후 1시 이후 갱신돼요. 투자 참고용이며 매수/매도 추천이 아닙니다. | stockchild.com</div>' +
      '</div>';

    var $ = function (id) { return wrap.querySelector('#' + id); };

    function chip(k, v, label, on, count) {
      return '<button type="button" class="sc-chip' + (on ? ' on' : '') + '" data-k="' + k + '" data-v="' + U.esc(v) + '">' +
        U.esc(label) + (count != null ? '<span class="c">' + count + '</span>' : '') + '</button>';
    }

    function drawFilters() {
      var items = DATA.items;
      var row1 = PERIODS.map(function (p) {
        var n = items.filter(function (it) { return inPeriod(it, p, today); }).length;
        return chip('period', p, '최근 ' + p + '일', st.period === p, n);
      }).join('');
      var mk = markets(items);
      var row2 = (mk.length > 1 ? chip('mkt', 'all', '전체 시장', st.mkt === 'all') + mk.map(function (m) { return chip('mkt', m, m, st.mkt === m); }).join('') : '') +
        chip('big', '1', '대량해제만', st.bigOnly);
      $('filters').innerHTML = '<div class="lk-frow">' + row1 + '</div><div class="lk-frow">' + row2 + '</div>';
    }

    function drawKpis() {
      var base = DATA.items.filter(function (it) {
        return inPeriod(it, st.period, today) && (st.mkt === 'all' || it.mkt === st.mkt);
      });
      var big = base.filter(function (it) { return it.big; });
      var top = base.slice().sort(sortByRatio)[0];
      $('kpis').innerHTML =
        U.kpi('최근 ' + st.period + '일 해제', U.int(base.length) + '<small>건</small>', '기준일 ' + fmtFull(DATA.base), true) +
        U.kpi('대량해제 (' + BIG + '%↑)', U.int(big.length) + '<small>건</small>', base.length ? '같은 기간 해제의 ' + Math.round(big.length / base.length * 100) + '%' : '같은 기간') +
        U.kpi('가장 큰 해제', top && isFinite(top.ratio) ? top.ratio + '<small>%</small>' : '-', top ? U.esc(top.name) + ' · ' + fmtMD(top.ymd) : '해당 없음');
    }

    function itemHtml(it) {
      var ago = daysAgo(it.ymd, today);
      var w = isFinite(it.ratio) ? Math.max(2, Math.min(100, it.ratio)) : 0;
      var meta = [it.code, it.reason].filter(Boolean).map(U.esc).join(' · ');
      return '<div class="lk-item"><div class="lk-l">' +
        '<div class="lk-name"><span class="n">' + U.esc(it.name) + '</span>' +
        (it.mkt ? '<span class="lk-tag">' + U.esc(it.mkt) + '</span>' : '') +
        (it.big ? '<span class="lk-big">대량</span>' : '') + '</div>' +
        '<div class="lk-meta">' + (meta || '&nbsp;') + '</div></div>' +
        '<div class="lk-r"><div class="lk-pct' + (it.big ? ' big' : '') + '">' + (isFinite(it.ratio) ? it.ratio + '%' : '-') + '</div>' +
        '<div class="lk-bar"><i class="' + (it.big ? 'big' : '') + '" style="width:' + w + '%"></i></div>' +
        '<div class="lk-date">' + fmtMD(it.ymd) + ' · ' + agoText(ago) + '</div></div></div>';
    }

    function drawList() {
      var list = applyFilter(DATA.items, st, today);
      $('count').innerHTML = '<span>' + (list.length ? '조건에 맞는 해제 ' + list.length.toLocaleString('ko-KR') + '건' : '') + '</span>' +
        '<span class="lk-sort"><button type="button" data-k="sort" data-v="date" class="' + (st.sort === 'date' ? 'on' : '') + '">최신순</button>' +
        '<button type="button" data-k="sort" data-v="ratio" class="' + (st.sort === 'ratio' ? 'on' : '') + '">해제비율순</button></span>';
      if (!list.length) {
        $('list').innerHTML = '<div class="lk-empty">' + (st.q ? '검색 결과가 없어요. 기간을 넓혀 보세요.' : '이 기간에 해제된 종목이 없어요.') + '</div>';
        $('more').innerHTML = '';
        return;
      }
      $('list').innerHTML = list.slice(0, st.shown).map(itemHtml).join('');
      var rest = list.length - st.shown;
      $('more').innerHTML = rest > 0 ? '<button type="button" class="sc-btn ghost lk-more" id="moreBtn">' + Math.min(rest, PAGE) + '건 더 보기</button>' : '';
    }

    function drawAll() { drawFilters(); drawKpis(); drawList(); }

    wrap.addEventListener('click', function (e) {
      if (!DATA) return;
      var t = e.target.closest('button');
      if (!t) return;
      if (t.id === 'moreBtn') { st.shown += PAGE; drawList(); return; }
      var k = t.getAttribute('data-k'), v = t.getAttribute('data-v');
      if (!k) return;
      if (k === 'period') st.period = Number(v);
      else if (k === 'mkt') st.mkt = v;
      else if (k === 'big') st.bigOnly = !st.bigOnly;
      else if (k === 'sort') st.sort = v;
      st.shown = PAGE;
      drawAll();
    });

    $('q').addEventListener('input', function (e) {
      st.q = e.target.value;
      st.shown = PAGE;
      if (DATA) drawList();
    });

    function fail(msg) {
      $('list').innerHTML = '<div class="sc-note warn">데이터를 불러오지 못했어요. 잠시 후 새로고침해 주세요.<br><span style="font-size:12px">' + U.esc(msg) + '</span></div>';
      $('kpis').innerHTML = U.kpi('최근 7일 해제', '-', '불러오기 실패', true);
    }

    function load(retry) {
      var ctl = typeof AbortController !== 'undefined' ? new AbortController() : null;
      var timer = ctl ? setTimeout(function () { ctl.abort(); }, 20000) : null;
      fetch(API_URL, { cache: 'no-store', signal: ctl ? ctl.signal : undefined })
        .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
        .then(function (json) { if (timer) clearTimeout(timer); DATA = normalize(json); drawAll(); })
        .catch(function (err) {
          if (timer) clearTimeout(timer);
          if (!retry) { setTimeout(function () { load(true); }, 1500); return; }
          fail(err && err.name === 'AbortError' ? '응답 시간 초과' : String(err && err.message || err));
        });
    }
    load(false);
  }

  if (window.SCTools) window.SCTools.register({ id: 'lockup-release', css: CSS, render: render });
  else document.addEventListener('DOMContentLoaded', function () { if (window.SCTools) window.SCTools.register({ id: 'lockup-release', css: CSS, render: render }); });
})();
