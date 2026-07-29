/*!
 * stockchild.com No.62 국민연금 지분 변동 추적기
 * 데이터: DART 임원ㆍ주요주주 소유상황보고 + 주식등의 대량보유상황보고
 */
(function () {
  'use strict';

  var JSON_URL = 'https://dooly870505-commits.github.io/stockchild-data/nps.json';
  var MOUNT_ID = 'nps-widget';

  var CSS = [
    '#nps-widget{--nps-bg:#FAF7F0;--nps-card:#FFFDF7;--nps-line:#E8E0D0;',
    '--nps-ink:#3D3529;--nps-sub:#8A7F6C;--nps-accent:#8B6F47;',
    '--nps-up:#C0392B;--nps-down:#2E6DA4;--nps-flat:#8A7F6C;',
    'background:var(--nps-bg);border:1px solid var(--nps-line);border-radius:12px;',
    'padding:20px;font-family:"Noto Sans KR",-apple-system,sans-serif;color:var(--nps-ink);',
    'box-sizing:border-box;max-width:100%;}',
    '#nps-widget *{box-sizing:border-box;}',
    '.nps-t{font-size:19px;font-weight:700;margin-bottom:4px;}',
    '.nps-st{font-size:13px;color:var(--nps-sub);margin-bottom:16px;line-height:1.5;}',
    '.nps-sbox{position:relative;margin-bottom:14px;}',
    '.nps-sbox input{width:100%;padding:12px 14px;font-size:16px;border:1px solid var(--nps-line);',
    'border-radius:8px;background:var(--nps-card);color:var(--nps-ink);outline:none;',
    'font-family:inherit;}',
    '.nps-sbox input:focus{border-color:var(--nps-accent);}',
    '.nps-sug{position:absolute;top:100%;left:0;right:0;background:var(--nps-card);',
    'border:1px solid var(--nps-line);border-radius:8px;margin-top:4px;z-index:50;',
    'max-height:260px;overflow-y:auto;display:none;box-shadow:0 4px 12px rgba(0,0,0,.08);}',
    '.nps-sug.on{display:block;}',
    '.nps-sug-i{padding:11px 14px;cursor:pointer;font-size:14px;border-bottom:1px solid var(--nps-line);}',
    '.nps-sug-i:last-child{border-bottom:none;}',
    '.nps-sug-i:hover{background:var(--nps-bg);}',
    '.nps-sug-c{font-family:"JetBrains Mono",monospace;font-size:12px;color:var(--nps-sub);margin-left:6px;}',
    '.nps-detail{display:none;margin-bottom:16px;}',
    '.nps-detail.on{display:block;}',
    '.nps-dhead{background:var(--nps-card);border:1px solid var(--nps-line);border-radius:10px;',
    'padding:16px;margin-bottom:10px;}',
    '.nps-dname{font-size:17px;font-weight:700;margin-bottom:8px;}',
    '.nps-dcode{font-family:"JetBrains Mono",monospace;font-size:12px;color:var(--nps-sub);',
    'font-weight:400;margin-left:8px;}',
    '.nps-drate{font-family:"JetBrains Mono",monospace;font-size:26px;font-weight:700;}',
    '.nps-dmeta{font-size:12px;color:var(--nps-sub);margin-top:6px;line-height:1.6;}',
    '.nps-close{float:right;font-size:12px;color:var(--nps-sub);cursor:pointer;',
    'border:1px solid var(--nps-line);border-radius:6px;padding:4px 10px;background:var(--nps-bg);}',
    '.nps-tabs{display:flex;gap:6px;margin-bottom:12px;flex-wrap:wrap;}',
    '.nps-tab{flex:1;min-width:70px;padding:9px 6px;text-align:center;font-size:13px;',
    'border:1px solid var(--nps-line);border-radius:8px;background:var(--nps-card);',
    'cursor:pointer;color:var(--nps-sub);white-space:nowrap;}',
    '.nps-tab.on{background:var(--nps-accent);color:#fff;border-color:var(--nps-accent);font-weight:600;}',
    '.nps-hint{font-size:12px;color:var(--nps-sub);margin-bottom:10px;line-height:1.5;}',
    '.nps-card{background:var(--nps-card);border:1px solid var(--nps-line);border-radius:10px;',
    'padding:14px;margin-bottom:8px;}',
    '.nps-row1{display:flex;justify-content:space-between;align-items:baseline;gap:8px;}',
    '.nps-nm{font-size:15px;font-weight:600;flex:1;min-width:0;overflow:hidden;',
    'text-overflow:ellipsis;white-space:nowrap;}',
    '.nps-cd{font-family:"JetBrains Mono",monospace;font-size:11px;color:var(--nps-sub);',
    'font-weight:400;margin-left:6px;}',
    '.nps-rate{font-family:"JetBrains Mono",monospace;font-size:16px;font-weight:700;',
    'white-space:nowrap;}',
    '.nps-row2{display:flex;justify-content:space-between;align-items:center;gap:8px;',
    'margin-top:7px;font-size:12px;color:var(--nps-sub);}',
    '.nps-chg{font-family:"JetBrains Mono",monospace;font-weight:600;}',
    '.nps-up{color:var(--nps-up);}',
    '.nps-down{color:var(--nps-down);}',
    '.nps-flat{color:var(--nps-flat);}',
    '.nps-badge{display:inline-block;font-size:11px;padding:2px 7px;border-radius:5px;',
    'background:var(--nps-bg);border:1px solid var(--nps-line);color:var(--nps-sub);',
    'margin-left:6px;vertical-align:middle;}',
    '.nps-badge.n{background:#FFF4E0;border-color:#E8D5B0;color:#9C7A3C;}',
    '.nps-badge.x{background:#F0F0F0;border-color:#DDD;color:#777;}',
    '.nps-tl{max-height:340px;overflow-y:auto;}',
    '.nps-tli{border-left:2px solid var(--nps-line);padding:0 0 14px 14px;position:relative;}',
    '.nps-tli:last-child{padding-bottom:0;}',
    '.nps-tli:before{content:"";position:absolute;left:-5px;top:4px;width:8px;height:8px;',
    'border-radius:50%;background:var(--nps-accent);}',
    '.nps-tld{font-family:"JetBrains Mono",monospace;font-size:11px;color:var(--nps-sub);}',
    '.nps-tlr{font-family:"JetBrains Mono",monospace;font-size:14px;font-weight:600;margin-top:2px;}',
    '.nps-tlq{font-size:11px;color:var(--nps-sub);margin-top:2px;}',
    '.nps-msg{padding:30px 10px;text-align:center;color:var(--nps-sub);font-size:14px;}',
    '.nps-disc{background:var(--nps-card);border:1px solid var(--nps-line);border-radius:10px;',
    'padding:14px;margin-top:16px;font-size:12px;color:var(--nps-sub);line-height:1.7;}',
    '.nps-disc b{color:var(--nps-ink);font-weight:600;}',
    '.nps-foot{margin-top:12px;font-size:11px;color:var(--nps-sub);text-align:right;line-height:1.6;}',
    '@media(max-width:480px){',
    '#nps-widget{padding:14px;border-radius:10px;}',
    '.nps-t{font-size:17px;}.nps-st{font-size:12px;}',
    '.nps-tab{font-size:12px;padding:8px 4px;min-width:0;}',
    '.nps-nm{font-size:14px;}.nps-rate{font-size:15px;}',
    '.nps-drate{font-size:22px;}',
    '.nps-card{padding:12px;}}'
  ].join('');

  var D = null, IDX = {}, tab = 'recent', sel = null;

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function fmtN(n) {
    if (n == null || isNaN(n)) return '-';
    return Number(n).toLocaleString('ko-KR');
  }
  function fmtR(n) {
    if (n == null || isNaN(n)) return '-';
    return Number(n).toFixed(2) + '%';
  }
  function fmtC(n) {
    if (n == null || isNaN(n) || n === 0) return '0.00%p';
    return (n > 0 ? '+' : '') + Number(n).toFixed(2) + '%p';
  }
  function cls(n) {
    if (n == null || isNaN(n) || n === 0) return 'nps-flat';
    return n > 0 ? 'nps-up' : 'nps-down';
  }
  function srcLabel(s) {
    return s === 'ELE' ? '소유상황보고' : '대량보유보고';
  }

  function build(root) {
    root.innerHTML =
      '<div class="nps-t">🏦 국민연금 지분 변동 추적기</div>' +
      '<div class="nps-st">국민연금공단이 DART에 제출한 지분 공시를 종목별로 정리했습니다. ' +
      '공시일은 실제 매매일보다 늦습니다.</div>' +
      '<div class="nps-sbox">' +
      '<input type="text" id="nps-q" placeholder="종목명 또는 종목코드 검색" autocomplete="off">' +
      '<div class="nps-sug" id="nps-sug"></div></div>' +
      '<div class="nps-detail" id="nps-detail"></div>' +
      '<div class="nps-tabs">' +
      '<div class="nps-tab on" data-t="recent">최근 변동</div>' +
      '<div class="nps-tab" data-t="rank">지분율 TOP</div>' +
      '<div class="nps-tab" data-t="up">늘린 종목</div>' +
      '<div class="nps-tab" data-t="down">줄인 종목</div>' +
      '</div>' +
      '<div class="nps-hint" id="nps-hint"></div>' +
      '<div id="nps-list"><div class="nps-msg">데이터를 불러오는 중입니다</div></div>' +
      '<div class="nps-disc">' +
      '<b>이 데이터를 볼 때 주의할 점</b><br>' +
      '· 공시일과 실제 매매일은 다릅니다. 대량보유보고는 제도상 최대 40일까지 늦게 공시될 수 있습니다.<br>' +
      '· 지분 5% 이상 보유 또는 10% 이상 주주인 경우에만 보고 의무가 생깁니다. ' +
      '여기 없는 종목도 국민연금이 매매했을 수 있습니다.<br>' +
      '· 국민연금 국내주식에는 지수를 따라가는 패시브 운용 비중이 큽니다. ' +
      '지분 증가가 종목 선호가 아니라 지수 편입이나 리밸런싱의 결과일 수 있습니다.<br>' +
      '· 표시된 지분율은 마지막 공시 시점 기준이며, 현재 보유 상태와 다를 수 있습니다.<br>' +
      '· <b>국민연금 매매는 호재도 악재도 아닙니다.</b> 이 도구는 투자 참고용이며 ' +
      '특정 종목의 매수나 매도를 추천하지 않습니다.' +
      '</div>' +
      '<div class="nps-foot" id="nps-foot"></div>';
  }

  function render() {
    var el = document.getElementById('nps-list');
    var hint = document.getElementById('nps-hint');
    if (!D) return;

    var html = '', i, list;

    if (tab === 'recent') {
      hint.textContent = '최근 공시된 지분 변동입니다. 신규 보고는 매매가 아니라 보고 의무 발생 건입니다.';
      list = D.rows.slice(0, 60);
      for (i = 0; i < list.length; i++) html += cardRow(list[i]);

    } else if (tab === 'rank') {
      hint.textContent = '마지막 공시 기준 지분율이 높은 순입니다.';
      list = D.corps.filter(function (c) { return c[6] !== 1 && c[2] > 0; }).slice(0, 60);
      for (i = 0; i < list.length; i++) html += cardCorp(list[i], i + 1);

    } else {
      var up = tab === 'up';
      hint.textContent = up
        ? '최근 1년간 실제 매매로 지분을 늘린 종목입니다. 신규 보고 건은 제외했습니다.'
        : '최근 1년간 실제 매매로 지분을 줄인 종목입니다. 합병으로 사라진 종목은 제외했습니다.';
      var agg = aggregate();
      agg.sort(function (a, b) { return up ? b.s - a.s : a.s - b.s; });
      list = agg.filter(function (x) { return up ? x.s > 0 : x.s < 0; }).slice(0, 40);
      for (i = 0; i < list.length; i++) html += cardAgg(list[i], i + 1);
    }

    el.innerHTML = html || '<div class="nps-msg">표시할 데이터가 없습니다</div>';
  }

  function aggregate() {
    var cut = new Date(Date.now() - 365 * 86400000);
    var cs = cut.getFullYear() + '-' +
      ('0' + (cut.getMonth() + 1)).slice(-2) + '-' + ('0' + cut.getDate()).slice(-2);
    var m = {};
    for (var i = 0; i < D.rows.length; i++) {
      var r = D.rows[i];
      if (r[9] !== '') continue;
      if (r[1] < cs) continue;
      if (r[3] == null) continue;
      if (!m[r[0]]) m[r[0]] = { c: r[0], s: 0, n: 0, last: r[2], d: r[1] };
      m[r[0]].s += r[3];
      m[r[0]].n++;
    }
    return Object.keys(m).map(function (k) {
      var o = m[k];
      o.s = Math.round(o.s * 100) / 100;
      o.nm = IDX[k] ? IDX[k][1] : k;
      return o;
    });
  }

  function cardRow(r) {
    var nm = IDX[r[0]] ? IDX[r[0]][1] : r[0];
    var badge = '';
    var chgHtml;
    if (r[9] === 'N') {
      badge = '<span class="nps-badge n">10% 진입 보고</span>';
      chgHtml = '<span class="nps-chg nps-flat">변동분 미표시</span>';
    } else if (r[9] === 'X') {
      badge = '<span class="nps-badge x">상장 소멸</span>';
      chgHtml = '<span class="nps-chg nps-flat">합병·교환</span>';
    } else {
      chgHtml = '<span class="nps-chg ' + cls(r[3]) + '">' + fmtC(r[3]) +
        ' (' + (r[5] > 0 ? '+' : '') + fmtN(r[5]) + '주)</span>';
    }
    return '<div class="nps-card">' +
      '<div class="nps-row1"><div class="nps-nm">' + esc(nm) +
      '<span class="nps-cd">' + esc(r[0]) + '</span>' + badge + '</div>' +
      '<div class="nps-rate">' + fmtR(r[2]) + '</div></div>' +
      '<div class="nps-row2"><span>' + esc(r[1]) + ' · ' + srcLabel(r[6]) + '</span>' +
      chgHtml + '</div></div>';
  }

  function cardCorp(c, rank) {
    return '<div class="nps-card">' +
      '<div class="nps-row1"><div class="nps-nm">' + rank + '. ' + esc(c[1]) +
      '<span class="nps-cd">' + esc(c[0]) + '</span></div>' +
      '<div class="nps-rate">' + fmtR(c[2]) + '</div></div>' +
      '<div class="nps-row2"><span>마지막 공시 ' + esc(c[3]) + ' · 누적 ' + c[4] + '건</span>' +
      '<span class="nps-chg ' + cls(c[5]) + '">' + fmtC(c[5]) + '</span></div></div>';
  }

  function cardAgg(o, rank) {
    return '<div class="nps-card">' +
      '<div class="nps-row1"><div class="nps-nm">' + rank + '. ' + esc(o.nm) +
      '<span class="nps-cd">' + esc(o.c) + '</span></div>' +
      '<div class="nps-rate ' + cls(o.s) + '">' + fmtC(o.s) + '</div></div>' +
      '<div class="nps-row2"><span>공시 ' + o.n + '건 · 최근 ' + esc(o.d) + '</span>' +
      '<span>현재 ' + fmtR(o.last) + '</span></div></div>';
  }

  function showDetail(code) {
    var box = document.getElementById('nps-detail');
    var c = IDX[code];
    if (!c) return;
    sel = code;

    var hist = D.rows.filter(function (r) { return r[0] === code; });
    var tl = '';
    for (var i = 0; i < hist.length && i < 40; i++) {
      var r = hist[i], sub;
      if (r[9] === 'N') sub = '10% 진입 보고 (매매 아님)';
      else if (r[9] === 'X') sub = '합병·교환으로 지분 소멸';
      else sub = fmtC(r[3]) + ' · ' + (r[5] > 0 ? '+' : '') + fmtN(r[5]) + '주';
      tl += '<div class="nps-tli">' +
        '<div class="nps-tld">' + esc(r[1]) + ' · ' + srcLabel(r[6]) + '</div>' +
        '<div class="nps-tlr">' + fmtR(r[2]) +
        ' <span class="' + cls(r[9] === '' ? r[3] : 0) + '" style="font-size:12px;">' +
        esc(sub) + '</span></div>' +
        (r[8] ? '<div class="nps-tlq">' + esc(r[8]) + '</div>' : '') +
        '</div>';
    }

    box.innerHTML =
      '<div class="nps-dhead">' +
      '<span class="nps-close" id="nps-x">닫기</span>' +
      '<div class="nps-dname">' + esc(c[1]) + '<span class="nps-dcode">' + esc(c[0]) + '</span></div>' +
      '<div class="nps-drate">' + fmtR(c[2]) + '</div>' +
      '<div class="nps-dmeta">마지막 공시 ' + esc(c[3]) + ' · 누적 공시 ' + c[4] + '건' +
      (c[6] === 1 ? '<br>합병 또는 주식교환으로 지분이 소멸된 종목입니다.' : '') +
      '</div></div>' +
      '<div class="nps-card"><div class="nps-tl">' + tl + '</div></div>';
    box.className = 'nps-detail on';

    document.getElementById('nps-x').onclick = function () {
      box.className = 'nps-detail';
      sel = null;
      document.getElementById('nps-q').value = '';
    };
    box.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function bindSearch() {
    var q = document.getElementById('nps-q');
    var sug = document.getElementById('nps-sug');

    q.addEventListener('input', function () {
      var v = q.value.trim().toLowerCase();
      if (!v) { sug.className = 'nps-sug'; return; }
      var hit = D.corps.filter(function (c) {
        return String(c[1]).toLowerCase().indexOf(v) !== -1 || String(c[0]).indexOf(v) !== -1;
      }).slice(0, 12);
      if (!hit.length) {
        sug.innerHTML = '<div class="nps-sug-i" style="color:#8A7F6C;">' +
          '검색 결과가 없습니다. 국민연금 보고 대상이 아닌 종목일 수 있습니다.</div>';
      } else {
        sug.innerHTML = hit.map(function (c) {
          return '<div class="nps-sug-i" data-c="' + esc(c[0]) + '">' + esc(c[1]) +
            '<span class="nps-sug-c">' + esc(c[0]) + '</span>' +
            '<span class="nps-sug-c">' + fmtR(c[2]) + '</span></div>';
        }).join('');
      }
      sug.className = 'nps-sug on';
    });

    sug.addEventListener('click', function (e) {
      var t = e.target;
      while (t && t !== sug && !t.getAttribute('data-c')) t = t.parentNode;
      if (!t || t === sug) return;
      sug.className = 'nps-sug';
      q.value = '';
      showDetail(t.getAttribute('data-c'));
    });

    document.addEventListener('click', function (e) {
      if (!e.target.closest || !e.target.closest('.nps-sbox')) sug.className = 'nps-sug';
    });
  }

  function bindTabs() {
    var els = document.querySelectorAll('#nps-widget .nps-tab');
    for (var i = 0; i < els.length; i++) {
      els[i].onclick = function () {
        var all = document.querySelectorAll('#nps-widget .nps-tab');
        for (var j = 0; j < all.length; j++) all[j].className = 'nps-tab';
        this.className = 'nps-tab on';
        tab = this.getAttribute('data-t');
        render();
      };
    }
  }

  function init() {
    var root = document.getElementById(MOUNT_ID);
    if (!root) return;

    var st = document.createElement('style');
    st.textContent = CSS;
    document.head.appendChild(st);
    build(root);

    var stamp = new Date();
    var key = stamp.getFullYear() + ('0' + (stamp.getMonth() + 1)).slice(-2) +
      ('0' + stamp.getDate()).slice(-2) + (stamp.getHours() < 12 ? 'a' : 'b');

    fetch(JSON_URL + '?v=' + key)
      .then(function (r) { return r.json(); })
      .then(function (j) {
        if (!j || !j.corps || !j.rows) throw new Error('bad json');

        D = {
          meta: j.meta || {},
          corps: j.corps.filter(function (c) { return c && c.length >= 6 && c[0]; }),
          rows: j.rows.filter(function (r) {
            return r && r.length >= 9 && r[0] && /^\d{4}-\d{2}-\d{2}$/.test(String(r[1]));
          })
        };
        for (var i = 0; i < D.corps.length; i++) {
          var c = D.corps[i];
          if (c.length < 7) c[6] = 0;
          IDX[c[0]] = c;
        }

        document.getElementById('nps-foot').innerHTML =
          '출처: DART 전자공시시스템 · 수집 ' + esc(D.meta.from || '') + ' ~ ' + esc(D.meta.to || '') +
          '<br>종목 ' + D.corps.length + '개 · 공시 ' + D.rows.length + '건 · 갱신 ' +
          esc(D.meta.gen || '');

        bindSearch();
        bindTabs();
        render();
      })
      .catch(function () {
        var el = document.getElementById('nps-list');
        if (el) el.innerHTML = '<div class="nps-msg">데이터를 불러오지 못했습니다. ' +
          '잠시 후 새로고침해 주세요.</div>';
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
