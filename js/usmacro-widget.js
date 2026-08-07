(function () {
  'use strict';

  var API_URL = 'https://script.google.com/macros/s/AKfycbx3rYebPAr6ReE4UoBivkKGRiCZIg_wukexmykPRxpMKriSvYDnYrmJblyvEAZPzZ7I/exec?tool=usmacro';
  var mountId = 'nct-usmacro-mount';

  function fmtNum(v) {
    if (v === null || v === undefined || v === '') return '-';
    var n = Number(v);
    if (isNaN(n)) return String(v);
    if (Math.abs(n) >= 1000) return n.toLocaleString('en-US', { maximumFractionDigits: 2 });
    return n.toLocaleString('en-US', { maximumFractionDigits: 4 });
  }

  function fmtChange(v) {
    if (v === null || v === undefined || v === '') return { text: '-', cls: '' };
    var n = Number(v);
    if (isNaN(n) || n === 0) return { text: '0', cls: 'nct-um-flat' };
    var sign = n > 0 ? '▲' : '▼';
    var cls = n > 0 ? 'nct-um-up' : 'nct-um-down';
    return { text: sign + ' ' + fmtNum(Math.abs(n)), cls: cls };
  }

  function hoursAgo(dateStr) {
    if (!dateStr) return '';
    var d = new Date(dateStr + 'T00:00:00+09:00');
    var diffMs = Date.now() - d.getTime();
    var diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays <= 0) return '오늘 발표';
    if (diffDays === 1) return '어제 발표';
    return diffDays + '일 전 발표';
  }

  function cleanRow(r) {
    // 서버 반영 지연 대비, 위젯 자체에서도 방어적으로 정제
    return {
      seriesId: r.seriesId || '',
      indicatorName: r.indicatorName || r.seriesId || '알 수 없음',
      category: r.category === 'headline' ? 'headline' : 'background',
      releaseDate: r.releaseDate || '',
      actualValue: (r.actualValue === '' || r.actualValue === undefined) ? null : r.actualValue,
      prevValue: (r.prevValue === '' || r.prevValue === undefined) ? null : r.prevValue,
      change: (r.change === '' || r.change === undefined) ? null : r.change,
      consensusValue: (r.consensusValue === '' || r.consensusValue === undefined) ? null : r.consensusValue,
      surprise: (r.surprise === '' || r.surprise === undefined) ? null : r.surprise
    };
  }

  function buildLatestCard(row) {
    var ch = fmtChange(row.change);
    var consensusHtml = '';
    if (row.consensusValue !== null) {
      var surpriseCh = fmtChange(row.surprise);
      consensusHtml =
        '<div class="nct-um-consensus">' +
        '<span class="nct-um-consensus-label">시장 예상치</span>' +
        '<span class="nct-um-consensus-val">' + fmtNum(row.consensusValue) + '</span>' +
        '<span class="nct-um-consensus-label">예상 대비</span>' +
        '<span class="' + surpriseCh.cls + '">' + surpriseCh.text + '</span>' +
        '</div>';
    } else {
      consensusHtml = '<div class="nct-um-consensus nct-um-consensus-empty">예상치 미입력</div>';
    }

    return (
      '<div class="nct-um-latest-card">' +
      '<div class="nct-um-badge">' + hoursAgo(row.releaseDate) + '</div>' +
      '<div class="nct-um-latest-name">' + row.indicatorName + '</div>' +
      '<div class="nct-um-latest-value">' + fmtNum(row.actualValue) + '</div>' +
      '<div class="nct-um-latest-sub">' +
      '<span>전기 ' + fmtNum(row.prevValue) + '</span>' +
      '<span class="' + ch.cls + '">' + ch.text + '</span>' +
      '</div>' +
      consensusHtml +
      '<div class="nct-um-date">발표일 ' + row.releaseDate + '</div>' +
      '</div>'
    );
  }

  function buildListItem(row) {
    var ch = fmtChange(row.change);
    return (
      '<div class="nct-um-item">' +
      '<div class="nct-um-item-top">' +
      '<span class="nct-um-item-name">' + row.indicatorName + '</span>' +
      '<span class="nct-um-pill ' + (row.category === 'headline' ? 'nct-um-pill-headline' : 'nct-um-pill-bg') + '">' +
      (row.category === 'headline' ? '주요지표' : '참고지표') +
      '</span>' +
      '</div>' +
      '<div class="nct-um-item-mid">' +
      '<span class="nct-um-item-value">' + fmtNum(row.actualValue) + '</span>' +
      '<span class="' + ch.cls + '">' + ch.text + '</span>' +
      '</div>' +
      '<div class="nct-um-item-date">' + row.releaseDate + '</div>' +
      '</div>'
    );
  }

  function render(data) {
    var mount = document.getElementById(mountId);
    if (!mount) return;

    if (!data || !data.latest) {
      mount.innerHTML = '<div class="nct-um-empty">아직 수집된 지표가 없습니다.</div>';
      return;
    }

    var latest = cleanRow(data.latest);
    var recent = (data.recent || []).map(cleanRow).filter(function (r) {
      return r.seriesId !== latest.seriesId || r.releaseDate !== latest.releaseDate;
    });

    var headlineItems = recent.filter(function (r) { return r.category === 'headline'; });
    var allItems = recent;

    var html =
      '<div class="nct-um-wrap">' +
      '<div class="nct-um-title">🇺🇸 미국 경제지표 속보</div>' +
      buildLatestCard(latest) +
      '<div class="nct-um-tabs">' +
      '<button class="nct-um-tab nct-um-tab-active" data-tab="headline">주요지표</button>' +
      '<button class="nct-um-tab" data-tab="all">전체보기</button>' +
      '</div>' +
      '<div class="nct-um-list" data-panel="headline">' +
      (headlineItems.map(buildListItem).join('') || '<div class="nct-um-empty">데이터 없음</div>') +
      '</div>' +
      '<div class="nct-um-list" data-panel="all" style="display:none;">' +
      (allItems.map(buildListItem).join('') || '<div class="nct-um-empty">데이터 없음</div>') +
      '</div>' +
      '<div class="nct-um-disclaimer">' +
      '표시된 지표는 미 연준 경제데이터(FRED)를 자동 수집한 실제 발표치이며, 시장 예상치는 발표 전 별도 입력된 경우에만 표시됩니다. ' +
      '지표 하나의 등락이 시장 방향을 확정하지 않으며, 투자 참고용 정보일 뿐 매수/매도 추천이 아닙니다.' +
      '</div>' +
      '<div class="nct-um-footer">출처: FRED (Federal Reserve Economic Data) · 기준시각 ' + (data.generatedAt || '-') + '</div>' +
      '</div>';

    mount.innerHTML = html;

    var tabs = mount.querySelectorAll('.nct-um-tab');
    tabs.forEach(function (btn) {
      btn.addEventListener('click', function () {
        tabs.forEach(function (b) { b.classList.remove('nct-um-tab-active'); });
        btn.classList.add('nct-um-tab-active');
        var target = btn.getAttribute('data-tab');
        mount.querySelectorAll('.nct-um-list').forEach(function (panel) {
          panel.style.display = (panel.getAttribute('data-panel') === target) ? '' : 'none';
        });
      });
    });
  }

  function init() {
    var mount = document.getElementById(mountId);
    if (!mount) return;
    mount.innerHTML = '<div class="nct-um-loading">불러오는 중...</div>';

    fetch(API_URL)
      .then(function (res) { return res.json(); })
      .then(function (data) { render(data); })
      .catch(function (err) {
        mount.innerHTML = '<div class="nct-um-empty">데이터를 불러오지 못했습니다.</div>';
        console.error('usmacro widget error:', err);
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
