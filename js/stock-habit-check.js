/* =====================================================================
   stockchild.com 주식 중독 자가진단 (stock-habit-check.js)
   순수 클라이언트: 외부 API, CDN JSON 호출 없음. 오프라인 동작.
   워드프레스 삽입: <div id="sc-shc-root"></div> 아래에 이 스크립트 로드.

   설계 원칙: 가벼운 공감 톤이 기본이나, 고점(문제 신호가 뚜렷한 구간)에서는
   톤을 낮추고 실제 상담 창구(도박문제 헬프라인 1336)를 강조한다.
   조롱하지 않는다. 진단이 아니라 자기점검용 참고 도구임을 명시한다.
   ===================================================================== */
(function () {
  'use strict';

  /* [수정 지점] 상담 창구: 현행 확인(2026-07). 변경 시 이 블록만 수정. */
  var HELP = {
    NAME: '도박문제 헬프라인',
    TEL: '1336',
    HOURS: '국번없이 1336 (무료) · 365일 09:00~22:00 · 비밀보장',
    ORG: '한국도박문제예방치유원'
  };

  /* 문항 10개. 실제 행위중독 자가점검의 결(몰입/통제상실/추격매매/일상지장/은폐)을
     주식 맥락으로 옮김. 표현은 공감형. */
  var QUESTIONS = [
    '장이 열리는 동안 주가를 계속 확인하느라 일이나 공부에 집중하기 어렵다',
    '장 마감 후나 주말에도 차트, 종목 토론방을 계속 들여다본다',
    '원래 정한 금액보다 더 많이, 더 자주 매매하게 된다',
    '손실이 나면 만회하려고 계획에 없던 추격매수를 한 적이 있다',
    '주식에 쓰는 돈이나 손실 규모를 가족, 지인에게 숨긴 적이 있다',
    '생활비, 대출, 신용, 미수 등 잃으면 안 되는 돈까지 투자에 끌어다 쓴 적이 있다',
    '주식 생각 때문에 잠을 설치거나 다른 일이 손에 안 잡힌 적이 있다',
    '"이번이 마지막"이라고 다짐하고도 다시 무리한 매매로 돌아간 적이 있다',
    '수익이 나면 기분이 크게 들뜨고, 손실이 나면 심하게 가라앉는 감정 기복이 있다',
    '주식을 줄이거나 쉬어야겠다고 느끼면서도 마음대로 잘 안 된다'
  ];
  var CHOICES = ['전혀 아니다', '가끔 그렇다', '자주 그렇다', '거의 늘 그렇다']; // 0~3

  var root = document.getElementById('sc-shc-root');
  if (!root) return;

  /* ---------------- 스타일 ---------------- */
  var css = ''
    + '#sc-shc-root{--nct-bg:#FAF7F0;--nct-card:#FFFDF7;--nct-line:#E8E0D0;--nct-ink:#3D3529;--nct-sub:#8A7F6C;--nct-accent:#8B6F47;'
    + 'font-family:"Noto Sans KR",sans-serif;background:var(--nct-bg);border:1px solid var(--nct-line);border-radius:14px;'
    + 'padding:22px;max-width:680px;margin:0 auto;color:var(--nct-ink);box-sizing:border-box}'
    + '#sc-shc-root *{box-sizing:border-box}'
    + '.shc-title{font-size:20px;font-weight:700;text-align:center;margin-bottom:4px}'
    + '.shc-sub{font-size:13px;color:var(--nct-sub);text-align:center;margin-bottom:18px;line-height:1.6}'
    + '.shc-q{background:var(--nct-card);border:1px solid var(--nct-line);border-radius:12px;padding:14px 16px;margin-bottom:10px}'
    + '.shc-qtext{font-size:14px;font-weight:700;line-height:1.5;margin-bottom:10px}'
    + '.shc-qtext .qn{color:var(--nct-accent);margin-right:6px}'
    + '.shc-opts{display:flex;gap:6px}'
    + '.shc-opt{flex:1;font-size:12px;font-weight:700;text-align:center;padding:9px 4px;border:1px solid var(--nct-line);'
    + 'border-radius:8px;background:#fff;color:var(--nct-sub);cursor:pointer;line-height:1.3;font-family:inherit}'
    + '.shc-opt.sel{background:var(--nct-accent);border-color:var(--nct-accent);color:#fff}'
    + '.shc-btn{width:100%;padding:13px;font-size:16px;font-weight:700;border:none;border-radius:8px;'
    + 'background:var(--nct-accent);color:#fff;cursor:pointer;font-family:inherit;margin-top:6px}'
    + '.shc-btn:active{opacity:.85}'
    + '.shc-btn2{width:100%;padding:11px;font-size:14px;font-weight:700;border:1px solid var(--nct-accent);'
    + 'border-radius:8px;background:var(--nct-card);color:var(--nct-accent);cursor:pointer;font-family:inherit;margin-top:10px}'
    + '.shc-err{font-size:13px;color:#B33A3A;margin-top:10px;text-align:center;display:none}'
    + '.shc-results{display:none}'
    + '.shc-rcard{border-radius:12px;padding:20px;margin-bottom:12px;text-align:center}'
    + '.shc-rcard.lv1{background:#E7F0E9;border:1px solid #BcdCc4}'
    + '.shc-rcard.lv2{background:#FBF4E4;border:1px solid #E8D9B0}'
    + '.shc-rcard.lv3{background:#F6E7DC;border:1px solid #E0C3A8}'
    + '.shc-rcard.lv4{background:#F9E9E7;border:1px solid #E5B5AE}'
    + '.shc-badge{font-size:15px;font-weight:700;margin-bottom:6px}'
    + '.shc-score{font-size:34px;font-weight:700;font-family:"JetBrains Mono","Noto Sans KR",monospace;margin:2px 0}'
    + '.shc-score small{font-size:16px;color:var(--nct-sub);font-weight:400}'
    + '.shc-msg{font-size:14px;line-height:1.65;margin-top:8px;color:var(--nct-ink)}'
    + '.shc-help{background:var(--nct-card);border:2px solid var(--nct-accent);border-radius:12px;padding:16px;margin-bottom:12px;line-height:1.65}'
    + '.shc-help .ht{font-size:14px;font-weight:700;margin-bottom:6px}'
    + '.shc-help .tel{font-size:22px;font-weight:700;font-family:"JetBrains Mono",monospace;color:var(--nct-accent);margin:4px 0}'
    + '.shc-help .hs{font-size:12px;color:var(--nct-sub)}'
    + '.shc-disc{font-size:12px;color:var(--nct-sub);background:var(--nct-card);border:1px solid var(--nct-line);'
    + 'border-radius:10px;padding:12px;line-height:1.6;margin-top:4px}'
    + '.shc-footer{font-size:11px;color:var(--nct-sub);text-align:center;margin-top:12px;line-height:1.6}'
    + '@media(max-width:480px){#sc-shc-root{padding:14px}.shc-title{font-size:18px}.shc-opt{font-size:11px;padding:8px 2px}.shc-score{font-size:28px}}';
  var styleTag = document.createElement('style');
  styleTag.textContent = css;
  document.head.appendChild(styleTag);

  /* ---------------- 마크업 (h1/h2/h3 미사용) ---------------- */
  var answers = new Array(QUESTIONS.length).fill(-1);

  var qHtml = '';
  QUESTIONS.forEach(function (q, i) {
    qHtml += '<div class="shc-q">'
      + '<div class="shc-qtext"><span class="qn">' + (i + 1) + '.</span>' + q + '</div>'
      + '<div class="shc-opts" data-q="' + i + '">';
    CHOICES.forEach(function (ch, j) {
      qHtml += '<button type="button" class="shc-opt" data-q="' + i + '" data-v="' + j + '">' + ch + '</button>';
    });
    qHtml += '</div></div>';
  });

  root.innerHTML = ''
    + '<div class="shc-title">🩺 주식 중독 자가진단</div>'
    + '<div class="shc-sub">최근 3개월 내 나의 투자 습관을 돌아보는 자기점검이에요.<br>정답은 없어요. 솔직하게 체크할수록 도움이 됩니다.</div>'
    + qHtml
    + '<button class="shc-btn" id="shc-calc" type="button">결과 보기</button>'
    + '<div class="shc-err" id="shc-err"></div>'
    + '<div class="shc-results" id="shc-results">'
    + '  <div id="shc-result-card"></div>'
    + '  <div id="shc-help-slot"></div>'
    + '  <button class="shc-btn2" id="shc-share" type="button">📸 결과 이미지 저장하기</button>'
    + '</div>'
    + '<div class="shc-disc">⚖️ 이 자가진단은 의학적 진단이 아니라 스스로의 투자 습관을 돌아보기 위한 참고용 자기점검 도구입니다. '
    + '점수가 낮다고 안심하거나 높다고 단정할 필요는 없어요. 다만 마음에 걸리는 부분이 있다면 혼자 안고 있지 말고 전문 상담을 받아보시길 권합니다. '
    + '투자 자체를 부정하거나 매수/매도를 권하는 도구가 아닙니다.</div>'
    + '<div class="shc-footer">상담: ' + HELP.NAME + ' ' + HELP.TEL + ' (' + HELP.ORG + ')<br>출처: stockchild.com</div>';

  /* ---------------- 선택 처리 ---------------- */
  root.querySelectorAll('.shc-opt').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var qi = parseInt(btn.getAttribute('data-q'), 10);
      var v = parseInt(btn.getAttribute('data-v'), 10);
      answers[qi] = v;
      root.querySelectorAll('.shc-opt[data-q="' + qi + '"]').forEach(function (b) { b.classList.remove('sel'); });
      btn.classList.add('sel');
    });
  });

  /* ---------------- 결과 구간 ----------------
     0~30점. 4구간. 고점(lv3,lv4)에서만 상담 안내 강조. */
  function level(score) {
    if (score <= 7) return {
      cls: 'lv1', badge: '🌱 건강한 거리두기',
      msg: '투자와 일상 사이에 균형이 잘 잡혀 있는 편이에요. 지금의 페이스를 유지하시면 좋겠습니다. 시장이 과열될 때 이 균형이 흔들리기 쉬우니 가끔 다시 점검해보세요.',
      help: false
    };
    if (score <= 14) return {
      cls: 'lv2', badge: '🌤️ 살짝 과몰입 주의',
      msg: '아직 큰 문제는 아니지만, 주식이 생각보다 하루를 많이 차지하기 시작한 신호가 보여요. 매매 원칙을 글로 적어두거나, 장을 안 보는 시간을 정해두는 것만으로도 도움이 됩니다.',
      help: false
    };
    if (score <= 21) return {
      cls: 'lv3', badge: '🌧️ 습관을 점검할 때',
      msg: '투자가 감정과 일상에 적지 않은 영향을 주고 있는 것 같아요. 이건 웃으며 넘길 문제가 아닐 수 있습니다. 잠시 매매를 멈추고 거리를 두거나, 혼자 판단이 어렵다면 아래 상담 창구에 가볍게 이야기를 꺼내보는 것도 좋은 방법이에요.',
      help: true
    };
    return {
      cls: 'lv4', badge: '🚨 혼자 두지 마세요',
      msg: '지금은 투자 조언보다 회복이 먼저인 상태로 보입니다. 통제가 잘 안 되고 잃으면 안 되는 돈까지 흔들리고 있다면, 그건 의지의 문제가 아니라 도움이 필요한 상태일 수 있어요. 부끄러운 일이 아닙니다. 아래 창구는 비밀이 보장되고 무료이니, 오늘 한 번 연락해보시길 진심으로 권합니다.',
      help: true
    };
  }

  var lastResult = null;

  function calc() {
    var errEl = document.getElementById('shc-err');
    errEl.style.display = 'none';
    var unanswered = answers.indexOf(-1);
    if (unanswered !== -1) {
      errEl.textContent = (unanswered + 1) + '번 문항이 아직 체크되지 않았어요.';
      errEl.style.display = 'block';
      document.getElementById('shc-results').style.display = 'none';
      return;
    }
    var score = answers.reduce(function (a, b) { return a + b; }, 0);
    var lv = level(score);

    document.getElementById('shc-result-card').innerHTML =
      '<div class="shc-rcard ' + lv.cls + '">'
      + '<div class="shc-badge">' + lv.badge + '</div>'
      + '<div class="shc-score">' + score + '<small> / 30점</small></div>'
      + '<div class="shc-msg">' + lv.msg + '</div>'
      + '</div>';

    document.getElementById('shc-help-slot').innerHTML = lv.help
      ? '<div class="shc-help"><div class="ht">💬 혼자 고민하지 마세요</div>'
        + '<div>' + HELP.NAME + '</div>'
        + '<div class="tel">☎ ' + HELP.TEL + '</div>'
        + '<div class="hs">' + HELP.HOURS + '<br>' + HELP.ORG + ' 운영</div></div>'
      : '';

    document.getElementById('shc-results').style.display = 'block';
    lastResult = { score: score, badge: lv.badge, help: lv.help };
    document.getElementById('shc-results').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  /* ---------------- 공유 카드 (캔버스 1080x1080) ----------------
     고점 결과는 조롱성 확산을 막기 위해 점수를 크게 박지 않고,
     배지와 상담 안내 중심으로 구성. */
  function drawShareCard() {
    if (!lastResult) return;
    var c = document.createElement('canvas');
    c.width = 1080; c.height = 1080;
    var x = c.getContext('2d');
    var FONT = '"Noto Sans KR",sans-serif';

    x.fillStyle = '#FAF7F0'; x.fillRect(0, 0, 1080, 1080);
    x.strokeStyle = '#E8E0D0'; x.lineWidth = 6; x.strokeRect(30, 30, 1020, 1020);
    x.textAlign = 'center';

    x.fillStyle = '#3D3529'; x.font = '700 54px ' + FONT;
    x.fillText('🩺 주식 중독 자가진단', 540, 160);

    x.font = '700 60px ' + FONT; x.fillStyle = '#8B6F47';
    x.fillText(lastResult.badge, 540, 340);

    if (!lastResult.help) {
      // 저점: 점수 노출 OK
      x.fillStyle = '#3D3529'; x.font = '700 130px ' + FONT;
      x.fillText(lastResult.score + ' / 30', 540, 520);
      x.font = '400 34px ' + FONT; x.fillStyle = '#8A7F6C';
      x.fillText('투자와 일상의 균형, 지금처럼 지켜가요', 540, 610);
    } else {
      // 고점: 점수 강조 대신 메시지 + 상담 안내
      x.font = '400 36px ' + FONT; x.fillStyle = '#8A7F6C';
      x.fillText('혼자 안고 있지 않아도 괜찮아요', 540, 440);
      x.fillStyle = '#FFFDF7'; x.strokeStyle = '#8B6F47'; x.lineWidth = 4;
      roundRect(x, 190, 520, 700, 200, 20); x.fill(); x.stroke();
      x.fillStyle = '#3D3529'; x.font = '700 34px ' + FONT;
      x.fillText('도박문제 헬프라인', 540, 590);
      x.fillStyle = '#8B6F47'; x.font = '700 76px ' + FONT;
      x.fillText('☎ 1336', 540, 665);
      x.fillStyle = '#8A7F6C'; x.font = '400 24px ' + FONT;
      x.fillText('무료 · 365일 09:00~22:00 · 비밀보장', 540, 700);
    }

    x.font = '400 26px ' + FONT; x.fillStyle = '#8A7F6C';
    x.fillText('의학적 진단이 아닌 자기점검용 참고 도구입니다', 540, 960);
    x.font = '700 30px ' + FONT; x.fillStyle = '#8B6F47';
    x.fillText('stockchild.com', 540, 1015);

    var a = document.createElement('a');
    a.href = c.toDataURL('image/png');
    a.download = 'stock_habit_check.png';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  }
  function roundRect(x, px, py, w, h, r) {
    x.beginPath(); x.moveTo(px + r, py);
    x.arcTo(px + w, py, px + w, py + h, r);
    x.arcTo(px + w, py + h, px, py + h, r);
    x.arcTo(px, py + h, px, py, r);
    x.arcTo(px, py, px + w, py, r);
    x.closePath();
  }

  /* ---------------- 이벤트 ---------------- */
  document.getElementById('shc-calc').addEventListener('click', calc);
  document.getElementById('shc-share').addEventListener('click', drawShareCard);
})();
