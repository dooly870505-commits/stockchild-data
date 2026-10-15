/* stockchild.com 공모주 자금 효율 계산기 (sc-tool-ipo-cash) v1.1 (2026-10-14)
   149선 No.101 (4, 36, 104 흡수). id: ipo-cash-efficiency
   필요 파일: market-calendar-core.js (환불일 계산), sc-ui.js
   v1.1: 수수료 기본값 0원, 증권사별 수수료 정리 내부링크, 연환산 열 제거
   규칙: 일반청약 증거금 50%, 환불일은 청약 마감일 + 2영업일(종목 공고 우선).
   배정 주수는 방문자가 직접 입력합니다 (경쟁률 추정은 증권사별 물량 쪼개짐 때문에 오차가 커서 쓰지 않음). */
(function () {
  'use strict';

  var MARGIN = 0.5;            // 일반청약 증거금률
  var REFUND_DAYS = 2;         // 청약 마감 후 환불까지 영업일
  var FEE_URL = 'https://stockchild.com/2026%eb%85%84-%ec%a3%bc%ec%8b%9d-%ec%88%98%ec%88%98%eb%a3%8c-%ec%a0%95%eb%a6%ac-%ec%a6%9d%ea%b6%8c%ec%82%ac%eb%b3%84-hts%c2%b7mts-%ec%88%98%ec%88%98%eb%a3%8c-%ec%99%84%eb%b2%bd-%eb%b9%84%ea%b5%90/';
  var SCEN = [-20, -10, 0, 30, 60, 100, 160]; // 시나리오: 공모가 대비 매도가 변동률(%)

  function n0(v) { return (typeof v === 'number' && isFinite(v)) ? v : 0; }

  // ---------- 순수 계산 함수 (화면과 분리, 자동 테스트 대상) ----------
  // o: { price, qty, equal, prop, fee, rate, sellPct, sellCost, endYmd, applyFirst, listYmd }
  function calc(o, cal) {
    var R = { ok: false, errors: [], warns: [] };
    var P = n0(o.price), Q = Math.floor(n0(o.qty));
    var E = Math.max(0, Math.floor(n0(o.equal))), Pr = Math.max(0, Math.floor(n0(o.prop)));
    var fee = Math.max(0, n0(o.fee)), rate = Math.max(0, n0(o.rate)) / 100;
    var sellPct = n0(o.sellPct), sellCost = Math.min(Math.max(0, n0(o.sellCost)), 50) / 100;

    if (!(P > 0)) R.errors.push('공모가를 입력해 주세요.');
    if (!(Q >= 1)) R.errors.push('청약 주수는 1주 이상 입력해 주세요.');
    if (!cal) { R.errors.push('영업일 엔진(market-calendar-core.js)을 불러오지 못했어요.'); return R; }

    var end = o.endYmd;
    if (!cal.isYmd(end)) R.errors.push('청약 마감일을 선택해 주세요.');
    else if (cal.coverage('kr', end) === 'none') R.errors.push('아직 휴장일 정보가 없는 날짜예요.');
    else if (!cal.isTradingDay('kr', end)) R.errors.push('이날은 ' + (cal.closedReason('kr', end) || '휴장일') + '이라 청약이 마감될 수 없어요.');
    if (R.errors.length) return R;

    var refund = cal.addSettleDays('kr', end, REFUND_DAYS);
    if (!refund) { R.errors.push('환불일을 계산할 수 없어요.'); return R; }
    if (cal.coverage('kr', refund) !== 'firm') R.warns.push('환불일이 휴장일 잠정 구간이에요. 거래소 공식 발표 후 달라질 수 있어요.');

    var start = o.applyFirst ? cal.prevTradingDay('kr', end, false) : end;
    var d1 = cal.diffDays(start, refund);

    var d2 = 0, listYmd = o.listYmd || '';
    if (listYmd) {
      if (!cal.isYmd(listYmd)) { R.warns.push('상장일 형식이 올바르지 않아 보유 기간은 뺐어요.'); }
      else if (listYmd <= refund) { R.warns.push('상장일이 환불일보다 빠르거나 같아요. 날짜를 다시 확인해 주세요. 보유 기간은 뺐어요.'); }
      else {
        d2 = cal.diffDays(refund, listYmd);
        if (!cal.isTradingDay('kr', listYmd)) R.warns.push('상장일이 휴장일이에요. 날짜를 다시 확인해 주세요.');
      }
    }

    var A = E + Pr;
    if (A > Q) { R.warns.push('배정 주수 합(' + A + '주)이 청약 주수(' + Q + '주)보다 커서 청약 주수까지만 반영했어요.'); A = Q; }

    var margin = P * Q * MARGIN;
    var cost = P * A;
    var feeApplied = A > 0 ? fee : 0;
    var extraNeeded = Math.max(0, cost + feeApplied - margin);
    var refundAmt = Math.max(0, margin - cost - feeApplied);
    var opp = (margin * d1 + (A > 0 ? cost * d2 : 0)) * rate / 365;
    
    function scen(g) {
      var sell = A * P * (1 + g / 100);
      var net = sell - sell * sellCost - cost - feeApplied - opp;
      var ret = margin > 0 ? net / margin : NaN;
      return { g: g, sell: sell, net: net, ret: ret };
    }

    var be = A > 0 ? ((cost + feeApplied + opp) / (A * P * (1 - sellCost)) - 1) : NaN;

    var list = SCEN.slice();
    if (list.indexOf(sellPct) < 0) { list.push(sellPct); list.sort(function (a, b) { return a - b; }); }
    var rows = list.map(scen), hl = list.indexOf(sellPct);

    R.ok = true;
    R.P = P; R.Q = Q; R.E = E; R.Pr = Pr; R.A = A;
    R.margin = margin; R.cost = cost; R.feeApplied = feeApplied; R.extraNeeded = extraNeeded; R.refundAmt = refundAmt;
    R.start = start; R.end = end; R.refund = refund; R.listYmd = d2 > 0 ? listYmd : '';
    R.d1 = d1; R.d2 = d2; R.opp = opp; R.breakeven = be;
    R.cur = scen(sellPct); R.rows = rows; R.hl = hl;
    return R;
  }
  window.SCIpoCash = { calc: calc, MARGIN: MARGIN, REFUND_DAYS: REFUND_DAYS };

  // ---------- 화면 ----------
  var CSS = [
    '.sc-input input[type=date]{text-align:left;font-size:16px;min-width:0}',
    '.sc-in-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:12px}',
    '.sc-sub{font-size:12px;font-weight:600;color:var(--sub);margin:16px 0 8px}',
    '.sc-gap{margin-top:12px}',
    '.sc-help a{color:var(--focus);font-weight:600;text-decoration:none}.sc-help a:hover{text-decoration:underline}'
  ].join('');

  function render(wrap, U) {
    var cal = window.SCCal;
    var today = cal ? cal.todayYmd('kr') : '';
    var defEnd = cal && today ? (cal.nextTradingDay('kr', today, true) || today) : '';
    var state = { first: false };

    function dateField(id, label, val, help, optional) {
      return '<div class="sc-field"><label for="' + id + '">' + label + (optional ? '<span class="opt">선택</span>' : '') + '</label>' +
        '<div class="sc-input"><input id="' + id + '" type="date" value="' + U.esc(val) + '"></div>' +
        (help ? '<div class="sc-help">' + help + '</div>' : '') + '</div>';
    }

    wrap.innerHTML =
      '<div class="sc-card">' +
      U.header('공모주 자금 센터', '공모주 자금 효율 계산기', '증거금을 넣고 환불받기까지 돈이 묶이는 기간과 기회비용을 빼고도 남는지 한 화면에서 확인해요.') +
      '<div class="sc-sec"><div class="sc-sec-t">청약 정보</div><div class="sc-in-grid">' +
      U.field('ic-price', '확정 공모가', '원', '20,000') +
      U.field('ic-qty', '청약 주수', '주', '100', '균등만 노리면 최소 청약 단위(통상 10주)') +
      dateField('ic-end', '청약 마감일', defEnd, '환불일은 이 날짜 + 2영업일로 계산해요') +
      dateField('ic-list', '상장 예정일', '', '넣으면 상장일까지 배정 주식 보유 비용도 계산해요', true) +
      '</div>' +
      '<div class="sc-sub">청약한 날</div><div class="sc-chips" id="ic-first">' +
      '<button type="button" class="sc-chip on" data-v="0">마감일에 청약</button>' +
      '<button type="button" class="sc-chip" data-v="1">첫날에 청약</button></div></div>' +
      '<div class="sc-sec"><div class="sc-sec-t">예상 배정 (증권사 배정 공고 기준으로 직접 입력)</div><div class="sc-in-grid">' +
      U.field('ic-equal', '균등 배정 주수', '주', '1', '증권사마다 달라요') +
      U.field('ic-prop', '비례 배정 주수', '주', '0', '경쟁률이 높으면 0주일 수 있어요') +
      '</div></div>' +
      '<div class="sc-sec"><div class="sc-sec-t">비용과 매도 가정</div><div class="sc-in-grid">' +
      U.field('ic-fee', '청약 수수료', '원', '0', '무료인 곳도 있고 등급별로 달라요. 배정받을 때만 낸다고 가정해요. <a href="' + FEE_URL + '" target="_blank" rel="noopener">증권사별 수수료 정리 ↗</a>') +
      U.field('ic-rate', '기회비용 연이율', '%', '3.5', '묶인 돈을 예금이나 CMA에 뒀다면 받았을 금리') +
      U.field('ic-sell', '예상 매도가', '%', '30', '공모가 대비. +30이면 공모가보다 30% 높게 매도') +
      U.field('ic-scost', '매도 수수료·세금', '%', '0.2', '예시값이에요. 증권사와 시장 기준으로 직접 확인해 주세요') +
      '</div>' +
      '<div class="sc-sub">빠른 예시</div><div class="sc-chips" id="ic-ex">' +
      '<button type="button" class="sc-chip" data-ex="a">소액 균등형</button>' +
      '<button type="button" class="sc-chip" data-ex="b">증거금 집중형</button></div></div>' +
      '<div class="sc-sec" id="ic-out"></div>' +
      U.foot('환불일은 청약 마감일 + 2영업일 일반 규칙으로 계산했고, 종목별 공고가 우선이에요.') +
      '</div>';

    var ids = ['ic-price', 'ic-qty', 'ic-equal', 'ic-prop', 'ic-fee', 'ic-rate', 'ic-sell', 'ic-scost'];
    var out = wrap.querySelector('#ic-out');

    function readDate(id) { return wrap.querySelector('#' + id).value || ''; }

    function update() {
      var o = {
        price: U.val(wrap, 'ic-price'), qty: U.val(wrap, 'ic-qty'),
        equal: U.val(wrap, 'ic-equal'), prop: U.val(wrap, 'ic-prop'),
        fee: U.val(wrap, 'ic-fee'), rate: U.val(wrap, 'ic-rate'),
        sellPct: U.val(wrap, 'ic-sell'), sellCost: U.val(wrap, 'ic-scost'),
        endYmd: readDate('ic-end'), listYmd: readDate('ic-list'), applyFirst: state.first
      };
      var r = calc(o, cal);
      if (!r.ok) {
        out.innerHTML = '<div class="sc-note warn">' + r.errors.map(U.esc).join('<br>') + '</div>';
        return;
      }
      var sg = function (n) { return (n > 0 ? '+' : '') + U.won(n); };
      var h = '';
      if (r.warns.length) h += '<div class="sc-note warn sc-gap">' + r.warns.map(U.esc).join('<br>') + '</div>';

      h += '<div class="sc-sec-t sc-gap">핵심 결과</div><div class="sc-kpis">' +
        U.kpi('청약 증거금', U.won(r.margin) + '<small>원</small>', '공모가 × 청약 주수 × 50%') +
        U.kpi('환불일', cal.md(r.refund), '돈이 묶이는 기간 ' + r.d1 + '일') +
        U.kpi('실질 수익률', '<span class="' + U.tone(r.cur.ret) + '">' + U.pct(r.cur.ret, 2, true) + '</span>',
          '순수익 <span class="' + U.tone(r.cur.net) + '">' + sg(r.cur.net) + '원</span> (증거금 대비)', true) +
        '</div>';

      h += '<div class="sc-sec"><div class="sc-sec-t">상세 결과</div><div class="sc-rows">' +
        U.row('예상 배정', r.A + '주 (균등 ' + Math.min(r.E, r.A) + ' + 비례 ' + Math.max(0, r.A - Math.min(r.E, r.A)) + ')') +
        U.row('배정 금액', U.won(r.cost) + '원') +
        U.row('청약 수수료', r.A > 0 ? U.won(r.feeApplied) + '원' : '0원 (배정 없음)') +
        U.row('환불금', U.won(r.refundAmt) + '원') +
        (r.extraNeeded > 0 ? U.row('추가 납입 필요', '<span class="up">' + U.won(r.extraNeeded) + '원</span>') : '') +
        U.row('청약일 → 환불일', cal.md(r.start) + ' → ' + cal.md(r.refund) + ' (' + r.d1 + '일)') +
        (r.d2 > 0 ? U.row('환불일 → 상장일', cal.md(r.refund) + ' → ' + cal.md(r.listYmd) + ' (' + r.d2 + '일)') : '') +
        U.row('기회비용(이자 환산)', U.won(r.opp) + '원') +
        U.row('손익분기 매도가', r.A > 0 ? '공모가 대비 ' + U.pct(r.breakeven, 2, true) : '배정 없음') +
        '</div></div>';

      h += '<div class="sc-sec"><div class="sc-sec-t">매도가별 시나리오 (공모가 대비)</div>' +
        U.table(['매도가', '순수익', '증거금 대비'], r.rows.map(function (s) {
          return [(s.g > 0 ? '+' : '') + s.g + '%',
            '<span class="' + U.tone(s.net) + '">' + sg(s.net) + '원</span>',
            '<span class="' + U.tone(s.ret) + '">' + U.pct(s.ret, 2, true) + '</span>'];
        }), r.hl) + '</div>';

      h += '<div class="sc-sec"><div class="sc-note"><b>어떻게 계산하나요</b><br>' +
        '일반청약은 균등 50%, 비례 50%로 배정하고, 증거금은 청약 금액의 50%예요. 순수익은 매도금액에서 배정 금액, 청약 수수료, 매도 비용, 기회비용을 뺀 값이고, 증거금 대비 수익률은 그 순수익을 증거금으로 나눈 값이에요.</div></div>' +
        '<div class="sc-sec"><div class="sc-note"><b>배정 주수는 직접 입력해요</b><br>' +
        '경쟁률만으로 내 배정 주수를 추정하면 증권사별 인수 물량이 달라 오차가 커요. 청약 전에는 증권사별 예상 균등 주수를, 청약 후에는 배정 결과 공고의 주수를 넣어 주세요. ' +
        '매도가는 상장 후 실제 체결가 기준으로 바뀌므로 시나리오 표로 범위를 보세요.</div></div>';
      out.innerHTML = h;
    }

    U.bindInputs(wrap, ids, update);
    ['ic-end', 'ic-list'].forEach(function (id) {
      var el = wrap.querySelector('#' + id);
      el.addEventListener('input', update); el.addEventListener('change', update);
    });
    wrap.querySelector('#ic-first').addEventListener('click', function (e) {
      var b = e.target.closest ? e.target.closest('.sc-chip') : null;
      if (!b) return;
      state.first = b.getAttribute('data-v') === '1';
      var chips = wrap.querySelectorAll('#ic-first .sc-chip');
      for (var i = 0; i < chips.length; i++) chips[i].className = 'sc-chip' + (chips[i] === b ? ' on' : '');
      update();
    });
    wrap.querySelector('#ic-ex').addEventListener('click', function (e) {
      var b = e.target.closest ? e.target.closest('.sc-chip') : null;
      if (!b) return;
      var ex = b.getAttribute('data-ex');
      var v = ex === 'a' ? { p: 20000, q: 10, e: 1, r: 0, s: 30 } : { p: 20000, q: 1000, e: 2, r: 20, s: 30 };
      U.set(wrap, 'ic-price', v.p); U.set(wrap, 'ic-qty', v.q); U.set(wrap, 'ic-equal', v.e);
      U.set(wrap, 'ic-prop', v.r); U.set(wrap, 'ic-sell', v.s);
      update();
    });
    update();
  }

  if (window.SCTools) window.SCTools.register({ id: 'ipo-cash-efficiency', css: CSS, render: render });
})();
