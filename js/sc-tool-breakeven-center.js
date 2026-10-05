/* stockchild.com 주식 본전 센터 (sc-tool-breakeven-center) v1.0 (2026-10-05)
   149선 No.17 물타기 평단, 18 목표 평단 역산, 19 본전 매도가, 23 손실 회복, 24 등락률, 105 원금 회수 매도, 106 손절 후 재진입 비교
   기존 "물타기 계산기 평단가 낮추기" 페이지의 두 모드(목표 평단으로 계산, 추가 매수로 계산)와 침수 게이지, 결과 복사를 그대로 이어받음
   시작 탭 지정: <div data-sc-tool="breakeven-center" data-tab="breakeven"> (target, add, breakeven, recovery, change, freeshares, reentry)
   기준: 2026년 국내 주식 매도 시 증권거래세 합계 0.20%, 국내 ETF는 거래세 없음, 호가단위는 코스피·코스닥 공통 */
(function () {
  'use strict';
  if (!window.SCTools) return;

  var TABS = [
    { id: 'target', label: '목표 평단으로 계산', title: '💧 물타기 계산기', desc: '평단을 얼마까지 내리려면 몇 주 더 사야 하는지 계산해 드려요.' },
    { id: 'add', label: '추가 매수로 계산', title: '💧 물타기 계산기', desc: '몇 주를 더 사면 평단이 얼마가 되는지 바로 보여드려요.' },
    { id: 'breakeven', label: '본전 매도가', title: '본전 매도가 계산기', desc: '수수료와 세금까지 넣으면 얼마에 팔아야 진짜 본전인지 계산해요.' },
    { id: 'recovery', label: '손실 회복', title: '손실 회복 계산기', desc: '지금 손실을 메우려면 몇 % 올라야 하는지, 얼마나 걸릴지 보여드려요.' },
    { id: 'change', label: '등락률', title: '주식 등락률 계산기', desc: '두 가격 사이가 몇 %인지, 몇 % 오르면 얼마인지 계산해요.' },
    { id: 'freeshares', label: '원금 회수 매도', title: '원금 회수 매도 계산기', desc: '몇 주를 팔면 원금을 다 빼고 나머지를 공짜 주식으로 남길 수 있는지 계산해요.' },
    { id: 'reentry', label: '손절 후 재진입', title: '손절 후 재진입 비교', desc: '지금 팔고 더 싸게 다시 사면 주식이 몇 주 늘어나는지 비교해요.' }
  ];

  var CSS = [
    '.tabs{margin-top:18px}',
    '.tabs .sc-chip{padding:8px 13px}',
    '.ex{margin-top:12px}.ex .lb{font-size:12px;color:var(--muted);margin-bottom:6px}',
    '.ex .sc-chip{font-size:12px;padding:6px 11px;font-weight:500}',
    '.flood{background:var(--soft);border-radius:var(--r-md);padding:16px 18px;margin-top:10px}',
    '.flood .h{font-size:12px;font-weight:600;color:var(--sub)}',
    '.flood .bar{height:12px;border-radius:999px;background:#E3E6EA;overflow:hidden;margin:10px 0}',
    '.flood .fill{height:100%;border-radius:999px;background:var(--down);transition:width .3s}',
    '.flood .lv{font-size:17px;font-weight:700}.flood .ds{font-size:13px;color:var(--sub);margin-top:2px}',
    '.copy{margin-top:14px;width:100%}',
    '.copy.done{background:var(--ok);border-color:var(--ok)}',
    '.sub2{margin-top:12px}'
  ].join('');

  // ---------- 계산 규칙 ----------
  function tickOf(p, kind) {
    if (kind === 'etf') return p < 2000 ? 1 : 5;
    if (p < 2000) return 1; if (p < 5000) return 5; if (p < 20000) return 10; if (p < 50000) return 50;
    if (p < 200000) return 100; if (p < 500000) return 500; return 1000;
  }
  function ceilTick(p, kind) {
    if (kind === 'custom') return Math.ceil(p * 100 - 1e-6) / 100;
    var t = tickOf(p, kind); return Math.ceil(p / t - 1e-9) * t;
  }
  function roundTick(p, kind) {
    if (kind === 'custom') return Math.round(p * 100) / 100;
    var t = tickOf(p, kind); return Math.round(p / t) * t;
  }
  function flood(ratio) {
    if (ratio < 0.3) return { e: '🦶', l: '발목까지', d: '가볍게 담갔네요. 이 정도는 산책 수준이에요.', p: 20 };
    if (ratio < 0.7) return { e: '🦵', l: '무릎까지', d: '슬슬 차오릅니다. 아직 걸을 만해요.', p: 40 };
    if (ratio < 1.5) return { e: '🌊', l: '허리까지', d: '허리까지 왔어요. 발이 땅에 닿는지 확인할 때.', p: 60 };
    if (ratio < 3) return { e: '😰', l: '가슴까지', d: '숨이 가빠지는 구간. 물의 온도를 다시 봐야 해요.', p: 82 };
    return { e: '🤿', l: '머리끝까지', d: '잠수 장비가 필요합니다. 종목부터 다시 보세요.', p: 100 };
  }
  // 물타기 목표 평단까지 필요한 수량
  function needQty(qty, avg, now, target) { return Math.ceil(qty * (avg - target) / (target - now) - 1e-9); }
  // 수수료·세금 포함 본전 매도가 (매수 수수료도 원금에 포함)
  function breakeven(avg, f, t) { return avg * (1 + f) / (1 - f - t); }
  function recoveryNeed(loss) { return 1 / (1 + loss) - 1; }

  var MODEL = { tickOf: tickOf, ceilTick: ceilTick, roundTick: roundTick, flood: flood, needQty: needQty, breakeven: breakeven, recoveryNeed: recoveryNeed };

  SCTools.register({
    id: 'breakeven-center',
    css: CSS,
    model: MODEL,
    render: function (wrap, U) {
      var host = wrap.getRootNode && wrap.getRootNode().host;
      var start = host && host.getAttribute('data-tab');
      var S = {
        tab: TABS.some(function (t) { return t.id === start; }) ? start : 'target',
        qty: 100, avg: 20000, now: 15000, target: 18000, add: 50,
        fee: 0.015, tax: 0.2, kind: 'stock',
        loss: -40, growth: 8, cmode: 'two', from: 15000, to: 20000, base: 15000, pct: 10,
        fqty: 100, favg: 20000, fnow: 40000, rqty: 100, rnow: 15000, re: 13500
      };
      var copyText = '';

      function P(n) { // 가격 표시: 1,000 미만은 소수 둘째 자리까지
        if (!isFinite(n)) return '-';
        return n.toLocaleString('ko-KR', { maximumFractionDigits: Math.abs(n) < 1000 ? 2 : 0 });
      }
      function W(n) { return U.won(n) + '원'; }
      function sh(n) { return U.int(n) + '주'; }
      function note(msg, warn) { return '<div class="sc-note' + (warn ? ' warn' : '') + '">' + msg + '</div>'; }
      function v(id) { var el = wrap.querySelector('#' + id); return el ? U.num(el.value) : NaN; }
      function exChips(list) {
        return '<div class="ex"><div class="lb">빠른 예시</div><div class="sc-chips">' + list.map(function (e, i) {
          return '<button class="sc-chip" data-ex="' + i + '">' + e.l + '</button>';
        }).join('') + '</div></div>';
      }
      function floodHtml(fl) {
        return '<div class="flood"><div class="h">💧 침수 경보 (추가 투입금이 기존 투입금 대비 얼마나 큰가)</div>' +
          '<div class="bar"><div class="fill" style="width:' + fl.p + '%"></div></div>' +
          '<div class="lv">' + fl.e + ' ' + fl.l + '</div><div class="ds">' + fl.d + '</div></div>';
      }
      function costFields() {
        return '<div class="sc-grid sub2">' + U.field('fee', '매매 수수료', '%', String(S.fee), '증권사마다 달라요. 기본값 0.015%') +
          U.field('tax', '매도 세금 (거래세)', '%', String(S.tax), '국내 주식 0.20% (2026년), 국내 ETF 0%') + '</div>' +
          '<div class="sc-chips sub2" id="kinds"><button class="sc-chip' + (S.kind === 'stock' ? ' on' : '') + '" data-k="stock">국내 주식 0.20%</button>' +
          '<button class="sc-chip' + (S.kind === 'etf' ? ' on' : '') + '" data-k="etf">국내 ETF 0%</button>' +
          '<button class="sc-chip' + (S.kind === 'custom' ? ' on' : '') + '" data-k="custom">직접 입력 (해외주식 등)</button></div>';
      }

      // ---------- 탭별 정의: fields(입력 화면), ex(빠른 예시), read(입력값 읽기), calc(결과) ----------
      var D = {
        target: {
          ids: ['qty', 'avg', 'now', 'target'],
          fields: function () {
            return '<div class="sc-grid">' + U.field('qty', '보유 수량', '주', U.int(S.qty)) + U.field('avg', '현재 평균 단가', '원', P(S.avg)) +
              U.field('now', '현재가 (추가 매수 가격)', '원', P(S.now)) + U.field('target', '목표 평단가', '원', P(S.target)) + '</div>';
          },
          ex: [{ l: '평단 2만원 100주 → 1만8천원', s: { qty: 100, avg: 20000, now: 15000, target: 18000 } },
               { l: '반토막 종목 평단 8만원 → 6만원', s: { qty: 50, avg: 80000, now: 40000, target: 60000 } }],
          calc: function () {
            var q = S.qty, a = S.avg, n = S.now, t = S.target;
            if (!(q > 0 && a > 0 && n > 0 && t > 0)) return note('<b>보유 수량, 평균 단가, 현재가, 목표 평단가</b>를 모두 입력해 주세요.', true);
            if (n >= a) return note('🔥 <b>지금은 현재가가 평단보다 높거나 같아요.</b> 여기서 더 사면 평단이 오히려 올라갑니다. 물타기가 아니라 불타기 구간이에요. "추가 매수로 계산" 탭에서 불타기 후 평단을 볼 수 있어요.', true);
            if (t >= a) return note('😎 <b>목표 평단이 지금 평단보다 높거나 같아요.</b> 이미 목표보다 아래인데요? 물 안 타셔도 됩니다.', true);
            if (t <= n) return note('🚧 <b>목표 평단을 현재가(' + W(n) + ')보다 높게 잡아 주세요.</b> 현재가에 사는 물타기로는 평단을 그 아래로 내릴 수 없어요.', true);
            var need = needQty(q, a, n, t), addM = need * n, tq = q + need, ti = q * a + addM, na = ti / tq, fl = flood(addM / (q * a));
            copyText = '💧 물타기 계산 결과\n평단 ' + W(a) + ' → ' + W(t) + ' 만들려면\n' + sh(need) + ' 더 매수 (' + W(addM) + ' 필요)\n현재 침수: ' + fl.l + ' ' + fl.e + '\nstockchild.com';
            var levels = [0.05, 0.1, 0.15, 0.2, 0.3].map(function (k) { return { t: Math.round(a * (1 - k)), k: k }; }).filter(function (r) { return r.t > n && r.t !== t; });
            levels.push({ t: t, me: true });
            levels.sort(function (x, y) { return y.t - x.t; });
            var hl = -1, rows = levels.map(function (r, i) {
              var nq = needQty(q, a, n, r.t); if (r.me) hl = i;
              return [(r.me ? '입력한 목표 ' : '평단 -' + Math.round(r.k * 100) + '% ') + P(r.t) + '원', sh(nq), W(nq * n), flood(nq * n / (q * a)).e];
            });
            return '<div class="sc-kpis">' + U.kpi('추가 매수 수량', U.int(need) + '<small>주</small>', '현재가 ' + W(n) + '에 매수', true) +
              U.kpi('필요한 돈', U.won(addM) + '<small>원</small>') + U.kpi('물타기 후 평단', P(na) + '<small>원</small>', '목표 ' + W(t)) + '</div>' +
              floodHtml(fl) +
              '<div class="sc-sec"><div class="sc-rows">' + U.row('총 보유 수량', sh(tq)) + U.row('총 투입 금액', W(ti)) +
              U.row('지금 수익률', '<span class="' + U.tone(n / a - 1) + '">' + U.pct(n / a - 1, 1, true) + '</span>') +
              U.row('물타기 후 현재가 기준 수익률', '<span class="' + U.tone(n / na - 1) + '">' + U.pct(n / na - 1, 1, true) + '</span>') + '</div></div>' +
              '<div class="sc-sec"><div class="sc-sec-t">목표 평단별로 비교하면</div>' + U.table(['목표 평단', '추가 수량', '필요한 돈', '침수'], rows, hl) + '</div>' +
              '<div class="sc-sec">' + note('<b>계산 원리</b>: 필요 수량 = 보유 수량 × (평단 - 목표 평단) ÷ (목표 평단 - 현재가), 소수점은 올림. 목표 평단이 현재가에 가까워질수록 필요 수량이 빠르게 늘어나요. 물타기는 평단을 낮추지만 투입 원금과 손실 위험도 함께 키우니, 종목의 펀더멘털이 여전히 괜찮은지 먼저 확인하세요.') + '</div>';
          }
        },
        add: {
          ids: ['qty', 'avg', 'now', 'add'],
          fields: function () {
            return '<div class="sc-grid">' + U.field('qty', '보유 수량', '주', U.int(S.qty)) + U.field('avg', '현재 평균 단가', '원', P(S.avg)) +
              U.field('now', '현재가 (추가 매수 가격)', '원', P(S.now)) + U.field('add', '추가 매수 수량', '주', U.int(S.add)) + '</div>';
          },
          ex: [{ l: '100주 보유, 50주 더', s: { qty: 100, avg: 20000, now: 15000, add: 50 } },
               { l: '불타기: 수익 중에 더 사면', s: { qty: 100, avg: 20000, now: 26000, add: 50 } }],
          calc: function () {
            var q = S.qty, a = S.avg, n = S.now, ad = S.add;
            if (!(q > 0 && a > 0 && n > 0 && ad > 0)) return note('<b>보유 수량, 평균 단가, 현재가, 추가 매수 수량</b>을 모두 입력해 주세요.', true);
            function res(x) { var ti = q * a + x * n, na = ti / (q + x); return { na: na, ti: ti, m: x * n, fl: flood(x * n / (q * a)) }; }
            var r = res(ad), diff = r.na - a, fire = n > a;
            copyText = '💧 물타기 계산 결과\n' + sh(ad) + '를 ' + W(n) + '에 더 사면\n평단 ' + W(a) + ' → ' + P(r.na) + '원\n현재 침수: ' + r.fl.l + ' ' + r.fl.e + '\nstockchild.com';
            var mult = [0.5, 1, 2, 3].map(function (m) { return Math.round(q * m); }).filter(function (x) { return x > 0 && x !== ad; });
            mult.push(ad); mult.sort(function (x, y) { return x - y; });
            var hl = mult.indexOf(ad), rows = mult.map(function (x) {
              var s = res(x); return [(x === ad ? '입력한 ' : '') + sh(x), W(s.m), P(s.na) + '원', '<span class="' + U.tone(n / s.na - 1) + '">' + U.pct(n / s.na - 1, 1, true) + '</span>', s.fl.e];
            });
            return (fire ? note('🔥 <b>불타기 구간이에요.</b> 현재가가 평단보다 높아서 더 사면 평단이 올라갑니다.', true) + '<div class="sub2"></div>' : '') +
              '<div class="sc-kpis">' + U.kpi(sh(ad) + ' 더 사면 평단', P(r.na) + '<small>원</small>', '기존 ' + W(a), true) +
              U.kpi('평단 변화', '<span class="' + U.tone(diff) + '">' + (diff > 0 ? '▲ ' : diff < 0 ? '▼ ' : '') + P(Math.abs(diff)) + '<small>원</small></span>', U.pct(diff / a, 1, true)) +
              U.kpi('추가 매수 금액', U.won(r.m) + '<small>원</small>') + '</div>' + floodHtml(r.fl) +
              '<div class="sc-sec"><div class="sc-rows">' + U.row('총 보유 수량', sh(q + ad)) + U.row('총 투입 금액', W(r.ti)) +
              U.row('현재가 기준 수익률', '<span class="' + U.tone(n / r.na - 1) + '">' + U.pct(n / r.na - 1, 1, true) + '</span>') + '</div></div>' +
              '<div class="sc-sec"><div class="sc-sec-t">추가 수량별로 비교하면</div>' + U.table(['추가 수량', '추가 금액', '평단', '수익률', '침수'], rows, hl) + '</div>' +
              '<div class="sc-sec">' + note('<b>계산 원리</b>: 새 평단 = (보유 수량 × 평단 + 추가 수량 × 현재가) ÷ 전체 수량. 아무리 많이 사도 평단은 현재가 아래로 내려가지 않아요. 수수료와 세금은 반영하지 않은 단순 계산이에요.') + '</div>';
          }
        },
        breakeven: {
          ids: ['avg', 'qty', 'fee', 'tax'],
          fields: function () {
            return '<div class="sc-grid">' + U.field('avg', '평균 매수 단가', '원', P(S.avg)) + U.field('qty', '보유 수량', '주', U.int(S.qty), '금액 계산에만 쓰여요', true) + '</div>' + costFields();
          },
          ex: [{ l: '평단 2만원 국내 주식', s: { avg: 20000, qty: 100, kind: 'stock', tax: 0.2, fee: 0.015 } },
               { l: '평단 1만원 국내 ETF', s: { avg: 10000, qty: 100, kind: 'etf', tax: 0, fee: 0.015 } }],
          calc: function () {
            var a = S.avg, q = S.qty, f = S.fee / 100, t = S.tax / 100;
            if (!(a > 0) || !(f >= 0) || !(t >= 0)) return note('<b>평균 매수 단가와 수수료, 세금</b>을 입력해 주세요.', true);
            if (f * 2 + t >= 1) return note('수수료와 세금 비율이 너무 커요. 입력값을 확인해 주세요.', true);
            var raw = breakeven(a, f, t), be = ceilTick(raw, S.kind), hasQ = q > 0;
            copyText = '📌 본전 매도가 계산\n평단 ' + P(a) + '원 → 진짜 본전 ' + P(be) + '원 (' + U.pct(be / a - 1, 2, true) + ')\n수수료 ' + S.fee + '%, 세금 ' + S.tax + '% 반영\nstockchild.com';
            var hl = 0, rows = [0, 0.01, 0.03, 0.05, 0.1, 0.2].map(function (r) {
              var p = ceilTick(raw * (1 + r), S.kind), netGain = hasQ ? q * (p * (1 - f - t) - a * (1 + f)) : NaN;
              return [r === 0 ? '본전 (0%)' : '수익 +' + Math.round(r * 100) + '%', P(p) + '원', U.pct(p / a - 1, 2, true), hasQ ? W(netGain) : '-'];
            });
            return '<div class="sc-kpis">' + U.kpi('진짜 본전 매도가', P(be) + '<small>원</small>', S.kind === 'custom' ? '소수 둘째 자리 올림' : '호가단위 ' + U.int(tickOf(raw, S.kind)) + '원에 맞춰 올림', true) +
              U.kpi('평단보다 이만큼 올라야', '<span class="up">' + U.pct(be / a - 1, 2, true) + '</span>', '주당 ' + P(be - a) + '원') +
              U.kpi('이론상 본전', P(raw) + '<small>원</small>', '호가 맞추기 전') + '</div>' +
              '<div class="sc-sec"><div class="sc-rows">' + U.row('매수 수수료 (주당)', P(a * f) + '원') + U.row('본전에 팔 때 수수료 (주당)', P(be * f) + '원') +
              U.row('본전에 팔 때 세금 (주당)', P(be * t) + '원') + (hasQ ? U.row(sh(q) + ' 기준 총 거래비용', W(q * (a * f + be * (f + t)))) : '') + '</div></div>' +
              '<div class="sc-sec"><div class="sc-sec-t">목표 수익별 매도가</div>' + U.table(['목표', '매도가', '평단 대비', hasQ ? '실제 손에 쥐는 수익' : '수익 금액'], rows, hl) + '</div>' +
              '<div class="sc-sec">' + note('<b>계산 원리</b>: 본전 매도가 = 평단 × (1 + 수수료) ÷ (1 - 수수료 - 세금). 살 때 낸 수수료까지 원금으로 보고, 팔 때 빠지는 수수료와 세금을 뺀 금액이 원금과 같아지는 가격이에요. 세금은 이익이 아니라 매도 금액에 붙어서, 손해를 보고 팔아도 빠집니다.') + '</div>';
          }
        },
        recovery: {
          ids: ['loss', 'growth'],
          fields: function () {
            var mine = S.avg > 0 && S.now > 0 && S.now < S.avg;
            return '<div class="sc-grid">' + U.field('loss', '지금 손실률', '%', String(S.loss), '예: 40% 손실이면 -40') +
              U.field('growth', '연 기대 수익률', '%', String(S.growth), '회복 기간 계산용') + '</div>' +
              (mine ? '<div class="sc-chips sub2"><button class="sc-chip" id="mine">물타기 탭에 넣은 내 종목 손실률 (' + U.pct(S.now / S.avg - 1, 1) + ') 불러오기</button></div>' : '');
          },
          ex: [{ l: '-20%', s: { loss: -20 } }, { l: '-50% (반토막)', s: { loss: -50 } }, { l: '-70%', s: { loss: -70 } }],
          calc: function () {
            var L = S.loss / 100, g = S.growth / 100;
            if (!isFinite(L) || L >= 0) return note('<b>손실률을 마이너스(-)로 입력해 주세요.</b> 예: 40% 손실이면 -40', true);
            if (L <= -1) return note('손실률은 -100%보다 커야 해요.', true);
            var need = recoveryNeed(L), yrs = g > 0 ? Math.log(1 + need) / Math.log(1 + g) : NaN;
            function yTxt(y) { return isFinite(y) ? (y < 1 ? Math.max(1, Math.round(y * 12)) + '개월' : (Math.round(y * 10) / 10) + '년') : '-'; }
            copyText = '📉 손실 회복 계산\n지금 ' + U.pct(L, 1) + ' → 원금까지 ' + U.pct(need, 1, true) + ' 상승 필요\n연 ' + S.growth + '% 수익이면 약 ' + yTxt(yrs) + '\nstockchild.com';
            var list = [-0.1, -0.2, -0.3, -0.4, -0.5, -0.6, -0.7, -0.8, -0.9].filter(function (x) { return Math.abs(x - L) > 1e-9; });
            list.push(L); list.sort(function (x, y) { return y - x; });
            var hl = list.indexOf(L), rows = list.map(function (x) {
              var nd = recoveryNeed(x), y = g > 0 ? Math.log(1 + nd) / Math.log(1 + g) : NaN;
              return [(x === L ? '입력한 ' : '') + U.pct(x, x === L ? 1 : 0), '<span class="up">' + U.pct(nd, 1, true) + '</span>', yTxt(y)];
            });
            return '<div class="sc-kpis">' + U.kpi('원금까지 필요한 상승률', U.pct(need, 1, true), '지금 ' + U.pct(L, 1) + ' 손실', true) +
              U.kpi('회복까지 걸리는 기간', yTxt(yrs), '연 ' + S.growth + '% 수익이 계속될 때') +
              U.kpi('손실 대비 상승 필요 배수', (Math.round(need / -L * 100) / 100) + '<small>배</small>', '잃은 비율보다 이만큼 더') + '</div>' +
              '<div class="sc-sec"><div class="sc-sec-t">손실률별 회복 조건</div>' + U.table(['손실률', '필요한 상승률', '연 ' + S.growth + '% 기준 기간'], rows, hl) + '</div>' +
              '<div class="sc-sec">' + note('<b>왜 더 많이 올라야 할까요?</b> 100만원이 50% 떨어지면 50만원이 되고, 50만원이 100만원이 되려면 100%가 올라야 해요. 떨어진 뒤에는 기준 금액이 작아져서 같은 비율로 올라도 금액이 덜 늘어나기 때문이에요. 그래서 큰 손실은 피하는 것이 회복보다 쉽습니다. 계산 원리: 필요 상승률 = 1 ÷ (1 + 손실률) - 1.') + '</div>';
          }
        },
        change: {
          ids: function () { return S.cmode === 'two' ? ['from', 'to'] : ['base', 'pct']; },
          fields: function () {
            return '<div class="sc-chips" id="cmodes"><button class="sc-chip' + (S.cmode === 'two' ? ' on' : '') + '" data-c="two">두 가격 사이 등락률</button>' +
              '<button class="sc-chip' + (S.cmode === 'pct' ? ' on' : '') + '" data-c="pct">몇 % 오르면 얼마</button></div><div class="sc-grid sub2">' +
              (S.cmode === 'two' ? U.field('from', '처음 가격 (매수가 등)', '원', P(S.from)) + U.field('to', '나중 가격 (현재가 등)', '원', P(S.to))
                : U.field('base', '기준 가격', '원', P(S.base)) + U.field('pct', '등락률', '%', String(S.pct), '하락은 -로 입력')) + '</div>';
          },
          ex: [{ l: '1만5천 → 2만원', s: { cmode: 'two', from: 15000, to: 20000 } }, { l: '5만원에서 -12%', s: { cmode: 'pct', base: 50000, pct: -12 } }, { l: '상한가 +30%', s: { cmode: 'pct', base: 10000, pct: 30 } }],
          calc: function () {
            var base, rate, target, head;
            if (S.cmode === 'two') {
              if (!(S.from > 0 && S.to > 0)) return note('<b>두 가격</b>을 입력해 주세요.', true);
              base = S.from; target = S.to; rate = target / base - 1;
              head = U.kpi('등락률', '<span class="' + U.tone(rate) + '">' + U.pct(rate, 2, true) + '</span>', P(base) + '원 → ' + P(target) + '원', true) +
                U.kpi('가격 차이', '<span class="' + U.tone(rate) + '">' + (rate > 0 ? '+' : '') + P(target - base) + '<small>원</small></span>') +
                U.kpi('몇 배', (Math.round(target / base * 1000) / 1000) + '<small>배</small>');
            } else {
              if (!(S.base > 0) || !isFinite(S.pct)) return note('<b>기준 가격과 등락률</b>을 입력해 주세요.', true);
              base = S.base; rate = S.pct / 100; target = base * (1 + rate);
              if (target <= 0) return note('등락률은 -100%보다 커야 해요.', true);
              head = U.kpi(U.pct(rate, 1, true) + ' 가격', P(target) + '<small>원</small>', '기준 ' + P(base) + '원', true) +
                U.kpi('호가에 맞춘 가격', P(roundTick(target, 'stock')) + '<small>원</small>', '국내 주식 호가단위 ' + U.int(tickOf(target, 'stock')) + '원') +
                U.kpi('가격 차이', '<span class="' + U.tone(rate) + '">' + (rate > 0 ? '+' : '') + P(target - base) + '<small>원</small></span>');
            }
            copyText = '📊 등락률 계산\n' + P(base) + '원 → ' + P(target) + '원 : ' + U.pct(rate, 2, true) + '\nstockchild.com';
            var list = [-0.3, -0.2, -0.1, -0.05, 0.05, 0.1, 0.2, 0.3].filter(function (x) { return Math.abs(x - rate) > 1e-9; });
            list.push(rate); list.sort(function (x, y) { return y - x; });
            var hl = list.indexOf(rate), rows = list.map(function (x) {
              var p = base * (1 + x);
              return [(x === rate ? '입력값 ' : '') + '<span class="' + U.tone(x) + '">' + U.pct(x, x === rate ? 2 : 0, true) + '</span>', P(p) + '원', (x > 0 ? '+' : '') + P(p - base) + '원'];
            });
            return '<div class="sc-kpis">' + head + '</div>' +
              '<div class="sc-sec"><div class="sc-sec-t">기준 ' + P(base) + '원에서 움직이면</div>' + U.table(['등락률', '가격', '차이'], rows, hl) + '</div>' +
              '<div class="sc-sec">' + note('<b>계산 원리</b>: 등락률 = (나중 가격 ÷ 처음 가격) - 1. 국내 주식의 하루 가격 제한폭은 ±30%라서, +30%와 -30% 줄이 하루 안에 갈 수 있는 끝이에요.') + '</div>';
          }
        },
        freeshares: {
          ids: ['fqty', 'favg', 'fnow', 'fee', 'tax'],
          fields: function () {
            return '<div class="sc-grid">' + U.field('fqty', '보유 수량', '주', U.int(S.fqty)) + U.field('favg', '평균 매수 단가', '원', P(S.favg)) +
              U.field('fnow', '현재가 (팔 가격)', '원', P(S.fnow)) + '</div>' + costFields();
          },
          ex: [{ l: '2배 오른 종목 100주', s: { fqty: 100, favg: 20000, fnow: 40000 } }, { l: '50% 수익 중 300주', s: { fqty: 300, favg: 10000, fnow: 15000 } }],
          calc: function () {
            var q = S.fqty, a = S.favg, n = S.fnow, f = S.fee / 100, t = S.tax / 100;
            if (!(q > 0 && a > 0 && n > 0) || !(f >= 0) || !(t >= 0)) return note('<b>보유 수량, 평균 단가, 현재가</b>를 입력해 주세요.', true);
            var principal = q * a * (1 + f), netPer = n * (1 - f - t);
            function plan(price) { var np = price * (1 - f - t), s = Math.ceil(principal / np - 1e-9); return { s: s, left: q - s, back: s * np }; }
            var p = plan(n);
            if (p.left <= 0) return note('📉 <b>지금 가격으로는 전부 팔아도 원금을 다 회수하지 못해요.</b> 원금 회수 매도는 수익 중일 때 쓰는 계산이에요. 본전 매도가는 ' + P(ceilTick(breakeven(a, f, t), S.kind)) + '원이에요.', true);
            copyText = '🎁 원금 회수 매도\n' + sh(q) + ' 중 ' + sh(p.s) + ' 팔면 원금 회수\n남는 공짜 주식 ' + sh(p.left) + ' (' + W(p.left * n) + ')\nstockchild.com';
            var mults = [1.2, 1.5, 2, 3, 5].filter(function (m) { return Math.abs(a * m - n) > 1e-9; }).map(function (m) { return { price: a * m, m: m }; });
            mults.push({ price: n, me: true }); mults.sort(function (x, y) { return x.price - y.price; });
            var hl = -1, rows = mults.map(function (r, i) {
              if (r.me) hl = i; var x = plan(r.price);
              return [(r.me ? '현재가 ' : '평단 ' + r.m + '배 ') + P(r.price) + '원', x.left > 0 ? sh(x.s) : '불가', x.left > 0 ? sh(x.left) : '-', x.left > 0 ? U.pct(x.left / q, 0) : '-'];
            });
            return '<div class="sc-kpis">' + U.kpi('팔아야 할 수량', U.int(p.s) + '<small>주</small>', '보유 ' + sh(q) + ' 중', true) +
              U.kpi('남는 공짜 주식', U.int(p.left) + '<small>주</small>', '보유량의 ' + U.pct(p.left / q, 0)) +
              U.kpi('공짜 주식 평가금액', U.won(p.left * n) + '<small>원</small>', '현재가 기준') + '</div>' +
              '<div class="sc-sec"><div class="sc-rows">' + U.row('회수할 원금 (매수 수수료 포함)', W(principal)) + U.row(sh(p.s) + ' 팔아서 손에 쥐는 돈', W(p.back)) +
              U.row('원금보다 남는 돈', W(p.back - principal)) + '</div></div>' +
              '<div class="sc-sec"><div class="sc-sec-t">주가별로 비교하면</div>' + U.table(['매도 가격', '팔 수량', '남는 주식', '남는 비율'], rows, hl) + '</div>' +
              '<div class="sc-sec">' + note('<b>계산 원리</b>: 팔 수량 = 원금 ÷ (현재가 × (1 - 수수료 - 세금)), 소수점은 올림. 원금을 먼저 빼두면 남은 주식은 떨어져도 원금 손실이 없는 "공짜 주식"이 돼서 마음 편히 오래 들고 갈 수 있어요. 다만 판 주식만큼 이후 상승분은 포기하는 선택이에요.') + '</div>';
          }
        },
        reentry: {
          ids: ['rqty', 'rnow', 're', 'fee', 'tax'],
          fields: function () {
            return '<div class="sc-grid">' + U.field('rqty', '보유 수량', '주', U.int(S.rqty)) + U.field('rnow', '지금 팔 가격 (현재가)', '원', P(S.rnow)) +
              U.field('re', '다시 살 가격', '원', P(S.re)) + '</div>' + costFields();
          },
          ex: [{ l: '1만5천에 팔고 1만3,500에 재매수', s: { rqty: 100, rnow: 15000, re: 13500 } }, { l: '조금만 싸게 (-0.3%)', s: { rqty: 100, rnow: 15000, re: 14950 } }],
          calc: function () {
            var q = S.rqty, n = S.rnow, r = S.re, f = S.fee / 100, t = S.tax / 100;
            if (!(q > 0 && n > 0 && r > 0) || !(f >= 0) || !(t >= 0)) return note('<b>보유 수량, 지금 팔 가격, 다시 살 가격</b>을 입력해 주세요.', true);
            var cash = q * n * (1 - f - t), limit = n * (1 - f - t) / (1 + f);
            function buy(price) { return Math.floor(cash / (price * (1 + f)) + 1e-9); }
            var nq = buy(r), d = nq - q, cost = q * n * (f + t) + nq * r * f;
            copyText = '🔁 손절 후 재진입 비교\n' + P(n) + '원에 ' + sh(q) + ' 팔고 ' + P(r) + '원에 다시 사면\n' + sh(nq) + ' (' + (d >= 0 ? '+' : '') + U.int(d) + '주)\nstockchild.com';
            var list = [0.01, 0.03, 0.05, 0.1, 0.2].map(function (k) { return { p: n * (1 - k), k: k }; }).filter(function (x) { return Math.abs(x.p - r) > 1e-9; });
            list.push({ p: r, me: true }); list.sort(function (x, y) { return y.p - x.p; });
            var hl = -1, rows = list.map(function (x, i) {
              if (x.me) hl = i; var b = buy(x.p), dd = b - q;
              return [(x.me ? '입력한 ' : '-' + Math.round(x.k * 100) + '% ') + P(x.p) + '원', sh(b), '<span class="' + U.tone(dd) + '">' + (dd > 0 ? '+' : '') + U.int(dd) + '주</span>', U.pct(dd / q, 1, true)];
            });
            return (d <= 0 ? note('⚠️ <b>이 가격에 다시 사면 ' + (d < 0 ? '오히려 주식이 줄어들어요.' : '주식 수가 늘지 않아요.') + '</b> 수수료와 세금을 빼고 나면 ' + P(limit) + '원보다 낮게, 그것도 1주를 더 살 만큼 충분히 싸게 다시 사야 주식이 늘어나요.', true) + '<div class="sub2"></div>' : '') +
              '<div class="sc-kpis">' + U.kpi('다시 살 수 있는 수량', U.int(nq) + '<small>주</small>', '지금 ' + sh(q) + ' → <span class="' + U.tone(d) + '">' + (d > 0 ? '+' : '') + U.int(d) + '주</span>', true) +
              U.kpi('이득이 되는 재진입가', P(limit) + '<small>원 미만</small>', '지금 가격 대비 ' + U.pct(limit / n - 1, 2)) +
              U.kpi('사고팔며 드는 비용', U.won(cost) + '<small>원</small>', '수수료 + 세금') + '</div>' +
              '<div class="sc-sec"><div class="sc-sec-t">다시 사는 가격별로 비교하면</div>' + U.table(['다시 살 가격', '살 수 있는 수량', '증감', '증감률'], rows, hl) + '</div>' +
              '<div class="sc-sec">' + note('<b>꼭 기억하세요</b>: 이 계산은 생각한 가격까지 내려왔을 때의 결과예요. 판 뒤에 내려오지 않고 바로 오르면, 더 비싸게 다시 사거나 상승을 놓치게 됩니다. 손절은 "더 싸게 사기"보다 "더 큰 손실 막기"가 먼저라는 점도 함께 생각해 주세요.', true) + '</div>';
          }
        }
      };

      function tabDef() { return TABS.filter(function (t) { return t.id === S.tab; })[0]; }
      function ids() { var d = D[S.tab]; return typeof d.ids === 'function' ? d.ids() : d.ids; }

      function draw() {
        var T = tabDef(), d = D[S.tab];
        wrap.innerHTML = '<div class="sc-card">' + U.header('주식 본전 센터', T.title, T.desc) +
          '<div class="sc-chips tabs" role="tablist">' + TABS.map(function (t) {
            return '<button class="sc-chip' + (t.id === S.tab ? ' on' : '') + '" data-t="' + t.id + '" role="tab" aria-selected="' + (t.id === S.tab) + '">' + t.label + '</button>';
          }).join('') + '</div>' +
          '<div class="sc-sec" id="in">' + d.fields() + exChips(d.ex) + '</div>' +
          '<div class="sc-sec" id="out"></div>' +
          '<button class="sc-btn ghost copy" id="copy">📋 결과 복사하기</button>' +
          U.foot('물타기는 평단을 낮추지만 투입 원금과 손실 위험을 함께 키우는 행동이에요. 수수료·세금 기준: 2026년 국내 주식 매도 시 0.20%') + '</div>';
        U.bindInputs(wrap, ids(), function () { readAll(); calc(); });
        calc();
      }
      function readAll() {
        ids().forEach(function (id) { var x = v(id); S[id] = x; });
      }
      function calc() {
        copyText = '';
        wrap.querySelector('#out').innerHTML = D[S.tab].calc();
        var c = wrap.querySelector('#copy');
        c.style.display = copyText ? '' : 'none'; c.classList.remove('done'); c.textContent = '📋 결과 복사하기';
      }

      wrap.addEventListener('click', function (e) {
        var b = e.target.closest('button'); if (!b) return;
        if (b.dataset.t) { S.tab = b.dataset.t; draw(); return; }
        if (b.dataset.ex != null) { var ex = D[S.tab].ex[+b.dataset.ex].s; for (var k in ex) S[k] = ex[k]; draw(); return; }
        if (b.dataset.k) {
          S.kind = b.dataset.k;
          if (S.kind === 'stock') S.tax = 0.2; else if (S.kind === 'etf') S.tax = 0;
          draw(); if (S.kind === 'custom') { var tx = wrap.querySelector('#tax'); if (tx) tx.focus(); } return;
        }
        if (b.dataset.c) { S.cmode = b.dataset.c; draw(); return; }
        if (b.id === 'mine') { S.loss = Math.round((S.now / S.avg - 1) * 1000) / 10; draw(); return; }
        if (b.id === 'copy' && copyText) {
          var done = function () { b.classList.add('done'); b.textContent = '✅ 복사됐어요!'; };
          if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(copyText).then(done, function () { fallback(copyText); done(); });
          else { fallback(copyText); done(); }
        }
      });
      // 세금 칸을 손으로 고치면 "직접 입력"으로 표시
      wrap.addEventListener('input', function (e) {
        if (e.target.id === 'tax' && S.kind !== 'custom') {
          S.kind = 'custom';
          var ks = wrap.querySelectorAll('#kinds .sc-chip');
          for (var i = 0; i < ks.length; i++) ks[i].classList.toggle('on', ks[i].dataset.k === 'custom');
          calc();
        }
      });
      function fallback(t) {
        var ta = document.createElement('textarea'); ta.value = t; ta.style.position = 'fixed'; ta.style.opacity = '0';
        document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); } catch (err) {} document.body.removeChild(ta);
      }
      draw();
    }
  });
})();
