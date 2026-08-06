(function () {
  'use strict';

  var JSON_URL = 'https://dooly870505-commits.github.io/stockchild-data/spac-archive.json';
  var MOUNT_ID = 'spac-archive-widget';

  // 폰트 로드 (중복 방지)
  if (!document.getElementById('spac-fonts')) {
    var lk = document.createElement('link');
    lk.id = 'spac-fonts';
    lk.rel = 'stylesheet';
    lk.href = 'https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700;900&family=JetBrains+Mono:wght@400;500;700&display=swap';
    document.head.appendChild(lk);
  }

  // 스타일 주입 (중복 방지)
  if (!document.getElementById('spac-style')) {
    var st = document.createElement('style');
    st.id = 'spac-style';
    st.textContent = [
      '.spac-wrap{--spac-bg:#FAF7F0;--spac-card:#FFFDF7;--spac-line:#E8E0D0;--spac-ink:#3D3529;--spac-sub:#8A7F6C;--spac-accent:#8B6F47;--spac-up:#C0392B;--spac-down:#2E6DA4;--spac-flat:#8A7F6C;--spac-warn:#B8863B;font-family:"Noto Sans KR",sans-serif;color:var(--spac-ink);background:var(--spac-bg);max-width:760px;margin:0 auto;padding:22px 16px 40px;box-sizing:border-box;line-height:1.55}',
      '.spac-wrap *{box-sizing:border-box}',
      '.spac-num{font-family:"JetBrains Mono",monospace;font-variant-numeric:tabular-nums}',
      '.spac-title{font-size:26px;font-weight:900;letter-spacing:-.5px;display:flex;align-items:center;gap:8px}',
      '.spac-subtitle{font-size:13.5px;color:var(--spac-sub);margin-top:4px}',
      '.spac-hero{margin-top:18px;padding:22px 20px;background:var(--spac-card);border:1px solid var(--spac-line);border-radius:14px;position:relative;overflow:hidden}',
      '.spac-hero::before{content:"";position:absolute;left:0;top:0;bottom:0;width:5px;background:var(--spac-accent)}',
      '.spac-hero-lead{font-size:15px;font-weight:700;color:var(--spac-accent)}',
      '.spac-hero-head{font-size:21px;font-weight:900;margin-top:6px;letter-spacing:-.4px}',
      '.spac-hero-head .spac-big{font-size:30px;color:var(--spac-up)}',
      '.spac-hero-sub{font-size:13px;color:var(--spac-sub);margin-top:8px}',
      '.spac-stats{display:flex;gap:10px;margin-top:16px}',
      '.spac-stat{flex:1;background:var(--spac-card);border:1px solid var(--spac-line);border-radius:12px;padding:14px 12px;text-align:center}',
      '.spac-stat-v{font-size:24px;font-weight:700;letter-spacing:-.5px}',
      '.spac-stat-l{font-size:11.5px;color:var(--spac-sub);margin-top:3px}',
      '.spac-search-box{margin-top:20px;position:relative}',
      '.spac-search{width:100%;font-size:16px;font-family:"Noto Sans KR",sans-serif;padding:14px 16px 14px 46px;border:1.5px solid var(--spac-line);border-radius:12px;background:var(--spac-card);color:var(--spac-ink);outline:none;transition:border-color .15s}',
      '.spac-search:focus{border-color:var(--spac-accent)}',
      '.spac-search-ic{position:absolute;left:0;top:0;bottom:0;width:44px;display:flex;align-items:center;justify-content:center;font-size:15px;opacity:.5;pointer-events:none}',
      '.spac-result{margin-top:12px}',
      '.spac-result-hint{font-size:12.5px;color:var(--spac-sub);padding:4px 2px}',
      '.spac-tabs{display:flex;gap:4px;margin-top:22px;border-bottom:2px solid var(--spac-line)}',
      '.spac-tab{flex:1;padding:11px 4px;font-size:13px;font-weight:700;color:var(--spac-sub);background:none;border:none;cursor:pointer;border-bottom:2px solid transparent;margin-bottom:-2px;font-family:"Noto Sans KR",sans-serif;transition:color .12s}',
      '.spac-tab.spac-on{color:var(--spac-accent);border-bottom-color:var(--spac-accent)}',
      '.spac-panel{margin-top:16px;display:none}',
      '.spac-panel.spac-on{display:block}',
      '.spac-section-l{font-size:12.5px;font-weight:700;color:var(--spac-sub);margin:18px 2px 8px;display:flex;align-items:center;gap:6px}',
      '.spac-section-l:first-child{margin-top:2px}',
      '.spac-card2{background:var(--spac-card);border:1px solid var(--spac-line);border-radius:11px;padding:13px 14px;margin-bottom:8px}',
      '.spac-row{display:flex;align-items:center;gap:12px}',
      '.spac-rank{font-size:13px;font-weight:700;color:var(--spac-sub);min-width:26px;text-align:center}',
      '.spac-info{flex:1;min-width:0}',
      '.spac-sname{font-size:12px;color:var(--spac-sub)}',
      '.spac-pname{font-size:15.5px;font-weight:700;letter-spacing:-.3px;margin-top:1px}',
      '.spac-meta{font-size:11.5px;color:var(--spac-sub);margin-top:3px}',
      '.spac-ret{text-align:right;min-width:84px}',
      '.spac-ret-v{font-size:18px;font-weight:700}',
      '.spac-ret-l{font-size:10.5px;color:var(--spac-sub);margin-top:1px}',
      '.spac-up-c{color:var(--spac-up)}',
      '.spac-down-c{color:var(--spac-down)}',
      '.spac-flat-c{color:var(--spac-flat)}',
      '.spac-badge{display:inline-block;font-size:10.5px;font-weight:700;padding:2px 7px;border-radius:20px;margin-left:5px;vertical-align:middle}',
      '.spac-b-sotok{background:#EFE7D6;color:#8B6F47}',
      '.spac-b-jonsok{background:#E4EAF0;color:#2E6DA4}',
      '.spac-b-cap{background:#F3E4CC;color:#B8863B}',
      '.spac-brk{background:var(--spac-card);border:1px solid var(--spac-line);border-radius:11px;padding:13px 14px;margin-bottom:8px}',
      '.spac-brk-top{display:flex;align-items:baseline;gap:8px}',
      '.spac-brk-rk{font-size:13px;font-weight:700;color:var(--spac-accent);min-width:22px}',
      '.spac-brk-name{font-size:15.5px;font-weight:700;flex:1}',
      '.spac-brk-total{font-size:13px;color:var(--spac-sub)}',
      '.spac-brk-total b{color:var(--spac-ink);font-size:16px}',
      '.spac-bar{height:7px;background:var(--spac-line);border-radius:4px;margin-top:10px;overflow:hidden;display:flex}',
      '.spac-bar-done{background:var(--spac-accent);height:100%}',
      '.spac-bar-live{background:#C9B896;height:100%}',
      '.spac-bar-dead{background:#D8CBB4;height:100%}',
      '.spac-brk-legend{display:flex;gap:14px;margin-top:8px;font-size:11.5px;color:var(--spac-sub);flex-wrap:wrap}',
      '.spac-lg{display:flex;align-items:center;gap:4px}',
      '.spac-dot{width:8px;height:8px;border-radius:2px;display:inline-block}',
      '.spac-pill{display:inline-block;font-size:11px;font-weight:700;padding:3px 9px;border-radius:20px}',
      '.spac-p-open{background:#E3EEE3;color:#3C7A4E}',
      '.spac-p-prog{background:#F3E4CC;color:#B8863B}',
      '.spac-p-cancel{background:#F0E2E0;color:#B0574C}',
      '.spac-p-dead1{background:#ECE6DA;color:#8A7F6C}',
      '.spac-p-dead2{background:#F0E2E0;color:#B0574C}',
      '.spac-simple{display:flex;align-items:center;justify-content:space-between;gap:10px}',
      '.spac-empty{text-align:center;color:var(--spac-sub);font-size:13px;padding:30px 10px}',
      '.spac-loading{text-align:center;color:var(--spac-sub);font-size:14px;padding:50px 10px}',
      '.spac-note{margin-top:24px;padding:14px 16px;background:#F3EFE6;border:1px solid var(--spac-line);border-radius:11px;font-size:12px;color:var(--spac-sub);line-height:1.7}',
      '.spac-note b{color:var(--spac-accent)}',
      '.spac-foot{margin-top:14px;font-size:11px;color:var(--spac-sub);text-align:center;line-height:1.7}',
      '@media (max-width:480px){.spac-wrap{padding:16px 12px 32px}.spac-title{font-size:22px}.spac-hero-head{font-size:18px}.spac-hero-head .spac-big{font-size:25px}.spac-stat-v{font-size:20px}.spac-stat-l{font-size:10.5px}.spac-stats{gap:7px}.spac-stat{padding:12px 8px}.spac-tab{font-size:12px;padding:10px 2px}.spac-pname{font-size:14.5px}.spac-ret-v{font-size:16px}.spac-ret{min-width:72px}}'
    ].join('');
    document.head.appendChild(st);
  }

  function clean(s) {
    return String(s || '').replace(/&nbsp;/g, '').replace(/주식회사/g, '')
      .replace(/㈜|\(주\)/g, '').replace(/\s+/g, ' ').trim();
  }
  function esc(s) {
    return String(s || '').replace(/[&<>"]/g, function (m) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m];
    });
  }
  function retClass(v) { return v > 0 ? 'spac-up-c' : (v < 0 ? 'spac-down-c' : 'spac-flat-c'); }
  function retStr(v) { return (v > 0 ? '+' : '') + v + '%'; }
  function typeBadge(t) {
    return t === '소멸'
      ? '<span class="spac-badge spac-b-sotok">소멸합병</span>'
      : '<span class="spac-badge spac-b-jonsok">존속합병</span>';
  }

  function mount() {
    var el = document.getElementById(MOUNT_ID);
    if (!el) return;
    el.className = 'spac-wrap';
    el.innerHTML =
      '<div class="spac-title">📉 역대 스팩 아카이브</div>' +
      '<div class="spac-subtitle">기업인수목적회사(SPAC) 전수 데이터: 합병 성적표부터 청산 이력까지</div>' +
      '<div id="spacBody"><div class="spac-loading">데이터를 불러오는 중입니다...</div></div>';

    fetch(JSON_URL).then(function (r) { return r.json(); }).then(render).catch(function () {
      var b = document.getElementById('spacBody');
      if (b) b.innerHTML = '<div class="spac-empty">데이터를 불러오지 못했습니다. 잠시 후 새로고침해 주세요.</div>';
    });
  }

  function render(d) {
    var s = d.summary;
    var lossCnt = s.offerBased - s.offerWin;
    var lossRate = Math.round(lossCnt / s.offerBased * 100);
    var mergeRate = Math.round(s.mergedTotal / s.totalSpac * 100);

    var html = '';
    html += '<div class="spac-hero">';
    html += '<div class="spac-hero-lead">공모가 2,000원에 사서 합병까지 간 스팩</div>';
    html += '<div class="spac-hero-head"><span class="spac-big spac-num">' + lossRate + '%</span>가 지금 마이너스</div>';
    html += '<div class="spac-hero-sub">수익률 계산이 가능한 합병 성공 스팩 <span class="spac-num">' + s.offerBased + '</span>곳 중 <span class="spac-num">' + lossCnt + '</span>곳이 공모가 대비 손실 상태입니다. 안전하다고 알려진 스팩의 실제 성적표를 확인해 보세요.</div>';
    html += '</div>';

    html += '<div class="spac-stats">';
    html += '<div class="spac-stat"><div class="spac-stat-v spac-num">' + s.totalSpac + '</div><div class="spac-stat-l">역대 전체 스팩</div></div>';
    html += '<div class="spac-stat"><div class="spac-stat-v spac-num">' + mergeRate + '%</div><div class="spac-stat-l">합병 성공률</div></div>';
    html += '<div class="spac-stat"><div class="spac-stat-v spac-num">' + s.delisted + '</div><div class="spac-stat-l">합병 못하고 청산</div></div>';
    html += '</div>';

    html += '<div class="spac-search-box"><span class="spac-search-ic">🔍</span>';
    html += '<input class="spac-search" id="spacSearch" type="text" placeholder="스팩명 또는 합병한 기업명 검색 (예: 클래시스, 하나30호)">';
    html += '</div><div class="spac-result" id="spacResult"></div>';

    html += '<div class="spac-tabs">';
    html += '<button class="spac-tab spac-on" data-t="merged">합병 성적표</button>';
    html += '<button class="spac-tab" data-t="brokers">증권사 랭킹</button>';
    html += '<button class="spac-tab" data-t="active">거래 가능</button>';
    html += '<button class="spac-tab" data-t="delisted">청산 이력</button>';
    html += '</div>';

    html += '<div class="spac-panel spac-on" data-p="merged">' + panelMerged(d) + '</div>';
    html += '<div class="spac-panel" data-p="brokers">' + panelBrokers(d) + '</div>';
    html += '<div class="spac-panel" data-p="active">' + panelActive(d) + '</div>';
    html += '<div class="spac-panel" data-p="delisted">' + panelDelisted(d) + '</div>';

    html += '<div class="spac-note">';
    html += '<b>스팩 투자 참고사항</b><br>';
    html += '스팩은 그 자체로 호재도 악재도 아닙니다. 합병 대상과 시점, 시장 상황에 따라 결과가 크게 갈립니다. ';
    html += '수익률은 특정 시점 종가 기준이며, <b>공모가 대비</b>는 합병 성공 후 공모가 2,000원 기준, <b>자본변동 종목</b>은 액면분할·병합으로 공모가 대비 계산이 어려워 상장 첫날 종가 대비로 표기했습니다. ';
    html += '이 자료는 투자 참고용이며 특정 종목의 매수·매도 추천이 아닙니다.';
    html += '</div>';

    html += '<div class="spac-foot">데이터 출처: 금융감독원 전자공시(DART), 한국거래소 · 기준일 ' + esc(d.updated) + ' · stockchild.com</div>';

    document.getElementById('spacBody').innerHTML = html;
    bindTabs();
    bindSearch(d);
  }

  function panelMerged(d) {
    var h = '';
    h += '<div class="spac-section-l">🏆 공모가 대비 수익률 (합병 성공 ' + d.merged.length + '곳)</div>';
    d.merged.forEach(function (m, i) { h += mergedCard(m, i + 1); });

    if (d.capChanged && d.capChanged.length) {
      h += '<div class="spac-section-l">⚠️ 자본변동 종목 (' + d.capChanged.length + '곳) · 공모가 대비 계산 불가</div>';
      d.capChanged.forEach(function (m) { h += mergedCard(m, null); });
    }
    if (d.untraded && d.untraded.length) {
      h += '<div class="spac-section-l">🔻 합병 후 재합병·공개매수 등으로 현재 미거래 (' + d.untraded.length + '곳)</div>';
      d.untraded.forEach(function (m) {
        h += '<div class="spac-card2"><div class="spac-simple"><div class="spac-info">' +
          '<div class="spac-sname">' + esc(clean(m.n)) + '</div>' +
          '<div class="spac-pname">' + esc(clean(m.partner)) + '</div>' +
          '<div class="spac-meta">' + esc(m.broker) + '</div>' +
          '</div><span class="spac-pill spac-p-dead1">미거래</span></div></div>';
      });
    }
    return h;
  }

  function mergedCard(m, rank) {
    var isCap = (m.basis && m.basis.indexOf('첫날') !== -1);
    var h = '<div class="spac-card2"><div class="spac-row">';
    if (rank !== null) h += '<div class="spac-rank spac-num">' + rank + '</div>';
    h += '<div class="spac-info">';
    h += '<div class="spac-sname">' + esc(clean(m.n)) + typeBadge(m.type) + (isCap ? '<span class="spac-badge spac-b-cap">자본변동</span>' : '') + '</div>';
    h += '<div class="spac-pname">' + esc(clean(m.partner)) + '</div>';
    h += '<div class="spac-meta">' + esc(m.broker) + (m.price ? ' · 현재 <span class="spac-num">' + m.price.toLocaleString() + '</span>원' : '') + '</div>';
    h += '</div>';
    h += '<div class="spac-ret">';
    if (m.ret === null || m.ret === undefined) {
      h += '<div class="spac-ret-v spac-flat-c">-</div>';
    } else {
      h += '<div class="spac-ret-v spac-num ' + retClass(m.ret) + '">' + retStr(m.ret) + '</div>';
      h += '<div class="spac-ret-l">' + (isCap ? '첫날 대비' : '공모가 대비') + '</div>';
    }
    h += '</div></div></div>';
    return h;
  }

  function panelBrokers(d) {
    var h = '<div class="spac-section-l">🏦 스팩 발행 증권사 (발행 수 기준)</div>';
    d.brokers.forEach(function (b, i) {
      if (b.total < 1) return;
      var w = b.total;
      var dp = (b.done / w * 100), lp = (b.live / w * 100), xp = (b.dead / w * 100);
      h += '<div class="spac-brk">';
      h += '<div class="spac-brk-top"><span class="spac-brk-rk spac-num">' + (i + 1) + '</span>';
      h += '<span class="spac-brk-name">' + esc(b.broker) + '</span>';
      h += '<span class="spac-brk-total">발행 <b class="spac-num">' + b.total + '</b></span></div>';
      h += '<div class="spac-bar">';
      h += '<div class="spac-bar-done" style="width:' + dp + '%"></div>';
      h += '<div class="spac-bar-live" style="width:' + lp + '%"></div>';
      h += '<div class="spac-bar-dead" style="width:' + xp + '%"></div></div>';
      h += '<div class="spac-brk-legend">';
      h += '<span class="spac-lg"><span class="spac-dot" style="background:var(--spac-accent)"></span>합병 ' + b.done + '</span>';
      h += '<span class="spac-lg"><span class="spac-dot" style="background:#C9B896"></span>진행중 ' + b.live + '</span>';
      h += '<span class="spac-lg"><span class="spac-dot" style="background:#D8CBB4"></span>청산 ' + b.dead + '</span>';
      h += '<span class="spac-lg">합병률 <b class="spac-num">&nbsp;' + b.doneRate + '%</b></span>';
      h += '</div></div>';
    });
    return h;
  }

  function panelActive(d) {
    var open = [], prog = [], cancel = [];
    d.active.forEach(function (a) {
      if (a.status.indexOf('취소') !== -1) cancel.push(a);
      else if (a.status.indexOf('진행') !== -1) prog.push(a);
      else open.push(a);
    });
    var h = '';
    if (prog.length) {
      h += '<div class="spac-section-l">🔄 합병 진행 중 (' + prog.length + '곳)</div>';
      prog.forEach(function (a) { h += activeCard(a, 'spac-p-prog', '합병 진행중'); });
    }
    if (open.length) {
      h += '<div class="spac-section-l">🔍 합병 대상 찾는 중 (' + open.length + '곳)</div>';
      open.forEach(function (a) { h += activeCard(a, 'spac-p-open', '모집중'); });
    }
    if (cancel.length) {
      h += '<div class="spac-section-l">↩️ 합병 무산 후 재추진 (' + cancel.length + '곳)</div>';
      cancel.forEach(function (a) { h += activeCard(a, 'spac-p-cancel', '합병 취소 이력'); });
    }
    return h || '<div class="spac-empty">현재 거래 가능한 스팩이 없습니다.</div>';
  }
  function activeCard(a, cls, label) {
    return '<div class="spac-card2"><div class="spac-simple"><div class="spac-info">' +
      '<div class="spac-pname">' + esc(clean(a.n)) + '</div>' +
      '<div class="spac-meta">' + esc(a.broker) + '</div>' +
      '</div><span class="spac-pill ' + cls + '">' + label + '</span></div></div>';
  }

  function panelDelisted(d) {
    var noMerge = [], canceled = [];
    d.delisted.forEach(function (x) {
      if (x.status.indexOf('취소') !== -1 || x.status.indexOf('미완료') !== -1) canceled.push(x);
      else noMerge.push(x);
    });
    var h = '';
    h += '<div class="spac-section-l">💀 합병 시도 없이 존속기한 만료 (' + noMerge.length + '곳)</div>';
    noMerge.forEach(function (x) { h += deadCard(x, 'spac-p-dead1', '기한 만료'); });
    h += '<div class="spac-section-l">✖️ 합병 추진했으나 무산 후 청산 (' + canceled.length + '곳)</div>';
    canceled.forEach(function (x) { h += deadCard(x, 'spac-p-dead2', '합병 무산'); });
    return h;
  }
  function fmtDate_(s) {
    s = String(s || '').trim();
    if (s.length !== 8) return '';
    return s.substring(0, 4) + '.' + s.substring(4, 6) + '.' + s.substring(6, 8);
  }
  function deadCard(x, cls, label) {
    var dt = fmtDate_(x.date);
    return '<div class="spac-card2"><div class="spac-simple"><div class="spac-info">' +
      '<div class="spac-pname">' + esc(clean(x.n)) + '</div>' +
      '<div class="spac-meta">' + esc(x.broker) + (dt ? ' · <span class="spac-num">' + dt + '</span> 청산' : '') + '</div>' +
      '</div><span class="spac-pill ' + cls + '">' + label + '</span></div></div>';
  }

  function bindTabs() {
    var tabs = document.querySelectorAll('.spac-tab');
    var panels = document.querySelectorAll('.spac-panel');
    tabs.forEach(function (t) {
      t.addEventListener('click', function () {
        tabs.forEach(function (x) { x.classList.remove('spac-on'); });
        panels.forEach(function (x) { x.classList.remove('spac-on'); });
        t.classList.add('spac-on');
        var p = document.querySelector('.spac-panel[data-p="' + t.getAttribute('data-t') + '"]');
        if (p) p.classList.add('spac-on');
      });
    });
  }

  function bindSearch(d) {
    var input = document.getElementById('spacSearch');
    var box = document.getElementById('spacResult');
    if (!input || !box) return;
    var pool = [];
    d.merged.forEach(function (m) { pool.push({ kind: 'merged', o: m }); });
    d.capChanged.forEach(function (m) { pool.push({ kind: 'merged', o: m }); });
    d.untraded.forEach(function (m) { pool.push({ kind: 'untraded', o: m }); });
    d.active.forEach(function (a) { pool.push({ kind: 'active', o: a }); });
    d.delisted.forEach(function (x) { pool.push({ kind: 'delisted', o: x }); });

    input.addEventListener('input', function () {
      var q = clean(this.value).toLowerCase();
      if (q.length < 1) { box.innerHTML = ''; return; }
      var hits = pool.filter(function (p) {
        var n = clean(p.o.n).toLowerCase();
        var pt = clean(p.o.partner || '').toLowerCase();
        return n.indexOf(q) !== -1 || pt.indexOf(q) !== -1;
      }).slice(0, 8);

      if (!hits.length) { box.innerHTML = '<div class="spac-result-hint">검색 결과가 없습니다.</div>'; return; }
      var h = '<div class="spac-result-hint">검색 결과 ' + hits.length + '건</div>';
      hits.forEach(function (p) {
        if (p.kind === 'merged') h += mergedCard(p.o, null);
        else if (p.kind === 'untraded') {
          h += '<div class="spac-card2"><div class="spac-simple"><div class="spac-info">' +
            '<div class="spac-sname">' + esc(clean(p.o.n)) + '</div>' +
            '<div class="spac-pname">' + esc(clean(p.o.partner)) + '</div>' +
            '<div class="spac-meta">' + esc(p.o.broker) + '</div></div>' +
            '<span class="spac-pill spac-p-dead1">미거래</span></div></div>';
        } else if (p.kind === 'active') h += activeCard(p.o, 'spac-p-open', clean(p.o.status));
        else h += deadCard(p.o, 'spac-p-dead1', '청산');
      });
      box.innerHTML = h;
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }
})();
