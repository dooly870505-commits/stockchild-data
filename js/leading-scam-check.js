/* =====================================================================
   stockchild.com No.97 리딩방 사기 자가진단 (leading-scam-check.js)
   순수 클라이언트: 외부 API, CDN JSON 호출 없음. 오프라인 동작.
   워드프레스 삽입: <div id="sc-lsc-root"></div> 아래에 이 스크립트 로드.

   목적: 내가 있는 주식/코인 리딩방이 전형적인 사기 수법을 쓰고 있는지
   체크리스트로 자가점검. 위험 신호가 많을수록 '지금 빠져나오고 신고하라'는
   방향으로 안내를 강화. 특정 업체를 지목/비방하지 않고 '수법 패턴'만 다룬다.
   ===================================================================== */
(function () {
  'use strict';

  /* [수정 지점] 신고/조회 창구: 현행 확인(2026-07). 변경 시 이 블록만 수정. */
  var REPORT = {
    FSS_TEL: '1332',          // 금융감독원: 불법금융/불공정거래 신고
    POLICE_TEL: '112',        // 경찰청: 수사기관 고발
    FINE: 'fine.fss.or.kr',   // 파인: 유사투자자문업자 등록 조회
    SPAM_TEL: '118'           // 불법스팸 신고(KISA)
  };

  /* 문항 12개. 각 항목은 실제 리딩방 사기의 전형적 신호.
     '예'일수록 위험. weight로 위험도 차등(개인정보/대출/입금유도는 고위험). */
  var SIGNALS = [
    { t: '문자, 오픈채팅, 유튜브 댓글 등으로 모르는 곳에서 먼저 초대받아 들어갔다', w: 1 },
    { t: '"원금 보장", "확정 수익", "무조건 수익" 같은 표현을 쓴다', w: 2 },
    { t: '처음엔 무료로 종목을 알려주다가, 일대일 상담이나 유료 VIP방 가입을 권유한다', w: 2 },
    { t: '수익 인증샷, 회원 후기, 수익률 캡처를 계속 올리며 분위기를 띄운다', w: 1 },
    { t: '"오늘까지만", "자리 몇 개 안 남음" 등으로 빨리 결정하라고 재촉한다', w: 1 },
    { t: '특정 종목을 "지금 당장 매수하라"고 콕 집어 지시한다', w: 2 },
    { t: '운영자가 정식 등록된 투자자문업자인지 확인해줄 수 없거나 얼버무린다', w: 2 },
    { t: '수익금 출금이나 세금, 수수료 명목으로 추가 입금을 요구한다', w: 3 },
    { t: '손실을 봤더니 "손실 보상", "복구 프로그램"을 미끼로 다시 접근한다', w: 3 },
    { t: '신분증, 계좌 비밀번호, OTP, 대출 실행 등 개인정보나 금융정보를 요구한다', w: 3 },
    { t: '지정한 개인 계좌나 특정 앱, 사이트로만 입금, 거래하라고 한다', w: 3 },
    { t: '고수익을 강조하면서 위험이나 손실 가능성은 거의 말하지 않는다', w: 1 }
  ];
  // 최대 위험점수 합계 계산
  var MAX = SIGNALS.reduce(function (a, s) { return a + s.w; }, 0); // 24

  var root = document.getElementById('sc-lsc-root');
  if (!root) return;

  /* ---------------- 스타일 ---------------- */
  var css = ''
    + '#sc-lsc-root{--nct-bg:#FAF7F0;--nct-card:#FFFDF7;--nct-line:#E8E0D0;--nct-ink:#3D3529;--nct-sub:#8A7F6C;--nct-accent:#8B6F47;'
    + 'font-family:"Noto Sans KR",sans-serif;background:var(--nct-bg);border:1px solid var(--nct-line);border-radius:14px;'
    + 'padding:22px;max-width:680px;margin:0 auto;color:var(--nct-ink);box-sizing:border-box}'
    + '#sc-lsc-root *{box-sizing:border-box}'
    + '.lsc-title{font-size:20px;font-weight:700;text-align:center;margin-bottom:4px}'
    + '.lsc-sub{font-size:13px;color:var(--nct-sub);text-align:center;margin-bottom:18px;line-height:1.6}'
    + '.lsc-item{display:flex;align-items:flex-start;gap:12px;background:var(--nct-card);border:1px solid var(--nct-line);'
    + 'border-radius:12px;padding:14px 16px;margin-bottom:9px;cursor:pointer}'
    + '.lsc-item.on{border-color:var(--nct-accent);background:#FBF4E8}'
    + '.lsc-check{flex:0 0 24px;width:24px;height:24px;border:2px solid var(--nct-line);border-radius:6px;'
    + 'display:flex;align-items:center;justify-content:center;font-size:15px;color:#fff;margin-top:1px}'
    + '.lsc-item.on .lsc-check{background:var(--nct-accent);border-color:var(--nct-accent)}'
    + '.lsc-itext{font-size:14px;line-height:1.5;flex:1}'
    + '.lsc-btn{width:100%;padding:13px;font-size:16px;font-weight:700;border:none;border-radius:8px;'
    + 'background:var(--nct-accent);color:#fff;cursor:pointer;font-family:inherit;margin-top:8px}'
    + '.lsc-btn:active{opacity:.85}'
    + '.lsc-btn2{width:100%;padding:11px;font-size:14px;font-weight:700;border:1px solid var(--nct-accent);'
    + 'border-radius:8px;background:var(--nct-card);color:var(--nct-accent);cursor:pointer;font-family:inherit;margin-top:10px}'
    + '.lsc-count{font-size:13px;color:var(--nct-sub);text-align:center;margin:10px 0 2px}'
    + '.lsc-results{display:none}'
    + '.lsc-rcard{border-radius:12px;padding:20px;margin-bottom:12px;text-align:center}'
    + '.lsc-rcard.lv1{background:#E7F0E9;border:1px solid #BCD6C4}'
    + '.lsc-rcard.lv2{background:#FBF4E4;border:1px solid #E8D9B0}'
    + '.lsc-rcard.lv3{background:#F6E7DC;border:1px solid #E0C3A8}'
    + '.lsc-rcard.lv4{background:#F9E9E7;border:1px solid #E5B5AE}'
    + '.lsc-badge{font-size:16px;font-weight:700;margin-bottom:6px}'
    + '.lsc-score{font-size:30px;font-weight:700;font-family:"JetBrains Mono","Noto Sans KR",monospace;margin:2px 0}'
    + '.lsc-score small{font-size:15px;color:var(--nct-sub);font-weight:400}'
    + '.lsc-msg{font-size:14px;line-height:1.65;margin-top:8px;color:var(--nct-ink)}'
    + '.lsc-report{background:var(--nct-card);border:2px solid var(--nct-accent);border-radius:12px;padding:16px;margin-bottom:12px;line-height:1.6}'
    + '.lsc-report .rt{font-size:14px;font-weight:700;margin-bottom:10px}'
    + '.lsc-rrow{display:flex;justify-content:space-between;align-items:center;padding:7px 0;border-top:1px solid var(--nct-line);font-size:13px}'
    + '.lsc-rrow:first-of-type{border-top:none}'
    + '.lsc-rrow .rl{color:var(--nct-ink)}'
    + '.lsc-rrow .rv{font-weight:700;font-family:"JetBrains Mono",monospace;color:var(--nct-accent);font-size:15px}'
    + '.lsc-disc{font-size:12px;color:var(--nct-sub);background:var(--nct-card);border:1px solid var(--nct-line);'
    + 'border-radius:10px;padding:12px;line-height:1.6;margin-top:4px}'
    + '.lsc-footer{font-size:11px;color:var(--nct-sub);text-align:center;margin-top:12px;line-height:1.6}'
    + '@media(max-width:480px){#sc-lsc-root{padding:14px}.lsc-title{font-size:18px}.lsc-itext{font-size:13px}.lsc-score{font-size:26px}}';
  var styleTag = document.createElement('style');
  styleTag.textContent = css;
  document.head.appendChild(styleTag);

  /* ---------------- 마크업 (h1/h2/h3 미사용) ---------------- */
  var checked = new Array(SIGNALS.length).fill(false);

  var itemsHtml = '';
  SIGNALS.forEach(function (s, i) {
    itemsHtml += '<div class="lsc-item" data-i="' + i + '">'
      + '<div class="lsc-check">✓</div>'
      + '<div class="lsc-itext">' + s.t + '</div>'
      + '</div>';
  });

  root.innerHTML = ''
    + '<div class="lsc-title">🔍 리딩방 사기 자가진단</div>'
    + '<div class="lsc-sub">지금 참여 중이거나 권유받은 리딩방에<br>해당하는 항목을 모두 체크해보세요.</div>'
    + itemsHtml
    + '<div class="lsc-count" id="lsc-count">체크한 항목: 0개</div>'
    + '<button class="lsc-btn" id="lsc-calc" type="button">위험도 확인하기</button>'
    + '<div class="lsc-results" id="lsc-results">'
    + '  <div id="lsc-result-card"></div>'
    + '  <div id="lsc-report-slot"></div>'
    + '  <button class="lsc-btn2" id="lsc-share" type="button">📸 결과 이미지 저장하기</button>'
    + '</div>'
    + '<div class="lsc-disc">⚖️ 이 자가진단은 널리 알려진 사기 수법 패턴을 바탕으로 한 참고용 체크리스트이며, 특정 업체나 개인을 사기로 단정하는 도구가 아닙니다. '
    + '체크 항목이 적어도 안전이 보장되는 것은 아니고, 조금이라도 의심된다면 돈을 보내기 전에 멈추고 확인하는 것이 가장 안전합니다. '
    + '제도권 금융회사와 정식 등록 여부는 금융감독원 파인(' + REPORT.FINE + ')에서 직접 확인할 수 있습니다.</div>'
    + '<div class="lsc-footer">신고: 금융감독원 ' + REPORT.FSS_TEL + ' · 경찰청 ' + REPORT.POLICE_TEL + ' · 등록조회 파인(' + REPORT.FINE + ')<br>출처: stockchild.com</div>';

  /* ---------------- 체크 처리 ---------------- */
  root.querySelectorAll('.lsc-item').forEach(function (el) {
    el.addEventListener('click', function () {
      var i = parseInt(el.getAttribute('data-i'), 10);
      checked[i] = !checked[i];
      el.classList.toggle('on', checked[i]);
      var n = checked.filter(Boolean).length;
      document.getElementById('lsc-count').textContent = '체크한 항목: ' + n + '개';
    });
  });

  /* ---------------- 결과 구간 ----------------
     위험점수(가중합) 기준. lv3,lv4에서 신고 채널 강조.
     단, 고위험 단일 항목(w:3, 입금/개인정보/대출/손실보상)이 하나라도 있으면
     최소 lv3 이상으로 끌어올림 (개수는 적어도 치명적 신호이므로). */
  function level(score, hasCritical) {
    var lv;
    if (score <= 3) lv = {
      cls: 'lv1', badge: '🟢 뚜렷한 위험 신호 적음',
      msg: '지금 체크된 항목만으로는 전형적인 사기 신호가 두드러지지는 않아요. 다만 안심은 금물입니다. 정식 등록 업체인지 파인에서 한 번 확인하고, 원금이나 수익을 보장한다는 말이 나오는 순간 바로 거리를 두세요.',
      report: false
    };
    else if (score <= 8) lv = {
      cls: 'lv2', badge: '🟡 주의가 필요한 신호',
      msg: '사기 수법에서 자주 보이는 신호가 몇 가지 확인됩니다. 아직 돈을 보내지 않았다면 지금이 멈출 때예요. 무료 정보에서 유료 가입으로 넘어가는 흐름은 전형적인 미끼일 수 있습니다. 운영자의 정식 등록 여부부터 확인하세요.',
      report: false
    };
    else if (score <= 14) lv = {
      cls: 'lv3', badge: '🟠 사기 가능성 높음',
      msg: '전형적인 리딩방 사기 패턴이 여러 개 확인됩니다. 이건 가볍게 넘길 상황이 아닙니다. 추가로 돈을 보내거나 개인정보를 넘기지 마시고, 지금 대화를 캡처해 증거로 남겨두세요. 아래 창구에 문의하거나 신고하시길 권합니다.',
      report: true
    };
    else lv = {
      cls: 'lv4', badge: '🔴 즉시 중단하세요',
      msg: '지금 상황은 매우 위험합니다. 더 이상 돈을 보내지 말고, 개인정보나 대출 요구에는 절대 응하지 마세요. 이미 송금했거나 정보를 넘겼다면 한시라도 빨리 아래 창구에 연락하는 것이 피해를 줄이는 길입니다. 부끄러워하지 마세요, 신고가 나와 다른 사람을 지킵니다.',
      report: true
    };
    // 치명 신호 있으면 최소 lv3로
    if (hasCritical && (lv.cls === 'lv1' || lv.cls === 'lv2')) {
      return level(11, false); // lv3 강제
    }
    return lv;
  }

  var lastResult = null;

  function calc() {
    var score = 0, hasCritical = false, cnt = 0;
    SIGNALS.forEach(function (s, i) {
      if (checked[i]) { score += s.w; cnt++; if (s.w >= 3) hasCritical = true; }
    });
    var lv = level(score, hasCritical);

    document.getElementById('lsc-result-card').innerHTML =
      '<div class="lsc-rcard ' + lv.cls + '">'
      + '<div class="lsc-badge">' + lv.badge + '</div>'
      + '<div class="lsc-score">' + cnt + '<small> / ' + SIGNALS.length + '개 신호</small></div>'
      + '<div class="lsc-msg">' + lv.msg + '</div>'
      + '</div>';

    document.getElementById('lsc-report-slot').innerHTML = lv.report
      ? '<div class="lsc-report"><div class="rt">📞 의심되면 여기로 문의, 신고하세요</div>'
        + '<div class="lsc-rrow"><span class="rl">불법금융, 불공정거래 신고 (금융감독원)</span><span class="rv">☎ ' + REPORT.FSS_TEL + '</span></div>'
        + '<div class="lsc-rrow"><span class="rl">투자사기 수사, 고발 (경찰청)</span><span class="rv">☎ ' + REPORT.POLICE_TEL + '</span></div>'
        + '<div class="lsc-rrow"><span class="rl">업체 정식 등록 여부 조회 (파인)</span><span class="rv">' + REPORT.FINE + '</span></div>'
        + '<div class="lsc-rrow"><span class="rl">불법스팸 문자 신고 (KISA)</span><span class="rv">☎ ' + REPORT.SPAM_TEL + '</span></div>'
        + '</div>'
      : '';

    document.getElementById('lsc-results').style.display = 'block';
    lastResult = { cnt: cnt, badge: lv.badge, report: lv.report, cls: lv.cls };
    document.getElementById('lsc-results').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  /* ---------------- 공유 카드 (캔버스 1080x1080) ---------------- */
  function drawShareCard() {
    if (!lastResult) return;
    var c = document.createElement('canvas');
    c.width = 1080; c.height = 1080;
    var x = c.getContext('2d');
    var FONT = '"Noto Sans KR",sans-serif';
    var accentByLv = { lv1: '#3A7D44', lv2: '#8A5A1E', lv3: '#9A5A2A', lv4: '#B33A3A' };
    var ac = accentByLv[lastResult.cls] || '#8B6F47';

    x.fillStyle = '#FAF7F0'; x.fillRect(0, 0, 1080, 1080);
    x.strokeStyle = '#E8E0D0'; x.lineWidth = 6; x.strokeRect(30, 30, 1020, 1020);
    x.textAlign = 'center';

    x.fillStyle = '#3D3529'; x.font = '700 54px ' + FONT;
    x.fillText('🔍 리딩방 사기 자가진단', 540, 155);

    x.font = '700 62px ' + FONT; x.fillStyle = ac;
    x.fillText(lastResult.badge, 540, 320);

    x.fillStyle = '#3D3529'; x.font = '700 120px ' + FONT;
    x.fillText(lastResult.cnt + ' / ' + SIGNALS.length, 540, 480);
    x.font = '400 32px ' + FONT; x.fillStyle = '#8A7F6C';
    x.fillText('개의 사기 위험 신호가 확인됨', 540, 545);

    if (lastResult.report) {
      x.fillStyle = '#FFFDF7'; x.strokeStyle = '#8B6F47'; x.lineWidth = 4;
      roundRect(x, 150, 620, 780, 200, 20); x.fill(); x.stroke();
      x.fillStyle = '#3D3529'; x.font = '700 30px ' + FONT;
      x.fillText('의심되면 돈 보내기 전에 멈추고 확인하세요', 540, 685);
      x.fillStyle = '#8B6F47'; x.font = '700 40px ' + FONT;
      x.fillText('금융감독원 1332 · 경찰청 112', 540, 745);
      x.fillStyle = '#8A7F6C'; x.font = '400 26px ' + FONT;
      x.fillText('등록 조회: 파인 fine.fss.or.kr', 540, 790);
    } else {
      x.font = '400 34px ' + FONT; x.fillStyle = '#8A7F6C';
      x.fillText('그래도 원금, 수익 보장은 사기 신호 1순위예요', 540, 640);
      x.fillText('정식 등록 여부는 파인에서 확인하세요', 540, 690);
    }

    x.font = '400 25px ' + FONT; x.fillStyle = '#8A7F6C';
    x.fillText('널리 알려진 사기 수법 기반 참고용 체크리스트입니다', 540, 965);
    x.font = '700 30px ' + FONT; x.fillStyle = '#8B6F47';
    x.fillText('stockchild.com', 540, 1015);

    var a = document.createElement('a');
    a.href = c.toDataURL('image/png');
    a.download = 'leading_scam_check.png';
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
  document.getElementById('lsc-calc').addEventListener('click', calc);
  document.getElementById('lsc-share').addEventListener('click', drawShareCard);
})();
