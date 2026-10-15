/* stockchild.com 연말 손익확정 마감일 (sc-tool-year-end-deadline) v1.0 (2026-10-15)
   149선 No.6. id: year-end-deadline
   필요 파일: market-calendar-core.js (결제일, 휴장일), sc-ui.js
   원리: 해외주식 양도소득은 결제일이 속한 연도로 귀속됩니다. 그래서 "올해 손익으로 잡히는 마지막 매도일"은
   결제일이 12/31 이내인 마지막 거래일입니다. 시장은 한국과 미국만 지원합니다(엔진의 결제일 지원 범위). */
(function () {
  'use strict';

  var LINK_TAX = 'https://stockchild.com/%ed%95%b4%ec%99%b8%ec%a3%bc%ec%8b%9d-%ec%96%91%eb%8f%84%ec%84%b8-%ea%b3%84%ec%82%b0%ea%b8%b0/';
  var LINK_MAJOR = 'https://stockchild.com/%eb%8c%80%ec%a3%bc%ec%a3%bc-%ec%96%91%eb%8f%84%ec%84%b8-%ed%9a%8c%ed%94%bc-%ec%ba%98%eb%a6%b0%eb%8d%94/';
  var LABEL = { us: '미국주식', kr: '한국주식' };

  // 미국 정규장 마감을 한국시간으로 환산 (조기폐장일 반영)
  function closeKst(cal, ymd) {
    var segs = cal.segments('us', ymd), endMin = 960, i;
    for (i = 0; i < segs.length; i++) { if (segs[i][2] === 'regular') endMin = segs[i][1]; }
    var t = cal.parts('Asia/Seoul', new Date(cal.localToUTC('America/New_York', ymd, endMin)));
    return { ymd: t.ymd, h: t.h, mi: t.mi, localMin: endMin };
  }
  // 한국 정규장 마감 시각(종가 단일가 끝) 분 단위. 수능일 등 특수일은 엔진 시간표를 따릅니다.
  function closeKr(cal, ymd) {
    var segs = cal.segments('kr', ymd), endMin = 930, i;
    for (i = 0; i < segs.length; i++) { if (segs[i][2] === 'auction_close') endMin = segs[i][1]; }
    return endMin;
  }

  // 오늘이 올해 마감일을 지났으면 내년분을 기본으로
  function defaultYear(cal, m, today) {
    var y = Number(today.slice(0, 4));
    var r = cal.lastBuyForRecord(m, y + '-12-31');
    if (r.ok && r.lastBuy < today) return y + 1;
    return y;
  }

  // o: { market: 'us'|'kr', year: 2026, today?: 'YYYY-MM-DD' }
  function calc(o, cal) {
    var R = { ok: false, errors: [], warns: [] };
    if (!cal) { R.errors.push('영업일 엔진(market-calendar-core.js)을 불러오지 못했어요.'); return R; }
    var m = o.market, y = Number(o.year);
    if (m !== 'us' && m !== 'kr') { R.errors.push('시장을 선택해 주세요.'); return R; }
    var yearEnd = y + '-12-31';
    var r = cal.lastBuyForRecord(m, yearEnd);
    if (!r.ok) { R.errors.push(y + '년 연말 일정은 아직 준비되지 않았어요.'); return R; }
    var last = r.lastBuy;
    var sd = cal.settleDate(m, last);
    if (!sd.ok) { R.errors.push('결제일을 계산할 수 없어요.'); return R; }
    var n = cal.MARKETS[m].settleDays;

    // 연말 마지막 거래일 (이날 팔아도 결제가 내년이면 내년분)
    var lastTrading = cal.prevTradingDay(m, yearEnd, true);
    var ltSettle = cal.settleDate(m, lastTrading).settle;

    // 표: 마감일 앞 4거래일 ~ 뒤 3거래일, 사이의 평일 휴장일도 함께
    var before = [], after = [], d = last, i;
    for (i = 0; i < 4; i++) { d = cal.prevTradingDay(m, d, false); before.unshift(d); }
    d = last;
    for (i = 0; i < 3; i++) { d = cal.nextTradingDay(m, d, false); after.push(d); }
    var start = before[0], end = after[after.length - 1], rows = [], hl = -1, outOfData = false, cur;
    for (cur = start; cur <= end; cur = cal.addDays(cur, 1)) {
      if (cal.isTradingDay(m, cur)) {
        var s = cal.addSettleDays(m, cur, n);
        if (cal.coverage(m, cur) === 'none' || (s && cal.coverage(m, s) === 'none')) outOfData = true;
        if (cur === last) hl = rows.length;
        rows.push({ ymd: cur, closed: false, settle: s, thisYear: s <= yearEnd });
      } else {
        var wd = cal.weekday(cur);
        if (wd !== 0 && wd !== 6) rows.push({ ymd: cur, closed: true, reason: cal.closedReason(m, cur) || '휴장' });
      }
    }

    var daysLeft = cal.diffDays(o.today || cal.todayYmd(m), last);
    var closing = null;
    if (m === 'us') {
      var k = closeKst(cal, last);
      closing = { kind: 'us', kst: k, early: cal.SP.us[last] === 'early' };
    } else {
      var em = closeKr(cal, last);
      closing = { kind: 'kr', min: em };
    }

    if (r.coverage === 'tentative') R.warns.push('이 연도의 한국 휴장일은 잠정이에요. 거래소 공식 발표 후 마감일이 달라질 수 있어요.');
    if (outOfData) R.warns.push('다음 해 초 일정은 휴장일 정보가 없어 평일 기준으로 계산했어요.');

    R.ok = true;
    R.market = m; R.year = y; R.last = last; R.settle = sd.settle; R.days = n; R.daysLeft = daysLeft;
    R.rows = rows; R.hl = hl; R.closing = closing;
    R.lastTrading = lastTrading; R.ltSettle = ltSettle; R.ltNextYear = ltSettle > yearEnd;
    var nx = cal.nextTradingDay(m, last, false);
    R.nextAfter = { ymd: nx, settle: cal.addSettleDays(m, nx, n) };
    return R;
  }
  window.SCYearEnd = { calc: calc, closeKst: closeKst, defaultYear: defaultYear };

  // ---------- 화면 ----------
  var CSS = [
    '.sc-chips-row{display:flex;flex-direction:column;gap:14px}',
    '.sc-sub{font-size:12px;font-weight:600;color:var(--sub);margin:0 0 8px}',
    '.sc-gap{margin-top:12px}',
    '.yes{color:var(--ok-tx);font-weight:700}.no{color:var(--up);font-weight:700}',
    '.mute{color:var(--muted)}'
  ].join('');

  function render(wrap, U) {
    var cal = window.SCCal;
    var today = cal ? cal.todayYmd('kr') : '';
    var baseYear = today ? Number(today.slice(0, 4)) : 2026;
    var state = { market: 'us', year: cal ? defaultYear(cal, 'us', today) : baseYear };

    function chip(attr, val, label, on) { return '<button type="button" class="sc-chip' + (on ? ' on' : '') + '" data-' + attr + '="' + val + '">' + label + '</button>'; }

    wrap.innerHTML =
      '<div class="sc-card">' +
      U.header('세금 센터', '연말 손익확정 마감일', '올해 손익으로 잡히려면 언제까지 팔아야 할까요? 결제일 기준으로 계산해요.') +
      '<div class="sc-sec sc-chips-row">' +
      '<div><div class="sc-sub">시장</div><div class="sc-chips" id="ye-m">' + chip('m', 'us', LABEL.us, true) + chip('m', 'kr', LABEL.kr, false) + '</div></div>' +
      '<div><div class="sc-sub">손익이 귀속되는 연도</div><div class="sc-chips" id="ye-y">' +
      chip('y', baseYear, baseYear + '년', state.year === baseYear) + chip('y', baseYear + 1, (baseYear + 1) + '년', state.year === baseYear + 1) + '</div></div>' +
      '</div>' +
      '<div class="sc-sec" id="ye-out"></div>' +
      U.foot('결제일은 거래소 휴장일 기준으로 계산했고, 증권사별 주문 마감 시각은 다를 수 있어요.') +
      '</div>';

    var out = wrap.querySelector('#ye-out');

    function update() {
      var r = calc({ market: state.market, year: state.year }, cal);
      if (!r.ok) { out.innerHTML = '<div class="sc-note warn">' + r.errors.map(U.esc).join('<br>') + '</div>'; return; }
      var y = r.year, h = '';
      if (r.warns.length) h += '<div class="sc-note warn sc-gap">' + r.warns.map(U.esc).join('<br>') + '</div>';

      var dd = r.daysLeft > 0 ? 'D-' + r.daysLeft : (r.daysLeft === 0 ? 'D-DAY' : '지났어요');
      var closeTxt;
      if (r.closing.kind === 'us') {
        var k = r.closing.kst;
        closeTxt = '정규장 마감 한국시간 ' + cal.md(k.ymd) + ' ' + cal.pad(k.h) + ':' + cal.pad(k.mi) + (r.closing.early ? ' (조기폐장)' : '');
      } else {
        closeTxt = '정규장 마감 ' + cal.pad(Math.floor(r.closing.min / 60)) + ':' + cal.pad(r.closing.min % 60);
      }

      h += '<div class="sc-sec-t sc-gap">' + y + '년 ' + LABEL[r.market] + ' 핵심 결과</div><div class="sc-kpis">' +
        U.kpi('마지막 매도일', cal.md(r.last), closeTxt, true) +
        U.kpi('남은 기간', dd, r.daysLeft > 0 ? '오늘 기준 ' + r.daysLeft + '일' : (r.daysLeft === 0 ? '오늘이 마지막 매도일이에요' : '올해분은 마감됐어요')) +
        U.kpi('결제일', cal.md(r.settle), y + '년 안에 결제돼요') +
        '</div>';

      h += '<div class="sc-sec"><div class="sc-sec-t">상세 결과</div><div class="sc-rows">' +
        U.row('결제 주기', 'T+' + r.days + ' (거래일 기준)') +
        U.row('다음 거래일에 팔면', cal.md(r.nextAfter.ymd) + ' 매도 → ' + cal.md(r.nextAfter.settle) + ' 결제 (' + (y + 1) + '년분)') +
        (r.ltNextYear ? U.row('연말 마지막 거래일', cal.md(r.lastTrading) + ' 매도도 ' + cal.md(r.ltSettle) + ' 결제라 ' + (y + 1) + '년분') : '') +
        '</div></div>';

      h += '<div class="sc-sec"><div class="sc-sec-t">날짜별 귀속 연도</div>' +
        U.table(['매도일', '결제일', '귀속 연도'], r.rows.map(function (x) {
          if (x.closed) return [cal.md(x.ymd), '<span class="mute">휴장 (' + U.esc(x.reason) + ')</span>', '-'];
          return [cal.md(x.ymd), cal.md(x.settle), x.thisYear ? '<span class="yes">' + y + '년</span>' : '<span class="no">' + (y + 1) + '년</span>'];
        }), r.hl) + '</div>';

      h += '<div class="sc-sec"><div class="sc-note"><b>어떻게 계산하나요</b><br>' +
        '해외주식 양도소득은 매도한 날이 아니라 결제일이 속한 연도로 잡혀요. 그래서 올해 손익으로 넣으려면 결제일이 12월 31일 이내여야 하고, 그 조건을 만족하는 마지막 거래일이 위의 마지막 매도일이에요. ' +
        (r.market === 'kr' ? '한국은 12월 31일이 휴장이라 폐장일에 팔아도 결제가 내년으로 넘어가서, 마감일이 더 앞당겨져요.' : '미국은 T+1이라 연말 마지막 거래일에 팔면 결제가 내년 1월로 넘어가요.') +
        '</div></div>' +
        '<div class="sc-sec"><div class="sc-note warn"><b>꼭 확인하세요</b><br>' +
        '증권사마다 주문 마감 시각, 시간외와 야간거래 가능 여부가 달라요. 마감일 당일보다 하루 이틀 여유를 두고 증권사 공지를 확인해 주세요.</div></div>' +
        '<div class="sc-sec"><div class="sc-note"><b>국내 상장주식은 대부분 해당이 없어요</b><br>' +
        '장내에서 국내 상장주식을 거래하는 소액주주는 양도소득세 대상이 아니에요. 대주주는 연말 보유 상태로 판정해서 마감일 계산이 달라질 수 있으니, 아래 대주주 양도세 회피 캘린더를 확인해 보세요.</div></div>' +
        '<div class="sc-sec"><div class="sc-sec-t">함께 보면 좋은 도구</div><div class="sc-links">' +
        '<a class="sc-link" href="' + LINK_TAX + '" target="_blank" rel="noopener"><span>해외주식 양도세 계산기</span><span>↗</span></a>' +
        '<a class="sc-link" href="' + LINK_MAJOR + '" target="_blank" rel="noopener"><span>대주주 양도세 회피 캘린더</span><span>↗</span></a>' +
        '</div></div>';
      out.innerHTML = h;
    }

    function bind(id, key, num) {
      wrap.querySelector('#' + id).addEventListener('click', function (e) {
        var b = e.target.closest ? e.target.closest('.sc-chip') : null;
        if (!b) return;
        state[key] = num ? Number(b.getAttribute('data-' + (key === 'year' ? 'y' : 'm'))) : b.getAttribute('data-' + (key === 'year' ? 'y' : 'm'));
        var chips = wrap.querySelectorAll('#' + id + ' .sc-chip');
        for (var i = 0; i < chips.length; i++) chips[i].className = 'sc-chip' + (chips[i] === b ? ' on' : '');
        update();
      });
    }
    bind('ye-m', 'market', false);
    bind('ye-y', 'year', true);
    update();
  }

  if (window.SCTools) window.SCTools.register({ id: 'year-end-deadline', css: CSS, render: render });
})();
