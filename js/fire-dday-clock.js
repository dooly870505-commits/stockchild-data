(function(){
  var root = document.getElementById('nctFire');
  if(!root){ return; }
  function $(id){ return document.getElementById(id); }

  var PRESETS = [
    { key:'safe', name:'안전형', rate:3, desc:'인출률 3%' },
    { key:'standard', name:'국룰 4%', rate:4, desc:'인출률 4%' },
    { key:'aggressive', name:'공격형', rate:5, desc:'인출률 5%' }
  ];
  var activeWithdraw = 'standard';

  function buildPresets(){
    var wrap = $('nctPresets');
    if(!wrap) return;
    wrap.innerHTML = '';
    PRESETS.forEach(function(p){
      var el = document.createElement('div');
      el.className = 'nct-preset' + (p.key===activeWithdraw ? ' on' : '');
      el.innerHTML = '<div class="nct-pname">' + p.name + '</div><div class="nct-prate">' + p.desc + '</div>';
      el.addEventListener('click', function(){
        activeWithdraw = p.key;
        root.querySelectorAll('.nct-preset').forEach(function(x){ x.classList.remove('on'); });
        el.classList.add('on');
      });
      wrap.appendChild(el);
    });
  }
  buildPresets();

  function attachComma(el){
    if(!el) return;
    el.addEventListener('input', function(){
      var v = el.value.replace(/[^0-9]/g,'');
      el.value = v ? Number(v).toLocaleString('ko-KR') : '';
    });
  }
  ['nctAge','nctSeed','nctMonthly','nctLiving'].forEach(function(id){ attachComma($(id)); });

  function n(id){ return Number(($(id).value||'').replace(/[^0-9]/g,'')) || 0; }
  function won(v){ return Math.round(v).toLocaleString('ko-KR') + '원'; }
  function eok(v){
    var e = v / 100000000;
    return e.toFixed(e<10?2:1) + '억원';
  }

  function render(){
    var age = n('nctAge');
    var seed = n('nctSeed');
    var monthly = n('nctMonthly');
    var annualReturn = parseFloat(($('nctReturn').value||'').replace(/[^0-9.]/g,'')) || 0;
    var living = n('nctLiving');

    if(age<=0 || living<=0){
      $('nctResult').classList.remove('show');
      return;
    }

    var preset = PRESETS.filter(function(p){return p.key===activeWithdraw;})[0];
    var withdrawRate = preset.rate / 100;
    var target = (living * 12) / withdrawRate;

    var monthlyRate = Math.pow(1 + annualReturn/100, 1/12) - 1;
    var asset = seed;
    var months = 0;
    var MAX_MONTHS = 720;

    while(asset < target && months < MAX_MONTHS){
      asset = asset * (1 + monthlyRate) + monthly;
      months++;
    }

    var hero = $('nctHero');
    var notice = $('nctNotice');

    if(months >= MAX_MONTHS && asset < target){
      hero.className = 'nct-hero far';
      $('nctBigIcon').textContent = '🐌';
      $('nctDdayVal').textContent = '60년 이상';
      $('nctDsub').textContent = '지금 조건으로는 계산 범위를 벗어나요';
      $('nctGradeTag').textContent = '조건 조정이 필요해요';
      notice.style.display = 'block';
      notice.innerHTML = '60년 안에는 목표 자산에 도달하지 못하는 조건이에요. 월 적립액을 늘리거나, 예상 수익률을 현실적인 범위에서 조정하거나, 목표 생활비를 낮춰서 다시 계산해보세요.';
      $('nctSummary').innerHTML =
        '<div class="nct-srow"><span class="nct-sk">목표 자산 (' + preset.name + ')</span><span class="nct-sv">' + eok(target) + '</span></div>' +
        '<div class="nct-srow"><span class="nct-sk">목표 월 생활비</span><span class="nct-sv">' + won(living) + '</span></div>';
      root.dataset.copytext = '🔥 파이어 D-day 시계\n목표 자산 ' + eok(target) + ' (인출률 ' + preset.rate + '%)\n지금 조건으로는 60년 안에 도달이 어려워요\nstockchild.com';
      $('nctResult').classList.add('show');
      $('nctCopy').classList.remove('done'); $('nctCopy').textContent = '📋 결과 복사하기';
      return;
    }

    var years = Math.floor(months/12);
    var remMonths = months % 12;

    var today = new Date();
    var fireDate = new Date(today.getFullYear(), today.getMonth()+months, today.getDate());

    var gradeKey, gradeIcon, gradeTag;
    if(years < 5){ gradeKey='fast'; gradeIcon='🚀'; gradeTag='초고속 파이어'; }
    else if(years < 15){ gradeKey='mid'; gradeIcon='🔥'; gradeTag='정석 파이어'; }
    else if(years < 25){ gradeKey='long'; gradeIcon='🐢'; gradeTag='장기전 파이어'; }
    else { gradeKey='far'; gradeIcon='🌍'; gradeTag='파이어까지 지구 한 바퀴'; }

    hero.className = 'nct-hero ' + gradeKey;
    $('nctBigIcon').textContent = gradeIcon;
    $('nctDdayVal').textContent = years + '년 ' + remMonths + '개월 후';
    $('nctDsub').textContent = fireDate.getFullYear() + '년 ' + (fireDate.getMonth()+1) + '월, 예상 나이 만 ' + Math.floor(age + months/12) + '세';
    $('nctGradeTag').textContent = gradeTag;

    $('nctSummary').innerHTML =
      '<div class="nct-srow"><span class="nct-sk">목표 자산 (' + preset.name + ')</span><span class="nct-sv">' + eok(target) + '</span></div>' +
      '<div class="nct-srow"><span class="nct-sk">목표 월 생활비</span><span class="nct-sv">' + won(living) + '</span></div>' +
      '<div class="nct-srow"><span class="nct-sk">현재 자산</span><span class="nct-sv">' + eok(seed) + '</span></div>' +
      '<div class="nct-srow"><span class="nct-sk">월 적립액</span><span class="nct-sv">' + won(monthly) + '</span></div>' +
      '<div class="nct-srow"><span class="nct-sk">예상 연 수익률</span><span class="nct-sv">' + annualReturn + '%</span></div>';

    notice.style.display = 'none';

    root.dataset.copytext = '🔥 파이어 D-day 시계\n' + gradeTag + ' (' + years + '년 ' + remMonths + '개월 후)\n목표 자산 ' + eok(target) + ' · 인출률 ' + preset.rate + '%\n' + fireDate.getFullYear() + '년 ' + (fireDate.getMonth()+1) + '월 예상\nstockchild.com';

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
