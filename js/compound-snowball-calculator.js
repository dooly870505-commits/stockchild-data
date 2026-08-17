(function(){
  console.log('[디버그] 눈덩이 계산기 스크립트 파일 자체는 실행됐어요');
  function init(){
  console.log('[디버그] init 함수 시작됨');
  var root = document.getElementById('nctSnowball');
  if(!root){ console.log('[디버그] nctSnowball 요소를 못 찾았어요! 여기서 멈춥니다'); return; }
  console.log('[디버그] nctSnowball 요소 찾았어요, 정상 진행 중');
  function $(id){ return document.getElementById(id); }

  function attachComma(el){
    if(!el) return;
    el.addEventListener('input', function(){
      var v = el.value.replace(/[^0-9]/g,'');
      el.value = v ? Number(v).toLocaleString('ko-KR') : '';
    });
  }
  ['nctSeed','nctMonthly'].forEach(function(id){ attachComma($(id)); });
  var yearsEl = $('nctYears');
  if(yearsEl){ yearsEl.addEventListener('input', function(){ this.value = this.value.replace(/[^0-9]/g,''); }); }
  var returnEl = $('nctReturn');
  if(returnEl){ returnEl.addEventListener('input', function(){ this.value = this.value.replace(/[^0-9.]/g,''); }); }

  function n(id){ return Number(($(id).value||'').replace(/[^0-9]/g,'')) || 0; }
  function won(v){ return Math.round(v).toLocaleString('ko-KR') + '원'; }
  function eok(v){
    if(v < 100000000){ return won(v); }
    var e = v / 100000000;
    return e.toFixed(e<10?2:1) + '억원';
  }

  function simulate(seed, monthly, annualRate, years){
    var monthlyRate = Math.pow(1 + annualRate/100, 1/12) - 1;
    var asset = seed, principal = seed, yearData = [];
    for(var y=1; y<=years; y++){
      for(var m=0; m<12; m++){
        asset = asset * (1 + monthlyRate) + monthly;
        principal += monthly;
      }
      var pShown = Math.min(principal, asset);
      var iShown = Math.max(asset - principal, 0);
      yearData.push({ year:y, asset:asset, principal:pShown, interest:iShown });
    }
    return { finalAsset:asset, finalPrincipal:principal, yearData:yearData };
  }

  function render(){
    var seed = n('nctSeed');
    var monthly = n('nctMonthly');
    var annualRate = parseFloat(($('nctReturn').value||'')) || 0;
    var years = Math.min(parseInt($('nctYears').value)||0, 40);

    if(years<=0){
      $('nctResult').classList.remove('show');
      return;
    }
    if(monthly<=0){
      if(seed<=0){
        $('nctResult').classList.remove('show');
        return;
      }
    }

    var sim = simulate(seed, monthly, annualRate, years);
    var totalInterest = sim.finalAsset - sim.finalPrincipal;

    $('nctFinalVal').textContent = eok(sim.finalAsset);
    $('nctFinalSub').textContent = years + '년 후 예상 총액 (연 ' + annualRate + '% 가정)';

    $('nctSummary').innerHTML =
      '<div class="nct-srow"><span class="nct-sk"><i class="nct-sdot" style="background:var(--nct-accent);"></i>내가 넣은 원금</span><span class="nct-sv">' + eok(sim.finalPrincipal) + '</span></div>' +
      '<div class="nct-srow"><span class="nct-sk"><i class="nct-sdot" style="background:var(--nct-gain);"></i>복리로 불어난 이자</span><span class="nct-sv" style="color:var(--nct-gain);">+' + eok(totalInterest) + '</span></div>';

    var yearData = sim.yearData;
    var step = Math.ceil(yearData.length/15);
    var displayData = yearData.filter(function(d){ return d.year % step === 0 || d.year === yearData.length; });
    var maxAsset = Math.max.apply(null, displayData.map(function(d){ return d.asset; }));

    var chartHtml = '';
    displayData.forEach(function(d){
      var pH = maxAsset>0 ? (d.principal/maxAsset)*100 : 0;
      var iH = maxAsset>0 ? (d.interest/maxAsset)*100 : 0;
      var totalH = pH + iH;
      var pRatio = totalH>0 ? (pH/totalH)*100 : 0;
      var iRatio = totalH>0 ? (iH/totalH)*100 : 0;
      chartHtml += '<div class="nct-barcol">' +
        '<div class="nct-barstack" style="height:' + totalH + '%;">' +
          '<div class="nct-barprincipal" style="height:' + pRatio + '%;"></div>' +
          '<div class="nct-barinterest" style="height:' + iRatio + '%;"></div>' +
        '</div>' +
        '<div class="nct-barlabel">' + d.year + '년</div>' +
      '</div>';
    });
    $('nctChartBars').innerHTML = chartHtml;

    root.dataset.copytext = '☃️ 복리 눈덩이 계산기\n' + years + '년 후 ' + eok(sim.finalAsset) + ' (연 ' + annualRate + '% 가정)\n원금 ' + eok(sim.finalPrincipal) + ' + 이자 ' + eok(totalInterest) + '\nstockchild.com';

    $('nctResult').classList.add('show');
    $('nctCopy').classList.remove('done');
    $('nctCopy').textContent = '📋 결과 복사하기';
  }

  $('nctGo').addEventListener('click', function(){
    console.log('[디버그] 눈덩이 굴려보기 버튼 클릭됨');
    render();
    setTimeout(function(){ $('nctResult').scrollIntoView({behavior:'smooth', block:'nearest'}); }, 60);
  });

  $('nctCopy').addEventListener('click', function(){
    var t = root.dataset.copytext || '';
    if(!t) return;
    var btn = $('nctCopy');
    function ok(){ btn.classList.add('done'); btn.textContent = '✅ 복사됐어요'; }
    if(navigator.clipboard){
      if(navigator.clipboard.writeText){
        navigator.clipboard.writeText(t).then(ok).catch(function(){ fallback(t); ok(); });
        return;
      }
    }
    fallback(t); ok();
  });
  function fallback(t){
    var ta = document.createElement('textarea');
    ta.value = t; ta.style.position='fixed'; ta.style.opacity='0';
    document.body.appendChild(ta); ta.select();
    try{ document.execCommand('copy'); }catch(e){}
    document.body.removeChild(ta);
  }
  } // init 끝

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
