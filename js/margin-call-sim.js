/* =====================================================================
   stockchild.com No.88 미수·반대매매 시뮬레이터 (margin-call-sim.js)
   순수 클라이언트 계산기: 외부 API, CDN JSON 호출 없음. 오프라인 동작.
   워드프레스 삽입: <div id="sc-mcs-root"></div> 아래에 이 스크립트 로드.
   ===================================================================== */
(function () {
  'use strict';

  /* -------------------------------------------------------------------
     [수정 지점] 기본값 상수: 통상 기준이며 증권사/종목별로 다릅니다.
     기본값 자체는 사용자가 화면에서 직접 바꿀 수 있게 입력값으로 노출.
     ------------------------------------------------------------------- */
  var DEFAULTS = {
    MAINT_RATIO: 140,   // 담보유지비율 기본값 (%) : 통상 140, 증권사별 상이
    MARGIN_RATE: 40     // 미수 증거금률 기본값 (%) : 종목별 20~100 상이
  };
  var BASIS_NOTE = '기준: 담보유지비율/증거금률은 증권사·종목별로 다르며 통상 수치를 기본값으로 제공';

  var root = document.getElementById('sc-mcs-root');
  if (!root) return;

  /* ---------------- 스타일 ---------------- */
  var css = ''
    + '#sc-mcs-root{--nct-bg:#FAF7F0;--nct-card:#FFFDF7;--nct-line:#E8E0D0;--nct-ink:#3D3529;--nct-sub:#8A7F6C;--nct-accent:#8B6F47;'
    + 'font-family:"Noto Sans KR",sans-serif;background:var(--nct-bg);border:1px solid var(--nct-line);border-radius:14px;'
    + 'padding:22px;max-width:680px;margin:0 auto;color:var(--nct-ink);box-sizing:border-box}'
    + '#sc-mcs-root *{box-sizing:border-box}'
    + '.mcs-title{font-size:20px;font-weight:700;text-align:center;margin-bottom:4px}'
    + '.mcs-sub{font-size:13px;color:var(--nct-sub);text-align:center;margin-bottom:16px}'
    + '.mcs-tabs{display:flex;gap:8px;margin-bottom:14px}'
    + '.mcs-tab{flex:1;padding:11px 6px;font-size:14px;font-weight:700;text-align:center;border:1px solid var(--nct-line);'
    + 'border-radius:10px;background:var(--nct-card);color:var(--nct-sub);cursor:pointer;font-family:inherit}'
    + '.mcs-tab.on{background:var(--nct-accent);border-color:var(--nct-accent);color:#fff}'
    + '.mcs-inputs{background:var(--nct-card);border:1px solid var(--nct-line);border-radius:12px;padding:18px;margin-bottom:14px}'
    + '.mcs-field{margin-bottom:14px}'
    + '.mcs-label{font-size:13px;font-weight:700;display:block;margin-bottom:6px}'
    + '.mcs-label .hint{font-weight:400;color:var(--nct-sub);font-size:12px}'
    + '.mcs-inwrap{display:flex;align-items:center;gap:8px}'
    + '.mcs-input{flex:1;font-size:16px;font-family:"JetBrains Mono",monospace;padding:10px 12px;'
    + 'border:1px solid var(--nct-line);border-radius:8px;background:#fff;color:var(--nct-ink);width:100%}'
    + '.mcs-input:focus{outline:none;border-color:var(--nct-accent)}'
    + '.mcs-unit{font-size:14px;color:var(--nct-sub);white-space:nowrap}'
    + '.mcs-btn{width:100%;padding:13px;font-size:16px;font-weight:700;border:none;border-radius:8px;'
    + 'background:var(--nct-accent);color:#fff;cursor:pointer;font-family:inherit}'
    + '.mcs-btn:active{opacity:.85}'
    + '.mcs-btn2{width:100%;padding:11px;font-size:14px;font-weight:700;border:1px solid var(--nct-accent);'
    + 'border-radius:8px;background:var(--nct-card);color:var(--nct-accent);cursor:pointer;font-family:inherit;margin-top:10px}'
    + '.mcs-err{font-size:13px;color:#B33A3A;margin-top:8px;display:none;text-align:center}'
    + '.mcs-results{display:none}'
    + '.mcs-card{background:var(--nct-card);border:1px solid var(--nct-line);border-radius:12px;padding:16px;margin-bottom:10px}'
    + '.mcs-acct{font-size:14px;font-weight:700;margin-bottom:2px}'
    + '.mcs-big{font-size:26px;font-weight:700;font-family:"JetBrains Mono","Noto Sans KR",monospace;margin:6px 0 2px;color:#B33A3A}'
    + '.mcs-bigsub{font-size:13px;color:var(--nct-sub);margin-bottom:8px}'
    + '.mcs-row{display:flex;justify-content:space-between;font-size:13px;color:var(--nct-sub);padding:3px 0}'
    + '.mcs-row b{color:var(--nct-ink);font-family:"JetBrains Mono",monospace;font-weight:500}'
    + '.mcs-warn{font-size:12px;border-radius:8px;padding:8px 10px;margin-top:8px;line-height:1.5}'
    + '.mcs-warn.orange{background:#FBF0E0;border:1px solid #E8C99A;color:#8A5A1E}'
    + '.mcs-warn.red{background:#F9E9E7;border:1px solid #E5B5AE;color:#8A2F26}'
    + '.mcs-grade{display:inline-block;font-size:14px;font-weight:700;border-radius:20px;padding:6px 14px;margin:2px 0 10px}'
    + '.mcs-grade.g1{background:#E7F0E9;color:#3A7D44}'
    + '.mcs-grade.g2{background:#FBF0E0;color:#8A5A1E}'
    + '.mcs-grade.g3{background:#F6E7DC;color:#9A5A2A}'
    + '.mcs-grade.g4{background:#F9E9E7;color:#8A2F26}'
    + '.mcs-disc{font-size:12px;color:var(--nct-sub);background:var(--nct-card);border:1px solid var(--nct-line);'
    + 'border-radius:10px;padding:12px;line-height:1.6;margin-top:14px}'
    + '.mcs-footer{font-size:11px;color:var(--nct-sub);text-align:center;margin-top:12px;line-height:1.6}'
    + '@media(max-width:480px){#sc-mcs-root{padding:14px}.mcs-title{font-size:18px}.mcs-big{font-size:22px}}';
  var styleTag = document.createElement('style');
  styleTag.textContent = css;
  document.head.appendChild(styleTag);

  /* ---------------- 마크업 (h1/h2/h3 미사용) ---------------- */
  root.innerHTML = ''
    + '<div class="mcs-title">⚠️ 미수·반대매매 시뮬레이터</div>'
    + '<div class="mcs-sub">몇 % 하락하면 반대매매 구간에 들어가는지 미리 계산해보세요</div>'
    + '<div class="mcs-tabs">'
    + '  <button class="mcs-tab on" id="mcs-tab-credit" type="button">🏦 신용융자</button>'
    + '  <button class="mcs-tab" id="mcs-tab-misu" type="button">⏰ 미수거래</button>'
    + '</div>'
    /* 신용융자 입력 */
    + '<div class="mcs-inputs" id="mcs-in-credit">'
    + '  <div class="mcs-field">'
    + '    <span class="mcs-label">내 투자원금 <span class="hint">(자기자금)</span></span>'
    + '    <div class="mcs-inwrap"><input class="mcs-input" id="mcs-c-cash" type="text" inputmode="numeric" value="1000"><span class="mcs-unit">만원</span></div>'
    + '  </div>'
    + '  <div class="mcs-field">'
    + '    <span class="mcs-label">신용융자금 <span class="hint">(증권사에서 빌린 금액)</span></span>'
    + '    <div class="mcs-inwrap"><input class="mcs-input" id="mcs-c-loan" type="text" inputmode="numeric" value="1000"><span class="mcs-unit">만원</span></div>'
    + '  </div>'
    + '  <div class="mcs-field">'
    + '    <span class="mcs-label">담보유지비율 <span class="hint">(통상 140%, 증권사·종목별 상이)</span></span>'
    + '    <div class="mcs-inwrap"><input class="mcs-input" id="mcs-c-ratio" type="text" inputmode="numeric" value="' + DEFAULTS.MAINT_RATIO + '"><span class="mcs-unit">%</span></div>'
    + '  </div>'
    + '  <button class="mcs-btn" id="mcs-calc-credit" type="button">계산하기</button>'
    + '  <div class="mcs-err" id="mcs-err-credit"></div>'
    + '</div>'
    /* 미수 입력 */
    + '<div class="mcs-inputs" id="mcs-in-misu" style="display:none">'
    + '  <div class="mcs-field">'
    + '    <span class="mcs-label">내 증거금 <span class="hint">(실제로 넣는 내 돈)</span></span>'
    + '    <div class="mcs-inwrap"><input class="mcs-input" id="mcs-m-cash" type="text" inputmode="numeric" value="1000"><span class="mcs-unit">만원</span></div>'
    + '  </div>'
    + '  <div class="mcs-field">'
    + '    <span class="mcs-label">종목 증거금률 <span class="hint">(종목별 20~100%, HTS/MTS에서 확인)</span></span>'
    + '    <div class="mcs-inwrap"><input class="mcs-input" id="mcs-m-rate" type="text" inputmode="numeric" value="' + DEFAULTS.MARGIN_RATE + '"><span class="mcs-unit">%</span></div>'
    + '  </div>'
    + '  <button class="mcs-btn" id="mcs-calc-misu" type="button">계산하기</button>'
    + '  <div class="mcs-err" id="mcs-err-misu"></div>'
    + '</div>'
    + '<div class="mcs-results" id="mcs-results">'
    + '  <div id="mcs-card"></div>'
    + '  <button class="mcs-btn2" id="mcs-share" type="button">📸 결과 이미지 저장하기</button>'
    + '</div>'
    + '<div class="mcs-disc">⚖️ 미수와 신용융자 자체가 나쁜 제도는 아니지만, 반대매매 구조를 모르고 쓰면 원금 이상의 손실이 날 수 있습니다. '
    + '이 계산기는 매수한 주식만 담보로 잡히고 이자·수수료·세금은 없다고 가정한 단순 계산입니다. '
    + '실제 담보유지비율, 증거금률, 반대매매 처리 일정과 방식은 이용 중인 증권사 기준을 반드시 확인하세요. '
    + '본 결과는 투자 참고용이며 매수/매도 추천이 아닙니다.</div>'
    + '<div class="mcs-footer">' + BASIS_NOTE + '<br>출처: stockchild.com</div>';

  /* ---------------- 유틸 ---------------- */
  function num(id) {
    var v = String(document.getElementById(id).value || '').replace(/,/g, '').trim();
    var n = parseFloat(v);
    return isFinite(n) ? n : NaN;
  }
  function comma(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
  function fmtMan(man) { // 만원 단위 숫자를 "1억 2,000만원" 형태로
    man = Math.round(man);
    var eok = Math.floor(man / 10000);
    var rest = man % 10000;
    if (eok > 0 && rest > 0) return comma(eok) + '억 ' + comma(rest) + '만원';
    if (eok > 0) return comma(eok) + '억원';
    return comma(man) + '만원';
  }
  function pct(x) { return (Math.round(x * 10) / 10).toFixed(1); }

  /* 레버리지 배율 기준 유머 등급. 조롱이 아니라 공감 톤, 위험할수록 주의 환기 포함 */
  function grade(lev, tab) {
    var CREDIT = [
      { max: 1.5,  cls: 'g1', text: '🚗 안전 운전 중' },
      { max: 2.01, cls: 'g2', text: '🛵 적당히 밟는 중' },
      { max: 3,    cls: 'g3', text: '🏎️ 과속 구간, 안전벨트 필수' },
      { max: 1e9,  cls: 'g4', text: '🙏 기도 매매, 우리 같이 존버해요' }
    ];
    var MISU = [
      { max: 1.5,  cls: 'g1', text: '🚗 가벼운 외출' },
      { max: 2.01, cls: 'g2', text: '🛵 살짝 무리 구간' },
      { max: 3,    cls: 'g3', text: '🏎️ 심장 쫄깃 구간' },
      { max: 1e9,  cls: 'g4', text: '🚀 풀악셀, 손 떨리는 중' }
    ];
    var table = (tab === 'misu') ? MISU : CREDIT;
    for (var i = 0; i < table.length; i++) { if (lev < table[i].max) return table[i]; }
    return table[table.length - 1];
  }

  var activeTab = 'credit';
  var lastResult = null;

  /* ---------------- 탭 전환 ---------------- */
  function switchTab(tab) {
    activeTab = tab;
    document.getElementById('mcs-tab-credit').className = 'mcs-tab' + (tab === 'credit' ? ' on' : '');
    document.getElementById('mcs-tab-misu').className = 'mcs-tab' + (tab === 'misu' ? ' on' : '');
    document.getElementById('mcs-in-credit').style.display = (tab === 'credit') ? 'block' : 'none';
    document.getElementById('mcs-in-misu').style.display = (tab === 'misu') ? 'block' : 'none';
    document.getElementById('mcs-results').style.display = 'none';
    lastResult = null;
  }
  document.getElementById('mcs-tab-credit').addEventListener('click', function () { switchTab('credit'); });
  document.getElementById('mcs-tab-misu').addEventListener('click', function () { switchTab('misu'); });

  /* ---------------- 신용융자 계산 ----------------
     총매수 T = C + L, 주가가 x비율 하락 시 담보평가 = T(1-x)
     담보부족 진입: T(1-x) < (ratio/100) x L  →  x* = 1 - (ratio/100)L/T   */
  function calcCredit() {
    var errEl = document.getElementById('mcs-err-credit');
    errEl.style.display = 'none';
    var C = num('mcs-c-cash'), L = num('mcs-c-loan'), ratio = num('mcs-c-ratio');
    if (!(C > 0)) return err(errEl, '내 투자원금을 숫자로 입력해주세요.');
    if (!(L > 0)) return err(errEl, '신용융자금을 숫자로 입력해주세요. 융자가 없다면 반대매매 걱정도 없어요.');
    if (!(ratio >= 100) || ratio > 200) return err(errEl, '담보유지비율은 100~200 사이로 입력해주세요.');

    var T = C + L;
    var line = 1 - (ratio / 100) * L / T; // 담보부족 진입 하락률
    var lev = T / C;
    var lossAtLine = T * line;            // 경고선 도달 시 평가손실 (만원)

    var html = '<div class="mcs-card">'
      + '<div class="mcs-acct">🏦 신용융자 반대매매 경고선</div>';
    if (line <= 0) {
      html += '<div class="mcs-big">진입 즉시 담보부족</div>'
        + '<div class="mcs-bigsub">이 비중이면 매수하는 순간부터 담보유지비율(' + ratio + '%)에 미달합니다</div>'
        + '<div class="mcs-warn red">🚨 융자 비중이 너무 높습니다. 통상 이런 주문은 애초에 체결이 제한되지만, 계산상으로는 하락 여유가 전혀 없는 구조입니다.</div>';
    } else {
      var gC = grade(lev, 'credit');
      html += '<div class="mcs-big">-' + pct(line * 100) + '%</div>'
        + '<div class="mcs-bigsub">매수가 대비 이만큼 하락하면 담보부족(반대매매 위험 구간) 진입</div>'
        + '<div class="mcs-grade ' + gC.cls + '">' + gC.text + '</div>'
        + '<div class="mcs-row"><span>총 매수금액</span><b>' + fmtMan(T) + '</b></div>'
        + '<div class="mcs-row"><span>레버리지</span><b>' + pct(lev) + '배</b></div>'
        + '<div class="mcs-row"><span>경고선 도달 시 평가손실</span><b>' + fmtMan(lossAtLine) + ' (원금의 ' + pct(lossAtLine / C * 100) + '%)</b></div>'
        + '<div class="mcs-warn orange">⚠️ 담보부족 후 추가담보를 기한 내 납부하지 못하면 통상 발생일 +2영업일 장 시작 동시호가에 반대매매됩니다. '
        + '처분 수량은 전일 종가 대비 15~20% 하락한 가격(하한가 등) 기준으로 산정되어, 부족금액보다 훨씬 많은 수량이 팔릴 수 있습니다.</div>';
    }
    html += '</div>';
    showResult(html);
    lastResult = { tab: 'credit', C: C, L: L, ratio: ratio, line: line, lev: lev };
  }

  /* ---------------- 미수 계산 ----------------
     최대매수 T = C / (m/100), 미수금 = T - C, 레버리지 = 100/m배
     원금 전액 손실 하락률 = m% (이자/수수료 제외 단순 계산)          */
  function calcMisu() {
    var errEl = document.getElementById('mcs-err-misu');
    errEl.style.display = 'none';
    var C = num('mcs-m-cash'), m = num('mcs-m-rate');
    if (!(C > 0)) return err(errEl, '내 증거금을 숫자로 입력해주세요.');
    if (!(m >= 20) || m > 100) return err(errEl, '증거금률은 20~100 사이로 입력해주세요.');

    var T = C / (m / 100);
    var misu = T - C;
    var lev = 100 / m;

    var html = '<div class="mcs-card">'
      + '<div class="mcs-acct">⏰ 미수거래 위험 계산</div>';
    if (m >= 100) {
      html += '<div class="mcs-big">미수 불가 종목</div>'
        + '<div class="mcs-bigsub">증거금률 100% 종목은 전액 현금 매수만 가능해 미수가 발생하지 않아요</div>';
    } else {
      var gM = grade(lev, 'misu');
      html += '<div class="mcs-big">-' + pct(m) + '%</div>'
        + '<div class="mcs-bigsub">주가가 이만큼 하락하면 내 증거금 전액 손실 (레버리지 ' + pct(lev) + '배 기준)</div>'
        + '<div class="mcs-grade ' + gM.cls + '">' + gM.text + '</div>'
        + '<div class="mcs-row"><span>최대 매수 가능액</span><b>' + fmtMan(T) + '</b></div>'
        + '<div class="mcs-row"><span>발생 미수금</span><b>' + fmtMan(misu) + '</b></div>'
        + '<div class="mcs-row"><span>레버리지</span><b>' + pct(lev) + '배</b></div>'
        + '<div class="mcs-warn red">🚨 미수금은 결제일(매수 후 2영업일)까지 납부해야 하며, 미납 시 다음 영업일 장 시작 동시호가에 반대매매됩니다. '
        + '신용융자와 달리 주가가 올라도 기한을 넘기면 반대매매를 피할 수 없습니다.</div>'
        + '<div class="mcs-warn orange">⚠️ 미수 발생 계좌는 통상 30일간 증거금 100% 계좌(미수동결계좌)로 지정되어 미수거래가 제한됩니다. '
        + '반대매매 수량 산정도 전일 종가 대비 하락가 기준이라 필요분보다 많이 처분될 수 있어요.</div>';
    }
    html += '</div>';
    showResult(html);
    lastResult = { tab: 'misu', C: C, m: m, T: T, misu: misu, lev: lev };
  }

  function err(el, msg) {
    el.textContent = msg; el.style.display = 'block';
    document.getElementById('mcs-results').style.display = 'none';
  }
  function showResult(html) {
    document.getElementById('mcs-card').innerHTML = html;
    document.getElementById('mcs-results').style.display = 'block';
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
    x.textAlign = 'center';

    x.fillStyle = '#3D3529'; x.font = '700 56px ' + FONT;
    x.fillText('⚠️ 반대매매 시뮬레이션', 540, 150);

    if (lastResult.tab === 'credit') {
      x.font = '400 34px ' + FONT; x.fillStyle = '#8A7F6C';
      x.fillText('내 돈 ' + fmtMan(lastResult.C) + ' + 신용융자 ' + fmtMan(lastResult.L) + ' · 담보유지비율 ' + lastResult.ratio + '%', 540, 220);
      x.fillStyle = '#B33A3A'; x.font = '700 150px ' + FONT;
      x.fillText(lastResult.line <= 0 ? '즉시 위험' : '-' + pct(lastResult.line * 100) + '%', 540, 480);
      x.fillStyle = '#3D3529'; x.font = '700 40px ' + FONT;
      x.fillText('하락하면 반대매매 위험 구간', 540, 570);
      x.font = '400 32px ' + FONT; x.fillStyle = '#8A7F6C';
      x.fillText('레버리지 ' + pct(lastResult.lev) + '배 · 총 매수 ' + fmtMan(lastResult.C + lastResult.L), 540, 640);
      x.fillText('추가담보 미납 시 다음 영업일 아침 동시호가 처분', 540, 700);
      if (lastResult.line > 0) {
        var gcC = grade(lastResult.lev, 'credit');
        x.font = '700 44px ' + FONT; x.fillStyle = '#3D3529';
        x.fillText(gcC.text, 540, 810);
      }
    } else {
      x.font = '400 34px ' + FONT; x.fillStyle = '#8A7F6C';
      x.fillText('증거금 ' + fmtMan(lastResult.C) + ' · 증거금률 ' + lastResult.m + '% · 미수 ' + fmtMan(lastResult.misu), 540, 220);
      x.fillStyle = '#B33A3A'; x.font = '700 150px ' + FONT;
      x.fillText('-' + pct(lastResult.m) + '%', 540, 480);
      x.fillStyle = '#3D3529'; x.font = '700 40px ' + FONT;
      x.fillText('하락하면 내 증거금 전액 손실', 540, 570);
      x.font = '400 32px ' + FONT; x.fillStyle = '#8A7F6C';
      x.fillText('레버리지 ' + pct(lastResult.lev) + '배 · 최대 매수 ' + fmtMan(lastResult.T), 540, 640);
      x.fillText('결제일까지 미납 시 다음 영업일 아침 반대매매', 540, 700);
      if (lastResult.m < 100) {
        var gcM = grade(lastResult.lev, 'misu');
        x.font = '700 44px ' + FONT; x.fillStyle = '#3D3529';
        x.fillText(gcM.text, 540, 810);
      }
    }

    x.font = '400 26px ' + FONT; x.fillStyle = '#8A7F6C';
    x.fillText('이자/수수료 제외 단순 계산 · 실제 기준은 증권사별 상이 · 투자 참고용', 540, 965);
    x.font = '700 30px ' + FONT; x.fillStyle = '#8B6F47';
    x.fillText('stockchild.com', 540, 1020);

    var a = document.createElement('a');
    a.href = c.toDataURL('image/png');
    a.download = 'margin_call_sim.png';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  }

  /* ---------------- 이벤트 ---------------- */
  document.getElementById('mcs-calc-credit').addEventListener('click', calcCredit);
  document.getElementById('mcs-calc-misu').addEventListener('click', calcMisu);
  document.getElementById('mcs-share').addEventListener('click', drawShareCard);
  ['mcs-c-cash', 'mcs-c-loan', 'mcs-c-ratio'].forEach(function (id) {
    document.getElementById(id).addEventListener('keydown', function (e) { if (e.key === 'Enter') calcCredit(); });
  });
  ['mcs-m-cash', 'mcs-m-rate'].forEach(function (id) {
    document.getElementById(id).addEventListener('keydown', function (e) { if (e.key === 'Enter') calcMisu(); });
  });
})();
