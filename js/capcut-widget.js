/* ================================================================
   No.15 무상감자 이력 추적기 : JS
   GitHub 저장소 js/capcut-widget.js 로 커밋해서 CDN으로 로드
   (포스트 안에 직접 넣지 않음: 용어사전 플러그인 충돌 방지)

   ★ 설정: 아래 FALLBACK_URL의 웹앱 URL을 본인 것으로 교체
================================================================ */
(function () {
  'use strict';

  var CDN_URL = 'https://dooly870505-commits.github.io/stockchild-data/data/capcut.json';
  /* 웹앱 배포 URL 뒤에 ?tool=capcut 을 붙인 폴백 주소. AAAA 부분을 교체 */
  var FALLBACK_URL = 'https://script.google.com/macros/s/AKfycbx3rYebPAr6ReE4UoBivkKGRiCZIg_wukexmykPRxpMKriSvYDnYrmJblyvEAZPzZ7I/exec?tool=capcut';

  var DATA = null;
  var PAGE_SIZE = 15;
  var shownCount = PAGE_SIZE;
  var currentTab = 'rank';

  /* ---------------- 유틸 ---------------- */
  function $(id) { return document.getElementById(id); }

  function disp(name) {
    return String(name || '')
      .replace(/^(주식회사|\(주\)|㈜)\s*/, '')
      .replace(/\s*(주식회사|\(주\)|㈜)$/, '');
  }

  function marketLabel(m) {
    if (m === 'KOSPI') return '코스피';
    if (m === 'KOSDAQ') return '코스닥';
    if (m === 'KONEX') return '코넥스';
    return '기타';
  }

  function kindBadge(kind) {
    if (kind === '무상') return '<span class="cc-badge free">무상감자</span>';
    if (kind === '유상') return '<span class="cc-badge paid">유상감자</span>';
    if (kind === '소각') return '<span class="cc-badge burn">자사주 소각</span>';
    return '<span class="cc-badge unknown">감자(방법 확인)</span>';
  }

  function ratioText(r) {
    var n = parseFloat(r);
    if (!isFinite(n) || n <= 0 || n > 100) return '';
    return n + '%';
  }

  function esc(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function dartLink(code) {
    /* 종목 단위 DART 검색 링크: 개별 접수번호가 JSON에 없으므로 회사 검색으로 유도 */
    return 'https://dart.fss.or.kr/dsab007/main.do?option=corp&textCrpNm=' + encodeURIComponent(code);
  }

  /* ---------------- 데이터 로드: CDN 우선, 실패 시 Apps Script ---------------- */
  function loadData() {
    fetch(CDN_URL, { cache: 'no-cache' })
      .then(function (r) { if (!r.ok) throw new Error('CDN ' + r.status); return r.json(); })
      .then(init)
      .catch(function () {
        fetch(FALLBACK_URL)
          .then(function (r) { return r.json(); })
          .then(init)
          .catch(function () {
            $('ccList').innerHTML =
              '<div class="cc-loading">데이터를 불러오지 못했습니다. 잠시 후 새로고침해 주세요.</div>';
          });
      });
  }

  function init(json) {
    /* 방어적 정제: 필수 필드 없는 항목 제거 */
    if (!json || !Array.isArray(json.stocks)) {
      $('ccList').innerHTML = '<div class="cc-loading">데이터 형식 오류입니다.</div>';
      return;
    }
    json.stocks = json.stocks.filter(function (s) {
      return s && s.code && s.name && Array.isArray(s.history);
    });
    json.recent = Array.isArray(json.recent) ? json.recent : [];
    DATA = json;
    $('ccUpdated').textContent = json.updated || '-';
    renderList();
  }

  /* ---------------- 리스트 (탭) ---------------- */
  function renderList() {
    var el = $('ccList');
    if (!DATA) return;

    if (currentTab === 'rank') {
      var ranked = DATA.stocks.filter(function (s) { return s.countFree > 0; });
      var rows = ranked.slice(0, shownCount).map(function (s, i) {
        var last = s.history[s.history.length - 1] || {};
        return '<div class="cc-card" data-code="' + esc(s.code) + '">'
          + '<div class="cc-card-top">'
          + '<span class="cc-rank-no">' + (i + 1) + '</span>'
          + '<span class="cc-name">' + esc(disp(s.name)) + '</span>'
          + '<span class="cc-code">' + esc(s.code) + '</span>'
          + '<span class="cc-market">' + marketLabel(s.market) + '</span>'
          + '</div>'
          + '<div class="cc-card-sub">무상감자 <span class="cc-count">' + s.countFree + '회</span>'
          + (s.countAll > s.countFree ? ' · 전체 감자 이력 ' + s.countAll + '건' : '')
          + ' · 최근 ' + esc(last.date || '-') + '</div>'
          + '</div>';
      }).join('');
      el.innerHTML = rows || '<div class="cc-loading">데이터가 없습니다.</div>';
      $('ccMore').style.display = ranked.length > shownCount ? 'block' : 'none';
    } else {
      var rows2 = DATA.recent.map(function (e) {
        var rt = ratioText(e.ratio);
        return '<div class="cc-card" data-code="' + esc(e.code) + '">'
          + '<div class="cc-card-top">'
          + '<span class="cc-name">' + esc(disp(e.name)) + '</span>'
          + '<span class="cc-code">' + esc(e.code) + '</span>'
          + kindBadge(e.kind)
          + '</div>'
          + '<div class="cc-card-sub">' + esc(e.date)
          + (rt ? ' · 감자비율 ' + rt : '')
          + (e.form && e.form !== '기타' ? ' · ' + esc(e.form) : '')
          + '</div>'
          + '</div>';
      }).join('');
      el.innerHTML = rows2 || '<div class="cc-loading">최근 90일 내 감자결정 공시가 없습니다.</div>';
      $('ccMore').style.display = 'none';
    }

    Array.prototype.forEach.call(el.querySelectorAll('.cc-card'), function (card) {
      card.addEventListener('click', function () { openDetail(card.getAttribute('data-code')); });
    });
  }

  /* ---------------- 상세 카드 ---------------- */
  function openDetail(code) {
    var s = null;
    for (var i = 0; i < DATA.stocks.length; i++) {
      if (DATA.stocks[i].code === code) { s = DATA.stocks[i]; break; }
    }
    if (!s) return;

    var counts = { '무상': 0, '유상': 0, '소각': 0 };
    s.history.forEach(function (e) { if (counts[e.kind] !== undefined) counts[e.kind]++; });
    var parts = [];
    if (counts['무상']) parts.push('무상감자 ' + counts['무상'] + '회');
    if (counts['유상']) parts.push('유상감자 ' + counts['유상'] + '회');
    if (counts['소각']) parts.push('자사주 소각 ' + counts['소각'] + '회');
    if (s.countAll > counts['무상'] + counts['유상'] + counts['소각']) parts.push('방법 확인 필요 포함');

    var tl = s.history.map(function (e) {
      var rt = ratioText(e.ratio);
      return '<div class="cc-tl-item">'
        + '<div class="cc-tl-top">'
        + '<span class="cc-tl-date">' + esc(e.date) + '</span>'
        + kindBadge(e.kind)
        + (rt ? '<span class="cc-tl-ratio">' + rt + '</span>' : '')
        + (e.form && e.form !== '기타' ? '<span class="cc-tl-form">' + esc(e.form) + '</span>' : '')
        + '</div>'
        + (e.method ? '<div class="cc-tl-method">' + esc(e.method) + '</div>' : '')
        + (e.reason ? '<div class="cc-tl-reason">사유: ' + esc(e.reason) + '</div>' : '')
        + '</div>';
    }).join('');

    /* 계산기: 병합형 무상감자가 1건 이상일 때만 노출 */
    var mergeCuts = s.history.filter(function (e) {
      var n = parseFloat(e.ratio);
      return e.kind === '무상' && e.form === '병합형' && isFinite(n) && n > 0 && n < 100;
    });
    var calcHtml = '';
    if (mergeCuts.length) {
      calcHtml = '<div class="cc-calc">'
        + '<div class="cc-calc-title">🧮 감자 생존 계산기</div>'
        + '<div class="cc-calc-row">'
        + '<input type="number" id="ccCalcInput" placeholder="처음 보유 주식수 (예: 100)" min="1" />'
        + '<button id="ccCalcBtn">계산</button>'
        + '</div>'
        + '<div class="cc-calc-result" id="ccCalcResult"></div>'
        + '<div class="cc-calc-note">병합형 무상감자 ' + mergeCuts.length + '건을 공시일 순서로 적용한 참고값입니다. '
        + '차등감자 / 단수주 / 액면감액형은 계산에서 제외됩니다.</div>'
        + '</div>';
    }

    $('ccDetail').innerHTML =
      '<div class="cc-detail-head">'
      + '<span class="cc-detail-name">' + esc(disp(s.name)) + '</span>'
      + '<span class="cc-code">' + esc(s.code) + '</span>'
      + '<span class="cc-market">' + marketLabel(s.market) + '</span>'
      + '<button class="cc-detail-close" id="ccDetailClose">✕</button>'
      + '</div>'
      + '<div class="cc-detail-summary">' + parts.join(' · ')
      + ' · <a href="' + dartLink(s.name) + '" target="_blank" rel="noopener" style="color:var(--nct-accent);">DART 원문 보기</a></div>'
      + '<div class="cc-tl">' + tl + '</div>'
      + calcHtml;

    $('ccDetail').style.display = 'block';
    $('ccDetailClose').addEventListener('click', function () {
      $('ccDetail').style.display = 'none';
    });

    if (mergeCuts.length) {
      $('ccCalcBtn').addEventListener('click', function () { runCalc(mergeCuts); });
      $('ccCalcInput').addEventListener('keydown', function (ev) {
        if (ev.key === 'Enter') runCalc(mergeCuts);
      });
    }

    $('ccDetail').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function runCalc(cuts) {
    var start = parseInt($('ccCalcInput').value, 10);
    var out = $('ccCalcResult');
    if (!isFinite(start) || start < 1) {
      out.innerHTML = '보유 주식수를 숫자로 입력해 주세요.';
      return;
    }
    var shares = start;
    var steps = [];
    cuts.forEach(function (e) {
      var before = shares;
      shares = Math.floor(shares * (1 - parseFloat(e.ratio) / 100));
      steps.push(esc(e.date) + ' (' + ratioText(e.ratio) + ') : '
        + before.toLocaleString() + '주 → ' + shares.toLocaleString() + '주');
    });
    out.innerHTML = steps.join('<br>')
      + '<br>처음 ' + start.toLocaleString() + '주가 지금은 약 '
      + '<span class="final">' + shares.toLocaleString() + '주</span> 입니다.';
  }

  /* ---------------- 검색 ---------------- */
  function bindSearch() {
    var input = $('ccSearch');
    var box = $('ccSuggest');

    input.addEventListener('input', function () {
      var q = input.value.trim().toLowerCase();
      if (!DATA || q.length < 1) { box.className = 'cc-suggest'; box.innerHTML = ''; return; }
      var hits = DATA.stocks.filter(function (s) {
        return s.name.toLowerCase().indexOf(q) !== -1 || s.code.indexOf(q) !== -1;
      }).slice(0, 8);
      if (!hits.length) { box.className = 'cc-suggest'; box.innerHTML = ''; return; }
      box.innerHTML = hits.map(function (s) {
        return '<div class="cc-suggest-item" data-code="' + esc(s.code) + '">'
          + '<span>' + esc(disp(s.name)) + '</span>'
          + '<span class="code">' + esc(s.code) + ' · 감자 ' + s.countAll + '건</span></div>';
      }).join('');
      box.className = 'cc-suggest open';
      Array.prototype.forEach.call(box.querySelectorAll('.cc-suggest-item'), function (item) {
        item.addEventListener('click', function () {
          box.className = 'cc-suggest'; box.innerHTML = '';
          input.value = '';
          openDetail(item.getAttribute('data-code'));
        });
      });
    });

    document.addEventListener('click', function (ev) {
      if (!box.contains(ev.target) && ev.target !== input) {
        box.className = 'cc-suggest'; box.innerHTML = '';
      }
    });
  }

  /* ---------------- 탭 / 더보기 ---------------- */
  function bindTabs() {
    Array.prototype.forEach.call(document.querySelectorAll('.cc-tab'), function (btn) {
      btn.addEventListener('click', function () {
        Array.prototype.forEach.call(document.querySelectorAll('.cc-tab'), function (b) {
          b.className = 'cc-tab';
        });
        btn.className = 'cc-tab active';
        currentTab = btn.getAttribute('data-tab');
        shownCount = PAGE_SIZE;
        renderList();
      });
    });
    $('ccMoreBtn').addEventListener('click', function () {
      shownCount += PAGE_SIZE;
      renderList();
    });
  }

  /* ---------------- 시작 ---------------- */
  function boot() {
    if (!$('ccWidget')) return;
    bindSearch();
    bindTabs();
    loadData();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
