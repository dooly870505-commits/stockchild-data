/* stockchild.com 글로벌 증시 시계 v1.1 (2026-09-28): 시계판 숫자 1~12, 플립 카드 디지털
   거래시간은 현지 시각으로 정의하고 IANA 시간대로 계산하므로 서머타임은 브라우저가 자동 반영합니다.
   매년 12월: HOL(휴장일)과 SP(특수일) 목록만 갱신하면 됩니다. */
(function () {
  'use strict';
  var gmc_root = document.getElementById('gmc-root');
  if (!gmc_root) return;

  var GMC_UPDATED = '2026-09-28';
  var GMC_ON = '2026-12-07'; // 미국 야간거래 첫 거래일 (현지 12/6 일요일 밤 9시 시작). 연기되면 이 날짜만 수정

  var MK = [
    { id: 'kr', name: '서울', ex: 'KRX, NXT', tz: 'Asia/Seoul' },
    { id: 'us', name: '뉴욕', ex: 'NYSE, Nasdaq', tz: 'America/New_York' },
    { id: 'cn', name: '상하이', ex: 'SSE', tz: 'Asia/Shanghai' },
    { id: 'uk', name: '런던', ex: 'LSE', tz: 'Europe/London' }
  ];
  var WD = ['일', '월', '화', '수', '목', '금', '토'];

  // 휴장일 (현지 날짜 기준). 중국·영국 2027년은 12월 공식 발표 후 추가
  var HOL = {
    kr: { '2026-10-05': '개천절 대체휴일', '2026-10-09': '한글날', '2026-12-25': '성탄절', '2026-12-31': '연말 휴장', '2027-01-01': '신정' },
    us: { '2026-11-26': '추수감사절', '2026-12-25': '크리스마스', '2027-01-01': '신정', '2027-01-18': '마틴 루터 킹 데이', '2027-02-15': '대통령의 날', '2027-03-26': '성금요일', '2027-05-31': '메모리얼 데이', '2027-06-18': '준틴스 대체', '2027-07-05': '독립기념일 대체', '2027-09-06': '노동절', '2027-11-25': '추수감사절', '2027-12-24': '크리스마스 대체' },
    cn: { '2026-10-01': '국경절', '2026-10-02': '국경절', '2026-10-05': '국경절', '2026-10-06': '국경절', '2026-10-07': '국경절', '2027-01-01': '원단' },
    uk: { '2026-12-25': '크리스마스', '2026-12-28': '박싱데이 대체' }
  };
  // 특수일: suneung(수능), late_open(연초 개장일), early(미국 조기폐장), half(영국 반일장)
  var SP = {
    kr: { '2026-11-19': 'suneung', '2027-01-04': 'late_open' },
    us: { '2026-11-27': 'early', '2026-12-24': 'early', '2027-11-26': 'early' },
    uk: { '2026-12-24': 'half', '2026-12-31': 'half' },
    cn: {}
  };
  var SPN = { suneung: '수능일: 10시 개장, 16시 30분 마감', late_open: '연초 개장일: 10시 개장', early: '조기폐장: 13시 마감', half: '반일장: 12시 30분 마감' };
  var NOTICES = [{ m: 'us', ymd: '2026-12-06', t: '미국 야간거래 시작 (현지 밤 9시, 한국시간 12/7 오전 11시)' }];

  var SHORT = { pre: '프리마켓', auction_open: '장전 동시호가', regular: '정규장', auction_close: '장마감 동시호가', offhours: '시간외 종가', after: '애프터마켓', lunch: '점심 휴장', overnight: '야간거래' };
  var LAB = { pre: '프리마켓 진행 중', auction_open: '장전 동시호가', regular: '정규장 개장 중', auction_close: '장마감 동시호가', offhours: '시간외 종가 매매', after: '애프터마켓 진행 중', lunch: '점심 휴장', overnight: '야간거래 진행 중' };
  var FAM = { regular: 'reg', pre: 'ext', after: 'ext', offhours: 'ext', overnight: 'night', auction_open: 'auc', auction_close: 'auc', lunch: 'auc' };
  var COL = {
    reg: { ring: '#1FA463', face: '#E4F5EB', text: '#137A47' },
    ext: { ring: '#2F6FEB', face: '#E6EEFF', text: '#1F54C4' },
    auc: { ring: '#E0A100', face: '#FFF4D6', text: '#8A6100' },
    night: { ring: '#7B55E8', face: '#EEE9FD', text: '#5A37C4' },
    closed: { ring: '#B8BDC4', face: '#F4F5F7', text: '#5F6670' }
  };

  function pad(n) { return String(n).padStart(2, '0'); }

  // ---------- 시간 엔진 ----------
  var FC = {};
  function parts(tz, date) {
    var f = FC[tz] || (FC[tz] = new Intl.DateTimeFormat('en-US', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    var o = {};
    f.formatToParts(date).forEach(function (x) { o[x.type] = x.value; });
    var h = +o.hour; if (h === 24) h = 0;
    var y = +o.year, mo = +o.month, d = +o.day, mi = +o.minute, s = +o.second;
    return {
      y: y, mo: mo, d: d, h: h, mi: mi, s: s,
      wd: new Date(Date.UTC(y, mo - 1, d)).getUTCDay(),
      offset: Math.round((Date.UTC(y, mo - 1, d, h, mi, s) - Math.floor(date.getTime() / 1000) * 1000) / 60000),
      ymd: o.year + '-' + o.month + '-' + o.day,
      cur: h * 60 + mi + s / 60
    };
  }
  function addD(ymd, k) {
    var a = ymd.split('-').map(Number), t = new Date(Date.UTC(a[0], a[1] - 1, a[2] + k));
    return { ymd: t.toISOString().slice(0, 10), wd: t.getUTCDay() };
  }
  function l2u(tz, ymd, min) {
    var a = ymd.split('-').map(Number), g = Date.UTC(a[0], a[1] - 1, a[2], 0, min);
    var o1 = parts(tz, new Date(g)).offset, t = g - o1 * 60000, o2 = parts(tz, new Date(t)).offset;
    if (o2 !== o1) t = g - o2 * 60000;
    return t;
  }
  function md(ymd) {
    var a = ymd.split('-').map(Number);
    return a[1] + '/' + a[2] + '(' + WD[new Date(Date.UTC(a[0], a[1] - 1, a[2])).getUTCDay()] + ')';
  }
  function isTr(m, ymd, wd) { return wd !== 0 && wd !== 6 && !HOL[m][ymd]; }

  // 하루 세션표: [시작분, 종료분, 상태키] (현지 시각, 0~1440)
  function segs(m, ymd, wd) {
    var tr = isTr(m, ymd, wd), sp = SP[m][ymd], s = [];
    if (m === 'kr' && tr) {
      if (sp === 'suneung') s = [[580, 600, 'auction_open'], [600, 980, 'regular'], [980, 990, 'auction_close'], [990, 1020, 'offhours'], [1020, 1200, 'after']];
      else if (sp === 'late_open') s = [[580, 600, 'auction_open'], [600, 920, 'regular'], [920, 930, 'auction_close'], [930, 960, 'offhours'], [960, 1200, 'after']];
      else s = [[480, 520, 'pre'], [520, 540, 'auction_open'], [540, 920, 'regular'], [920, 930, 'auction_close'], [930, 960, 'offhours'], [960, 1200, 'after']];
    }
    if (m === 'cn' && tr) s = [[555, 570, 'auction_open'], [570, 690, 'regular'], [690, 780, 'lunch'], [780, 897, 'regular'], [897, 900, 'auction_close']];
    if (m === 'uk' && tr) s = sp === 'half' ? [[470, 480, 'auction_open'], [480, 750, 'regular'], [750, 755, 'auction_close']] : [[470, 480, 'auction_open'], [480, 990, 'regular'], [990, 995, 'auction_close']];
    if (m === 'us') {
      if (tr && ymd >= GMC_ON) s.push([0, 240, 'overnight']);
      if (tr) (sp === 'early' ? [[240, 570, 'pre'], [570, 780, 'regular'], [780, 1020, 'after']] : [[240, 570, 'pre'], [570, 960, 'regular'], [960, 1200, 'after']]).forEach(function (x) { s.push(x); });
      var n = addD(ymd, 1);
      if (n.ymd >= GMC_ON && isTr('us', n.ymd, n.wd)) s.push([1260, 1440, 'overnight']);
    }
    return s;
  }

  function status(m, tz, T) {
    var p = parts(tz, new Date(T)), cur = p.cur, today = segs(m, p.ymd, p.wd), key, lab, until, ul;
    var seg = today.filter(function (x) { return cur >= x[0] && cur < x[1]; })[0];
    if (seg) {
      key = seg[2]; lab = LAB[key];
      var ey = p.ymd, em = seg[1];
      if (em === 1440) {
        var n = addD(p.ymd, 1), ns = segs(m, n.ymd, n.wd);
        if (ns[0] && ns[0][0] === 0 && ns[0][2] === key) { ey = n.ymd; em = ns[0][1]; }
      }
      until = l2u(tz, ey, em); ul = SHORT[key] + ' 종료까지';
    } else {
      key = 'closed';
      if (!isTr(m, p.ymd, p.wd)) lab = HOL[m][p.ymd] ? '휴장: ' + HOL[m][p.ymd] : '주말 휴장';
      else {
        var f = today.filter(function (x) { return x[2] !== 'overnight'; })[0];
        lab = f && cur < f[0] ? '개장 전' : '장 종료';
      }
      for (var k = 0; k < 15 && !until; k++) {
        var d = k ? addD(p.ymd, k) : { ymd: p.ymd, wd: p.wd }, ss = segs(m, d.ymd, d.wd);
        for (var i = 0; i < ss.length; i++) {
          if (k > 0 || ss[i][0] > cur) { until = l2u(tz, d.ymd, ss[i][0]); ul = SHORT[ss[i][2]] + ' 시작까지'; break; }
        }
      }
    }
    return { p: p, key: key, lab: lab, until: until, ul: ul, segs: today };
  }

  // 한국시간 기준 정규장 (진행 중이거나 다음 것)
  function regWin(m, tz, T, p) {
    for (var k = 0; k < 15; k++) {
      var d = k ? addD(p.ymd, k) : { ymd: p.ymd, wd: p.wd };
      var ss = segs(m, d.ymd, d.wd).filter(function (x) { return x[2] === 'regular' || x[2] === 'auction_close'; });
      if (!ss.length) continue;
      var st = Math.min.apply(null, ss.filter(function (x) { return x[2] === 'regular'; }).map(function (x) { return x[0]; }));
      var en = Math.max.apply(null, ss.map(function (x) { return x[1]; }));
      var a = l2u(tz, d.ymd, st), b = l2u(tz, d.ymd, en);
      if (b <= T) continue;
      var A = parts('Asia/Seoul', new Date(a)), B = parts('Asia/Seoul', new Date(b));
      return {
        label: a <= T ? '지금 정규장 (한국시간)' : '다음 정규장 ' + md(A.ymd) + ' (한국시간)',
        range: pad(A.h) + ':' + pad(A.mi) + ' ~ ' + (B.ymd !== A.ymd ? '익일 ' : '') + pad(B.h) + ':' + pad(B.mi)
      };
    }
    return null;
  }

  // 서머타임 정보 + 다음 전환일
  var DC = {};
  function dstInfo(tz, p) {
    var a = parts(tz, new Date(Date.UTC(p.y, 0, 15))).offset, b = parts(tz, new Date(Date.UTC(p.y, 6, 15))).offset;
    if (a === b) return null;
    var on = p.offset > Math.min(a, b), ck = tz + p.ymd;
    if (DC[ck] === undefined) {
      DC[ck] = null;
      var base = l2u(tz, p.ymd, 720);
      for (var k = 1; k < 370; k++) {
        var q = parts(tz, new Date(base + k * 864e5));
        if (q.offset !== p.offset) { DC[ck] = { ymd: q.ymd, n: k }; break; }
      }
    }
    return { on: on, next: DC[ck] };
  }

  function cd(ms) {
    var s = Math.max(0, Math.floor(ms / 1000)), d = Math.floor(s / 86400); s %= 86400;
    return (d ? d + '일 ' : '') + Math.floor(s / 3600) + ':' + pad(Math.floor(s % 3600 / 60)) + ':' + pad(s % 60);
  }

  // ---------- 시계 SVG ----------
  function pt(r, a) { var t = (a - 90) * Math.PI / 180; return [(100 + r * Math.cos(t)).toFixed(2), (100 + r * Math.sin(t)).toFixed(2)]; }
  function arc(r, a0, a1) {
    if (a1 - a0 >= 359.9) a1 = a0 + 359.9;
    var p0 = pt(r, a0), p1 = pt(r, a1);
    return 'M' + p0[0] + ' ' + p0[1] + ' A' + r + ' ' + r + ' 0 ' + (a1 - a0 > 180 ? 1 : 0) + ' 1 ' + p1[0] + ' ' + p1[1];
  }
  function clockSvg(mk, r) {
    var p = r.p, half = p.h < 12 ? 0 : 720, c = COL[FAM[r.key] || 'closed'];
    var g = '<circle cx="100" cy="100" r="82" fill="' + c.face + '"/>' +
      '<circle cx="100" cy="100" r="92" fill="none" stroke="#EEF0F3" stroke-width="8"/>';
    r.segs.forEach(function (x) {
      var a = Math.max(x[0], half), b = Math.min(x[1], half + 720);
      if (b <= a) return;
      g += '<path d="' + arc(92, (a - half) / 2, (b - half) / 2) + '" fill="none" stroke="' + COL[FAM[x[2]]].ring + '" stroke-width="8"/>';
    });
    for (var i = 0; i < 12; i++) {
      var t0 = pt(72, i * 30), t1 = pt(78, i * 30);
      g += '<line x1="' + t0[0] + '" y1="' + t0[1] + '" x2="' + t1[0] + '" y2="' + t1[1] + '" stroke="#16181D" stroke-width="2.2" stroke-linecap="round"/>';
    }
    for (var n = 1; n <= 12; n++) {
      var q = pt(61, n * 30);
      g += '<text x="' + q[0] + '" y="' + q[1] + '" text-anchor="middle" dominant-baseline="central" font-size="15" font-weight="600" fill="#16181D">' + n + '</text>';
    }
    g += '<text x="100" y="128" text-anchor="middle" dominant-baseline="central" font-size="11" font-weight="600" fill="#6B7280">' + (p.h < 12 ? '오전' : '오후') + '</text>';
    var ha = ((p.h % 12) * 60 + p.mi + p.s / 60) / 2, ma = (p.mi + p.s / 60) * 6, sa = p.s * 6;
    var H = pt(42, ha), M = pt(62, ma), S1 = pt(70, sa), S0 = pt(-14, sa);
    g += '<line x1="100" y1="100" x2="' + H[0] + '" y2="' + H[1] + '" stroke="#16181D" stroke-width="5.5" stroke-linecap="round"/>' +
      '<line x1="100" y1="100" x2="' + M[0] + '" y2="' + M[1] + '" stroke="#16181D" stroke-width="3.2" stroke-linecap="round"/>' +
      '<line x1="' + S0[0] + '" y1="' + S0[1] + '" x2="' + S1[0] + '" y2="' + S1[1] + '" stroke="#FF5A1F" stroke-width="1.6" stroke-linecap="round"/>' +
      '<circle cx="100" cy="100" r="4.5" fill="#FF5A1F"/>';
    var aria = mk.name + ' 현지 시각 ' + p.h + '시 ' + p.mi + '분, ' + r.lab;
    return '<svg class="gmc-svg" viewBox="0 0 200 200" role="img" aria-label="' + aria + '">' + g + '</svg>';
  }

  // ---------- 화면 ----------
  gmc_root.innerHTML =
    '<div class="gmc-wrap">' +
    '<div class="gmc-head"><div><div class="gmc-title">글로벌 증시 시계</div><div class="gmc-sub">서울, 뉴욕, 상하이, 런던의 현지 시각과 거래 상태</div></div><div class="gmc-now" id="gmc-now"></div></div>' +
    '<div class="gmc-sum" id="gmc-sum"></div>' +
    '<div class="gmc-ban" id="gmc-ban"></div>' +
    '<div class="gmc-grid">' + MK.map(function (mk) { return '<div class="gmc-card" id="gmc-c-' + mk.id + '"></div>'; }).join('') + '</div>' +
    '<div class="gmc-leg">' +
    [['reg', '정규장'], ['ext', '프리마켓, 애프터마켓'], ['auc', '동시호가, 점심 휴장'], ['night', '야간거래']].map(function (x) {
      return '<span><span class="gmc-sw" style="background:' + COL[x[0]].ring + '"></span>' + x[1] + '</span>';
    }).join('') +
    '<span>테두리 색은 지금 속한 오전 또는 오후 12시간의 세션이에요</span></div>' +
    '<div class="gmc-note">시장이 열려 있다는 사실 자체는 호재도 악재도 아니에요. 프리마켓과 애프터마켓은 정규장보다 거래량이 적어 가격이 크게 움직일 수 있고, 한국 애프터마켓은 ETF와 ETN 등 일부 종목이 제외됩니다. 거래 가능 종목과 주문 시간은 증권사마다 다를 수 있으니 주문 전 확인해 주세요. 투자 참고용이며 매수/매도 추천이 아닙니다.</div>' +
    '<div class="gmc-foot">기준: 한국거래소, 넥스트레이드, NYSE, 상하이증권거래소, 런던증권거래소 공지 | 휴장일 업데이트 ' + GMC_UPDATED + ' | 시각은 접속한 기기의 시계를 기준으로 계산됩니다.</div>' +
    '</div>';

  var lastBanKey = '';

  function renderBanner(T) {
    var items = [];
    MK.forEach(function (mk) {
      var p = parts(mk.tz, new Date(T)), groups = {};
      for (var k = 0; k <= 7; k++) {
        var d = addD(p.ymd, k), h = HOL[mk.id][d.ymd], sp = SP[mk.id][d.ymd];
        if (h) {
          if (!groups[h]) groups[h] = { first: d.ymd, last: d.ymd, k: k };
          else groups[h].last = d.ymd;
        }
        if (sp) items.push({ k: k, t: md(d.ymd) + ' ' + mk.name + ' ' + SPN[sp] });
        NOTICES.forEach(function (nt) { if (nt.m === mk.id && nt.ymd === d.ymd) items.push({ k: k, t: md(d.ymd) + ' ' + nt.t }); });
      }
      Object.keys(groups).forEach(function (name) {
        var g = groups[name], range = g.first === g.last ? md(g.first) : md(g.first) + '~' + md(g.last);
        items.push({ k: g.k, t: range + ' ' + mk.name + ' 휴장 (' + name + ')' });
      });
      var di = dstInfo(mk.tz, p);
      if (di && di.next && di.next.n <= 7) {
        items.push({ k: di.next.n, t: md(di.next.ymd) + ' ' + mk.name + ' 서머타임 ' + (di.on ? '해제: 한국시간 기준 1시간 늦게 열려요' : '시작: 한국시간 기준 1시간 일찍 열려요') });
      }
    });
    items.sort(function (a, b) { return a.k - b.k; });
    var el = document.getElementById('gmc-ban');
    if (!items.length) {
      el.innerHTML = '<div class="gmc-ban-row"><span class="gmc-tag">7일</span><span>앞으로 7일간 4개 시장 모두 휴장일과 특수일이 없어요.</span></div>';
      return;
    }
    el.innerHTML = items.slice(0, 5).map(function (it) {
      return '<div class="gmc-ban-row"><span class="gmc-tag' + (it.k === 0 ? ' today' : '') + '">' + (it.k === 0 ? '오늘' : 'D-' + it.k) + '</span><span>' + it.t + '</span></div>';
    }).join('');
  }

  function render() {
    if (document.hidden) return;
    var T = Date.now(), K = parts('Asia/Seoul', new Date(T)), openList = [], regN = 0;
    document.getElementById('gmc-now').innerHTML = '한국시간 <b>' + K.mo + '/' + K.d + '(' + WD[K.wd] + ') ' + pad(K.h) + ':' + pad(K.mi) + ':' + pad(K.s) + '</b>';

    MK.forEach(function (mk) {
      var r = status(mk.id, mk.tz, T), p = r.p, c = COL[FAM[r.key] || 'closed'];
      if (r.key !== 'closed' && r.key !== 'lunch') { openList.push(mk.name + ' ' + SHORT[r.key]); if (r.key === 'regular') regN++; }
      var rw = regWin(mk.id, mk.tz, T, p), di = dstInfo(mk.tz, p), dst;
      if (!di) dst = '<div class="gmc-dst">서머타임 없음</div>';
      else if (di.next) dst = '<div class="gmc-dst' + (di.next.n <= 7 ? ' soon' : '') + '">' + (di.on ? '서머타임 적용 중, 해제 D-' : '표준시, 서머타임 시작 D-') + di.next.n + ' (' + md(di.next.ymd) + ')</div>';
      else dst = '<div class="gmc-dst">' + (di.on ? '서머타임 적용 중' : '표준시') + '</div>';
      document.getElementById('gmc-c-' + mk.id).innerHTML =
        '<div class="gmc-ch"><span class="gmc-name">' + mk.name + '</span><span class="gmc-ex">' + mk.ex + '</span></div>' +
        clockSvg(mk, r) +
        '<div class="gmc-flip" aria-hidden="true"><span class="gmc-tile">' + pad(p.h) + '</span><span class="gmc-colon">:</span><span class="gmc-tile">' + pad(p.mi) + '</span><span class="gmc-fs">' + pad(p.s) + '</span></div>' +
        '<div class="gmc-date">' + md(p.ymd) + ' 현지</div>' +
        '<span class="gmc-pill" style="background:' + c.face + ';color:' + c.text + '">' + r.lab + '</span>' +
        '<div class="gmc-cd">' + (r.until ? r.ul + ' ' + cd(r.until - T) : '') + '</div>' +
        (rw ? '<div class="gmc-kst">' + rw.label + '<b>' + rw.range + '</b></div>' : '') +
        dst;
    });

    document.getElementById('gmc-sum').innerHTML = openList.length
      ? '<span class="gmc-sum-t">지금 거래 가능한 시장</span><span class="gmc-sum-n">' + openList.length + '곳</span><span class="gmc-sum-t">정규장 ' + regN + '곳</span><div class="gmc-sum-d">' + openList.join(', ') + '</div>'
      : '<span class="gmc-sum-t">지금 거래 가능한 시장</span><span class="gmc-sum-n">0곳</span><div class="gmc-sum-d">4개 시장 모두 쉬는 시간이에요.</div>';

    var bk = K.ymd + K.h + ':' + K.mi;
    if (bk !== lastBanKey) { lastBanKey = bk; renderBanner(T); }
  }

  render();
  setTimeout(function () { render(); setInterval(render, 1000); }, 1000 - (Date.now() % 1000));
  document.addEventListener('visibilitychange', function () { if (!document.hidden) render(); });
})();
