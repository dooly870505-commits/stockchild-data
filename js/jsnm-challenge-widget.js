(function () {
'use strict';
// 도트그리드 히어로 (매일 1주 = 매일 채워지는 칸의 은유)
  const grid = document.getElementById('jsnm-dotgrid');
  const totalDots = 130;
  for(let i=0;i<totalDots;i++){
    const d = document.createElement('i');
    const progress = i/totalDots;
    const filled = Math.random() < progress + 0.15;
    if(filled){
      const intensity = 0.25 + Math.random()*0.65;
      d.style.background = `rgba(120,178,255,${intensity.toFixed(2)})`;
    }
    grid.appendChild(d);
  }

  // 탭 전환
  const tabBtns = document.querySelectorAll('.tab-btn');
  const panels = document.querySelectorAll('.panel');
  tabBtns.forEach(btn=>{
    btn.addEventListener('click', ()=>{
      tabBtns.forEach(b=>b.classList.remove('active'));
      panels.forEach(p=>p.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('jsnm-panel-'+btn.dataset.tab).classList.add('active');
      window.scrollTo({top:0, behavior:'smooth'});
    });
  });

  // 종목 검색 자동완성 - 전체 종목 리스트(stocklist.json)를 불러와서 실시간 검색
  const searchInput = document.getElementById('jsnm-stockSearch');
  const acBox = document.getElementById('jsnm-autocompleteBox');
  let selectedSymbol = '005930';
  let selectedName = '삼성전자';
  let stockList = [{ symbol: '005930', name: '삼성전자', market: 'KOSPI' }]; // 로드 전 기본값

  fetch('https://dooly870505-commits.github.io/stockchild-data/stocklist.json')
    .then(function (res) { return res.json(); })
    .then(function (json) { stockList = json.stocks || stockList; })
    .catch(function (err) { console.error('stocklist.json 로드 실패', err); });

  function renderAutocomplete(matches) {
    acBox.innerHTML = '';
    matches.forEach(function (s) {
      var div = document.createElement('div');
      div.dataset.name = s.name;
      div.dataset.symbol = s.symbol;
      div.innerHTML = s.name + ' <span class="code">' + s.symbol + ' · ' + s.market + '</span>';
      div.addEventListener('click', function () {
        searchInput.value = s.name;
        selectedSymbol = s.symbol;
        selectedName = s.name;
        acBox.classList.remove('show');
      });
      acBox.appendChild(div);
    });
    acBox.classList.toggle('show', matches.length > 0);
  }

  searchInput.addEventListener('input', function () {
    var v = searchInput.value.trim();
    if (v.length === 0) { acBox.classList.remove('show'); return; }
    var matches = stockList.filter(function (s) {
      return s.name.indexOf(v) !== -1 || s.symbol.indexOf(v) !== -1;
    }).slice(0, 8);
    renderAutocomplete(matches);
  });
  document.addEventListener('click', (e)=>{
    if(!e.target.closest('.field')) acBox.classList.remove('show');
  });

  // 매수 기간: 직접 기간 선택 시 시작일/종료일 노출
  const periodSelect = document.getElementById('jsnm-periodSelect');
  const customDateRange = document.getElementById('jsnm-customDateRange');
  periodSelect.addEventListener('change', ()=>{
    customDateRange.style.display = periodSelect.value === 'custom' ? 'block' : 'none';
  });

  // 수량 pill 선택
  let selectedQty = 1;
  document.querySelectorAll('#jsnm-qtyPills .pill').forEach(p=>{
    p.addEventListener('click', ()=>{
      document.querySelectorAll('#jsnm-qtyPills .pill').forEach(x=>x.classList.remove('active'));
      p.classList.add('active');
      selectedQty = Number(p.dataset.qty);
    });
  });

  // ---- 적립식 시뮬레이터: Apps Script 캔들 프록시 연동 ----
  var CANDLES_API_URL = 'https://script.google.com/macros/s/AKfycbxn1HLEizdPFKXs9j2RjIdYc8VlnH0-hTmloxPowI0vlFr66oN25bu-BxZaPvFg8dYygw/exec';
  var candlesCache = {}; // symbol -> candles 배열 (같은 세션에서 재요청 방지)

  function fmtWonInt(n){ return Math.round(n).toLocaleString('ko-KR') + '원'; }

  function getPeriodRange() {
    var today = new Date();
    var from;
    if (periodSelect.value === 'custom') {
      from = new Date(document.getElementById('jsnm-customFrom').value);
      var to = new Date(document.getElementById('jsnm-customTo').value);
      return { from: from, to: to };
    }
    var years = { '1y':1, '3y':3, '5y':5, '10y':10 }[periodSelect.value] || 3;
    from = new Date(today);
    from.setFullYear(from.getFullYear() - years);
    return { from: from, to: today };
  }

  function runDcaSimulation() {
    var calcBtn = document.getElementById('jsnm-calcBtn');
    var resultCard = document.getElementById('jsnm-resultCard');
    var badge = document.getElementById('jsnm-dcaResultBadge');
    calcBtn.textContent = '불러오는 중...';
    calcBtn.disabled = true;

    var fetchPromise = candlesCache[selectedSymbol]
      ? Promise.resolve(candlesCache[selectedSymbol])
      : fetch(CANDLES_API_URL + '?tool=candles&symbol=' + selectedSymbol)
          .then(function (res) { return res.json(); })
          .then(function (json) {
            candlesCache[selectedSymbol] = json.candles || [];
            return candlesCache[selectedSymbol];
          });

    fetchPromise.then(function (candles) {
      calcBtn.textContent = '시뮬레이션 계산하기';
      calcBtn.disabled = false;

      if (!candles || candles.length === 0) {
        badge.textContent = '데이터를 불러오지 못했습니다.';
        resultCard.style.display = 'block';
        return;
      }

      var range = getPeriodRange();
      // candles는 최신순 -> 기간 내(from~to) 것만, 오래된 순으로 뒤집어서 사용
      var inRange = candles.filter(function (c) {
        var d = new Date(c.timestamp);
        return d >= range.from && d <= range.to;
      }).slice().reverse();

      if (inRange.length === 0) {
        badge.textContent = '선택한 기간에 해당하는 거래일 데이터가 없습니다.';
        resultCard.style.display = 'block';
        return;
      }

      var totalShares = 0, totalCost = 0;
      var avgPriceSeries = [];
      inRange.forEach(function (c) {
        var price = parseFloat(c.closePrice);
        totalShares += selectedQty;
        totalCost += price * selectedQty;
        avgPriceSeries.push(totalCost / totalShares);
      });

      var lastPrice = parseFloat(inRange[inRange.length - 1].closePrice);
      var valuation = totalShares * lastPrice;
      var avgPrice = totalCost / totalShares;
      var returnRate = ((valuation - totalCost) / totalCost) * 100;
      var isUp = returnRate >= 0;

      document.getElementById('jsnm-dcaPrincipal').textContent = fmtWonInt(totalCost);
      document.getElementById('jsnm-dcaAvgPrice').textContent = fmtWonInt(avgPrice);
      var valEl = document.getElementById('jsnm-dcaValuation');
      valEl.textContent = fmtWonInt(valuation);
      valEl.className = 'v ' + (isUp ? 'up' : 'down');
      var retEl = document.getElementById('jsnm-dcaReturn');
      retEl.textContent = (isUp ? '+' : '') + returnRate.toFixed(1) + '%';
      retEl.className = 'v ' + (isUp ? 'up' : 'down');

      var periodLabel = periodSelect.value === 'custom'
        ? (document.getElementById('jsnm-customFrom').value + ' ~ ' + document.getElementById('jsnm-customTo').value)
        : periodSelect.options[periodSelect.selectedIndex].text;
      badge.textContent = '● ' + selectedName + ' · ' + periodLabel + ' · ' + selectedQty + '주씩';

      // 차트: 종가/누적평균단가를 최대 60개 지점으로 다운샘플링해서 그리기
      var maxPoints = 60;
      var step = Math.max(1, Math.floor(inRange.length / maxPoints));
      var priceSample = [], avgSample = [];
      for (var i = 0; i < inRange.length; i += step) {
        priceSample.push(parseFloat(inRange[i].closePrice));
        avgSample.push(avgPriceSeries[i]);
      }
      var allVals = priceSample.concat(avgSample);
      var minV = Math.min.apply(null, allVals), maxV = Math.max.apply(null, allVals);
      var range_v = (maxV - minV) || 1;
      function toPoints(arr) {
        return arr.map(function (v, idx) {
          var x = (idx / (arr.length - 1 || 1)) * 300;
          var y = 105 - ((v - minV) / range_v) * 100;
          return x.toFixed(1) + ',' + y.toFixed(1);
        }).join(' ');
      }
      document.getElementById('jsnm-dcaPriceLine').setAttribute('points', toPoints(priceSample));
      document.getElementById('jsnm-dcaAvgLine').setAttribute('points', toPoints(avgSample));

      resultCard.style.display = 'block';
    }).catch(function (err) {
      calcBtn.textContent = '시뮬레이션 계산하기';
      calcBtn.disabled = false;
      badge.textContent = '오류가 발생했습니다: ' + err;
      resultCard.style.display = 'block';
      console.error(err);
    });
  }

  document.getElementById('jsnm-calcBtn').addEventListener('click', runDcaSimulation);

  // ---- TOP10 챌린지: 실제 데이터 불러오기 ----
  var TOP10_DATA_URL = 'https://dooly870505-commits.github.io/stockchild-data/top10-challenge.json';
  var bandLabels = { "100000":"10만원 이하", "10000":"1만원 이하", "1000":"1,000원 이하" };
  var top10Data = null; // fetch 성공 시 여기 저장
  var currentSort = 'volume';

  function fmtWon(n){ return Number(n).toLocaleString('ko-KR') + '원'; }
  function fmtEok(n){ return (Number(n) / 100000000).toFixed(1) + '억원'; }
  function fmtManju(n){ return (Number(n) / 10000).toFixed(1) + '만주'; }

  function renderTop10(bandValue){
    var table = document.getElementById('jsnm-top10Table');
    var badge = document.getElementById('jsnm-top10Badge');

    if (!top10Data) {
      badge.textContent = '데이터를 불러오지 못했습니다. 잠시 후 새로고침 해주세요.';
      table.innerHTML = '<tr><th>순위</th><th>종목명</th><th>종가</th><th>거래량</th><th>거래대금</th></tr>';
      return;
    }

    var bandData = top10Data.bands && top10Data.bands[bandValue];
    var items = (bandData && bandData[currentSort]) || [];

    table.innerHTML = `<tr>
      <th>순위</th><th>종목명</th><th style="text-align:right;">종가</th>
      <th style="text-align:right;cursor:pointer;${currentSort==='volume'?'color:var(--grow);':''}" data-colsort="volume">거래량${currentSort==='volume'?' ▾':''}</th>
      <th style="text-align:right;cursor:pointer;${currentSort==='value'?'color:var(--grow);':''}" data-colsort="value">거래대금${currentSort==='value'?' ▾':''}</th>
    </tr>`;

    if (items.length === 0) {
      var tr = document.createElement('tr');
      tr.innerHTML = '<td colspan="5" style="text-align:center;color:var(--sub);padding:16px 4px;">오늘은 이 가격대·기준에서 조건에 맞는 종목이 없습니다.</td>';
      table.appendChild(tr);
    }

    items.forEach(function (r, i) {
      var tr = document.createElement('tr');
      tr.innerHTML = `<td><span class="rank-no ${i<3?'top3':''}">${r.rank}</span></td>
        <td>${r.name}<span class="price-ok">${bandLabels[bandValue].replace(' 이하','↓')}</span></td>
        <td class="num">${fmtWon(r.lastPrice)}</td>
        <td class="num">${fmtManju(r.tradingVolume)}</td>
        <td class="num">${fmtEok(r.tradingAmount)}</td>`;
      table.appendChild(tr);
    });

    table.querySelectorAll('th[data-colsort]').forEach(function (th) {
      th.addEventListener('click', function () {
        currentSort = th.dataset.colsort;
        syncSortPills();
        renderTop10(priceBandSelect.value);
      });
    });

    badge.textContent = '● ' + top10Data.date + ' 기준 · ' + bandLabels[bandValue];
  }

  function syncSortPills(){
    document.querySelectorAll('#jsnm-sortPills .pill').forEach(function (p) {
      p.classList.toggle('active', p.dataset.sort === currentSort);
    });
  }

  document.querySelectorAll('#jsnm-sortPills .pill').forEach(function (p) {
    p.addEventListener('click', function () {
      currentSort = p.dataset.sort;
      syncSortPills();
      renderTop10(priceBandSelect.value);
    });
  });

  var priceBandSelect = document.getElementById('jsnm-priceBandSelect');
  priceBandSelect.addEventListener('change', function () { renderTop10(priceBandSelect.value); });

  fetch(TOP10_DATA_URL)
    .then(function (res) { return res.json(); })
    .then(function (json) {
      top10Data = json;
      renderTop10(priceBandSelect.value);
    })
    .catch(function (err) {
      console.error('top10-challenge.json 로드 실패', err);
      document.getElementById('jsnm-top10Badge').textContent = '데이터를 불러오지 못했습니다.';
    });

  // ---- 동전주 챌린지: 실제 데이터 불러오기 ----
  var COIN_DATA_URL = 'https://dooly870505-commits.github.io/stockchild-data/coin-stock-challenge.json';
  fetch(COIN_DATA_URL)
    .then(function (res) { return res.json(); })
    .then(function (json) {
      document.getElementById('jsnm-coinBadge').textContent =
        '● 운영 ' + json.operatingDays + '일째 · ' + (json.startDate ? json.startDate.substring(0, 10) : '') + ' 시작';
      document.getElementById('jsnm-coinInvested').textContent = fmtWonInt(json.totalInvested);
      var valEl = document.getElementById('jsnm-coinValuation');
      valEl.textContent = fmtWonInt(json.totalValuation);
      valEl.className = 'v ' + (json.returnRate >= 0 ? 'up' : 'down');
      var retEl = document.getElementById('jsnm-coinReturn');
      retEl.textContent = (json.returnRate >= 0 ? '+' : '') + json.returnRate + '%';
      retEl.className = 'v ' + (json.returnRate >= 0 ? 'up' : 'down');
      document.getElementById('jsnm-coinCount').textContent = json.holdingCount + '개';

      var box = document.getElementById('jsnm-coinPortfolio');
      box.innerHTML = '';
      var shown = json.holdings.slice(0, 12);
      shown.forEach(function (h) {
        var chip = document.createElement('div');
        chip.className = 'coin-chip';
        chip.innerHTML = '<span class="dot"></span>' + h.name + ' ' + h.shares + '주';
        box.appendChild(chip);
      });
      var moreNote = document.getElementById('jsnm-coinMoreNote');
      if (json.holdingCount > shown.length) {
        moreNote.textContent = '외 ' + (json.holdingCount - shown.length) + '개 종목 보유 중 (평가금액 상위 ' + shown.length + '개만 표시)';
      }
    })
    .catch(function (err) {
      console.error('coin-stock-challenge.json 로드 실패', err);
      document.getElementById('jsnm-coinBadge').textContent = '데이터를 불러오지 못했습니다.';
    });

  // ---- 투자일기: 로컬 저장 + 엑셀 내보내기 ----
  var DIARY_KEY = 'stockchild_diary_entries';
  var diaryMemoryFallback = [];
  var diaryStorageAvailable = true;
  try {
    var __t = '__diary_test__';
    window.localStorage.setItem(__t, '1');
    window.localStorage.removeItem(__t);
  } catch (e) {
    diaryStorageAvailable = false;
    document.getElementById('jsnm-diaryStorageNote').textContent =
      '⚠️ 이 화면(미리보기)에서는 브라우저 저장이 막혀 있어, 새로고침하면 기록이 사라집니다. 실제 배포된 페이지에서는 정상 저장됩니다.';
  }

  function diaryLoad() {
    if (!diaryStorageAvailable) return diaryMemoryFallback;
    try { return JSON.parse(window.localStorage.getItem(DIARY_KEY) || '[]'); }
    catch (e) { return []; }
  }
  function diarySaveAll(entries) {
    if (!diaryStorageAvailable) { diaryMemoryFallback = entries; return; }
    try { window.localStorage.setItem(DIARY_KEY, JSON.stringify(entries)); }
    catch (e) {}
  }

  function renderDiaryList() {
    var entries = diaryLoad().slice().sort(function (a, b) { return b.date.localeCompare(a.date); });
    var list = document.getElementById('jsnm-diaryList');
    list.innerHTML = '';
    if (entries.length === 0) {
      list.innerHTML = '<div class="diary-empty">아직 작성한 기록이 없습니다. 위에서 첫 기록을 남겨보세요.</div>';
      return;
    }
    entries.forEach(function (entry) {
      var div = document.createElement('div');
      div.className = 'diary-entry';
      div.innerHTML =
        '<div class="date">' + entry.date + '</div>' +
        '<div class="txt"></div>' +
        '<button class="del" data-id="' + entry.id + '" title="삭제">×</button>';
      div.querySelector('.txt').textContent = entry.text; // XSS 방지 위해 textContent로 삽입
      list.appendChild(div);
    });
    list.querySelectorAll('.del').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = btn.dataset.id;
        var remaining = diaryLoad().filter(function (e) { return String(e.id) !== id; });
        diarySaveAll(remaining);
        renderDiaryList();
      });
    });
  }

  document.getElementById('jsnm-diarySaveBtn').addEventListener('click', function () {
    var input = document.getElementById('jsnm-diaryInput');
    var text = input.value.trim();
    if (!text) return;
    var entries = diaryLoad();
    entries.push({
      id: Date.now(),
      date: Utilities_formatToday(),
      text: text
    });
    diarySaveAll(entries);
    input.value = '';
    renderDiaryList();
  });

  function Utilities_formatToday() {
    var d = new Date();
    var pad = function (n) { return String(n).padStart(2, '0'); };
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate())
      + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
  }

  document.getElementById('jsnm-diaryExportBtn').addEventListener('click', function () {
    var entries = diaryLoad().slice().sort(function (a, b) { return a.date.localeCompare(b.date); });
    if (entries.length === 0) { alert('내보낼 기록이 없습니다.'); return; }
    if (typeof XLSX === 'undefined') { alert('엑셀 내보내기 기능을 불러오지 못했습니다. 인터넷 연결을 확인해주세요.'); return; }
    var rows = entries.map(function (e) { return { '날짜': e.date, '기록': e.text }; });
    var ws = XLSX.utils.json_to_sheet(rows);
    ws['!cols'] = [{ wch: 18 }, { wch: 80 }];
    var wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '투자일기');
    XLSX.writeFile(wb, '투자일기_' + Utilities_formatToday().slice(0, 10) + '.xlsx');
  });

  renderDiaryList();

  // ---- 마일스톤: 목표 누적 투입금까지 예상 기간 ----
  const milestoneSelect = document.getElementById('jsnm-milestoneSelect');
  function renderMilestone(){
    const target = parseInt(milestoneSelect.value, 10);
    // 샘플 페이스: 최근 128일간 평균 1일 약 4,800원 투입 가정
    const dailyPace = 4800;
    const daysNeeded = Math.ceil(target / dailyPace);
    const years = Math.floor(daysNeeded/365);
    const months = Math.round((daysNeeded%365)/30);
    let text = '';
    if(years > 0) text += `약 ${years}년 `;
    if(months > 0) text += `${months}개월 후`;
    if(years === 0 && months === 0) text = '약 1개월 이내';
    document.getElementById('jsnm-milestoneDate').textContent = text.trim();
  }
  milestoneSelect.addEventListener('change', renderMilestone);
  renderMilestone();
})();
