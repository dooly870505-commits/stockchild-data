(function () {
  var WEBAPP_URL = 'https://script.google.com/macros/s/AKfycbx3rYebPAr6ReE4UoBivkKGRiCZIg_wukexmykPRxpMKriSvYDnYrmJblyvEAZPzZ7I/exec';
  var allEvents = [];
  var listEl = document.getElementById('ro-list');
  var searchEl = document.getElementById('ro-search-input');
  var viewList = document.getElementById('ro-view-list');
  var viewDetail = document.getElementById('ro-view-detail');
  var chartInstance = null;
  var currentEvent = null;
  var currentRangeMonths = 6;

  function disp(name) {
    return (name || '').replace(/^(주식회사|㈜|\(주\))\s*/, '').replace(/\s*(주식회사|㈜|\(주\))$/, '');
  }
  function fmtNum(n) {
    if (n === '' || n === null || n === undefined) return '';
    return Number(n).toLocaleString('ko-KR');
  }
  function fmtWon(n) {
    var v = fmtNum(n);
    return v ? v + '원' : '';
  }
  function fmtPriceDate(yyyymmdd) {
    var s = String(yyyymmdd);
    if (s.length !== 8) return s;
    return s.substring(4, 6) + '/' + s.substring(6, 8);
  }
  function calcDday(dateStr) {
    if (!dateStr) return null;
    var target = new Date(dateStr + 'T00:00:00+09:00');
    var today = new Date();
    var todayKST = new Date(today.getTime() + (today.getTimezoneOffset() * 60000) + (9 * 3600000));
    todayKST.setHours(0, 0, 0, 0);
    return Math.round((target - todayKST) / 86400000);
  }
  function ddayLabel(days) {
    if (days === null) return '';
    if (days > 0) return 'D-' + days;
    if (days === 0) return 'D-DAY';
    return 'D+' + Math.abs(days);
  }
  function field(label, value) {
    var v = value || '';
    var cls = v ? '' : ' empty';
    return '<div class="ro-field">' +
      '<div class="ro-field-label">' + label + '</div>' +
      '<div class="ro-field-value' + cls + '">' + (v || '미확인') + '</div>' +
    '</div>';
  }

  /* 상장일 이후 몇 개월까지 보여줄지 필터링. 상장 이전 흐름은 항상 전부 포함 */
  function filterPricesByRange(prices, months) {
    var limitDays = months * 30;
    return prices.filter(function (p) {
      if (p.days === '' || p.days === null || p.days === undefined) return true;
      var d = Number(p.days);
      if (isNaN(d)) return true;
      return d <= limitDays;
    });
  }

  function drawChart(ev, months) {
    var box = document.getElementById('ro-chart-box');
    var noteBox = document.getElementById('ro-cohort-note-box');
    if (!box) return;
    if (chartInstance) { chartInstance.destroy(); chartInstance = null; }
    if (typeof Chart === 'undefined') {
      box.innerHTML = '<div class="ro-chart-empty">그래프 라이브러리를 불러오지 못했어요</div>';
      return;
    }

    var allPrices = (ev.prices || []).slice().sort(function (a, b) { return a.date < b.date ? -1 : 1; });
    var prices = filterPricesByRange(allPrices, months);

    if (prices.length < 2) {
      box.innerHTML = '<div class="ro-chart-empty">이 기간엔 쌓인 시세 데이터가 적어요.</div>';
      if (noteBox) noteBox.innerHTML = '';
      return;
    }

    box.innerHTML = '<div class="ro-chart-canvas-box"><canvas id="ro-chart-canvas"></canvas></div>';

    var labels = prices.map(function (p) { return fmtPriceDate(p.date); });
    var values = prices.map(function (p) { return p.close; });
    var listingIdx = -1;
    prices.forEach(function (p, i) {
      if (listingIdx === -1 && p.days !== '' && p.days !== null && Number(p.days) >= 0) listingIdx = i;
    });

    var trendUp = values[values.length - 1] >= values[0];
    var lineColor = trendUp ? '#D64545' : '#2F80A0';

    var pointColors = prices.map(function (p, i) { return i === listingIdx ? '#D9761F' : lineColor; });
    var pointRadius = prices.map(function (p, i) { return i === listingIdx ? 6 : 2; });

    var datasets = [{
      label: '이 종목 종가',
      data: values,
      borderColor: lineColor,
      backgroundColor: 'transparent',
      borderWidth: 3,
      pointBackgroundColor: pointColors,
      pointRadius: pointRadius,
      pointHoverRadius: 7,
      tension: 0.2,
      fill: false,
      yAxisID: 'y'
    }];

    var cohortSeries = ev.cohort || [];
    var hasCohort = listingIdx !== -1 && cohortSeries.length > 0;
    var cohortSampleMin = null;

    if (hasCohort) {
      var baselineClose = prices[listingIdx].close;
      var cohortMap = {};
      cohortSeries.forEach(function (c) { cohortMap[c.day] = c; });

      var cohortValues = prices.map(function (p) {
        if (p.days === '' || p.days === null || Number(p.days) < 0) return null;
        var day = Number(p.days);
        var day3 = day - (day % 3);
        var c = cohortMap[day] || cohortMap[day3] || cohortMap[day3 + 1] || cohortMap[day3 + 2];
        if (!c) return null;
        if (cohortSampleMin === null || c.sampleCount < cohortSampleMin) cohortSampleMin = c.sampleCount;
        return Math.round((baselineClose * (c.avgPct / 100)) * 100) / 100;
      });

      var anyCohortValue = cohortValues.some(function (v) { return v !== null; });
      if (anyCohortValue) {
        datasets.push({
          label: '같은 유형·규모 평균',
          data: cohortValues,
          borderColor: '#8B6F47',
          backgroundColor: 'transparent',
          borderWidth: 2,
          borderDash: [6, 4],
          pointRadius: 0,
          pointHoverRadius: 4,
          tension: 0.2,
          fill: false,
          spanGaps: true,
          yAxisID: 'y'
        });
      } else {
        hasCohort = false;
      }
    }

    var ctx = document.getElementById('ro-chart-canvas').getContext('2d');

    chartInstance = new Chart(ctx, {
      type: 'line',
      data: { labels: labels, datasets: datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: hasCohort,
            position: 'top',
            align: 'end',
            labels: { boxWidth: 16, font: { size: 11 }, color: '#8A7F6C' }
          },
          tooltip: {
            backgroundColor: '#3D3529',
            padding: 10,
            titleFont: { size: 12 },
            bodyFont: { size: 13, weight: 'bold' },
            callbacks: {
              label: function (c) {
                return c.dataset.label + ' ' + Number(c.parsed.y).toLocaleString('ko-KR') + '원';
              }
            }
          }
        },
        scales: {
          x: { grid: { display: false }, ticks: { font: { size: 10 }, color: '#8A7F6C' } },
          y: { grid: { color: '#EFE9DC' }, ticks: { font: { size: 10 }, color: '#8A7F6C' } }
        }
      }
    });

    if (noteBox) {
      if (hasCohort) {
        var warn = cohortSampleMin !== null && cohortSampleMin < 5;
        noteBox.innerHTML =
          '<div class="ro-cohort-note">' +
            '<span class="ro-cohort-dot"></span>' +
            '<span>비교 그룹: ' + (ev.cohortLabel || '') +
            (warn ? ' <span class="ro-cohort-warn">· 표본 ' + cohortSampleMin + '건, 참고용</span>' : '') +
            '</span>' +
          '</div>';
      } else {
        noteBox.innerHTML = '';
      }
    }
  }

  function setActiveRangeBtn(months) {
    document.querySelectorAll('.ro-range-btn').forEach(function (btn) {
      btn.classList.toggle('active', Number(btn.dataset.months) === months);
    });
  }

  function renderDetail(ev) {
    currentEvent = ev;
    currentRangeMonths = 6;

    var days = calcDday(ev.listingDate);
    var ddayHtml = '';
    if (days !== null) {
      var cls = days >= 0 ? 'upcoming' : 'past';
      ddayHtml = '<div class="ro-dday ' + cls + '">신주상장 ' + ddayLabel(days) + '</div>';
    }

    var priceChip = '';
    if (ev.finalPrice) priceChip = '<span class="ro-price-chip">확정발행가 <b>' + fmtWon(ev.finalPrice) + '</b></span>';
    else if (ev.estimatedPrice) priceChip = '<span class="ro-price-chip">예정발행가 <b>' + fmtWon(ev.estimatedPrice) + '</b> (미확정)</span>';

    viewDetail.innerHTML =
      '<div class="ro-back" id="ro-back-btn">← 목록으로</div>' +
      '<div class="ro-detail-card">' +
        '<div class="ro-detail-name">' + disp(ev.corpName) + '</div>' +
        '<div class="ro-detail-code">' + ev.stockCode + ' · ' + ev.market + '</div>' +
        '<span class="ro-badge type-' + ev.offeringType + '">' + ev.offeringType + '</span>' + priceChip +
        '<div>' + ddayHtml + '</div>' +
        '<div class="ro-grid">' +
          field('이사회결의일', ev.boardResolutionDate) +
          field('신주배정기준일', ev.recordDate) +
          field('청약기간', (ev.subStartDate || ev.subEndDate) ? (ev.subStartDate + ' ~ ' + ev.subEndDate) : '') +
          field('납입일', ev.paymentDate) +
          field('신주상장예정일', ev.listingDate) +
          field('대표주관회사', ev.underwriter) +
          field('발행주식수', ev.sharesIssued ? fmtNum(ev.sharesIssued) + '주' : '') +
          field('증자전 발행주식총수', ev.sharesBeforeOffering ? fmtNum(ev.sharesBeforeOffering) + '주' : '') +
        '</div>' +
        '<div class="ro-chart-wrap">' +
          '<div class="ro-chart-head">' +
            '<div class="ro-chart-title">주가 흐름 <span>· 주황 점이 신주상장일 이후 첫 거래일이에요</span></div>' +
            '<div class="ro-range-toggle">' +
              '<button type="button" class="ro-range-btn" data-months="3">상장 후 3개월</button>' +
              '<button type="button" class="ro-range-btn active" data-months="6">6개월</button>' +
              '<button type="button" class="ro-range-btn" data-months="12">12개월</button>' +
            '</div>' +
          '</div>' +
          '<div id="ro-chart-box"></div>' +
          '<div id="ro-cohort-note-box"></div>' +
        '</div>' +
      '</div>';

    viewList.style.display = 'none';
    viewDetail.style.display = 'block';

    document.getElementById('ro-back-btn').addEventListener('click', function () {
      viewDetail.style.display = 'none';
      viewList.style.display = 'block';
    });

    document.querySelectorAll('.ro-range-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        currentRangeMonths = Number(btn.dataset.months);
        setActiveRangeBtn(currentRangeMonths);
        drawChart(currentEvent, currentRangeMonths);
      });
    });

    drawChart(ev, currentRangeMonths);
  }

  function renderList(events) {
    listEl.innerHTML = '';
    if (events.length === 0) {
      listEl.innerHTML = '<div class="ro-empty">검색 결과가 없어요</div>';
      return;
    }
    events.forEach(function (ev) {
      var card = document.createElement('div');
      card.className = 'ro-card type-' + ev.offeringType;
      card.innerHTML =
        '<div class="ro-card-top">' +
          '<span class="ro-name">' + disp(ev.corpName) + '</span>' +
          '<span class="ro-code">' + ev.stockCode + '</span>' +
        '</div>' +
        '<div>' +
          '<span class="ro-badge type-' + ev.offeringType + '">' + ev.offeringType + '</span>' +
          '<span class="ro-date">이사회결의일 ' + ev.boardResolutionDate + '</span>' +
        '</div>';
      card.addEventListener('click', function () { renderDetail(ev); });
      listEl.appendChild(card);
    });
  }

  function filterAndRender() {
    var q = searchEl.value.trim();
    if (!q) { renderList(allEvents); return; }
    var filtered = allEvents.filter(function (ev) {
      return disp(ev.corpName).indexOf(q) !== -1 || ev.stockCode.indexOf(q) !== -1;
    });
    renderList(filtered);
  }

  searchEl.addEventListener('input', filterAndRender);

  fetch(WEBAPP_URL + '?tool=rightsoffering')
    .then(function (res) { return res.json(); })
    .then(function (data) {
      allEvents = (data.events || []).slice().sort(function (a, b) {
        return a.boardResolutionDate < b.boardResolutionDate ? 1 : -1;
      });
      renderList(allEvents);
    })
    .catch(function (err) {
      listEl.innerHTML = '<div class="ro-empty">데이터를 불러오지 못했어요</div>';
      console.error(err);
    });
})();
