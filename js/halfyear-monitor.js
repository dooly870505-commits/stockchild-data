/**
 * 반기보고서 제출 현황 모니터 위젯 : stockchild.com
 * 사용법: 워드프레스 사용자 정의 HTML 블록에 아래 두 줄만 넣는다.
 *   <div id="hy-widget-root"></div>
 *   <script src="https://dooly870505-commits.github.io/stockchild-data/js/halfyear-monitor.js"></script>
 *
 * 데이터: CDN(halfyear.json) 우선, 실패 시 Apps Script 폴백
 * 상태 문구는 전부 이 위젯이 phase 값을 보고 결정한다 (서버는 사실만 제공)
 */
(function () {
  'use strict';

  var CDN_URL = 'https://dooly870505-commits.github.io/stockchild-data/data/halfyear.json';
  var FALLBACK_URL = ''; // 필요 시 Apps Script 웹앱 URL + '?tool=halfyear' 입력

  var ROOT_ID = 'hy-widget-root';
  var PAGE_SIZE = 30;

  /* ===== 스타일 ===== */
  var CSS = [
    '#hy-widget-root{--bg:#FAF7F0;--card:#FFFDF7;--line:#E8E0D0;--ink:#3D3529;--sub:#8A7F6C;--accent:#8B6F47;',
    '--ok:#4F7A4A;--warn:#C07A3D;--bad:#B0483C;',
    'font-family:"Noto Sans KR",-apple-system,sans-serif;color:var(--ink);background:var(--bg);',
    'border:1px solid var(--line);border-radius:14px;padding:20px;max-width:760px;margin:0 auto;box-sizing:border-box}',
    '#hy-widget-root *{box-sizing:border-box}',
    '#hy-widget-root .hy-mono{font-family:"JetBrains Mono",Consolas,monospace}',

    '#hy-widget-root .hy-title{font-size:19px;font-weight:700;margin-bottom:4px}',
    '#hy-widget-root .hy-subtitle{font-size:13px;color:var(--sub);margin-bottom:14px}',

    '#hy-widget-root .hy-dday{background:var(--card);border:1px solid var(--line);border-radius:10px;',
    'padding:12px 16px;margin-bottom:14px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px}',
    '#hy-widget-root .hy-dday-label{font-size:13px;color:var(--sub)}',
    '#hy-widget-root .hy-dday-num{font-size:22px;font-weight:700;color:var(--accent)}',
    '#hy-widget-root .hy-dday-num.hy-grace{color:var(--warn)}',
    '#hy-widget-root .hy-dday-num.hy-after{color:var(--bad)}',

    '#hy-widget-root .hy-search{width:100%;font-size:16px;padding:11px 14px;border:1px solid var(--line);',
    'border-radius:10px;background:var(--card);color:var(--ink);margin-bottom:14px;outline:none}',
    '#hy-widget-root .hy-search:focus{border-color:var(--accent)}',

    '#hy-widget-root .hy-stats{display:flex;gap:8px;margin-bottom:14px;flex-wrap:wrap}',
    '#hy-widget-root .hy-stat{flex:1;min-width:100px;background:var(--card);border:1px solid var(--line);',
    'border-radius:10px;padding:10px;text-align:center}',
    '#hy-widget-root .hy-stat-num{font-size:18px;font-weight:700}',
    '#hy-widget-root .hy-stat-label{font-size:11px;color:var(--sub);margin-top:2px}',

    '#hy-widget-root .hy-bar{height:8px;background:var(--line);border-radius:4px;overflow:hidden;margin-bottom:16px}',
    '#hy-widget-root .hy-bar-fill{height:100%;background:var(--accent);border-radius:4px;transition:width .4s}',

    '#hy-widget-root .hy-tabs{display:flex;gap:6px;margin-bottom:12px;flex-wrap:wrap}',
    '#hy-widget-root .hy-tab{font-size:13px;padding:8px 14px;border:1px solid var(--line);border-radius:20px;',
    'background:var(--card);color:var(--sub);cursor:pointer;user-select:none}',
    '#hy-widget-root .hy-tab.hy-on{background:var(--accent);border-color:var(--accent);color:#fff;font-weight:700}',

    '#hy-widget-root .hy-list{display:flex;flex-direction:column;gap:8px}',
    '#hy-widget-root .hy-card{background:var(--card);border:1px solid var(--line);border-radius:10px;',
    'padding:12px 14px;display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap}',
    '#hy-widget-root .hy-card-left{min-width:0}',
    '#hy-widget-root .hy-name{font-size:15px;font-weight:700}',
    '#hy-widget-root .hy-meta{font-size:12px;color:var(--sub);margin-top:3px;display:flex;gap:8px;flex-wrap:wrap}',
    '#hy-widget-root .hy-mkt{font-size:11px;border:1px solid var(--line);border-radius:4px;padding:1px 5px}',
    '#hy-widget-root .hy-chip{font-size:12px;font-weight:700;padding:4px 10px;border-radius:14px;white-space:nowrap}',
    '#hy-widget-root .hy-chip-ok{background:#EDF3EA;color:var(--ok)}',
    '#hy-widget-root .hy-chip-wait{background:#F1EDE4;color:var(--sub)}',
    '#hy-widget-root .hy-chip-warn{background:#F7ECE0;color:var(--warn)}',
    '#hy-widget-root .hy-chip-bad{background:#F6E7E4;color:var(--bad)}',
    '#hy-widget-root .hy-chip-ext{background:#EAEFF5;color:#4A6A8A}',

    '#hy-widget-root .hy-more{width:100%;margin-top:10px;padding:11px;font-size:14px;border:1px solid var(--line);',
    'border-radius:10px;background:var(--card);color:var(--accent);cursor:pointer;font-weight:700}',
    '#hy-widget-root .hy-empty{text-align:center;color:var(--sub);font-size:13px;padding:30px 0}',

    '#hy-widget-root .hy-note{font-size:12px;color:var(--sub);line-height:1.7;background:var(--card);',
    'border:1px solid var(--line);border-radius:10px;padding:12px 14px;margin-top:16px}',
    '#hy-widget-root .hy-footer{font-size:11px;color:var(--sub);text-align:right;margin-top:10px}',

    '@media (max-width:480px){',
    '#hy-widget-root{padding:14px}',
    '#hy-widget-root .hy-title{font-size:17px}',
    '#hy-widget-root .hy-dday-num{font-size:19px}',
    '#hy-widget-root .hy-stat{min-width:72px;padding:8px}',
    '#hy-widget-root .hy-card{padding:10px 12px}',
    '}'
  ].join('');

  /* ===== 유틸: 방어적 정제 ===== */
  function pad6(code) {
    var c = String(code || '').trim();
    if (/^\d{1,6}$/.test(c)) return ('000000' + c).slice(-6);
    return c;
  }
  function disp(name) {
    return String(name || '').replace(/^(주식회사|\(주\)|㈜)\s*/, '').trim();
  }
  function normDate(d) {
    var s = String(d || '').trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
    if (/^\d{8}$/.test(s)) return s.slice(0, 4) + '-' + s.slice(4, 6) + '-' + s.slice(6, 8);
    return '';
  }
  function todayStr() {
    var n = new Date();
    var kst = new Date(n.getTime() + (9 * 60 + n.getTimezoneOffset()) * 60000);
    var m = ('0' + (kst.getMonth() + 1)).slice(-2);
    var dd = ('0' + kst.getDate()).slice(-2);
    return kst.getFullYear() + '-' + m + '-' + dd;
  }
  function daysUntil(dateStr) {
    var t = todayStr().split('-');
    var d = dateStr.split('-');
    var a = Date.UTC(+t[0], +t[1] - 1, +t[2]);
    var b = Date.UTC(+d[0], +d[1] - 1, +d[2]);
    return Math.round((b - a) / 86400000);
  }
  function esc(s) {
    return String(s).replace(/[<>"']/g, function (ch) {
      return { '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch];
    });
  }

  /* ===== 상태 계산: 위젯이 phase를 자체 재계산 (CDN 갱신 지연 대비) ===== */
  function calcPhase(data) {
    var today = todayStr();
    var d45 = normDate(data.deadline45) || '2026-08-14';
    var d60 = normDate(data.deadline60) || '2026-08-31';
    if (today <= d45) return 'before';
    if (today <= d60) return 'grace';
    return 'after';
  }

  /* 미제출 상태의 표시 문구를 phase로 결정 */
  function notFiledChip(phase) {
    if (phase === 'before') return '<span class="hy-chip hy-chip-wait">제출 전</span>';
    if (phase === 'grace') return '<span class="hy-chip hy-chip-warn">확인 필요</span>';
    return '<span class="hy-chip hy-chip-bad">법정기한 경과</span>';
  }

  /* ===== 렌더링 ===== */
  var state = { data: null, phase: 'before', tab: 'notFiled', shown: PAGE_SIZE, query: '' };

  function build(root) {
    var d = state.data;
    var phase = state.phase;
    var d45 = normDate(d.deadline45) || '2026-08-14';
    var d60 = normDate(d.deadline60) || '2026-08-31';

    var ddayHtml = '';
    if (phase === 'before') {
      var n1 = daysUntil(d45);
      ddayHtml = '<div class="hy-dday"><span class="hy-dday-label">\u23F0 2026년 반기보고서 법정 제출기한: ' + d45 + '</span>' +
        '<span class="hy-dday-num">' + (n1 === 0 ? '오늘 마감' : 'D-' + n1) + '</span></div>';
    } else if (phase === 'grace') {
      var n2 = daysUntil(d60);
      ddayHtml = '<div class="hy-dday"><span class="hy-dday-label">\u23F0 45일 기한(' + d45 + ') 경과 \u00B7 연결 최초 작성 기업 특례기한: ' + d60 + '</span>' +
        '<span class="hy-dday-num hy-grace">' + (n2 === 0 ? '오늘 마감' : 'D-' + n2) + '</span></div>';
    } else {
      ddayHtml = '<div class="hy-dday"><span class="hy-dday-label">\u23F0 2026년 반기보고서 접수 마감 (' + d60 + ' 특례기한 포함)</span>' +
        '<span class="hy-dday-num hy-after">마감</span></div>';
    }

    var total = d.total || 0;
    var filedCount = d.filedCount || 0;
    var rate = total > 0 ? Math.round(filedCount / total * 1000) / 10 : 0;
    var notLabel = phase === 'before' ? '제출 전' : (phase === 'grace' ? '확인 필요' : '기한 경과');

    var html = '' +
      '<div class="hy-title">\uD83D\uDCCB 반기보고서 제출 현황 모니터</div>' +
      '<div class="hy-subtitle">12월 결산 코스피\u00B7코스닥 상장법인 ' + total + '개사 기준 (' + esc(d.period || '2026.06') + ' 반기)</div>' +
      ddayHtml +
      '<input class="hy-search" id="hy-search" type="text" placeholder="\uD83D\uDD0D 종목명 또는 종목코드 검색" value="' + esc(state.query) + '">' +
      '<div class="hy-stats">' +
      '<div class="hy-stat"><div class="hy-stat-num">' + filedCount + '</div><div class="hy-stat-label">제출완료</div></div>' +
      '<div class="hy-stat"><div class="hy-stat-num">' + (d.notFiledCount || 0) + '</div><div class="hy-stat-label">' + notLabel + '</div></div>' +
      '<div class="hy-stat"><div class="hy-stat-num">' + (d.extCount || 0) + '</div><div class="hy-stat-label">연장신고</div></div>' +
      '<div class="hy-stat"><div class="hy-stat-num">' + rate + '%</div><div class="hy-stat-label">제출률</div></div>' +
      '</div>' +
      '<div class="hy-bar"><div class="hy-bar-fill" style="width:' + rate + '%"></div></div>' +
      '<div class="hy-tabs" id="hy-tabs">' +
      tabBtn('notFiled', notLabel + ' ' + (d.notFiledCount || 0)) +
      tabBtn('filed', '제출완료 ' + filedCount) +
      tabBtn('extended', '연장신고 ' + (d.extCount || 0)) +
      '</div>' +
      '<div class="hy-list" id="hy-list"></div>' +
      '<div id="hy-more-wrap"></div>' +
      '<div class="hy-note">\u2139\uFE0F 반기보고서는 반기 종료 후 45일 이내 제출이 원칙입니다. 다만 연결재무제표 기준으로 최초 작성하는 사업연도와 그 다음 사업연도는 60일 이내 제출이 가능해, 45일 기한 이후의 미제출이 곧바로 규정 위반을 의미하지는 않습니다. 제출기한 연장신고 제도도 별도로 존재합니다. 본 자료는 DART 공시 접수 여부만을 집계한 것으로, 개별 기업의 기한 적용은 공시 원문으로 확인하시기 바랍니다. 투자 참고용이며 매수\u00B7매도 추천이 아닙니다.</div>' +
      '<div class="hy-footer">출처: 금융감독원 DART \u00B7 기준: ' + esc(d.updated || '') + ' \u00B7 stockchild.com</div>';

    root.innerHTML = html;

    root.querySelector('#hy-search').addEventListener('input', function (e) {
      state.query = e.target.value;
      state.shown = PAGE_SIZE;
      renderList(root);
    });
    root.querySelector('#hy-tabs').addEventListener('click', function (e) {
      var t = e.target.getAttribute('data-tab');
      if (!t) return;
      state.tab = t;
      state.shown = PAGE_SIZE;
      state.query = '';
      root.querySelector('#hy-search').value = '';
      var tabs = root.querySelectorAll('.hy-tab');
      for (var i = 0; i < tabs.length; i++) {
        tabs[i].className = 'hy-tab' + (tabs[i].getAttribute('data-tab') === t ? ' hy-on' : '');
      }
      renderList(root);
    });

    renderList(root);
  }

  function tabBtn(key, label) {
    var on = state.tab === key ? ' hy-on' : '';
    return '<span class="hy-tab' + on + '" data-tab="' + key + '">' + esc(label) + '</span>';
  }

  function cardHtml(item, group, phase) {
    var chip;
    if (group === 'filed') chip = '<span class="hy-chip hy-chip-ok">제출완료</span>';
    else if (group === 'extended') chip = '<span class="hy-chip hy-chip-ext">연장신고</span>';
    else chip = notFiledChip(phase);

    var meta = ['<span class="hy-mono">' + esc(pad6(item.code)) + '</span>',
                '<span class="hy-mkt">' + esc(item.market || '') + '</span>'];
    if (group === 'filed') {
      var fd = normDate(item.filedDate);
      if (fd) meta.push('제출일 ' + fd);
    } else if (group === 'extended') {
      var ed = normDate(item.extDate);
      if (ed) meta.push('연장신고일 ' + ed);
    } else {
      var ly = normDate(item.lastYear);
      if (ly) meta.push('작년 제출 ' + ly);
    }

    return '<div class="hy-card"><div class="hy-card-left">' +
      '<div class="hy-name">' + esc(disp(item.name)) + '</div>' +
      '<div class="hy-meta">' + meta.join('') + '</div>' +
      '</div>' + chip + '</div>';
  }

  function currentItems() {
    var d = state.data;
    var q = state.query.trim().toLowerCase();
    if (q) {
      // 검색 모드: 세 그룹 전체에서 찾고 그룹 정보를 함께 반환
      var out = [];
      var groups = [['notFiled', d.notFiled], ['extended', d.extended], ['filed', d.filed]];
      groups.forEach(function (g) {
        (g[1] || []).forEach(function (it) {
          var name = String(it.name || '').toLowerCase();
          var code = pad6(it.code);
          if (name.indexOf(q) !== -1 || code.indexOf(q) !== -1) out.push({ item: it, group: g[0] });
        });
      });
      return out;
    }
    var list = state.data[state.tab] || [];
    return list.map(function (it) { return { item: it, group: state.tab }; });
  }

  function renderList(root) {
    var listEl = root.querySelector('#hy-list');
    var moreWrap = root.querySelector('#hy-more-wrap');
    var items = currentItems();

    if (items.length === 0) {
      var msg = state.query ? '검색 결과가 없습니다' :
        (state.tab === 'filed' ? '아직 제출된 보고서가 없습니다. 통상 마감 직전 주간에 제출이 집중됩니다' :
         state.tab === 'extended' ? '연장신고 접수 건이 없습니다' : '해당 기업이 없습니다');
      listEl.innerHTML = '<div class="hy-empty">' + msg + '</div>';
      moreWrap.innerHTML = '';
      return;
    }

    var slice = items.slice(0, state.shown);
    var html = '';
    for (var i = 0; i < slice.length; i++) {
      html += cardHtml(slice[i].item, slice[i].group, state.phase);
    }
    listEl.innerHTML = html;

    if (items.length > state.shown) {
      moreWrap.innerHTML = '<button class="hy-more" type="button">더보기 (' + (items.length - state.shown) + '개 남음)</button>';
      moreWrap.querySelector('.hy-more').addEventListener('click', function () {
        state.shown += PAGE_SIZE * 2;
        renderList(root);
      });
    } else {
      moreWrap.innerHTML = '';
    }
  }

  /* ===== 데이터 로드 ===== */
  function clean(data) {
    // 방어적 정제: 배열 보장 + 제출완료는 최신 제출일 순 유지, 미제출은 이름순
    data.notFiled = Array.isArray(data.notFiled) ? data.notFiled : [];
    data.extended = Array.isArray(data.extended) ? data.extended : [];
    data.filed = Array.isArray(data.filed) ? data.filed : [];
    return data;
  }

  function load(root) {
    root.innerHTML = '<div class="hy-empty">데이터를 불러오는 중입니다...</div>';
    fetch(CDN_URL, { cache: 'no-cache' })
      .then(function (r) { if (!r.ok) throw new Error('CDN ' + r.status); return r.json(); })
      .then(function (data) { start(root, data); })
      .catch(function () {
        if (!FALLBACK_URL) {
          root.innerHTML = '<div class="hy-empty">데이터를 불러오지 못했습니다. 잠시 후 새로고침해 주세요.</div>';
          return;
        }
        fetch(FALLBACK_URL)
          .then(function (r) { return r.json(); })
          .then(function (data) { start(root, data); })
          .catch(function () {
            root.innerHTML = '<div class="hy-empty">데이터를 불러오지 못했습니다. 잠시 후 새로고침해 주세요.</div>';
          });
      });
  }

  function start(root, data) {
    state.data = clean(data);
    state.phase = calcPhase(data);
    // 기본 탭: 마감 전에는 제출 현황이 곧 콘텐츠이므로 미제출(제출 전) 탭 유지
    state.tab = 'notFiled';
    build(root);
  }

  /* ===== 초기화 ===== */
  function init() {
    var root = document.getElementById(ROOT_ID);
    if (!root) return;
    var style = document.createElement('style');
    style.textContent = CSS;
    document.head.appendChild(style);
    load(root);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
