(function () {
  var WEBAPP_URL = 'https://script.google.com/macros/s/AKfycbx3rYebPAr6ReE4UoBivkKGRiCZIg_wukexmykPRxpMKriSvYDnYrmJblyvEAZPzZ7I/exec';
  var STOCK_LIST_URL = 'https://dooly870505-commits.github.io/stockchild-data/data/stock-list.json';

  var root = document.getElementById('fscore-widget');
  if (!root) return;

  var inputEl = document.getElementById('fs-input');
  var searchBtn = document.getElementById('fs-search-btn');
  var autoEl = document.getElementById('fs-autocomplete');
  var resultEl = document.getElementById('fs-result');
  var listBodyEl = document.getElementById('fs-list-body');

  var stockList = [];
  var selectedCode = null;

  function escHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function fmtWon(v) {
    if (v === null || v === undefined || isNaN(v)) return '-';
    var a = Math.abs(v);
    var sign = v < 0 ? '-' : '';
    if (a >= 1e12) return sign + (a / 1e12).toFixed(1) + '조';
    if (a >= 1e8) return sign + Math.round(a / 1e8).toLocaleString('ko-KR') + '억';
    if (a >= 1e4) return sign + Math.round(a / 1e4).toLocaleString('ko-KR') + '만';
    return sign + Math.round(a).toLocaleString('ko-KR');
  }

  function safeDiv(a, b) {
    if (a === null || a === undefined || b === null || b === undefined || b === 0) return null;
    return a / b;
  }

  function fmtPct(v) {
    if (v === null || v === undefined || isNaN(v)) return '-';
    return (v * 100).toFixed(1) + '%';
  }

  function fmtRatio(v) {
    if (v === null || v === undefined || isNaN(v)) return '-';
    return v.toFixed(2) + '배';
  }

  // ===== 종목 검색 데이터 로드 (자동완성용) =====
  function loadStockList() {
    fetch(STOCK_LIST_URL)
      .then(function (res) { return res.json(); })
      .then(function (data) {
        if (Array.isArray(data)) stockList = data;
      })
      .catch(function () { /* 자동완성 실패해도 직접 종목코드 입력은 계속 가능하게 둠 */ });
  }
  loadStockList();

  function renderAutocomplete(query) {
    if (!query) { autoEl.style.display = 'none'; autoEl.innerHTML = ''; return; }
    var q = query.trim();
    var matches = stockList.filter(function (s) {
      if (!s || !s.name || !s.code) return false;
      return s.name.indexOf(q) !== -1 || String(s.code).indexOf(q) !== -1;
    }).slice(0, 8);

    if (matches.length === 0) { autoEl.style.display = 'none'; autoEl.innerHTML = ''; return; }

    autoEl.innerHTML = matches.map(function (s) {
      return '<div class="fs-autocomplete-item" data-code="' + escHtml(s.code) + '" data-name="' + escHtml(s.name) + '">'
        + escHtml(s.name) + '<span class="fs-code">' + escHtml(s.code) + '</span></div>';
    }).join('');
    autoEl.style.display = 'block';

    Array.prototype.forEach.call(autoEl.querySelectorAll('.fs-autocomplete-item'), function (el) {
      el.addEventListener('click', function () {
        var code = el.getAttribute('data-code');
        var name = el.getAttribute('data-name');
        inputEl.value = name;
        selectedCode = code;
        autoEl.style.display = 'none';
        doSearch(code);
      });
    });
  }

  inputEl.addEventListener('input', function () {
    selectedCode = null;
    renderAutocomplete(inputEl.value);
  });

  document.addEventListener('click', function (e) {
    if (!root.contains(e.target)) return;
    if (e.target === inputEl) return;
    if (autoEl.contains(e.target)) return;
    autoEl.style.display = 'none';
  });

  inputEl.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') { e.preventDefault(); triggerSearch(); }
  });
  searchBtn.addEventListener('click', triggerSearch);

  function resolveCodeFromInput() {
    var raw = inputEl.value.trim();
    if (!raw) return null;
    if (selectedCode) return selectedCode;
    if (/^\d{6}$/.test(raw)) return raw; // 6자리 숫자면 종목코드로 간주
    var byName = stockList.filter(function (s) { return s.name === raw; });
    if (byName.length === 1) return byName[0].code;
    var byCode = stockList.filter(function (s) { return String(s.code) === raw; });
    if (byCode.length === 1) return byCode[0].code;
    return null;
  }

  function triggerSearch() {
    autoEl.style.display = 'none';
    var code = resolveCodeFromInput();
    if (!code) {
      resultEl.innerHTML = '<div class="fs-card"><div class="fs-error">정확한 종목명 또는 6자리 종목코드를 입력해주세요.</div></div>';
      return;
    }
    doSearch(code);
  }

  // ===== 개별 종목 조회 =====
  function doSearch(code) {
    resultEl.innerHTML = '<div class="fs-card"><div class="fs-status">계산 중입니다. 잠시만 기다려주세요...</div></div>';
    fetch(WEBAPP_URL + '?tool=fscore&code=' + encodeURIComponent(code))
      .then(function (res) { return res.json(); })
      .then(function (result) {
        renderDetail(result);
        fetchList(); // 방금 조회한 종목이 반영되도록 하단 리스트도 갱신
      })
      .catch(function () {
        resultEl.innerHTML = '<div class="fs-card"><div class="fs-error">일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.</div></div>';
      });
  }

  function buildDetailRows(raw, detail) {
    if (!raw || !detail) return [];
    var t = raw.thstrm || {};
    var p = raw.frmtrm || {};
    return [
      { pass: detail.roaPositive, label: '총자산순이익률(ROA) 양수', value: 'ROA ' + fmtPct(safeDiv(t.netIncome, t.assets)) },
      { pass: detail.cfoPositive, label: '영업활동현금흐름 양수', value: fmtWon(t.cfo) },
      { pass: detail.roaImproved, label: 'ROA 전년대비 개선', value: '전기 ' + fmtPct(safeDiv(p.netIncome, p.assets)) + ' → 당기 ' + fmtPct(safeDiv(t.netIncome, t.assets)) },
      { pass: detail.cfoExceedsNi, label: '영업현금흐름 > 순이익', value: '현금흐름 ' + fmtWon(t.cfo) + ' / 순이익 ' + fmtWon(t.netIncome) },
      { pass: detail.leverageImproved, label: '장기부채비율(비유동부채/자산) 감소', value: '전기 ' + fmtPct(safeDiv(p.noncurrentLiab, p.assets)) + ' → 당기 ' + fmtPct(safeDiv(t.noncurrentLiab, t.assets)) },
      { pass: detail.currentRatioImproved, label: '유동비율 개선', value: '전기 ' + fmtRatio(safeDiv(p.currentAssets, p.currentLiab)) + ' → 당기 ' + fmtRatio(safeDiv(t.currentAssets, t.currentLiab)) },
      { pass: detail.noDilution, label: '신주발행 없음(자본금 유지)', value: (t.capital === p.capital ? '자본금 변동없음' : '자본금 변동있음') },
      { pass: detail.grossMarginImproved, label: '매출총이익률 개선', value: '전기 ' + fmtPct(safeDiv(p.grossProfit, p.revenue)) + ' → 당기 ' + fmtPct(safeDiv(t.grossProfit, t.revenue)) },
      { pass: detail.assetTurnoverImproved, label: '총자산회전율 개선', value: '전기 ' + fmtRatio(safeDiv(p.revenue, p.assets)) + ' → 당기 ' + fmtRatio(safeDiv(t.revenue, t.assets)) }
    ];
  }

  function renderDetail(result) {
    if (!result || result.error) {
      resultEl.innerHTML = '<div class="fs-card"><div class="fs-error">'
        + escHtml((result && result.error) || '조회에 실패했습니다.') + '</div></div>';
      return;
    }
    var rows = buildDetailRows(result.raw, result.detail);
    var rowsHtml = rows.map(function (r) {
      var cls = r.pass ? 'pass' : 'fail';
      var icon = r.pass ? '✓' : '✕';
      return '<div class="fs-check-row">'
        + '<div class="fs-check-left"><div class="fs-check-icon ' + cls + '">' + icon + '</div>'
        + '<span class="fs-check-label">' + escHtml(r.label) + '</span></div>'
        + '<span class="fs-check-value">' + escHtml(r.value) + '</span>'
        + '</div>';
    }).join('');

    resultEl.innerHTML = '<div class="fs-card">'
      + '<div class="fs-card-head">'
      + '<div><div class="fs-name">' + escHtml(result.name) + '</div>'
      + '<div class="fs-meta">' + escHtml(result.code) + ' · ' + escHtml(result.bsnsYear) + '년 사업연도 · '
      + (result.fsDiv === 'CFS' ? '연결재무제표' : '개별재무제표') + '</div></div>'
      + '<div class="fs-score-wrap"><div class="fs-score-badge">' + result.score + '</div>'
      + '<div class="fs-score-max">/ ' + result.maxScore + '점</div></div>'
      + '</div>'
      + '<div class="fs-check-list">' + rowsHtml + '</div>'
      + '<div class="fs-disclaimer">피오트로스키 F score는 재무제표 9개 항목의 전년 대비 개선 여부를 점수화한 보조 지표이며, 점수 자체가 좋고 나쁨을 단정하지 않습니다. 투자 참고용이며 매수·매도 추천이 아닙니다.</div>'
      + '</div>';
  }

  // ===== 누적 리스트 =====
  function fetchList() {
    fetch(WEBAPP_URL + '?tool=fscore')
      .then(function (res) { return res.json(); })
      .then(function (data) { renderList(data); })
      .catch(function () {
        listBodyEl.innerHTML = '<div class="fs-status">목록을 불러오지 못했습니다.</div>';
      });
  }

  function renderList(data) {
    if (!data || !Array.isArray(data.ranking) || data.ranking.length === 0) {
      listBodyEl.innerHTML = '<div class="fs-status">아직 조회한 종목이 없습니다. 위에서 종목을 검색해보세요.</div>';
      return;
    }
    var html = data.ranking.map(function (r) {
      return '<div class="fs-list-row" data-code="' + escHtml(r.code) + '">'
        + '<span class="fs-list-name">' + escHtml(r.name) + '<span class="fs-list-code">' + escHtml(r.code) + '</span></span>'
        + '<span class="fs-list-score">' + escHtml(r.score) + ' / ' + escHtml(r.maxScore) + '</span>'
        + '</div>';
    }).join('');
    listBodyEl.innerHTML = html;

    Array.prototype.forEach.call(listBodyEl.querySelectorAll('.fs-list-row'), function (el) {
      el.addEventListener('click', function () {
        var code = el.getAttribute('data-code');
        inputEl.value = '';
        var found = stockList.filter(function (s) { return String(s.code) === code; })[0];
        if (found) inputEl.value = found.name;
        doSearch(code);
        window.scrollTo({ top: root.offsetTop - 20, behavior: 'smooth' });
      });
    });

    var updated = data.updated ? '기준시각 ' + data.updated : '';
    listBodyEl.insertAdjacentHTML('afterend', '<div class="fs-footer">' + escHtml(updated) + '</div>');
  }

  fetchList();
})();