/* No.105 지수 대비 종목 괴리율 계산기 : stockchild.com */
(function () {
  'use strict';

  var BASE = 'https://dooly870505-commits.github.io/stockchild-data/gap105/';

  /* 캐시/최적화 플러그인이 <script> 태그를 body 하단으로 옮기는 경우가 있어,
   * 스크립트 위치가 아니라 본문에 미리 심어둔 자리표(.g105-mount)를 우선 찾는다.
   * 자리표가 없으면(구버전 삽입 방식) 예전처럼 스크립트 위치에 그려 넣는다. */
  var mount = document.querySelector('.g105-mount:empty');
  if (mount) {
    mount.className = 'g105-root';
  } else {
    var sc = document.currentScript;
    mount = document.createElement('div');
    mount.className = 'g105-root';
    if (sc && sc.parentNode) sc.parentNode.insertBefore(mount, sc);
    else document.body.appendChild(mount);
  }

  /* ============================ 스타일 ============================ */

  var CSS = ''
  + '.g105-root{--g105-bg:#FAF7F0;--g105-card:#FFFDF7;--g105-line:#E8E0D0;'
  + '--g105-ink:#3D3529;--g105-sub:#8A7F6C;--g105-accent:#8B6F47;'
  + '--g105-up:#C0392B;--g105-down:#2C6FB5;'
  + 'background:var(--g105-bg);border:1px solid var(--g105-line);border-radius:14px;'
  + 'padding:20px;font-family:"Noto Sans KR",-apple-system,BlinkMacSystemFont,sans-serif;'
  + 'color:var(--g105-ink);line-height:1.6;box-sizing:border-box;max-width:100%;}'
  + '.g105-root *{box-sizing:border-box;}'
  + '.g105-num{font-family:"JetBrains Mono","Consolas",monospace;font-variant-numeric:tabular-nums;}'
  + '.g105-ttl{font-size:19px;font-weight:700;letter-spacing:-0.02em;}'
  + '.g105-sub{font-size:12px;color:var(--g105-sub);margin-top:2px;}'
  + '.g105-search{position:relative;margin:16px 0 8px;}'
  + '.g105-search input{width:100%;font-size:16px;padding:12px 14px;border-radius:10px;'
  + 'border:1px solid var(--g105-line);background:var(--g105-card);color:var(--g105-ink);'
  + 'font-family:inherit;outline:none;}'
  + '.g105-search input:focus{border-color:var(--g105-accent);box-shadow:0 0 0 3px rgba(139,111,71,.13);}'
  + '.g105-ac{position:absolute;top:100%;left:0;right:0;z-index:40;background:var(--g105-card);'
  + 'border:1px solid var(--g105-line);border-radius:10px;margin-top:5px;overflow:hidden;'
  + 'box-shadow:0 6px 18px rgba(61,53,41,.12);max-height:290px;overflow-y:auto;}'
  + '.g105-ac div{padding:11px 14px;cursor:pointer;font-size:14px;border-bottom:1px solid var(--g105-line);}'
  + '.g105-ac div:last-child{border-bottom:none;}'
  + '.g105-ac div:hover,.g105-ac div.on{background:#F3EDE1;}'
  + '.g105-ac span{color:var(--g105-sub);font-size:12px;margin-left:6px;}'
  + '.g105-tabs{display:flex;gap:8px;margin:16px 0 14px;}'
  + '.g105-tabs button{flex:1;padding:11px 8px;font-size:14px;font-weight:600;cursor:pointer;'
  + 'border-radius:10px;border:1px solid var(--g105-line);background:var(--g105-card);'
  + 'color:var(--g105-sub);font-family:inherit;}'
  + '.g105-tabs button.on{background:var(--g105-accent);color:#fff;border-color:var(--g105-accent);}'
  + '.g105-chips{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:12px;}'
  + '.g105-chips button{padding:7px 13px;font-size:13px;cursor:pointer;border-radius:20px;'
  + 'border:1px solid var(--g105-line);background:var(--g105-card);color:var(--g105-sub);'
  + 'font-family:inherit;}'
  + '.g105-chips button.on{background:#F0E6D6;border-color:var(--g105-accent);'
  + 'color:var(--g105-accent);font-weight:600;}'
  + '.g105-dates{display:flex;align-items:center;gap:8px;margin-bottom:14px;flex-wrap:wrap;}'
  + '.g105-dates input{font-size:16px;padding:9px 11px;border-radius:9px;flex:1;min-width:135px;'
  + 'border:1px solid var(--g105-line);background:var(--g105-card);color:var(--g105-ink);'
  + 'font-family:inherit;}'
  + '.g105-dates em{font-style:normal;color:var(--g105-sub);font-size:13px;}'
  + '.g105-card{background:var(--g105-card);border:1px solid var(--g105-line);'
  + 'border-radius:12px;padding:16px;margin-bottom:10px;}'
  + '.g105-name{font-size:17px;font-weight:700;}'
  + '.g105-tag{font-size:11px;padding:2px 8px;border-radius:20px;background:#F0E6D6;'
  + 'color:var(--g105-accent);margin-left:7px;vertical-align:middle;font-weight:600;}'
  + '.g105-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:9px;margin-top:14px;}'
  + '.g105-cell{background:var(--g105-bg);border:1px solid var(--g105-line);'
  + 'border-radius:10px;padding:12px 10px;text-align:center;}'
  + '.g105-cell .lb{font-size:11px;color:var(--g105-sub);margin-bottom:5px;}'
  + '.g105-cell .vl{font-size:19px;font-weight:700;}'
  + '.g105-gapcell{border-color:var(--g105-accent);background:#FBF6EE;}'
  + '.g105-up{color:var(--g105-up);}'
  + '.g105-down{color:var(--g105-down);}'
  + '.g105-flat{color:var(--g105-sub);}'
  + '.g105-read{margin-top:13px;padding:12px 14px;background:var(--g105-bg);'
  + 'border-radius:10px;font-size:13.5px;border:1px solid var(--g105-line);}'
  + '.g105-chart{margin-top:14px;}'
  + '.g105-chart svg{width:100%;height:auto;display:block;}'
  + '.g105-legend{display:flex;gap:16px;font-size:12px;color:var(--g105-sub);'
  + 'margin-top:7px;flex-wrap:wrap;}'
  + '.g105-legend i{display:inline-block;width:14px;height:3px;border-radius:2px;'
  + 'margin-right:5px;vertical-align:middle;}'
  + '.g105-banner{background:#FBF6EE;border:1px solid var(--g105-accent);border-radius:12px;'
  + 'padding:15px 16px;margin-bottom:13px;font-size:14px;}'
  + '.g105-banner .big{font-size:15px;font-weight:700;display:block;margin-bottom:6px;}'
  + '.g105-row{display:flex;align-items:center;gap:11px;background:var(--g105-card);'
  + 'border:1px solid var(--g105-line);border-radius:11px;padding:12px 14px;margin-bottom:7px;}'
  + '.g105-rank{font-size:14px;font-weight:700;color:var(--g105-sub);min-width:22px;}'
  + '.g105-rinfo{flex:1;min-width:0;}'
  + '.g105-rname{font-size:14.5px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}'
  + '.g105-rmeta{font-size:11.5px;color:var(--g105-sub);margin-top:2px;}'
  + '.g105-rgap{text-align:right;font-size:16px;font-weight:700;white-space:nowrap;}'
  + '.g105-rgap small{display:block;font-size:11px;color:var(--g105-sub);font-weight:400;margin-top:2px;}'
  + '.g105-toggle{display:flex;align-items:center;gap:7px;font-size:13px;color:var(--g105-sub);'
  + 'margin-bottom:12px;cursor:pointer;}'
  + '.g105-toggle input{width:16px;height:16px;accent-color:var(--g105-accent);cursor:pointer;}'
  + '.g105-note{margin-top:16px;padding-top:13px;border-top:1px solid var(--g105-line);'
  + 'font-size:11.5px;color:var(--g105-sub);line-height:1.75;}'
  + '.g105-empty{padding:34px 16px;text-align:center;color:var(--g105-sub);font-size:13.5px;}'
  + '@media (max-width:480px){'
  + '.g105-root{padding:15px;border-radius:11px;}'
  + '.g105-ttl{font-size:17px;}'
  + '.g105-grid{gap:6px;}'
  + '.g105-cell{padding:10px 5px;}'
  + '.g105-cell .vl{font-size:16px;}'
  + '.g105-cell .lb{font-size:10px;}'
  + '.g105-row{padding:10px 11px;gap:8px;}'
  + '.g105-rgap{font-size:14.5px;}'
  + '.g105-dates input{min-width:120px;}'
  + '}';

  if (!document.getElementById('g105-style')) {
    var st = document.createElement('style');
    st.id = 'g105-style';
    st.textContent = CSS;
    document.head.appendChild(st);
  }

  /* ============================ 상태 ============================ */

  var S = {
    idx: null, rank: null, shards: {},
    tab: 1, sel: null, series: null,
    from: '', to: '',
    rk: '1m', rmkt: 'K', rdir: 'bot', rbig: true
  };

  /* ============================ 유틸 ============================ */

  function el(h) { var d = document.createElement('div'); d.innerHTML = h; return d.firstChild; }
  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }
  function toISO(y) { return '20' + y.slice(0, 2) + '-' + y.slice(2, 4) + '-' + y.slice(4, 6); }
  function toYY(iso) { return iso.replace(/-/g, '').slice(2); }
  function fmtDate(y) { return '20' + y.slice(0, 2) + '.' + y.slice(2, 4) + '.' + y.slice(4, 6); }
  function fmtShort(y) { return y.slice(2, 4) + '.' + y.slice(4, 6); }
  function pct(v, d) {
    if (v === null || v === undefined || isNaN(v)) return '-';
    var n = Number(v).toFixed(d === undefined ? 1 : d);
    return (Number(v) > 0 ? '+' : '') + n;
  }
  function cls(v) {
    if (v === null || v === undefined || isNaN(v)) return 'g105-flat';
    if (v > 0) return 'g105-up';
    if (v < 0) return 'g105-down';
    return 'g105-flat';
  }
  function cap(v) {
    if (v >= 10000) return (v / 10000).toFixed(1) + '조';
    return v.toLocaleString() + '억';
  }
  function disp(n) { return String(n).replace(/^(주식회사|\(주\)|㈜)\s*/, ''); }

  function getJSON(url) {
    return fetch(url, { cache: 'no-cache' }).then(function (r) {
      if (!r.ok) throw new Error(r.status);
      return r.json();
    });
  }

  /* 기간 안에서 유효한 첫 값과 마지막 값의 인덱스 */
  function span(arr, fromY, toY) {
    var cal = S.idx.cal, a = -1, b = -1;
    for (var i = 0; i < cal.length; i++) {
      if (cal[i] < fromY || cal[i] > toY) continue;
      var v = arr[i];
      if (v === null || v === undefined || v === '' || !(Number(v) > 0)) continue;
      if (a < 0) a = i;
      b = i;
    }
    return (a < 0 || b <= a) ? null : { a: a, b: b };
  }

  function ret(arr, sp) {
    var s = Number(arr[sp.a]), e = Number(arr[sp.b]);
    if (!(s > 0) || !(e > 0)) return null;
    return (e - s) / s * 100;
  }

  /* ============================ 골격 ============================ */

  mount.innerHTML = '<div class="g105-empty">데이터를 불러오는 중입니다</div>';

  Promise.all([getJSON(BASE + 'index.json'), getJSON(BASE + 'rank.json')])
    .then(function (r) {
      S.idx = r[0]; S.rank = r[1];
      var cal = S.idx.cal;
      S.to = cal[cal.length - 1];
      S.from = backDays(S.to, 30);
      build();
    })
    .catch(function () {
      mount.innerHTML = '<div class="g105-empty">데이터를 불러오지 못했습니다.'
        + '<br>잠시 후 새로고침해 주세요.</div>';
    });

  function backDays(yy, days) {
    var d = new Date(2000 + Number(yy.slice(0, 2)), Number(yy.slice(2, 4)) - 1, Number(yy.slice(4, 6)));
    d = new Date(d.getTime() - days * 86400000);
    var s = '' + (d.getFullYear() - 2000) + ('0' + (d.getMonth() + 1)).slice(-2)
          + ('0' + d.getDate()).slice(-2);
    var cal = S.idx.cal;
    for (var i = 0; i < cal.length; i++) if (cal[i] >= s) return cal[i];
    return cal[0];
  }

  function build() {
    mount.innerHTML = ''
      + '<div class="g105-ttl">📉 지수 대비 내 종목 괴리율</div>'
      + '<div class="g105-sub g105-num">기준일 ' + fmtDate(S.idx.base)
      + ' · 갱신 ' + esc(S.idx.updated) + '</div>'
      + '<div class="g105-search"><input type="text" placeholder="종목명 또는 종목코드 검색"'
      + ' autocomplete="off" spellcheck="false"></div>'
      + '<div class="g105-tabs">'
      + '<button data-tab="1" class="on">내 종목 비교</button>'
      + '<button data-tab="2">괴리율 랭킹</button></div>'
      + '<div class="g105-body"></div>'
      + '<div class="g105-note">'
      + '괴리율은 선택한 기간의 종목 등락률에서 같은 시장 지수 등락률을 뺀 값입니다. '
      + '지수는 시가총액이 큰 종목의 영향을 크게 받기 때문에, 지수가 올라도 대부분의 종목은 '
      + '내릴 수 있습니다. 괴리율이 크다는 것 자체는 호재도 악재도 아닙니다.<br>'
      + '종가 기준이며 배당과 액면분할은 반영하지 않았습니다. ETF, ETN, 스팩, 우선주, '
      + '거래정지 종목은 랭킹에서 제외했습니다. 투자 참고용이며 매수나 매도 추천이 아닙니다.<br>'
      + '출처: 네이버 금융 일별 시세'
      + '</div>';

    var inp = mount.querySelector('.g105-search input');
    inp.addEventListener('input', onSearch);
    inp.addEventListener('focus', onSearch);
    document.addEventListener('click', function (e) {
      if (!mount.querySelector('.g105-search').contains(e.target)) closeAC();
    });

    var tb = mount.querySelectorAll('.g105-tabs button');
    for (var i = 0; i < tb.length; i++) {
      tb[i].addEventListener('click', function () {
        S.tab = Number(this.getAttribute('data-tab'));
        for (var j = 0; j < tb.length; j++) tb[j].classList.remove('on');
        this.classList.add('on');
        render();
      });
    }
    render();
  }

  /* ============================ 검색 ============================ */

  function closeAC() {
    var a = mount.querySelector('.g105-ac');
    if (a) a.parentNode.removeChild(a);
  }

  function onSearch() {
    var q = mount.querySelector('.g105-search input').value.trim().toLowerCase();
    closeAC();
    if (!q) return;

    var st = S.idx.st, hit = [];
    for (var i = 0; i < st.length && hit.length < 40; i++) {
      var nm = String(st[i][1]).toLowerCase(), cd = String(st[i][0]).toLowerCase();
      if (nm.indexOf(q) !== -1 || cd.indexOf(q) !== -1) hit.push(st[i]);
    }
    if (!hit.length) return;

    hit.sort(function (a, b) {
      var an = String(a[1]).toLowerCase().indexOf(q) === 0 ? 0 : 1;
      var bn = String(b[1]).toLowerCase().indexOf(q) === 0 ? 0 : 1;
      if (an !== bn) return an - bn;
      return b[3] - a[3];
    });

    var h = '<div class="g105-ac">';
    for (var k = 0; k < Math.min(8, hit.length); k++) {
      h += '<div data-code="' + esc(hit[k][0]) + '">' + esc(disp(hit[k][1]))
        + '<span>' + esc(hit[k][0]) + ' · ' + (hit[k][2] === 'K' ? '코스피' : '코스닥')
        + '</span></div>';
    }
    h += '</div>';

    var box = el(h);
    mount.querySelector('.g105-search').appendChild(box);
    var rows = box.querySelectorAll('div');
    for (var m = 0; m < rows.length; m++) {
      rows[m].addEventListener('click', function () {
        pick(this.getAttribute('data-code'));
      });
    }
  }

  function pick(code) {
    var st = S.idx.st, found = null;
    for (var i = 0; i < st.length; i++) if (st[i][0] === code) { found = st[i]; break; }
    if (!found) return;

    closeAC();
    mount.querySelector('.g105-search input').value = disp(found[1]);
    S.sel = found; S.series = null;
    S.tab = 1;
    var tb = mount.querySelectorAll('.g105-tabs button');
    tb[0].classList.add('on'); tb[1].classList.remove('on');
    render();

    var sid = found[4];
    var key = 's' + (sid < 10 ? '0' + sid : sid);
    if (S.shards[key]) { S.series = S.shards[key][code]; render(); return; }

    getJSON(BASE + key + '.json').then(function (d) {
      S.shards[key] = d;
      if (S.sel && S.sel[0] === code) { S.series = d[code] || 'ERR'; render(); }
    }).catch(function () {
      S.series = 'ERR';
      render();
    });
  }

  /* ============================ 렌더 ============================ */

  function render() {
    var b = mount.querySelector('.g105-body');
    b.innerHTML = '';
    if (S.tab === 1) renderTab1(b); else renderTab2(b);
  }

  /* ---------- 탭1 : 내 종목 비교 ---------- */

  function renderTab1(b) {
    var cal = S.idx.cal;

    var h = '<div class="g105-chips">'
      + chip('p', '30', '최근 1개월', S.from === backDays(S.to, 30) && S.to === cal[cal.length - 1])
      + chip('p', '91', '3개월', S.from === backDays(S.to, 91) && S.to === cal[cal.length - 1])
      + chip('p', '182', '6개월', S.from === backDays(S.to, 182) && S.to === cal[cal.length - 1])
      + chip('p', 'ytd', '연초 대비', S.from === ytdStart() && S.to === cal[cal.length - 1])
      + '</div>'
      + '<div class="g105-dates">'
      + '<input type="date" class="g105-f" value="' + toISO(S.from) + '" min="' + toISO(cal[0])
      + '" max="' + toISO(cal[cal.length - 1]) + '">'
      + '<em>부터</em>'
      + '<input type="date" class="g105-t" value="' + toISO(S.to) + '" min="' + toISO(cal[0])
      + '" max="' + toISO(cal[cal.length - 1]) + '">'
      + '<em>까지</em></div>';

    b.innerHTML = h + '<div class="g105-out"></div>';

    var cs = b.querySelectorAll('.g105-chips button');
    for (var i = 0; i < cs.length; i++) {
      cs[i].addEventListener('click', function () {
        var v = this.getAttribute('data-v');
        S.to = cal[cal.length - 1];
        S.from = (v === 'ytd') ? ytdStart() : backDays(S.to, Number(v));
        render();
      });
    }
    b.querySelector('.g105-f').addEventListener('change', function () {
      S.from = clampDay(toYY(this.value)); fixOrder(); render();
    });
    b.querySelector('.g105-t').addEventListener('change', function () {
      S.to = clampDay(toYY(this.value)); fixOrder(); render();
    });

    var out = b.querySelector('.g105-out');

    if (!S.sel) {
      out.innerHTML = '<div class="g105-empty">🔍 위 검색창에서 종목을 선택하면<br>'
        + '같은 기간 지수와 얼마나 벌어졌는지 보여드립니다.</div>';
      return;
    }
    if (S.series === 'ERR') {
      out.innerHTML = '<div class="g105-empty">시세를 불러오지 못했습니다. 다시 선택해 주세요.</div>';
      return;
    }
    if (!S.series) {
      out.innerHTML = '<div class="g105-empty">시세를 불러오는 중입니다</div>';
      return;
    }

    var arr = String(S.series).split(',');
    var mk = S.sel[2];
    var ia = S.idx.idx[mk];

    var sp = span(arr, S.from, S.to);
    var ip = span(ia, S.from, S.to);
    if (!sp || !ip) {
      out.innerHTML = '<div class="g105-empty">선택한 기간에 거래 데이터가 부족합니다.<br>'
        + '기간을 넓혀 주세요.</div>';
      return;
    }

    var a = Math.max(sp.a, ip.a), z = Math.min(sp.b, ip.b);
    if (z <= a) {
      out.innerHTML = '<div class="g105-empty">선택한 기간에 겹치는 거래일이 없습니다.</div>';
      return;
    }
    var sp2 = { a: a, b: z }, ip2 = { a: a, b: z };

    var sr = ret(arr, sp2), ir = ret(ia, ip2);
    var gp = (sr === null || ir === null) ? null : sr - ir;
    var mkn = (mk === 'K') ? '코스피' : '코스닥';

    out.innerHTML = ''
      + '<div class="g105-card">'
      + '<div><span class="g105-name">' + esc(disp(S.sel[1])) + '</span>'
      + '<span class="g105-tag">' + mkn + '</span></div>'
      + '<div class="g105-sub g105-num">' + esc(S.sel[0]) + ' · 시총 ' + cap(S.sel[3])
      + '<br>' + fmtDate(S.idx.cal[a]) + ' ~ ' + fmtDate(S.idx.cal[z]) + '</div>'
      + '<div class="g105-grid">'
      + cell('내 종목', pct(sr) + '%', cls(sr), false)
      + cell(mkn + ' 지수', pct(ir) + '%', cls(ir), false)
      + cell('괴리', pct(gp) + '%p', cls(gp), true)
      + '</div>'
      + '<div class="g105-read">' + reading(disp(S.sel[1]), mkn, sr, ir, gp) + '</div>'
      + chart(arr, ia, a, z, mkn)
      + '</div>';
  }

  function fixOrder() {
    if (S.from > S.to) { var t = S.from; S.from = S.to; S.to = t; }
  }

  function ytdStart() {
    var cal = S.idx.cal, y = cal[cal.length - 1].slice(0, 2);
    for (var i = 0; i < cal.length; i++) if (cal[i].slice(0, 2) === y) return cal[i];
    return cal[0];
  }

  function clampDay(v) {
    var cal = S.idx.cal;
    if (v < cal[0]) return cal[0];
    if (v > cal[cal.length - 1]) return cal[cal.length - 1];
    return v;
  }

  function chip(k, v, label, on) {
    return '<button data-k="' + k + '" data-v="' + v + '" class="' + (on ? 'on' : '') + '">'
      + label + '</button>';
  }

  function cell(lb, vl, c, hi) {
    return '<div class="g105-cell' + (hi ? ' g105-gapcell' : '') + '">'
      + '<div class="lb">' + lb + '</div>'
      + '<div class="vl g105-num ' + c + '">' + vl + '</div></div>';
  }

  function reading(name, mkn, sr, ir, gp) {
    if (gp === null) return '계산할 수 있는 데이터가 부족합니다.';
    var d = Math.abs(gp).toFixed(1);
    var head;
    if (gp > 0) head = '<b>' + esc(name) + '</b>는 같은 기간 ' + mkn + ' 지수보다 '
      + '<b class="g105-up">' + d + '%p 앞섰습니다.</b>';
    else if (gp < 0) head = '<b>' + esc(name) + '</b>는 같은 기간 ' + mkn + ' 지수보다 '
      + '<b class="g105-down">' + d + '%p 뒤졌습니다.</b>';
    else head = '<b>' + esc(name) + '</b>는 ' + mkn + ' 지수와 거의 같이 움직였습니다.';

    var tail = '';
    if (sr < 0 && ir > 0) tail = ' 지수는 올랐지만 이 종목은 내렸습니다.';
    else if (sr > 0 && ir < 0) tail = ' 지수는 내렸지만 이 종목은 올랐습니다.';
    else if (sr < 0 && ir < 0 && gp > 0) tail = ' 둘 다 내렸지만 이 종목이 덜 빠졌습니다.';
    else if (sr < 0 && ir < 0 && gp < 0) tail = ' 둘 다 내렸고 이 종목이 더 빠졌습니다.';
    else if (sr > 0 && ir > 0 && gp < 0) tail = ' 둘 다 올랐지만 이 종목이 덜 올랐습니다.';
    return head + tail;
  }

  /* ---------- 차트 ---------- */

  function chart(arr, ia, a, z, mkn) {
    var W = 640, H = 220, PL = 8, PR = 8, PT = 14, PB = 26;
    var base1 = Number(arr[a]), base2 = Number(ia[a]);
    var p1 = [], p2 = [], lo = 100, hi = 100, n = z - a;

    for (var i = a; i <= z; i++) {
      var x = PL + (i - a) / (n || 1) * (W - PL - PR);
      var v1 = Number(arr[i]), v2 = Number(ia[i]);
      if (v1 > 0) { var r1 = v1 / base1 * 100; p1.push([x, r1]); if (r1 < lo) lo = r1; if (r1 > hi) hi = r1; }
      if (v2 > 0) { var r2 = v2 / base2 * 100; p2.push([x, r2]); if (r2 < lo) lo = r2; if (r2 > hi) hi = r2; }
    }
    if (p1.length < 2 || p2.length < 2) return '';

    var pad = (hi - lo) * 0.12 || 2;
    lo -= pad; hi += pad;
    function Y(v) { return PT + (hi - v) / (hi - lo) * (H - PT - PB); }
    function path(p) {
      var s = '';
      for (var i = 0; i < p.length; i++) s += (i ? 'L' : 'M') + p[i][0].toFixed(1) + ' ' + Y(p[i][1]).toFixed(1);
      return s;
    }

    var y100 = Y(100);
    var s = '<div class="g105-chart"><svg viewBox="0 0 ' + W + ' ' + H
      + '" preserveAspectRatio="none" role="img" aria-label="종목과 지수 비교 그래프">'
      + '<line x1="' + PL + '" y1="' + y100.toFixed(1) + '" x2="' + (W - PR) + '" y2="' + y100.toFixed(1)
      + '" stroke="#E8E0D0" stroke-width="1" stroke-dasharray="4 4"/>'
      + '<path d="' + path(p2) + '" fill="none" stroke="#8A7F6C" stroke-width="2"'
      + ' stroke-linejoin="round" stroke-linecap="round"/>'
      + '<path d="' + path(p1) + '" fill="none" stroke="#8B6F47" stroke-width="2.6"'
      + ' stroke-linejoin="round" stroke-linecap="round"/>'
      + '<text x="' + PL + '" y="' + (H - 7) + '" font-size="12" fill="#8A7F6C">'
      + fmtShort(S.idx.cal[a]) + '</text>'
      + '<text x="' + (W - PR) + '" y="' + (H - 7) + '" font-size="12" fill="#8A7F6C"'
      + ' text-anchor="end">' + fmtShort(S.idx.cal[z]) + '</text>'
      + '</svg>'
      + '<div class="g105-legend">'
      + '<span><i style="background:#8B6F47"></i>' + esc(disp(S.sel[1])) + '</span>'
      + '<span><i style="background:#8A7F6C"></i>' + mkn + ' 지수</span>'
      + '<span>시작일을 100으로 맞춘 그래프입니다</span>'
      + '</div></div>';
    return s;
  }

  /* ---------- 탭2 : 랭킹 ---------- */

  function renderTab2(b) {
    var ps = S.rank.presets, h = '<div class="g105-chips">';
    for (var i = 0; i < ps.length; i++) {
      h += '<button data-k="k" data-v="' + ps[i].k + '" class="' + (S.rk === ps[i].k ? 'on' : '')
        + '">' + esc(ps[i].label) + '</button>';
    }
    h += '</div><div class="g105-chips">'
      + '<button data-k="m" data-v="K" class="' + (S.rmkt === 'K' ? 'on' : '') + '">코스피</button>'
      + '<button data-k="m" data-v="Q" class="' + (S.rmkt === 'Q' ? 'on' : '') + '">코스닥</button>'
      + '<button data-k="d" data-v="bot" class="' + (S.rdir === 'bot' ? 'on' : '') + '">지수보다 부진</button>'
      + '<button data-k="d" data-v="top" class="' + (S.rdir === 'top' ? 'on' : '') + '">지수보다 선방</button>'
      + '</div>';

    b.innerHTML = h + '<div class="g105-out"></div>';

    var cs = b.querySelectorAll('.g105-chips button');
    for (var j = 0; j < cs.length; j++) {
      cs[j].addEventListener('click', function () {
        var k = this.getAttribute('data-k'), v = this.getAttribute('data-v');
        if (k === 'k') S.rk = v;
        if (k === 'm') S.rmkt = v;
        if (k === 'd') S.rdir = v;
        render();
      });
    }

    var d = S.rank.data[S.rk][S.rmkt];
    var out = b.querySelector('.g105-out');
    if (!d) { out.innerHTML = '<div class="g105-empty">데이터가 없습니다.</div>'; return; }

    var mkn = (S.rmkt === 'K') ? '코스피' : '코스닥';
    var lb = '';
    for (var p = 0; p < S.rank.presets.length; p++) {
      if (S.rank.presets[p].k === S.rk) lb = S.rank.presets[p].label;
    }

    var bn = '<div class="g105-banner"><span class="big">'
      + lb + ' ' + mkn + ' 지수 <span class="g105-num ' + cls(d.ir) + '">' + pct(d.ir) + '%</span>'
      + ' · 종목 중앙값 <span class="g105-num ' + cls(d.med) + '">' + pct(d.med) + '%</span></span>'
      + '지수를 이긴 종목은 <b class="g105-num">' + d.beat + '%</b>입니다. '
      + '전체 ' + d.n + '개 종목 가운데 ' + Math.round(d.n * d.beat / 100) + '개입니다.'
      + '</div>';

    var key = S.rdir + (S.rbig ? 'Big' : 'All');
    var list = d[key] || [];

    var tg = '<label class="g105-toggle"><input type="checkbox" class="g105-small"'
      + (S.rbig ? '' : ' checked') + '>시가총액 ' + S.rank.floor + '억 미만 소형주도 포함'
      + ' (현재 ' + (S.rbig ? d.nBig : d.n) + '개 대상)</label>';

    var rows = '';
    for (var i = 0; i < Math.min(10, list.length); i++) {
      var r = list[i];
      rows += '<div class="g105-row">'
        + '<div class="g105-rank g105-num">' + (i + 1) + '</div>'
        + '<div class="g105-rinfo"><div class="g105-rname">' + esc(disp(r[1])) + '</div>'
        + '<div class="g105-rmeta g105-num">' + esc(r[0]) + ' · ' + cap(r[2])
        + ' · 등락 <span class="' + cls(r[3]) + '">' + pct(r[3]) + '%</span></div></div>'
        + '<div class="g105-rgap g105-num ' + cls(r[4]) + '">' + pct(r[4]) + '%p'
        + '<small>괴리</small></div>'
        + '</div>';
    }
    if (!rows) rows = '<div class="g105-empty">해당 조건의 종목이 없습니다.</div>';

    out.innerHTML = bn + tg + rows;

    out.querySelector('.g105-small').addEventListener('change', function () {
      S.rbig = !this.checked;
      render();
    });
  }
})();
