/* =====================================================================
   stockchild.com No.94 배당 월급 역산 계산기 (dividend-salary-calc.js)
   순수 클라이언트 계산기: 외부 API, CDN JSON 호출 없음. 오프라인 동작.
   워드프레스 삽입: <div id="sc-dsc-root"></div> 아래에 이 스크립트 로드.
   ===================================================================== */
(function () {
  'use strict';

  /* -------------------------------------------------------------------
     [수정 지점] 세법 상수: 제도 개정 시 이 블록의 숫자만 바꾸면 됩니다.
     기준: 2026-07 현행. ISA 비과세 한도 확대안(일반형 500만/서민형 1,000만)은
     국회 미통과 상태라 반영하지 않음. 통과 확정 시 아래 두 값과
     푸터의 LAW_BASIS 문구를 함께 수정하세요.
     ------------------------------------------------------------------- */
  var TAX = {
    BASE_RATE: 0.154,            // 일반계좌 배당소득세율 (소득세 14% + 지방세 1.4%)
    ISA_OVER_RATE: 0.099,        // ISA 비과세 한도 초과분 분리과세율
    ISA_LIMIT_GENERAL: 2000000,  // ISA 일반형 비과세 한도 (원)
    ISA_LIMIT_SEOMIN: 4000000,   // ISA 서민형 비과세 한도 (원)
    ISA_TOTAL_DEPOSIT: 100000000,// ISA 총 납입 한도 (원)
    COMPREHENSIVE_LINE: 20000000 // 금융소득종합과세 기준 (연간, 원)
  };
  var LAW_BASIS = '세법 기준: 2026년 7월 현행 (ISA 비과세 일반형 200만원 / 서민형 400만원)';

  var root = document.getElementById('sc-dsc-root');
  if (!root) return;

  /* ---------------- 스타일 ---------------- */
  var css = ''
    + '#sc-dsc-root{--nct-bg:#FAF7F0;--nct-card:#FFFDF7;--nct-line:#E8E0D0;--nct-ink:#3D3529;--nct-sub:#8A7F6C;--nct-accent:#8B6F47;'
    + 'font-family:"Noto Sans KR",sans-serif;background:var(--nct-bg);border:1px solid var(--nct-line);border-radius:14px;'
    + 'padding:22px;max-width:680px;margin:0 auto;color:var(--nct-ink);box-sizing:border-box}'
    + '#sc-dsc-root *{box-sizing:border-box}'
    + '.dsc-title{font-size:20px;font-weight:700;text-align:center;margin-bottom:4px}'
    + '.dsc-sub{font-size:13px;color:var(--nct-sub);text-align:center;margin-bottom:18px}'
    + '.dsc-inputs{background:var(--nct-card);border:1px solid var(--nct-line);border-radius:12px;padding:18px;margin-bottom:14px}'
    + '.dsc-field{margin-bottom:14px}'
    + '.dsc-label{font-size:13px;font-weight:700;display:block;margin-bottom:6px}'
    + '.dsc-label .hint{font-weight:400;color:var(--nct-sub);font-size:12px}'
    + '.dsc-inwrap{display:flex;align-items:center;gap:8px}'
    + '.dsc-input{flex:1;font-size:16px;font-family:"JetBrains Mono",monospace;padding:10px 12px;'
    + 'border:1px solid var(--nct-line);border-radius:8px;background:#fff;color:var(--nct-ink);width:100%}'
    + '.dsc-input:focus{outline:none;border-color:var(--nct-accent)}'
    + '.dsc-unit{font-size:14px;color:var(--nct-sub);white-space:nowrap}'
    + '.dsc-btn{width:100%;padding:13px;font-size:16px;font-weight:700;border:none;border-radius:8px;'
    + 'background:var(--nct-accent);color:#fff;cursor:pointer;font-family:inherit}'
    + '.dsc-btn:active{opacity:.85}'
    + '.dsc-btn2{width:100%;padding:11px;font-size:14px;font-weight:700;border:1px solid var(--nct-accent);'
    + 'border-radius:8px;background:var(--nct-card);color:var(--nct-accent);cursor:pointer;font-family:inherit;margin-top:10px}'
    + '.dsc-err{font-size:13px;color:#B33A3A;margin-top:8px;display:none;text-align:center}'
    + '.dsc-results{display:none}'
    + '.dsc-card{background:var(--nct-card);border:1px solid var(--nct-line);border-radius:12px;padding:16px;margin-bottom:10px;position:relative}'
    + '.dsc-card.best{border-color:var(--nct-accent);border-width:2px}'
    + '.dsc-acct{font-size:14px;font-weight:700;margin-bottom:2px}'
    + '.dsc-acct .tag{font-size:11px;font-weight:700;color:var(--nct-accent);border:1px solid var(--nct-accent);'
    + 'border-radius:10px;padding:1px 8px;margin-left:6px;vertical-align:1px}'
    + '.dsc-principal{font-size:24px;font-weight:700;font-family:"JetBrains Mono","Noto Sans KR",monospace;margin:6px 0 8px}'
    + '.dsc-principal .small{font-size:13px;font-weight:400;color:var(--nct-sub);font-family:"Noto Sans KR",sans-serif}'
    + '.dsc-row{display:flex;justify-content:space-between;font-size:13px;color:var(--nct-sub);padding:3px 0}'
    + '.dsc-row b{color:var(--nct-ink);font-family:"JetBrains Mono",monospace;font-weight:500}'
    + '.dsc-row b.save{color:#3A7D44;font-weight:700}'
    + '.dsc-warn{font-size:12px;border-radius:8px;padding:8px 10px;margin-top:8px;line-height:1.5}'
    + '.dsc-warn.orange{background:#FBF0E0;border:1px solid #E8C99A;color:#8A5A1E}'
    + '.dsc-warn.red{background:#F9E9E7;border:1px solid #E5B5AE;color:#8A2F26}'
    + '.dsc-note{font-size:12px;color:var(--nct-sub);line-height:1.6;margin:12px 2px}'
    + '.dsc-disc{font-size:12px;color:var(--nct-sub);background:var(--nct-card);border:1px solid var(--nct-line);'
    + 'border-radius:10px;padding:12px;line-height:1.6;margin-top:14px}'
    + '.dsc-footer{font-size:11px;color:var(--nct-sub);text-align:center;margin-top:12px;line-height:1.6}'
    + '@media(max-width:480px){#sc-dsc-root{padding:14px}.dsc-title{font-size:18px}.dsc-principal{font-size:21px}}';
  var styleTag = document.createElement('style');
  styleTag.textContent = css;
  document.head.appendChild(styleTag);

  /* ---------------- 마크업 (h1/h2/h3 미사용) ---------------- */
  root.innerHTML = ''
    + '<div class="dsc-title">💰 배당 월급 역산 계산기</div>'
    + '<div class="dsc-sub">매달 받고 싶은 배당금을 입력하면 필요한 투자 원금을 계좌별로 계산해요</div>'
    + '<div class="dsc-inputs">'
    + '  <div class="dsc-field">'
    + '    <span class="dsc-label">목표 월 배당금 <span class="hint">(세금 다 떼고 실제로 받는 금액)</span></span>'
    + '    <div class="dsc-inwrap"><input class="dsc-input" id="dsc-target" type="text" inputmode="numeric" value="100" placeholder="예: 100"><span class="dsc-unit">만원 / 월</span></div>'
    + '  </div>'
    + '  <div class="dsc-field">'
    + '    <span class="dsc-label">예상 배당수익률 <span class="hint">(종목/ETF의 연간 배당수익률)</span></span>'
    + '    <div class="dsc-inwrap"><input class="dsc-input" id="dsc-yield" type="text" inputmode="decimal" value="5" placeholder="예: 5"><span class="dsc-unit">% / 년</span></div>'
    + '  </div>'
    + '  <button class="dsc-btn" id="dsc-calc">계산하기</button>'
    + '  <div class="dsc-err" id="dsc-err"></div>'
    + '</div>'
    + '<div class="dsc-results" id="dsc-results">'
    + '  <div id="dsc-cards"></div>'
    + '  <div class="dsc-note" id="dsc-isa-note"></div>'
    + '  <button class="dsc-btn2" id="dsc-share">📸 결과 이미지 저장하기</button>'
    + '</div>'
    + '<div class="dsc-disc">⚖️ 이 계산기는 입력한 배당수익률이 유지된다는 가정 아래 단순 계산한 참고용 도구입니다. '
    + '배당수익률은 주가와 배당 정책에 따라 수시로 변하며, 높은 배당수익률 자체가 좋은 투자를 뜻하지 않습니다. '
    + 'ISA의 비과세/저율과세 혜택은 의무가입기간(3년) 등 조건 충족 후 적용됩니다. '
    + '본 결과는 투자 참고용이며 매수/매도 추천이 아닙니다.</div>'
    + '<div class="dsc-footer">' + LAW_BASIS + '<br>출처: stockchild.com</div>';

  /* ---------------- 유틸 ---------------- */
  function num(id) {
    var v = String(document.getElementById(id).value || '').replace(/,/g, '').trim();
    var n = parseFloat(v);
    return isFinite(n) ? n : NaN;
  }
  function fmtWon(w) { // 원 단위 금액을 "3억 2,450만원" 형태로
    w = Math.round(w / 10000) * 10000; // 만원 반올림
    var man = Math.round(w / 10000);
    var eok = Math.floor(man / 10000);
    var rest = man % 10000;
    if (eok > 0 && rest > 0) return comma(eok) + '억 ' + comma(rest) + '만원';
    if (eok > 0) return comma(eok) + '억원';
    return comma(man) + '만원';
  }
  function comma(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }

  /* ---------------- 계산 로직 ----------------
     annualNet: 연간 세후 목표액(원). 각 계좌에서 이 금액을 손에 쥐기 위한
     연간 세전 배당(gross)을 역산한 뒤, 원금 = gross / 수익률.
     ISA: 비과세 한도까지 세금 0, 초과분은 9.9% 분리과세.        */
  function calc(annualNet, yieldRate) {
    var r = yieldRate / 100;
    function isaGross(limit) {
      if (annualNet <= limit) return annualNet;
      return limit + (annualNet - limit) / (1 - TAX.ISA_OVER_RATE);
    }
    var gGeneral = annualNet / (1 - TAX.BASE_RATE);
    var gIsaG = isaGross(TAX.ISA_LIMIT_GENERAL);
    var gIsaS = isaGross(TAX.ISA_LIMIT_SEOMIN);
    return [
      { key: 'general', name: '일반 위탁계좌', gross: gGeneral, tax: gGeneral - annualNet, principal: gGeneral / r, isIsa: false },
      { key: 'isaG', name: 'ISA 일반형', gross: gIsaG, tax: gIsaG - annualNet, principal: gIsaG / r, isIsa: true },
      { key: 'isaS', name: 'ISA 서민형', gross: gIsaS, tax: gIsaS - annualNet, principal: gIsaS / r, isIsa: true }
    ];
  }

  var lastResult = null; // 공유 카드용

  function render() {
    var errEl = document.getElementById('dsc-err');
    var resEl = document.getElementById('dsc-results');
    errEl.style.display = 'none';

    var targetMan = num('dsc-target');
    var yieldRate = num('dsc-yield');
    if (!(targetMan > 0)) { errEl.textContent = '목표 월 배당금을 숫자로 입력해주세요.'; errEl.style.display = 'block'; resEl.style.display = 'none'; return; }
    if (!(yieldRate > 0) || yieldRate > 100) { errEl.textContent = '배당수익률은 0보다 크고 100 이하로 입력해주세요.'; errEl.style.display = 'block'; resEl.style.display = 'none'; return; }

    var annualNet = targetMan * 10000 * 12;
    var rows = calc(annualNet, yieldRate);
    var generalTax = rows[0].tax;

    var html = '';
    rows.forEach(function (row, i) {
      var isBest = (i === 2); // 필요 원금 최소는 항상 서민형
      html += '<div class="dsc-card' + (isBest ? ' best' : '') + '">'
        + '<div class="dsc-acct">' + (row.isIsa ? '🏦 ' : '💼 ') + row.name
        + (isBest ? '<span class="tag">원금 최소</span>' : '') + '</div>'
        + '<div class="dsc-principal">' + fmtWon(row.principal) + ' <span class="small">필요</span></div>'
        + '<div class="dsc-row"><span>연간 세전 배당</span><b>' + fmtWon(row.gross) + '</b></div>'
        + '<div class="dsc-row"><span>연간 세금</span><b>' + fmtWon(row.tax) + '</b></div>';
      if (row.isIsa) {
        var save = generalTax - row.tax;
        html += '<div class="dsc-row"><span>일반계좌 대비 연간 절세</span><b class="save">' + fmtWon(save) + '</b></div>';
      }
      if (!row.isIsa && row.gross > TAX.COMPREHENSIVE_LINE) {
        html += '<div class="dsc-warn red">🚨 연간 세전 배당이 2,000만원을 넘어 금융소득종합과세 대상 구간입니다. '
          + '다른 소득과 합산해 누진세율이 적용될 수 있어 실제 세금은 이 계산보다 커질 수 있어요.</div>';
      }
      if (row.isIsa && row.principal > TAX.ISA_TOTAL_DEPOSIT) {
        html += '<div class="dsc-warn orange">⚠️ 필요 원금이 ISA 총 납입한도(1억원)를 넘어요. '
          + '이 목표를 ISA 계좌 하나만으로 담을 수는 없고, 초과분은 일반계좌 세율이 적용됩니다.</div>';
      }
      html += '</div>';
    });
    document.getElementById('dsc-cards').innerHTML = html;
    document.getElementById('dsc-isa-note').textContent =
      '참고: ISA 비과세 한도 초과분(9.9% 분리과세)은 금융소득종합과세 합산 대상에서 제외됩니다. '
      + 'ISA 서민형은 근로소득 5,000만원 이하 등 가입 조건이 있습니다.';
    resEl.style.display = 'block';
    lastResult = { targetMan: targetMan, yieldRate: yieldRate, rows: rows };
  }

  /* ---------------- 공유 카드 (캔버스 1080x1080) ---------------- */
  function drawShareCard() {
    if (!lastResult) return;
    var c = document.createElement('canvas');
    c.width = 1080; c.height = 1080;
    var x = c.getContext('2d');
    var FONT = '"Noto Sans KR",sans-serif';

    x.fillStyle = '#FAF7F0'; x.fillRect(0, 0, 1080, 1080);
    x.strokeStyle = '#E8E0D0'; x.lineWidth = 6; x.strokeRect(30, 30, 1020, 1020);

    x.fillStyle = '#3D3529'; x.textAlign = 'center';
    x.font = '700 58px ' + FONT;
    x.fillText('💰 배당 월급 계산 결과', 540, 150);

    x.font = '400 34px ' + FONT; x.fillStyle = '#8A7F6C';
    x.fillText('월 ' + comma(lastResult.targetMan) + '만원 실수령 · 배당수익률 연 ' + lastResult.yieldRate + '% 가정', 540, 215);

    var names = ['💼 일반 위탁계좌', '🏦 ISA 일반형', '🏦 ISA 서민형'];
    lastResult.rows.forEach(function (row, i) {
      var top = 280 + i * 210;
      x.fillStyle = '#FFFDF7'; x.strokeStyle = (i === 2) ? '#8B6F47' : '#E8E0D0'; x.lineWidth = (i === 2) ? 5 : 3;
      roundRect(x, 90, top, 900, 180, 18); x.fill(); x.stroke();
      x.textAlign = 'left'; x.fillStyle = '#3D3529';
      x.font = '700 36px ' + FONT;
      x.fillText(names[i] + (i === 2 ? '  ⭐' : ''), 130, top + 62);
      x.font = '700 52px ' + FONT; x.fillStyle = '#8B6F47';
      x.fillText(fmtWon(row.principal), 130, top + 135);
      x.font = '400 28px ' + FONT; x.fillStyle = '#8A7F6C'; x.textAlign = 'right';
      x.fillText('연간 세금 ' + fmtWon(row.tax), 950, top + 135);
      x.textAlign = 'center';
    });

    x.font = '400 26px ' + FONT; x.fillStyle = '#8A7F6C';
    x.fillText('수익률 유지 가정의 단순 계산 · 투자 참고용, 매수/매도 추천 아님', 540, 975);
    x.font = '700 30px ' + FONT; x.fillStyle = '#8B6F47';
    x.fillText('stockchild.com', 540, 1025);

    var a = document.createElement('a');
    a.href = c.toDataURL('image/png');
    a.download = 'dividend_salary_' + lastResult.targetMan + 'man.png';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  }
  function roundRect(x, px, py, w, h, r) {
    x.beginPath();
    x.moveTo(px + r, py);
    x.arcTo(px + w, py, px + w, py + h, r);
    x.arcTo(px + w, py + h, px, py + h, r);
    x.arcTo(px, py + h, px, py, r);
    x.arcTo(px, py, px + w, py, r);
    x.closePath();
  }

  /* ---------------- 이벤트 ---------------- */
  document.getElementById('dsc-calc').addEventListener('click', render);
  document.getElementById('dsc-share').addEventListener('click', drawShareCard);
  ['dsc-target', 'dsc-yield'].forEach(function (id) {
    document.getElementById(id).addEventListener('keydown', function (e) {
      if (e.key === 'Enter') render();
    });
  });
})();
