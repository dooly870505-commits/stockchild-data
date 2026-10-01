/* stockchild.com 배당·결제일 계산기 (sc-tool-dividend-date) v1.0 (2026-09-30)
   필요 파일: market-calendar-core.js → sc-ui.js → 이 파일 순서로 불러오기
   모드 3개: 배당 마지막 매수일 / 매매 결제일 / 배당락 전 vs 후 매수 비교 */
(function () {
  'use strict';
  var T = window.SCTools, C = window.SCCal;
  if (!T || !C) return;

  var CSS = [
    '.seg{display:flex;flex-wrap:wrap;gap:4px;padding:4px;background:var(--soft);border-radius:999px}',
    '.seg button{flex:1;min-width:110px;height:42px;border:0;border-radius:999px;background:transparent;font:inherit;font-size:14px;font-weight:700;color:var(--sub);cursor:pointer}',
    '.seg button.on{background:#fff;color:var(--ink);box-shadow:0 1px 4px rgba(22,24,29,.1)}',
    '.seg button:focus-visible{outline:2px solid var(--focus);outline-offset:2px}',
    '.sc-input.date input{text-align:left;font-size:16px}',
    '.bar2{display:flex;flex-wrap:wrap;gap:12px;align-items:flex-end;justify-content:space-between}',
    '.strip{display:grid;grid-template-columns:repeat(auto-fill,minmax(96px,1fr));gap:8px}',
    '.day{border:1px solid var(--line);border-radius:12px;padding:10px 8px;text-align:center;background:#fff}',
    '.day .d{font-size:15px;font-weight:700}',
    '.day .l{font-size:12px;font-weight:700;margin-top:4px;line-height:1.45}',
    '.day.off{background:repeating-linear-gradient(45deg,#FAFAFB,#FAFAFB 6px,#F1F2F4 6px,#F1F2F4 12px);color:var(--muted)}',
    '.day.settle{background:var(--ok-bg);border-color:#BFE6CC}.day.settle .l{color:var(--ok-tx)}',
    '.day.ex{background:var(--brand-bg);border-color:var(--brand)}.day.ex .l{color:var(--brand)}',
    '.day.rec{box-shadow:inset 0 0 0 2px var(--ink)}',
    '.day.buy{background:var(--ink);border-color:var(--ink);color:#fff}.day.buy .l{color:#fff}',
    '.dd{display:inline-block;margin-left:6px;font-size:13px;font-weight:700;padding:2px 8px;border-radius:999px;background:var(--brand);color:#fff;vertical-align:4px}',
    '.dd.past{background:var(--soft);color:var(--muted)}'
  ].join('');

  var WD = C.WD;
  function lab(ymd) { var a = ymd.split('-').map(Number); return a[1] + '월 ' + a[2] + '일 (' + WD[C.weekday(ymd)] + ')'; }
  function short(ymd) { var a = ymd.split('-').map(Number); return a[1] + '/' + a[2]; }

  T.register({
    id: 'dividend-date',
    css: CSS,
    render: function (el, U) {
      var st = { mode: 'record', m: 'kr' };
      var today = C.todayYmd('kr');
      var yr = +today.slice(0, 4);

      el.innerHTML = '<div class="sc-card">' + U.header('배당 센터', '배당·결제일 계산기', '배당을 받으려면 언제까지 사야 하는지, 판 돈은 언제 들어오는지, 배당락 전후 중 언제 사는 게 이득인지 계산해요.') +
        '<div class="sc-sec"><div class="seg" id="seg"><button data-v="record">배당 마지막 매수일</button><button data-v="settle">매매 결제일</button><button data-v="compare">배당락 전 vs 후</button></div></div>' +
        '<div id="body"></div></div>';

      function marketChips() {
        return '<div class="sc-chips" id="mk"><button class="sc-chip' + (st.m === 'kr' ? ' on' : '') + '" data-m="kr">한국 주식</button><button class="sc-chip' + (st.m === 'us' ? ' on' : '') + '" data-m="us">미국 주식</button></div>';
      }
      function dateField(id, label, val, help) {
        return '<div class="sc-field"><label for="' + id + '">' + label + '</label><div class="sc-input date"><input type="date" id="' + id + '" value="' + val + '"></div>' + (help ? '<div class="sc-help">' + help + '</div>' : '') + '</div>';
      }
      function covNote(cov) {
        return cov === 'tentative' ? '<div class="sc-note warn" style="margin-top:10px"><b>잠정 계산</b>: 이 날짜의 휴장일은 거래소 공식 발표 전이라 관공서 공휴일 기준으로 계산했어요. 12월 공식 발표 후 확정돼요.</div>' : '';
      }
      function ddTag(n) { return n > 0 ? '<span class="dd">D-' + n + '</span>' : (n === 0 ? '<span class="dd">오늘까지</span>' : '<span class="dd past">지났어요</span>'); }

      // ---------- 모드 1: 배당 마지막 매수일 ----------
      function viewRecord() {
        var def = yr + '-12-31';
        var b = el.querySelector('#body');
        b.innerHTML = '<div class="sc-sec"><div class="bar2">' + marketChips() + '</div></div>' +
          '<div class="sc-sec"><div class="sc-grid">' + dateField('rec', '배당 기준일 (주주명부 기준일)', def, '회사 공시의 "배당기준일"을 넣으세요') + '</div>' +
          '<div class="sc-chips" style="margin-top:10px" id="rq"><button class="sc-chip" data-d="' + yr + '-12-31">' + yr + '년 12월 결산</button><button class="sc-chip" data-d="' + (yr + 1) + '-03-31">' + (yr + 1) + '년 3월 분기</button><button class="sc-chip" data-d="' + (yr + 1) + '-06-30">' + (yr + 1) + '년 6월 중간</button></div></div>' +
          '<div class="sc-sec" id="out"></div>';
        function calc() {
          var d = el.querySelector('#rec').value, out = el.querySelector('#out');
          var chips = el.querySelectorAll('#rq .sc-chip'); for (var i = 0; i < chips.length; i++) chips[i].classList.toggle('on', chips[i].dataset.d === d);
          var r = C.lastBuyForRecord(st.m, d);
          if (!r.ok) { out.innerHTML = '<div class="sc-note warn"><b>계산할 수 없어요</b>: ' + r.error + '</div>'; return; }
          var mk = C.MARKETS[st.m], settleOfLast = C.addSettleDays(st.m, r.lastBuy, mk.settleDays), settleOfEx = C.addSettleDays(st.m, r.exDate, mk.settleDays);
          var dLeft = C.diffDays(C.todayYmd(st.m), r.lastBuy);
          // 날짜 흐름 조각
          var endD = r.record > r.exDate ? r.record : r.exDate, cells = [];
          for (var x = r.lastBuy; x <= endD; x = C.addDays(x, 1)) {
            var cls = [], ls = [], why = C.closedReason(st.m, x);
            if (why && why.indexOf('결제 휴일') === -1) { cls.push('off'); ls.push(why === '주말' ? '주말' : '휴장'); }
            else if (why) { ls.push('결제 휴일'); }
            if (x === settleOfLast) { cls.push('settle'); ls.push('결제 완료'); }
            if (x === r.exDate) { cls.push('ex'); ls.push('배당락'); }
            if (x === r.record) { cls.push('rec'); ls.push('배당 기준일'); }
            if (x === r.lastBuy) { cls.push('buy'); ls.push('매수 마감'); }
            cells.push('<div class="day ' + cls.join(' ') + '"><div class="d">' + short(x) + ' ' + WD[C.weekday(x)] + '</div><div class="l">' + (ls.join('<br>') || '&nbsp;') + '</div></div>');
          }
          out.innerHTML = '<div class="sc-kpis">' +
            U.kpi('마지막 매수일', lab(r.lastBuy), '이날 장 마감 전까지 사야 해요 ' + ddTag(dLeft), true) +
            U.kpi('배당락일', lab(r.exDate), '이날부터 사면 배당을 못 받아요') +
            U.kpi('결제 방식', 'T+' + mk.settleDays, mk.name + ' 주식은 ' + mk.settleDays + '영업일 뒤 결제') + '</div>' +
            '<div class="sc-sec"><div class="sc-sec-t">날짜 흐름</div><div class="strip">' + cells.join('') + '</div></div>' +
            '<div class="sc-sec"><div class="sc-rows">' +
            U.row(short(r.lastBuy) + '에 사면', '결제 ' + short(settleOfLast) + ' → 기준일(' + short(r.record) + ') 안이라 <span class="up">배당 받음</span>') +
            U.row(short(r.exDate) + '에 사면', '결제 ' + short(settleOfEx) + ' → 기준일을 넘겨서 <span class="down">배당 못 받음</span>') +
            (r.recordClosed ? U.row('기준일', lab(r.record) + '은 ' + r.recordClosed + '이에요') : '') + '</div>' + covNote(r.coverage) + '</div>' +
            '<div class="sc-sec"><div class="sc-note"><b>꼭 확인하세요</b>: 요즘은 배당절차 개선으로 회사마다 배당 기준일을 이사회에서 따로 정하는 경우가 많아요. 12월 결산 법인이라도 기준일이 12월 31일이 아닐 수 있으니, 해당 회사의 배당 공시에 적힌 기준일을 넣어 계산하세요.</div></div>' +
            U.foot('휴장일 기준: 공통 영업일 엔진 v' + C.VERSION + ' (' + C.UPDATED + ' 업데이트)' + (st.m === 'us' ? ', 미국은 거래소와 뉴욕 은행이 모두 여는 날만 결제일로 계산' : ''));
        }
        el.querySelector('#rec').addEventListener('input', calc);
        el.querySelector('#rq').addEventListener('click', function (e) { var c = e.target.closest('.sc-chip'); if (!c) return; el.querySelector('#rec').value = c.dataset.d; calc(); });
        calc();
      }

      // ---------- 모드 2: 매매 결제일 ----------
      function viewSettle() {
        var t0 = C.nextTradingDay(st.m, C.todayYmd(st.m), true) || C.todayYmd(st.m);
        var b = el.querySelector('#body');
        var fri = C.todayYmd(st.m); for (var i = 0; i < 7 && C.weekday(fri) !== 5; i++) fri = C.addDays(fri, 1);
        b.innerHTML = '<div class="sc-sec"><div class="bar2">' + marketChips() + '</div></div>' +
          '<div class="sc-sec"><div class="sc-grid">' + dateField('td', '매매한 날 (주문 체결일)', t0, st.m === 'us' ? '미국 현지 날짜 기준이에요' : '') + '</div>' +
          '<div class="sc-chips" style="margin-top:10px" id="tq"><button class="sc-chip" data-d="' + t0 + '">오늘(또는 다음 거래일)</button><button class="sc-chip" data-d="' + fri + '">이번 주 금요일</button></div></div>' +
          '<div class="sc-sec" id="out"></div>';
        function calc() {
          var d = el.querySelector('#td').value, out = el.querySelector('#out');
          var chips = el.querySelectorAll('#tq .sc-chip'); for (var i = 0; i < chips.length; i++) chips[i].classList.toggle('on', chips[i].dataset.d === d);
          var r = C.settleDate(st.m, d);
          if (!r.ok) { out.innerHTML = '<div class="sc-note warn"><b>계산할 수 없어요</b>: ' + r.error + (r.nextTrading ? ' 다음 거래일은 ' + lab(r.nextTrading) + '이에요.' : '') + '</div>'; return; }
          out.innerHTML = '<div class="sc-kpis">' +
            U.kpi('결제일', lab(r.settle), (st.m === 'kr' ? '판 돈을 출금할 수 있는 날' : '미국 현지 결제 완료일'), true) +
            U.kpi('걸리는 기간', r.calendarDays + '<small>일</small>', 'T+' + r.days + ' (영업일 ' + r.days + '일)') +
            U.kpi('사이에 낀 휴일', r.skipped.length + '<small>일</small>', r.skipped.length ? '주말·휴장일 포함' : '휴일 없이 바로 결제') + '</div>' +
            (r.skipped.length ? '<div class="sc-sec"><div class="sc-sec-t">건너뛴 날</div><div class="sc-rows">' + r.skipped.map(function (s) { return U.row(lab(s.ymd), s.reason); }).join('') + '</div></div>' : '') +
            covNote(r.coverage) +
            '<div class="sc-sec"><div class="sc-note">' + (st.m === 'kr'
              ? '<b>결제일</b>은 매도 대금이 계좌에 확정되어 출금할 수 있는 날이에요. 매수했다면 이날 주식이 내 계좌에 확정돼요.'
              : '<b>미국 주식</b>은 거래소와 뉴욕 은행이 모두 여는 날만 결제일로 셉니다. 콜럼버스 데이, 재향군인의 날처럼 거래는 되지만 결제는 쉬는 날이 있어요. 원화 출금 가능일은 증권사마다 다를 수 있어요.') + '</div></div>' +
            U.foot('휴장일 기준: 공통 영업일 엔진 v' + C.VERSION + ' (' + C.UPDATED + ' 업데이트)');
        }
        el.querySelector('#td').addEventListener('input', calc);
        el.querySelector('#tq').addEventListener('click', function (e) { var c = e.target.closest('.sc-chip'); if (!c) return; el.querySelector('#td').value = c.dataset.d; calc(); });
        calc();
      }

      // ---------- 모드 3: 배당락 전 vs 후 매수 비교 (No.138) ----------
      function viewCompare() {
        var tax = st.m === 'us' ? 15 : 15.4;
        var b = el.querySelector('#body');
        b.innerHTML = '<div class="sc-sec"><div class="sc-grid">' +
          U.field('cash', '투자할 금액', '원', '10,000,000') + U.field('px', '지금 주가 (배당락 전)', '원', '50,000') +
          U.field('dps', '주당 배당금', '원', '1,500') + U.field('drop', '배당락일 예상 하락폭', '원', '1,500', '보통 배당금만큼 떨어진다고 가정해요') +
          U.field('tax', '배당 세율', '%', String(tax)) + '</div>' +
          '<div class="sc-chips" style="margin-top:10px" id="dq"><button class="sc-chip" data-k="1">하락폭 = 배당금 (이론)</button><button class="sc-chip" data-k="0.5">배당금의 절반만 하락</button><button class="sc-chip" data-k="0">거의 안 떨어짐</button></div>' +
          '<div class="sc-chips" style="margin-top:8px" id="xq"><button class="sc-chip" data-t="15.4">국내 배당 15.4%</button><button class="sc-chip" data-t="15">미국 배당 15%</button><button class="sc-chip" data-t="0">비과세 계좌 0%</button></div></div>' +
          '<div class="sc-sec" id="out"></div>';
        function calc() {
          var cash = U.val(el, 'cash'), px = U.val(el, 'px'), dps = U.val(el, 'dps'), drop = U.val(el, 'drop'), t = U.val(el, 'tax') / 100, out = el.querySelector('#out');
          var ks = el.querySelectorAll('#dq .sc-chip'); for (var i = 0; i < ks.length; i++) ks[i].classList.toggle('on', dps > 0 && Math.abs(drop - dps * parseFloat(ks[i].dataset.k)) < 0.5);
          var ts = el.querySelectorAll('#xq .sc-chip'); for (var j = 0; j < ts.length; j++) ts[j].classList.toggle('on', Math.abs(t * 100 - parseFloat(ts[j].dataset.t)) < 0.001);
          if (!(cash > 0 && px > 0 && dps >= 0 && drop >= 0 && drop < px && t >= 0 && t < 1)) { out.innerHTML = '<div class="sc-note warn"><b>입력 확인</b>: 금액과 주가는 0보다 크게, 하락폭은 주가보다 작게, 세율은 0~99% 사이로 넣어주세요.</div>'; return; }
          var sh = Math.floor(cash / px);
          if (sh < 1) { out.innerHTML = '<div class="sc-note warn"><b>입력 확인</b>: 투자 금액으로 1주도 살 수 없어요.</div>'; return; }
          var netD = dps * (1 - t), per = netD - drop, diff = sh * per, be = netD;
          var winner = Math.abs(per) < 0.5 ? '차이 없음' : (per > 0 ? '배당락 전 매수' : '배당락 후 매수');
          var sc = [0, 0.5, 1 - t, 1, 1.2].map(function (k) { return dps * k; });
          var rows = sc.map(function (dr) {
            var g = sh * (netD - dr);
            return [U.won(dr) + '원' + (Math.abs(dr - be) < 0.5 ? ' (손익분기)' : ''), '<span class="' + U.tone(g) + '">' + (g > 0 ? '+' : '') + U.won(g) + '원</span>', Math.abs(g) < sh * 0.5 ? '같음' : (g > 0 ? '전 매수 유리' : '후 매수 유리')];
          });
          var hl = 0, best = 1e18; sc.forEach(function (dr, i) { if (Math.abs(dr - drop) < best) { best = Math.abs(dr - drop); hl = i; } });
          out.innerHTML = '<div class="sc-kpis">' +
            U.kpi('더 유리한 선택', winner, winner === '차이 없음' ? '어느 쪽이든 같아요' : '차이 ' + U.won(Math.abs(diff)) + '원', true) +
            U.kpi('세후 배당금', U.won(sh * netD) + '<small>원</small>', U.int(sh) + '주 × ' + U.won(netD) + '원') +
            U.kpi('손익분기 하락폭', U.won(be) + '<small>원</small>', '배당락 하락이 이보다 작으면 전 매수 유리') + '</div>' +
            '<div class="sc-sec"><div class="sc-rows">' +
            U.row('배당락 전 매수: 세후 배당금', '<span class="up">+' + U.won(sh * netD) + '원</span>') +
            U.row('배당락 전 매수: 배당락 하락 손실', '<span class="down">-' + U.won(sh * drop) + '원</span>') +
            U.row('배당락 전 매수 순효과 (후 매수 대비)', '<span class="' + U.tone(diff) + '">' + (diff > 0 ? '+' : '') + U.won(diff) + '원</span>') + '</div></div>' +
            '<div class="sc-sec"><div class="sc-sec-t">하락폭별 비교 (배당락 전 매수 기준 손익)</div>' + U.table(['배당락 하락폭 (주당)', '전 매수 순효과', '판정'], rows, hl) + '</div>' +
            '<div class="sc-sec"><div class="sc-note"><b>핵심 원리</b>: 이론적으로 주가는 배당금만큼 떨어지므로, 배당을 받으면 세금만큼 손해예요. 하지만 실제 배당락 하락폭이 세후 배당금보다 작다면 배당락 전에 사는 편이 유리해요. 수수료는 두 경우 같다고 보고 뺐고, 배당 지급일까지 기다리는 기간의 이자도 반영하지 않았어요. 연간 이자·배당 합계가 2천만 원을 넘으면 종합과세로 세율이 더 높아질 수 있어요.</div></div>' +
            U.foot();
        }
        U.bindInputs(el, ['cash', 'px', 'dps', 'drop', 'tax'], calc);
        el.querySelector('#dq').addEventListener('click', function (e) { var c = e.target.closest('.sc-chip'); if (!c) return; U.set(el, 'drop', Math.round(U.val(el, 'dps') * parseFloat(c.dataset.k))); calc(); });
        el.querySelector('#xq').addEventListener('click', function (e) { var c = e.target.closest('.sc-chip'); if (!c) return; el.querySelector('#tax').value = c.dataset.t; calc(); });
        calc();
      }

      function show() {
        var sb = el.querySelectorAll('#seg button'); for (var i = 0; i < sb.length; i++) sb[i].classList.toggle('on', sb[i].dataset.v === st.mode);
        if (st.mode === 'record') viewRecord(); else if (st.mode === 'settle') viewSettle(); else viewCompare();
      }
      el.querySelector('#seg').addEventListener('click', function (e) { var bt = e.target.closest('button'); if (!bt) return; st.mode = bt.dataset.v; show(); });
      el.addEventListener('click', function (e) { var c = e.target.closest('#mk .sc-chip'); if (!c) return; st.m = c.dataset.m; show(); });
      show();
    }
  });
})();
