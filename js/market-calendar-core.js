/* stockchild.com 공통 영업일 엔진 (market-calendar-core) v1.0 (2026-09-30)
   여러 위젯이 함께 쓰는 휴장일, 결제일, 배당 마지막 매수일, 거래시간 계산 모듈입니다.
   사용법: 이 파일을 위젯 JS보다 먼저 불러오면 window.SCCal 로 모든 기능을 쓸 수 있습니다.

   [매년 12월 갱신할 곳]
   1) HOL: 거래소 휴장일 (한국 2027년은 거래소 공식 발표 후 '잠정' 해제)
   2) SETTLE_ONLY: 미국 결제만 쉬는 날 (콜럼버스 데이, 재향군인의 날)
   3) SP: 특수일 (수능일, 연초 개장일, 미국 조기폐장, 영국 반일장)
   4) COVER: 데이터가 확정된 기간과 잠정 기간
   갱신 후 VERSION 숫자를 올리고, 위젯 블록의 ?v= 숫자도 함께 올려주세요. */
(function () {
  'use strict';
  if (window.SCCal) return; // 한 페이지에 여러 위젯이 있어도 한 번만 실행

  var VERSION = '1.0';
  var UPDATED = '2026-09-30';
  var US_OVERNIGHT_FROM = '2026-12-07'; // 미국 야간거래 첫 거래일. 연기되면 이 날짜만 수정

  var MARKETS = {
    kr: { name: '한국', city: '서울', tz: 'Asia/Seoul', settleDays: 2 },
    us: { name: '미국', city: '뉴욕', tz: 'America/New_York', settleDays: 1 },
    cn: { name: '중국', city: '상하이', tz: 'Asia/Shanghai', settleDays: null },
    uk: { name: '영국', city: '런던', tz: 'Europe/London', settleDays: null }
  };

  // ---------- 거래소 휴장일 (현지 날짜) ----------
  var HOL = {
    kr: {
      '2025-12-25': '성탄절', '2025-12-31': '연말 휴장',
      '2026-01-01': '신정', '2026-02-16': '설날', '2026-02-17': '설날', '2026-02-18': '설날',
      '2026-03-02': '삼일절 대체휴일', '2026-05-01': '근로자의 날', '2026-05-05': '어린이날',
      '2026-05-25': '부처님오신날 대체휴일', '2026-06-03': '지방선거', '2026-07-17': '제헌절',
      '2026-08-17': '광복절 대체휴일', '2026-09-24': '추석', '2026-09-25': '추석',
      '2026-10-05': '개천절 대체휴일', '2026-10-09': '한글날', '2026-12-25': '성탄절', '2026-12-31': '연말 휴장',
      // 2027년: 관공서 공휴일 기준 잠정 (거래소 공식 발표 전)
      '2027-01-01': '신정', '2027-02-08': '설날', '2027-02-09': '설날 대체휴일', '2027-03-01': '삼일절',
      '2027-05-03': '노동절 대체휴일', '2027-05-05': '어린이날', '2027-05-13': '부처님오신날',
      '2027-07-19': '제헌절 대체휴일', '2027-08-16': '광복절 대체휴일',
      '2027-09-14': '추석', '2027-09-15': '추석', '2027-09-16': '추석',
      '2027-10-04': '개천절 대체휴일', '2027-10-11': '한글날 대체휴일', '2027-12-27': '성탄절 대체휴일', '2027-12-31': '연말 휴장'
    },
    us: {
      '2026-01-01': '신정', '2026-01-19': '마틴 루터 킹 데이', '2026-02-16': '대통령의 날', '2026-04-03': '성금요일',
      '2026-05-25': '메모리얼 데이', '2026-06-19': '준틴스', '2026-07-03': '독립기념일 대체', '2026-09-07': '노동절',
      '2026-11-26': '추수감사절', '2026-12-25': '크리스마스',
      '2027-01-01': '신정', '2027-01-18': '마틴 루터 킹 데이', '2027-02-15': '대통령의 날', '2027-03-26': '성금요일',
      '2027-05-31': '메모리얼 데이', '2027-06-18': '준틴스 대체', '2027-07-05': '독립기념일 대체', '2027-09-06': '노동절',
      '2027-11-25': '추수감사절', '2027-12-24': '크리스마스 대체'
    },
    cn: { '2026-10-01': '국경절', '2026-10-02': '국경절', '2026-10-05': '국경절', '2026-10-06': '국경절', '2026-10-07': '국경절', '2027-01-01': '원단' },
    uk: { '2026-12-25': '크리스마스', '2026-12-28': '박싱데이 대체' }
  };

  // ---------- 거래는 열리지만 결제는 쉬는 날 (미국 은행 휴일) ----------
  var SETTLE_ONLY = {
    kr: {},
    us: { '2026-10-12': '콜럼버스 데이', '2026-11-11': '재향군인의 날', '2027-10-11': '콜럼버스 데이', '2027-11-11': '재향군인의 날' },
    cn: {}, uk: {}
  };

  // ---------- 특수일 ----------
  var SP = {
    kr: { '2026-11-19': 'suneung', '2027-01-04': 'late_open' },
    us: { '2026-11-27': 'early', '2026-12-24': 'early', '2027-11-26': 'early' },
    uk: { '2026-12-24': 'half', '2026-12-31': 'half' },
    cn: {}
  };
  var SP_NAME = { suneung: '수능일: 10시 개장, 16시 30분 마감', late_open: '연초 개장일: 10시 개장', early: '조기폐장: 13시 마감', half: '반일장: 12시 30분 마감' };

  // ---------- 데이터가 들어 있는 기간 ----------
  // firm: 거래소 공식 발표 기준으로 확정된 마지막 날, to: 잠정 포함 마지막 날
  var COVER = {
    kr: { from: '2025-12-01', firm: '2026-12-31', to: '2027-12-31' },
    us: { from: '2026-01-01', firm: '2027-12-31', to: '2027-12-31' },
    cn: { from: '2026-09-01', firm: '2026-12-31', to: '2027-01-01' },
    uk: { from: '2026-09-01', firm: '2026-12-31', to: '2026-12-31' }
  };

  var WD = ['일', '월', '화', '수', '목', '금', '토'];
  function pad(n) { return String(n).padStart(2, '0'); }

  // ---------- 날짜 기본 도구 (시간대와 무관한 달력 계산) ----------
  function toUTC(ymd) { var a = ymd.split('-').map(Number); return Date.UTC(a[0], a[1] - 1, a[2]); }
  function addDays(ymd, k) { return new Date(toUTC(ymd) + k * 864e5).toISOString().slice(0, 10); }
  function weekday(ymd) { return new Date(toUTC(ymd)).getUTCDay(); }
  function diffDays(a, b) { return Math.round((toUTC(b) - toUTC(a)) / 864e5); } // b - a
  function isYmd(s) { return typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(toUTC(s)) && new Date(toUTC(s)).toISOString().slice(0, 10) === s; }
  function md(ymd) { var a = ymd.split('-').map(Number); return a[1] + '/' + a[2] + '(' + WD[weekday(ymd)] + ')'; }
  function fullDate(ymd) { var a = ymd.split('-').map(Number); return a[0] + '년 ' + a[1] + '월 ' + a[2] + '일(' + WD[weekday(ymd)] + ')'; }

  // ---------- 시간대 도구 (증시 시계와 동일) ----------
  var FC = {};
  function parts(tz, date) {
    var f = FC[tz] || (FC[tz] = new Intl.DateTimeFormat('en-US', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    var o = {};
    f.formatToParts(date).forEach(function (x) { o[x.type] = x.value; });
    var h = +o.hour; if (h === 24) h = 0;
    var y = +o.year, mo = +o.month, d = +o.day, mi = +o.minute, s = +o.second;
    var ymd = o.year + '-' + o.month + '-' + o.day;
    return {
      y: y, mo: mo, d: d, h: h, mi: mi, s: s, ymd: ymd, wd: weekday(ymd),
      offset: Math.round((Date.UTC(y, mo - 1, d, h, mi, s) - Math.floor(date.getTime() / 1000) * 1000) / 60000),
      cur: h * 60 + mi + s / 60
    };
  }
  function localToUTC(tz, ymd, min) {
    var g = toUTC(ymd) + min * 60000;
    var o1 = parts(tz, new Date(g)).offset, t = g - o1 * 60000, o2 = parts(tz, new Date(t)).offset;
    if (o2 !== o1) t = g - o2 * 60000;
    return t;
  }
  function todayYmd(m) { return parts(MARKETS[m].tz, new Date()).ymd; }

  // ---------- 영업일 판정 ----------
  function holidayName(m, ymd) { return HOL[m][ymd] || null; }
  function isTradingDay(m, ymd) { var w = weekday(ymd); return w !== 0 && w !== 6 && !HOL[m][ymd]; }
  function isSettleDay(m, ymd) { return isTradingDay(m, ymd) && !SETTLE_ONLY[m][ymd]; }
  function coverage(m, ymd) {
    var c = COVER[m];
    if (ymd < c.from || ymd > c.to) return 'none';
    return ymd <= c.firm ? 'firm' : 'tentative';
  }
  // 이유 설명: 그 날이 왜 쉬는지 (없으면 null)
  function closedReason(m, ymd) {
    var w = weekday(ymd);
    if (w === 0 || w === 6) return '주말';
    if (HOL[m][ymd]) return HOL[m][ymd];
    if (SETTLE_ONLY[m][ymd]) return SETTLE_ONLY[m][ymd] + ' (거래는 되지만 결제 휴일)';
    return null;
  }

  function nextTradingDay(m, ymd, inclusive) {
    var d = inclusive ? ymd : addDays(ymd, 1);
    for (var i = 0; i < 30; i++) { if (isTradingDay(m, d)) return d; d = addDays(d, 1); }
    return null;
  }
  function prevTradingDay(m, ymd, inclusive) {
    var d = inclusive ? ymd : addDays(ymd, -1);
    for (var i = 0; i < 30; i++) { if (isTradingDay(m, d)) return d; d = addDays(d, -1); }
    return null;
  }
  // ymd 다음부터 결제 영업일을 n개 센 날짜
  function addSettleDays(m, ymd, n) {
    var d = ymd, cnt = 0;
    for (var i = 0; i < 60 && cnt < n; i++) { d = addDays(d, 1); if (isSettleDay(m, d)) cnt++; }
    return cnt === n ? d : null;
  }
  // 두 날짜 사이 거래일 수 (a 초과, b 이하)
  function tradingDaysBetween(m, a, b) {
    if (b <= a) return 0;
    var n = 0, d = a;
    for (var i = 0; i < 800 && d < b; i++) { d = addDays(d, 1); if (isTradingDay(m, d)) n++; }
    return n;
  }

  function cov2(m, a, b) { // 두 날짜 중 더 나쁜 커버리지
    var ca = coverage(m, a), cb = coverage(m, b);
    if (ca === 'none' || cb === 'none') return 'none';
    return (ca === 'tentative' || cb === 'tentative') ? 'tentative' : 'firm';
  }

  // ---------- 핵심 1: 매매 결제일 ----------
  // 반환: { ok, trade, settle, days, coverage, note, error }
  function settleDate(m, tradeYmd) {
    var mk = MARKETS[m];
    if (!mk || !mk.settleDays) return { ok: false, error: '이 시장은 결제일 계산을 지원하지 않아요.' };
    if (!isYmd(tradeYmd)) return { ok: false, error: '날짜 형식이 올바르지 않아요.' };
    if (coverage(m, tradeYmd) === 'none') return { ok: false, error: '아직 휴장일 정보가 없는 날짜예요.' };
    if (!isTradingDay(m, tradeYmd)) {
      return { ok: false, error: '이날은 ' + (closedReason(m, tradeYmd) || '휴장일') + '이라 매매가 없어요.', nextTrading: nextTradingDay(m, tradeYmd, false) };
    }
    var s = addSettleDays(m, tradeYmd, mk.settleDays);
    if (!s) return { ok: false, error: '결제일을 계산할 수 없어요.' };
    var skipped = [];
    for (var d = addDays(tradeYmd, 1); d < s; d = addDays(d, 1)) { var r = closedReason(m, d); if (r) skipped.push({ ymd: d, reason: r }); }
    return {
      ok: true, trade: tradeYmd, settle: s, days: mk.settleDays,
      calendarDays: diffDays(tradeYmd, s), skipped: skipped, coverage: cov2(m, tradeYmd, s)
    };
  }

  // ---------- 핵심 2: 배당(권리) 받으려면 언제까지 사야 하나 ----------
  // recordYmd: 배당 기준일(주주명부 기준일)
  // 반환: { ok, record, lastBuy, exDate, coverage, recordClosed, error }
  function lastBuyForRecord(m, recordYmd) {
    var mk = MARKETS[m];
    if (!mk || !mk.settleDays) return { ok: false, error: '이 시장은 배당 매수일 계산을 지원하지 않아요.' };
    if (!isYmd(recordYmd)) return { ok: false, error: '날짜 형식이 올바르지 않아요.' };
    if (coverage(m, recordYmd) === 'none') return { ok: false, error: '아직 휴장일 정보가 없는 날짜예요.' };
    // 결제일이 기준일 이하가 되는 가장 늦은 거래일을 뒤에서부터 찾음
    var t = prevTradingDay(m, recordYmd, true);
    for (var i = 0; i < 20 && t; i++) {
      var s = addSettleDays(m, t, mk.settleDays);
      if (s && s <= recordYmd) {
        var ex = nextTradingDay(m, t, false);
        return {
          ok: true, record: recordYmd, lastBuy: t, exDate: ex,
          recordClosed: closedReason(m, recordYmd),
          daysLeftFromToday: diffDays(todayYmd(m), t),
          coverage: cov2(m, t, recordYmd)
        };
      }
      t = prevTradingDay(m, t, false);
    }
    return { ok: false, error: '마지막 매수일을 계산할 수 없어요.' };
  }

  // ---------- 증시 시계용 거래시간표 (현지 분 단위) ----------
  function segments(m, ymd) {
    var tr = isTradingDay(m, ymd), sp = SP[m][ymd], s = [];
    if (m === 'kr' && tr) {
      if (sp === 'suneung') s = [[580, 600, 'auction_open'], [600, 980, 'regular'], [980, 990, 'auction_close'], [990, 1020, 'offhours'], [1020, 1200, 'after']];
      else if (sp === 'late_open') s = [[580, 600, 'auction_open'], [600, 920, 'regular'], [920, 930, 'auction_close'], [930, 960, 'offhours'], [960, 1200, 'after']];
      else s = [[480, 520, 'pre'], [520, 540, 'auction_open'], [540, 920, 'regular'], [920, 930, 'auction_close'], [930, 960, 'offhours'], [960, 1200, 'after']];
    }
    if (m === 'cn' && tr) s = [[555, 570, 'auction_open'], [570, 690, 'regular'], [690, 780, 'lunch'], [780, 897, 'regular'], [897, 900, 'auction_close']];
    if (m === 'uk' && tr) s = sp === 'half' ? [[470, 480, 'auction_open'], [480, 750, 'regular'], [750, 755, 'auction_close']] : [[470, 480, 'auction_open'], [480, 990, 'regular'], [990, 995, 'auction_close']];
    if (m === 'us') {
      if (tr && ymd >= US_OVERNIGHT_FROM) s.push([0, 240, 'overnight']);
      if (tr) (sp === 'early' ? [[240, 570, 'pre'], [570, 780, 'regular'], [780, 1020, 'after']] : [[240, 570, 'pre'], [570, 960, 'regular'], [960, 1200, 'after']]).forEach(function (x) { s.push(x); });
      var n = addDays(ymd, 1);
      if (n >= US_OVERNIGHT_FROM && isTradingDay('us', n)) s.push([1260, 1440, 'overnight']);
    }
    return s;
  }

  window.SCCal = {
    VERSION: VERSION, UPDATED: UPDATED, US_OVERNIGHT_FROM: US_OVERNIGHT_FROM,
    MARKETS: MARKETS, HOL: HOL, SETTLE_ONLY: SETTLE_ONLY, SP: SP, SP_NAME: SP_NAME, COVER: COVER, WD: WD,
    pad: pad, toUTC: toUTC, addDays: addDays, weekday: weekday, diffDays: diffDays, isYmd: isYmd, md: md, fullDate: fullDate,
    parts: parts, localToUTC: localToUTC, todayYmd: todayYmd,
    holidayName: holidayName, isTradingDay: isTradingDay, isSettleDay: isSettleDay, coverage: coverage, closedReason: closedReason,
    nextTradingDay: nextTradingDay, prevTradingDay: prevTradingDay, addSettleDays: addSettleDays, tradingDaysBetween: tradingDaysBetween,
    settleDate: settleDate, lastBuyForRecord: lastBuyForRecord, segments: segments
  };
})();
