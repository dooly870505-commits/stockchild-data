(function(){
  var root = document.getElementById('nctWib');
  if(!root) return;

  var WEBAPP_URL = 'https://script.google.com/macros/s/AKfycbx3rYebPAr6ReE4UoBivkKGRiCZIg_wukexmykPRxpMKriSvYDnYrmJblyvEAZPzZ7I/exec';
  var STOCK_LIST_URL = 'https://dooly870505-commits.github.io/stockchild-data/data/stock-list.json';

  function $(id){ return document.getElementById(id); }

  var stockList = [];
  var selectedStock = null; // { code, name }

  // ---- 1. 종목 리스트 로드 (클라이언트 사이드 자동완성용) ----
  fetch(STOCK_LIST_URL)
    .then(function(res){ return res.json(); })
    .then(function(data){
      stockList = Array.isArray(data) ? data : [];
      applyUrlParams_(); // 종목 리스트가 준비된 후에 URL 파라미터를 적용해야 종목명을 찾을 수 있음
    })
    .catch(function(){
      $('wibError').textContent = '종목 목록을 불러오지 못했어요. 잠시 후 다시 시도해주세요.';
      $('wibError').classList.add('show');
    });

  // ---- 2. 검색 자동완성 ----
  var searchEl = $('wibSearch');
  var dropdownEl = $('wibDropdown');

  searchEl.addEventListener('input', function(){
    var q = searchEl.value.trim();
    if(q.length < 1){ dropdownEl.classList.remove('show'); dropdownEl.innerHTML=''; return; }

    var matches = stockList.filter(function(s){
      return s.name.indexOf(q) !== -1;
    }).slice(0, 30);

    if(matches.length === 0){
      dropdownEl.innerHTML = '<div class="nct-drow" style="color:var(--nct-sub);">검색 결과가 없어요</div>';
      dropdownEl.classList.add('show');
      return;
    }

    dropdownEl.innerHTML = matches.map(function(s){
      return '<div class="nct-drow" data-code="'+s.code+'" data-name="'+s.name+'">'+s.name+'<span class="nct-dcode">'+s.code+'</span></div>';
    }).join('');
    dropdownEl.classList.add('show');

    dropdownEl.querySelectorAll('.nct-drow[data-code]').forEach(function(row){
      row.addEventListener('click', function(){
        selectedStock = { code: row.getAttribute('data-code'), name: row.getAttribute('data-name') };
        $('wibSelectedName').textContent = selectedStock.name + ' (' + selectedStock.code + ')';
        $('wibSelected').classList.add('show');
        searchEl.value = '';
        dropdownEl.classList.remove('show');
        dropdownEl.innerHTML = '';
        checkFormReady();
      });
    });
  });

  document.addEventListener('click', function(e){
    if(!root.contains(e.target)) return;
    if(e.target === searchEl) return;
    if(dropdownEl.contains(e.target)) return;
    dropdownEl.classList.remove('show');
  });

  $('wibClearBtn').addEventListener('click', function(){
    selectedStock = null;
    $('wibSelected').classList.remove('show');
    checkFormReady();
  });

  // ---- 3. 날짜/금액 입력 ----
  var yearEl = $('wibYear'), monthEl = $('wibMonth'), dayEl = $('wibDay'), amountEl = $('wibAmount');

  [yearEl, monthEl, dayEl].forEach(function(el){
    el.addEventListener('input', checkFormReady);
  });

  amountEl.addEventListener('input', function(){
    var v = amountEl.value.replace(/[^0-9]/g,'');
    amountEl.value = v ? Number(v).toLocaleString('ko-KR') : '';
    checkFormReady();
  });

  function checkFormReady(){
    var ready = true;
    if(!selectedStock) ready = false;
    if(Number(yearEl.value) < 1980) ready = false;
    if(Number(monthEl.value) < 1) ready = false;
    if(Number(monthEl.value) > 12) ready = false;
    if(Number(dayEl.value) < 1) ready = false;
    if(Number(dayEl.value) > 31) ready = false;
    if(amountNumber() <= 0) ready = false;
    $('wibGoBtn').disabled = !ready;
  }

  function amountNumber(){
    return Number((amountEl.value||'').replace(/[^0-9]/g,'')) || 0;
  }

  function pad2(n){ return String(n).length < 2 ? '0'+n : String(n); }

  // ---- 4. 조회 실행 ----
  $('wibGoBtn').addEventListener('click', function(){
    $('wibError').classList.remove('show');
    $('wibResult').classList.remove('show');
    $('wibLoading').classList.add('show');
    $('wibGoBtn').disabled = true;

    var dateStr = String(yearEl.value) + pad2(monthEl.value) + pad2(dayEl.value);
    var amount = amountNumber();

    var url = WEBAPP_URL + '?tool=whatIfBought'
      + '&code=' + encodeURIComponent(selectedStock.code)
      + '&date=' + encodeURIComponent(dateStr)
      + '&amount=' + encodeURIComponent(amount);

    fetch(url)
      .then(function(res){ return res.json(); })
      .then(function(data){
        $('wibLoading').classList.remove('show');
        $('wibGoBtn').disabled = false;

        if(data.error){
          $('wibError').textContent = data.error;
          $('wibError').classList.add('show');
          return;
        }
        renderResult(data, dateStr);
      })
      .catch(function(){
        $('wibLoading').classList.remove('show');
        $('wibGoBtn').disabled = false;
        $('wibError').textContent = '데이터를 가져오지 못했어요. 잠시 후 다시 시도해주세요.';
        $('wibError').classList.add('show');
      });
  });

  function fmtDate(yyyymmdd){
    if(!yyyymmdd || yyyymmdd.length !== 8) return yyyymmdd;
    return yyyymmdd.substring(0,4)+'.'+yyyymmdd.substring(4,6)+'.'+yyyymmdd.substring(6,8);
  }
  function won(v){ return Math.round(v).toLocaleString('ko-KR')+'원'; }
  function eok(v){
    if(Math.abs(v) < 100000000) return won(v);
    var e = v/100000000;
    return (v<0?'-':'')+Math.abs(e).toFixed(Math.abs(e)<10?2:1)+'억원';
  }

  function renderResult(data, inputDateStr){
    var isUp = data.profit >= 0;

    $('wibHook').textContent = fmtDate(inputDateStr) + '에 ' + selectedStock.name + '를(을) ' + won(data.pastTotal).replace('원','') + '원어치 샀다면';

    $('wibHeroBig').className = 'nct-herobig ' + (isUp ? 'up' : 'down');
    $('wibHeroBig').textContent = eok(data.currentValue);
    $('wibHeroSub').textContent = (isUp?'+':'') + data.profitRate.toFixed(1) + '% (' + (isUp?'+':'') + eok(data.profit) + ')';

    $('wibSummary').innerHTML =
      '<div class="nct-srow"><span class="nct-sk">매수 시점 종가</span><span class="nct-sv">'+won(data.pastPrice)+'</span></div>'+
      '<div class="nct-srow"><span class="nct-sk">매수 가능 주수</span><span class="nct-sv">'+data.shares.toLocaleString('ko-KR')+'주</span></div>'+
      '<div class="nct-srow"><span class="nct-sk">그때 투자 금액</span><span class="nct-sv">'+won(data.pastTotal)+'</span></div>'+
      '<div class="nct-srow"><span class="nct-sk">현재 종가</span><span class="nct-sv">'+won(data.currentPrice)+'</span></div>'+
      '<div class="nct-srow"><span class="nct-sk">지금 가치</span><span class="nct-sv" style="color:'+(isUp?'var(--nct-red)':'var(--nct-blue)')+';">'+won(data.currentValue)+'</span></div>';

    var noticeLines = [];
    if(data.resolvedPastDate !== inputDateStr){
      noticeLines.push('입력하신 날짜는 휴장일이라, 가장 가까운 직전 거래일인 '+fmtDate(data.resolvedPastDate)+' 기준으로 계산했어요.');
    }
    noticeLines.push('기준 시각: '+fmtDate(data.resolvedCurrentDate)+' 종가');
    $('wibNotice').textContent = noticeLines.join(' ');

    $('wibResult').classList.add('show');
    setTimeout(function(){ $('wibResult').scrollIntoView({behavior:'smooth', block:'nearest'}); }, 60);
  }
  // ---- 5. URL 파라미터 자동 인식 (?code=005930&date=20160104&amount=1000000 형태로 진입 시) ----
  function getUrlParams_(){
    var qs = new URLSearchParams(window.location.search);
    return {
      code: qs.get('code'),
      date: qs.get('date'),
      amount: qs.get('amount')
    };
  }

  function applyUrlParams_(){
    var p = getUrlParams_();
    if(!p.code) return; // 종목코드 파라미터가 없으면 아무것도 안 함 (일반 진입과 동일하게 동작)

    var matched = null;
    for(var i=0; i<stockList.length; i++){
      if(stockList[i].code === p.code){ matched = stockList[i]; break; }
    }
    if(!matched) return; // 목록에 없는 코드면 무시하고 빈 화면 그대로 둠

    selectedStock = { code: matched.code, name: matched.name };
    $('wibSelectedName').textContent = selectedStock.name + ' (' + selectedStock.code + ')';
    $('wibSelected').classList.add('show');

    if(p.date){
      if(p.date.length === 8){
        yearEl.value = p.date.substring(0,4);
        monthEl.value = String(Number(p.date.substring(4,6)));
        dayEl.value = String(Number(p.date.substring(6,8)));
      }
    }

    if(p.amount){
      var amt = Number(p.amount) || 0;
      if(amt > 0){ amountEl.value = amt.toLocaleString('ko-KR'); }
    }

    checkFormReady();

    // 종목, 날짜, 금액이 모두 유효하게 채워졌다면 자동으로 결과까지 보여줌
    if(!$('wibGoBtn').disabled){
      $('wibGoBtn').click();
    }
  }
})();
