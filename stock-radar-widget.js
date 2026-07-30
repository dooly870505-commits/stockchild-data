/* stock-radar-widget.js  |  내 종목 공시 레이더 v1 */
(function () {
  'use strict';

  var BASE = 'https://dooly870505-commits.github.io/stockchild-data/';
  var IDX_URL = BASE + 'stock-radar-idx.json';
  var EVT_URL = BASE + 'stock-radar-evt.json';
  var LS_KEY = 'stockchild_radar_watch';

  var MOUNT_ID = 'stock-radar';
  var TAG_COLOR = ['#8A7F6C', '#C77B3A', '#5B7DA8', '#B59A3F', '#B24A3A'];
  var TAG_ICON = ['📝', '👤', '🏛️', '🔤', '✂️'];
  var GRADE_COLOR = ['#7A9B6E', '#8A7F6C', '#B59A3F', '#C77B3A', '#B24A3A'];

  var IDX = null, EVT = null, evtLoading = false;
  var tab = 'watch', sel = null, mkt = 'KOSDAQ', hideRoutine = true;

  /* ---------- 유틸 ---------- */
  function el(id) { return document.getElementById(id); }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function fmtD(v) {
    var s = String(v);
    while (s.length < 6) s = '0' + s;
    return '20' + s.substring(0, 2) + '.' + s.substring(2, 4) + '.' + s.substring(4, 6);
  }
  function fmtD8(v) {
    var s = String(v);
    return s.substring(0, 4) + '.' + s.substring(4, 6) + '.' + s.substring(6, 8);
  }
  function daysAgo(ymd8) {
    var y = +String(ymd8).substring(0, 4), m = +String(ymd8).substring(4, 6),
        d = +String(ymd8).substring(6, 8);
    return Math.floor((Date.now() - new Date(y, m - 1, d).getTime()) / 86400000);
  }
  function getWatch() {
    try {
      var v = window.localStorage.getItem(LS_KEY);
      return v ? JSON.parse(v) : [];
    } catch (e) { return []; }
  }
  function setWatch(a) {
    try { window.localStorage.setItem(LS_KEY, JSON.stringify(a)); } catch (e) {}
  }
  function corpOf(code) {
    if (!IDX) return null;
    for (var i = 0; i < IDX.corps.length; i++) {
      if (IDX.corps[i][0] === code) return IDX.corps[i];
    }
    return null;
  }
  function rowsOf(code) {
    if (!EVT || !EVT.ev[code]) return [];
    return EVT.ev[code].map(function (r) {
      return {
        d: r[0], t: r[1], x: r[2] >= 0 ? EVT.dict[r[2]] : '',
        n: r.length > 3 ? r[3] : 1,
        rt: r.length > 4 ? r[4] : 0
      };
    });
  }

  /* ---------- 스타일 ---------- */
  var CSS = ''
  + '.rdr-w{--bg:#FAF7F0;--card:#FFFDF7;--line:#E8E0D0;--ink:#3D3529;--sub:#8A7F6C;--acc:#8B6F47;'
  + 'background:var(--bg);border:1px solid var(--line);border-radius:14px;padding:18px;'
  + "font-family:'Noto Sans KR',-apple-system,sans-serif;color:var(--ink);max-width:760px;margin:0 auto;box-sizing:border-box}"
  + '.rdr-w *{box-sizing:border-box}'
  + '.rdr-ttl{font-size:19px;font-weight:800;margin-bottom:3px}'
  + '.rdr-sub{font-size:12px;color:var(--sub);margin-bottom:14px;line-height:1.6}'
  + '.rdr-srch{position:relative;margin-bottom:12px}'
  + '.rdr-srch input{width:100%;font-size:16px;padding:12px 14px;border:1.5px solid var(--line);'
  + 'border-radius:10px;background:var(--card);color:var(--ink);outline:none;font-family:inherit}'
  + '.rdr-srch input:focus{border-color:var(--acc)}'
  + '.rdr-ac{position:absolute;top:100%;left:0;right:0;background:var(--card);border:1px solid var(--line);'
  + 'border-radius:10px;margin-top:4px;max-height:260px;overflow-y:auto;z-index:40;display:none;'
  + 'box-shadow:0 6px 20px rgba(0,0,0,.09)}'
  + '.rdr-ac div{padding:11px 14px;cursor:pointer;font-size:14px;border-bottom:1px solid var(--line)}'
  + '.rdr-ac div:last-child{border-bottom:none}'
  + '.rdr-ac div:hover{background:var(--bg)}'
  + '.rdr-ac .c{font-family:"JetBrains Mono",monospace;font-size:12px;color:var(--sub);margin-left:6px}'
  + '.rdr-note{background:#FFF9E8;border:1px solid #EADFBC;border-radius:8px;padding:9px 12px;'
  + 'font-size:11.5px;color:#7A6A45;line-height:1.65;margin-bottom:14px}'
  + '.rdr-tabs{display:flex;gap:6px;margin-bottom:14px}'
  + '.rdr-tabs button{flex:1;padding:10px 4px;font-size:13.5px;font-weight:700;border:1px solid var(--line);'
  + 'border-radius:9px;background:var(--card);color:var(--sub);cursor:pointer;font-family:inherit}'
  + '.rdr-tabs button.on{background:var(--acc);color:#fff;border-color:var(--acc)}'
  + '.rdr-card{background:var(--card);border:1px solid var(--line);border-radius:11px;padding:13px 15px;margin-bottom:9px}'
  + '.rdr-row{display:flex;justify-content:space-between;align-items:center;gap:10px}'
  + '.rdr-nm{font-size:15px;font-weight:700}'
  + '.rdr-cd{font-family:"JetBrains Mono",monospace;font-size:11.5px;color:var(--sub);margin-left:6px}'
  + '.rdr-gr{font-size:11px;font-weight:800;padding:3px 9px;border-radius:20px;color:#fff;white-space:nowrap}'
  + '.rdr-tags{margin-top:9px;display:flex;flex-wrap:wrap;gap:5px}'
  + '.rdr-tag{font-size:11px;padding:3px 8px;border-radius:6px;background:var(--bg);border:1px solid var(--line)}'
  + '.rdr-meta{font-size:11.5px;color:var(--sub);margin-top:8px}'
  + '.rdr-btn{padding:8px 14px;font-size:12.5px;font-weight:700;border-radius:8px;cursor:pointer;'
  + 'border:1px solid var(--acc);background:var(--acc);color:#fff;font-family:inherit;white-space:nowrap}'
  + '.rdr-btn.off{background:var(--card);color:var(--acc)}'
  + '.rdr-tl{margin-top:13px;border-top:1px solid var(--line);padding-top:11px;max-height:340px;overflow-y:auto}'
  + '.rdr-ti{display:flex;gap:9px;padding:7px 0;border-bottom:1px dashed var(--line);font-size:12.5px}'
  + '.rdr-ti:last-child{border-bottom:none}'
  + '.rdr-td{font-family:"JetBrains Mono",monospace;font-size:11px;color:var(--sub);flex-shrink:0;width:74px;padding-top:1px}'
  + '.rdr-tx{flex:1;line-height:1.5}'
  + '.rdr-tt{font-size:10.5px;font-weight:700;padding:1px 6px;border-radius:5px;color:#fff;margin-right:5px;'
  + 'display:inline-block;vertical-align:1px}'
  + '.rdr-rt{font-size:10px;color:var(--sub);margin-left:4px}'
  + '.rdr-empty{text-align:center;padding:34px 16px;color:var(--sub);font-size:13px;line-height:1.8}'
  + '.rdr-fil{display:flex;gap:5px;margin-bottom:11px;flex-wrap:wrap}'
  + '.rdr-fil button{padding:6px 12px;font-size:12px;border:1px solid var(--line);border-radius:16px;'
  + 'background:var(--card);color:var(--sub);cursor:pointer;font-family:inherit}'
  + '.rdr-fil button.on{background:var(--ink);color:#fff;border-color:var(--ink)}'
  + '.rdr-dh{font-size:12px;font-weight:800;color:var(--sub);margin:14px 0 7px;'
  + 'font-family:"JetBrains Mono",monospace}'
  + '.rdr-dh:first-child{margin-top:0}'
  + '.rdr-fd{padding:9px 12px;background:var(--card);border:1px solid var(--line);border-radius:9px;'
  + 'margin-bottom:6px;font-size:13px;cursor:pointer;line-height:1.55}'
  + '.rdr-fd.dim{opacity:.5}'
  + '.rdr-ft{margin-top:16px;padding-top:11px;border-top:1px solid var(--line);'
  + 'font-size:11px;color:var(--sub);line-height:1.7}'
  + '.rdr-rk{font-family:"JetBrains Mono",monospace;font-size:13px;font-weight:800;color:var(--sub);'
  + 'width:26px;flex-shrink:0}'
  + '@media(max-width:480px){.rdr-w{padding:14px;border-radius:0;border-left:none;border-right:none}'
  + '.rdr-ttl{font-size:17px}.rdr-nm{font-size:14px}.rdr-tabs button{font-size:12.5px;padding:9px 2px}'
  + '.rdr-td{width:66px;font-size:10.5px}.rdr-ti{font-size:12px}}';

  /* ---------- 렌더 ---------- */
  function shell() {
    return ''
    + '<div class="rdr-w">'
    + '<div class="rdr-ttl">📡 내 종목 공시 레이더</div>'
    + '<div class="rdr-sub" id="rdrSub">불러오는 중...</div>'
    + '<div class="rdr-srch"><input id="rdrQ" type="text" placeholder="종목명 또는 종목코드 검색" autocomplete="off">'
    + '<div class="rdr-ac" id="rdrAc"></div></div>'
    + '<div id="rdrSel"></div>'
    + '<div class="rdr-note">이벤트 지수는 공시가 얼마나 자주 발생했는지를 집계한 수치입니다. '
    + '기업의 가치나 부실 여부를 판정하지 않으며, 공시 자체는 호재도 악재도 아닙니다. '
    + '투자 참고용이며 매수 · 매도 추천이 아닙니다.</div>'
    + '<div class="rdr-tabs">'
    + '<button data-tab="watch">⭐ 내 종목</button>'
    + '<button data-tab="feed">📅 오늘의 공시</button>'
    + '<button data-tab="rank">🏆 랭킹</button></div>'
    + '<div id="rdrBody"></div>'
    + '<div class="rdr-ft" id="rdrFt"></div></div>';
  }

  function corpCard(c, withBtn, extra) {
    var w = getWatch(), on = w.indexOf(c[0]) !== -1;
    var tags = '';
    for (var i = 0; i < 5; i++) {
      if (c[3 + i] > 0) {
        tags += '<span class="rdr-tag" style="border-color:' + TAG_COLOR[i] + '">'
             + TAG_ICON[i] + ' ' + IDX.tags[i] + ' ' + c[3 + i] + '</span>';
      }
    }
    var ago = daysAgo(c[8]);
    return ''
    + '<div class="rdr-card">'
    + '<div class="rdr-row"><div><span class="rdr-nm">' + esc(c[1]) + '</span>'
    + '<span class="rdr-cd">' + c[0] + (c[2] ? ' · ' + c[2] : '') + '</span></div>'
    + '<span class="rdr-gr" style="background:' + GRADE_COLOR[c[10]] + '">' + IDX.grades[c[10]] + '</span></div>'
    + '<div class="rdr-tags">' + (tags || '<span class="rdr-tag">기록 없음</span>') + '</div>'
    + '<div class="rdr-meta">이벤트 지수 ' + c[9] + '점 · 최근 공시 ' + fmtD8(c[8])
    + ' (' + (ago === 0 ? '오늘' : ago + '일 전') + ')</div>'
    + (withBtn
      ? '<div style="margin-top:11px"><button class="rdr-btn' + (on ? ' off' : '')
        + '" data-watch="' + c[0] + '">' + (on ? '⭐ 관심종목 해제' : '☆ 관심종목 등록') + '</button></div>'
      : '')
    + '</div>';
  }

  function timeline(code) {
    if (!EVT) {
      return '<div class="rdr-tl"><div class="rdr-empty">타임라인 불러오는 중...</div></div>';
    }
    var rows = rowsOf(code);
    if (!rows.length) return '<div class="rdr-tl"><div class="rdr-empty">기록된 이벤트가 없습니다.</div></div>';
    var h = '<div class="rdr-tl">';
    rows.forEach(function (r) {
      h += '<div class="rdr-ti"><div class="rdr-td">' + fmtD(r.d) + '</div>'
        + '<div class="rdr-tx"><span class="rdr-tt" style="background:' + TAG_COLOR[r.t] + '">'
        + IDX.tags[r.t] + '</span>' + esc(r.x)
        + (r.n > 1 ? '<span class="rdr-rt">x' + r.n + '</span>' : '')
        + (r.rt ? '<span class="rdr-rt">(정형 공시)</span>' : '')
        + '</div></div>';
    });
    return h + '</div>';
  }

  function drawSel() {
    var box = el('rdrSel');
    if (!sel) { box.innerHTML = ''; return; }
    var c = corpOf(sel);
    if (!c) { box.innerHTML = ''; return; }
    box.innerHTML = corpCard(c, true, timeline(sel));
    if (!EVT && !evtLoading) loadEvt(function () { drawSel(); });
  }

  function drawWatch() {
    var w = getWatch();
    if (!w.length) {
      return '<div class="rdr-empty">등록된 관심종목이 없습니다.<br>'
        + '위 검색창에서 종목을 찾아 <b>관심종목 등록</b>을 눌러보세요.<br>'
        + '등록한 종목의 공시 이력이 여기에 모입니다.</div>';
    }
    var list = [];
    w.forEach(function (code) { var c = corpOf(code); if (c) list.push(c); });
    list.sort(function (a, b) { return b[8].localeCompare(a[8]); });
    var h = '';
    list.forEach(function (c) {
      h += '<div data-open="' + c[0] + '" style="cursor:pointer">' + corpCard(c, false) + '</div>';
    });
    return h;
  }

  function drawFeed() {
    var h = '<div class="rdr-fil">'
      + '<button data-rt="1" class="' + (hideRoutine ? 'on' : '') + '">정형 공시 숨기기</button>'
      + '<button data-rt="0" class="' + (hideRoutine ? '' : 'on') + '">전체 보기</button></div>';
    var last = '', cnt = 0;
    IDX.feed.forEach(function (f) {
      if (hideRoutine && f[6]) return;
      if (cnt >= 160) return;
      cnt++;
      if (f[1] !== last) { h += '<div class="rdr-dh">' + fmtD8(f[1]) + '</div>'; last = f[1]; }
      h += '<div class="rdr-fd' + (f[6] ? ' dim' : '') + '" data-open="' + f[0] + '">'
        + '<span class="rdr-tt" style="background:' + TAG_COLOR[f[2]] + '">' + IDX.tags[f[2]] + '</span>'
        + '<b>' + esc(f[4]) + '</b> ' + esc(f[3])
        + (f[5] > 1 ? '<span class="rdr-rt">x' + f[5] + '</span>' : '') + '</div>';
    });
    return h + (cnt ? '' : '<div class="rdr-empty">표시할 공시가 없습니다.</div>');
  }

  function drawRank() {
    var h = '<div class="rdr-fil">'
      + '<button data-mkt="KOSDAQ" class="' + (mkt === 'KOSDAQ' ? 'on' : '') + '">코스닥</button>'
      + '<button data-mkt="KOSPI" class="' + (mkt === 'KOSPI' ? 'on' : '') + '">코스피</button>'
      + '<button data-mkt="ALL" class="' + (mkt === 'ALL' ? 'on' : '') + '">전체</button></div>';
    var mn = { KOSDAQ: '코스닥', KOSPI: '코스피' }[mkt];
    var list = IDX.corps.filter(function (c) { return mkt === 'ALL' ? true : c[2] === mn; });
    list.sort(function (a, b) { return b[9] - a[9]; });
    list = list.slice(0, 40);
    if (!list.length) return h + '<div class="rdr-empty">해당 시장 데이터가 없습니다.</div>';
    list.forEach(function (c, i) {
      h += '<div data-open="' + c[0] + '" style="cursor:pointer">'
        + '<div class="rdr-card"><div class="rdr-row">'
        + '<div style="display:flex;align-items:center;gap:9px;min-width:0">'
        + '<span class="rdr-rk">' + (i + 1) + '</span>'
        + '<div style="min-width:0"><div class="rdr-nm">' + esc(c[1]) + '</div>'
        + '<div class="rdr-meta" style="margin-top:2px">' + c[0]
        + (c[2] ? ' · ' + c[2] : '') + ' · 최근 ' + fmtD8(c[8]) + '</div></div></div>'
        + '<div style="text-align:right;flex-shrink:0">'
        + '<span class="rdr-gr" style="background:' + GRADE_COLOR[c[10]] + '">' + c[9] + '점</span>'
        + '</div></div></div></div>';
    });
    if (mkt === 'KOSPI') {
      h += '<div class="rdr-note" style="margin-top:12px">코스피 대형주는 공시 총량 자체가 많아 '
        + '지수가 높게 나오는 경향이 있습니다. 규모가 비슷한 기업끼리 비교해서 보시는 편이 정확합니다.</div>';
    }
    return h;
  }

  function draw() {
    var t = el('rdrBody');
    if (tab === 'watch') t.innerHTML = drawWatch();
    else if (tab === 'feed') t.innerHTML = drawFeed();
    else t.innerHTML = drawRank();
    var bs = document.querySelectorAll('.rdr-tabs button');
    for (var i = 0; i < bs.length; i++) {
      bs[i].className = bs[i].getAttribute('data-tab') === tab ? 'on' : '';
    }
  }

  /* ---------- 검색 ---------- */
  function search(q) {
    q = q.trim().toLowerCase();
    var ac = el('rdrAc');
    if (!q || !IDX) { ac.style.display = 'none'; return; }
    var hit = [];
    for (var i = 0; i < IDX.corps.length && hit.length < 20; i++) {
      var c = IDX.corps[i];
      if (c[1].toLowerCase().indexOf(q) !== -1 || c[0].toLowerCase().indexOf(q) !== -1) hit.push(c);
    }
    if (!hit.length) {
      ac.innerHTML = '<div style="color:#8A7F6C;cursor:default">검색 결과가 없습니다</div>';
      ac.style.display = 'block';
      return;
    }
    var h = '';
    hit.forEach(function (c) {
      h += '<div data-pick="' + c[0] + '">' + esc(c[1])
        + '<span class="c">' + c[0] + (c[2] ? ' · ' + c[2] : '') + '</span></div>';
    });
    ac.innerHTML = h;
    ac.style.display = 'block';
  }

  /* ---------- 로딩 ---------- */
  function loadEvt(cb) {
    if (EVT || evtLoading) { if (cb) cb(); return; }
    evtLoading = true;
    fetch(EVT_URL).then(function (r) { return r.json(); }).then(function (j) {
      EVT = j; evtLoading = false; if (cb) cb();
    }).catch(function () { evtLoading = false; });
  }

  function boot(root) {
    root.innerHTML = shell();

    root.addEventListener('click', function (e) {
      var t = e.target;
      while (t && t !== root) {
        if (t.getAttribute) {
          var a;
          if ((a = t.getAttribute('data-tab'))) { tab = a; draw(); return; }
          if ((a = t.getAttribute('data-pick'))) {
            sel = a; el('rdrQ').value = ''; el('rdrAc').style.display = 'none';
            drawSel();
            el('rdrSel').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            return;
          }
          if ((a = t.getAttribute('data-watch'))) {
            var w = getWatch(), i = w.indexOf(a);
            if (i === -1) w.push(a); else w.splice(i, 1);
            setWatch(w); drawSel(); if (tab === 'watch') draw();
            return;
          }
          if ((a = t.getAttribute('data-open'))) {
            sel = a; drawSel();
            el('rdrSel').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            return;
          }
          if ((a = t.getAttribute('data-mkt'))) { mkt = a; draw(); return; }
          if ((a = t.getAttribute('data-rt')) !== null && a !== undefined && t.hasAttribute('data-rt')) {
            hideRoutine = a === '1'; draw(); return;
          }
        }
        t = t.parentNode;
      }
    });

    var qi = el('rdrQ');
    qi.addEventListener('input', function () { search(qi.value); });
    qi.addEventListener('focus', function () { if (qi.value) search(qi.value); });
    document.addEventListener('click', function (e) {
      if (!el('rdrAc')) return;
      if (!e.target.closest || !e.target.closest('.rdr-srch')) el('rdrAc').style.display = 'none';
    });

    fetch(IDX_URL).then(function (r) { return r.json(); }).then(function (j) {
      IDX = j;
      el('rdrSub').innerHTML = 'DART 공시 ' + j.meta.total.toLocaleString() + '건 · 종목 '
        + j.meta.corps.toLocaleString() + '개 · ' + fmtD8(j.meta.from) + ' ~ ' + fmtD8(j.meta.to);
      el('rdrFt').innerHTML = '출처: 금융감독원 전자공시시스템(DART)<br>'
        + '수집 항목: 기재정정 · 최대주주변경 · 국민연금 지분변동 · 상호변경 · 감자<br>'
        + '기준 시각: ' + esc(j.meta.gen);
      draw();
      loadEvt();
    }).catch(function () {
      el('rdrSub').textContent = '데이터를 불러오지 못했습니다. 잠시 후 새로고침해 주세요.';
    });
  }

  function init() {
    var root = document.getElementById(MOUNT_ID);
    if (!root) return;
    var st = document.createElement('style');
    st.textContent = CSS;
    document.head.appendChild(st);
    boot(root);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else { init(); }
})();
