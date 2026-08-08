(function(){
  var root = document.getElementById('nctRebal');
  if(!root){ return; }
  function $(id){ return document.getElementById(id); }

  var rowId = 0;
  var DEFAULT_ROWS = [
    { name:'', value:'', target:'' },
    { name:'', value:'', target:'' },
    { name:'', value:'', target:'' }
  ];

  function attachAmountComma(el){
    el.addEventListener('input', function(){
      var v = el.value.replace(/[^0-9]/g,'');
      el.value = v ? Number(v).toLocaleString('ko-KR') : '';
      updateSumCheck();
    });
  }
  function attachPercent(el){
    el.addEventListener('input', function(){
      el.value = el.value.replace(/[^0-9.]/g,'');
      updateSumCheck();
    });
  }

  function addRow(){
    rowId++;
    var id = rowId;
    var row = document.createElement('div');
    row.className = 'nct-row';
    row.dataset.id = id;
    row.innerHTML =
      '<div class="nct-rowtop">' +
        '<input type="text" class="nct-nameinput" id="nctName' + id + '" placeholder="종목명 (예: 삼성전자)">' +
        '<div class="nct-delbtn" data-del="' + id + '">✕</div>' +
      '</div>' +
      '<div class="nct-rowfields">' +
        '<div class="nct-rfield">' +
          '<label class="nct-rlabel">현재 평가금액</label>' +
          '<div class="nct-rinwrap"><input type="text" inputmode="numeric" class="nct-rinput" id="nctValue' + id + '"><span class="nct-runit">원</span></div>' +
        '</div>' +
        '<div class="nct-rfield">' +
          '<label class="nct-rlabel">목표 비중</label>' +
          '<div class="nct-rinwrap"><input type="text" inputmode="numeric" class="nct-rinput" id="nctTarget' + id + '"><span class="nct-runit">%</span></div>' +
        '</div>' +
      '</div>';
    $('nctRows').appendChild(row);

    attachAmountComma($('nctValue' + id));
    attachPercent($('nctTarget' + id));

    row.querySelector('.nct-delbtn').addEventListener('click', function(){
      row.remove();
      updateSumCheck();
    });
  }

  function updateSumCheck(){
    var rows = root.querySelectorAll('.nct-row');
    var sum = 0;
    rows.forEach(function(row){
      var id = row.dataset.id;
      var t = parseFloat(($('nctTarget' + id).value || '0').replace(/[^0-9.]/g,'')) || 0;
      sum += t;
    });
    var el = $('nctSumCheck');
    var rounded = Math.round(sum*10)/10;
    if(Math.abs(sum - 100) < 0.5){
      el.className = 'nct-sumcheck ok';
      el.textContent = '✓ 목표 비중 합계 ' + rounded + '% (정상)';
    } else {
      el.className = 'nct-sumcheck bad';
      el.textContent = '⚠️ 목표 비중 합계 ' + rounded + '% (100%로 맞춰주세요)';
    }
  }

  DEFAULT_ROWS.forEach(function(){ addRow(); });
  updateSumCheck();

  $('nctAdd').addEventListener('click', function(){
    addRow();
    updateSumCheck();
  });

  function won(v){ return Math.round(v).toLocaleString('ko-KR') + '원'; }

  function render(){
    var rows = root.querySelectorAll('.nct-row');
    var assets = [];
    var total = 0;

    rows.forEach(function(row){
      var id = row.dataset.id;
      var name = ($('nctName' + id).value || '').trim();
      var value = Number(($('nctValue' + id).value||'').replace(/[^0-9]/g,'')) || 0;
      var target = parseFloat(($('nctTarget' + id).value||'0').replace(/[^0-9.]/g,'')) || 0;
      if(!name && value<=0){ return; }
      assets.push({ name: name || '이름 없는 종목', value: value, target: target });
      total += value;
    });

    if(assets.length === 0 || total <= 0){
      $('nctResult').classList.remove('show');
      return;
    }

    var targetSum = assets.reduce(function(a,b){return a+b.target;},0);

    $('nctTotalVal').textContent = won(total);

    var html = '';
    var copyLines = ['⚖️ 리밸런싱 계산 결과', '총액 ' + won(total)];

    assets.forEach(function(a){
      var curPct = (a.value/total)*100;
      var targetValue = total * (a.target/100);
      var diff = targetValue - a.value;
      var action, tagClass, amtClass;
      var isKeep = Math.abs(diff) < total*0.005;
      if(isKeep){
        action = '유지'; tagClass = 'keep'; amtClass = '';
      } else if(diff > 0){
        action = '매수'; tagClass = 'buy'; amtClass = 'buy';
      } else {
        action = '매도'; tagClass = 'sell'; amtClass = 'sell';
      }

      var barCurWidth = Math.min(curPct, 100);
      var barTgtLeft = Math.min(a.target, 100);

      html +=
        '<div class="nct-resultrow ' + (tagClass==='buy'?'buy':tagClass==='sell'?'sell':'') + '">' +
          '<div class="nct-rrtop">' +
            '<span class="nct-rrname">' + a.name + '</span>' +
            '<span class="nct-rrtag ' + tagClass + '">' + action + '</span>' +
          '</div>' +
          '<div class="nct-rrbars">' +
            '<div class="nct-rrbarwrap"><div class="nct-rrbarcur" style="width:' + barCurWidth + '%"></div><div class="nct-rrbartgt" style="left:' + barTgtLeft + '%"></div></div>' +
            '<div class="nct-rrpct">' + curPct.toFixed(1) + '% → ' + a.target.toFixed(1) + '%</div>' +
          '</div>' +
          (isKeep ?
            '<div class="nct-rramt" style="color:#8A7F6C;">± 0원 (오차 범위 내)</div>' :
            '<div class="nct-rramt ' + amtClass + '">' + (diff>0?'+':'') + won(diff) + '</div>'
          ) +
        '</div>';

      copyLines.push(a.name + ' : ' + curPct.toFixed(1) + '% → ' + a.target.toFixed(1) + '% (' + action + ' ' + (diff>=0?'+':'') + won(diff) + ')');
    });

    $('nctResultRows').innerHTML = html;

    if(Math.abs(targetSum - 100) >= 0.5){
      copyLines.push('※ 목표 비중 합계가 100%가 아니에요 (' + Math.round(targetSum*10)/10 + '%)');
    }
    copyLines.push('stockchild.com');
    root.dataset.copytext = copyLines.join('\n');

    $('nctResult').classList.add('show');
    $('nctCopy').classList.remove('done');
    $('nctCopy').textContent = '📋 결과 복사하기';
  }

  $('nctGo').addEventListener('click', function(){
    render();
    setTimeout(function(){ $('nctResult').scrollIntoView({behavior:'smooth', block:'nearest'}); }, 60);
  });

  $('nctCopy').addEventListener('click', function(){
    var t = root.dataset.copytext || '';
    if(!t) return;
    var btn = $('nctCopy');
    function ok(){ btn.classList.add('done'); btn.textContent = '✅ 복사됐어요'; }
    if(navigator.clipboard && navigator.clipboard.writeText){
      navigator.clipboard.writeText(t).then(ok).catch(function(){ fallback(t); ok(); });
    } else { fallback(t); ok(); }
  });
  function fallback(t){
    var ta = document.createElement('textarea');
    ta.value = t; ta.style.position='fixed'; ta.style.opacity='0';
    document.body.appendChild(ta); ta.select();
    try{ document.execCommand('copy'); }catch(e){}
    document.body.removeChild(ta);
  }
})();
