/* stockchild.com 시가총액 순위 전광판 v2 (sc-tool-mcap-board) v1.0 (2026-11-03)
   id: mcap-board
   필요 파일: sc-ui.js
   데이터: 시가총액 Apps Script 웹 앱 v3 (금융위원회 주식시세정보, 전일 종가 기준, 1시간마다 갱신)
   { ok, basDt, prevBasDt, updated, kospi:[{rank,name,code,close,rate,cap,prev}], kosdaq:[...],
     total:{kospi,kosdaq}, count:{kospi,kosdaq} }
   prev: 전일 순위 (null 이면 전일 100위 밖에서 새로 들어온 종목) */
(function () {
  'use strict';

  var URL = 'https://script.google.com/macros/s/AKfycbxiA_U6HJ-JZsCA9wQKTgSDCpBuBRzuK8Xx00mSDiWQTstODYMYCoEo-NFSrdcFeZqH/exec?market=ALL';
  var FIRST = 30;
  var MK = { kospi: '코스피', kosdaq: '코스닥' };

  function num(v) { var n = Number(v); return isFinite(n) ? n : 0; }
  function fmtCap(won) {
    var jo = Math.floor(won / 1e12), eok = Math.round((won % 1e12) / 1e8);
    if (eok === 10000) { jo += 1; eok = 0; }
    if (jo > 0) return jo.toLocaleString('ko-KR') + '조' + (eok ? ' ' + eok.toLocaleString('ko-KR') + '억' : '');
    return eok.toLocaleString('ko-KR') + '억';
  }
  function fmtJo(won) { return Math.round(won / 1e12).toLocaleString('ko-KR') + '조'; }
  function fmtYmd(d) { d = String(d || ''); return d.length === 8 ? d.slice(0, 4) + '.' + d.slice(4, 6) + '.' + d.slice(6, 8) : d; }
  function shortYmd(d) { d = String(d || ''); return d.length === 8 ? Number(d.slice(4, 6)) + '/' + Number(d.slice(6, 8)) : d; }

  function normalize(j) {
    if (!j || j.ok === false) throw new Error((j && j.error) || '데이터를 받지 못했어요');
    function list(a) {
      return (Array.isArray(a) ? a : []).map(function (r) {
        return { name: String(r.name || ''), code: String(r.code || ''), close: num(r.close), rate: num(r.rate), cap: num(r.cap),
          prev: r.prev === undefined ? undefined : (r.prev == null ? null : num(r.prev)) };
      }).filter(function (r) { return r.name && r.cap > 0; })
        .sort(function (a, b) { return b.cap - a.cap; })
        .map(function (r, i) { r.rank = i + 1; return r; });
    }
    var t = j.total || {}, c = j.count || {};
    return { basDt: String(j.basDt || ''), prevBasDt: j.prevBasDt ? String(j.prevBasDt) : '', updated: String(j.updated || ''),
      kospi: list(j.kospi), kosdaq: list(j.kosdaq),
      total: { kospi: num(t.kospi), kosdaq: num(t.kosdaq) }, count: { kospi: num(c.kospi), kosdaq: num(c.kosdaq) } };
  }
  function share(D, m) {
    var L = D[m], tot = D.total[m] || L.reduce(function (a, x) { return a + x.cap; }, 0);
    var s1 = L[0] ? L[0].cap : 0, s10 = L.slice(1, 10).reduce(function (a, x) { return a + x.cap; }, 0), s50 = L.slice(10).reduce(function (a, x) { return a + x.cap; }, 0);
    return { tot: tot, top1: tot ? s1 / tot : 0, top2to10: tot ? s10 / tot : 0, top11to50: tot ? s50 / tot : 0, rest: tot ? Math.max(0, 1 - (s1 + s10 + s50) / tot) : 0 };
  }
  window.SCMcapBoard = { normalize: normalize, share: share, fmtCap: fmtCap };

  var CSS = [
    '#kpis{grid-template-columns:2fr 1fr 1fr}',
    '@media (max-width:640px){#kpis{grid-template-columns:1fr 1fr}#kpis .sc-kpi.main{grid-column:1/-1}}',
    '.mb-tabs{display:flex;gap:6px}',
    '.mb-share{margin-top:14px}',
    '.mb-share .lbl{display:flex;justify-content:space-between;font-size:12.5px;color:var(--sub);margin-bottom:6px}',
    '.mb-bar{display:flex;height:16px;border-radius:8px;overflow:hidden;background:var(--soft)}',
    '.mb-bar i{display:block;height:100%}',
    '.mb-leg{display:flex;flex-wrap:wrap;gap:4px 12px;margin-top:8px;font-size:12px;color:var(--sub)}',
    '.mb-leg span{display:inline-flex;align-items:center;gap:5px}',
    '.mb-leg b{display:inline-block;width:10px;height:10px;border-radius:3px}',
    '.mb-head,.mb-row{display:grid;grid-template-columns:44px 1fr 118px;gap:8px;align-items:center}',
    '.mb-head{font-size:11.5px;color:var(--muted);padding:0 12px 6px;border-bottom:1px solid var(--line);margin-top:14px}',
    '.mb-head .r{text-align:right}',
    '.mb-row{padding:11px 12px;border-bottom:1px solid var(--line)}',
    '.mb-row:last-child{border-bottom:0}',
    '.mb-rank{font-size:16px;font-weight:800;font-variant-numeric:tabular-nums;color:var(--ink);line-height:1.1}',
    '.mb-rank.t1{color:#C9A227}.mb-rank.t2{color:#9AA0A8}.mb-rank.t3{color:#B07B4F}',
    '.mb-chg{display:block;font-size:10.5px;font-weight:700;margin-top:2px;font-variant-numeric:tabular-nums}',
    '.mb-chg.up{color:var(--up)}.mb-chg.down{color:var(--down)}.mb-chg.same{color:var(--muted)}.mb-chg.new{color:var(--brand)}',
    '.mb-nm{font-size:15px;font-weight:700;color:var(--ink);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '.mb-sub{font-size:12px;color:var(--muted);margin-top:2px;font-variant-numeric:tabular-nums;white-space:nowrap}',
    '.mb-sub .up{color:var(--up)}.mb-sub .down{color:var(--down)}',
    '.mb-cap{text-align:right;font-size:14px;font-weight:700;font-variant-numeric:tabular-nums;white-space:nowrap}',
    '.mb-capbar{height:5px;border-radius:3px;background:var(--soft);margin-top:6px;overflow:hidden}',
    '.mb-capbar i{display:block;height:100%;background:var(--brand);border-radius:3px}',
    '.mb-list{border:1px solid var(--line);border-radius:var(--r-md);margin-top:0;background:#fff}',
    '.mb-more{width:100%;margin-top:10px}',
    '.mb-skel{height:260px;border-radius:12px;background:linear-gradient(90deg,var(--soft),#fafbfc,var(--soft));background-size:200% 100%;animation:mb-sh 1.2s infinite}',
    '@keyframes mb-sh{0%{background-position:200% 0}100%{background-position:-200% 0}}',
    '@media (max-width:480px){.mb-head,.mb-row{grid-template-columns:38px 1fr 104px;padding-left:8px;padding-right:8px}.mb-nm{font-size:14px}.mb-cap{font-size:13px}}'
  ].join('');

  var COLORS = ['#16181D', '#FF5A1F', '#FFB088', '#E6E8EB'];

  function render(wrap, U) {
    var D = null, st = { m: 'kospi', all: false };
    wrap.innerHTML =
      '<div class="sc-card">' +
      U.header('시세·수급 모니터', '시가총액 순위 전광판', '코스피·코스닥 시가총액 상위 50개 종목과 전일 대비 순위 변동을 한눈에 봐요. 전일 종가 기준이에요.') +
      '<div class="sc-sec"><div class="mb-tabs" id="tabs"></div></div>' +
      '<div class="sc-sec"><div class="sc-kpis" id="kpis">' + U.kpi('전체 시가총액', '-', '불러오는 중', true) + U.kpi('1위 비중', '-', '') + U.kpi('상위 10 비중', '-', '') + '</div><div class="mb-share" id="share"></div></div>' +
      '<div class="sc-sec"><div class="mb-head"><span>순위</span><span>종목 · 종가 · 등락률</span><span class="r">시가총액</span></div><div class="mb-list" id="list"><div class="mb-skel"></div></div><div id="more"></div></div>' +
      '<div class="sc-sec"><div class="sc-note">순위 옆 ▲▼는 전일 대비 순위 변동이고, <b>NEW</b>는 전일 100위 밖에서 새로 들어온 종목이에요. 막대는 1위 종목 대비 시가총액 크기예요.<br>금융위원회 주식시세정보는 기준일 다음 영업일 오후에 공개돼서, 오늘 장 결과는 내일 오후에 반영돼요. <b>시가총액 순위는 기업 가치를 판단하는 참고 자료일 뿐이에요.</b></div></div>' +
      '<div class="sc-foot" id="foot">자료: 금융위원회 주식시세정보 · 한국거래소. 투자 참고용이며 매수/매도 추천이 아닙니다. | stockchild.com</div>' +
      '</div>';
    var $ = function (id) { return wrap.querySelector('#' + id); };

    function draw() {
      $('tabs').innerHTML = ['kospi', 'kosdaq'].map(function (m) {
        return '<button type="button" class="sc-chip' + (st.m === m ? ' on' : '') + '" data-m="' + m + '">' + MK[m] + '</button>';
      }).join('');
      var L = D[st.m], sh = share(D, st.m);
      $('kpis').innerHTML =
        U.kpi(MK[st.m] + ' 전체 시가총액', fmtJo(sh.tot), (D.count[st.m] ? D.count[st.m].toLocaleString('ko-KR') + '종목 · ' : '') + '기준일 ' + fmtYmd(D.basDt), true) +
        U.kpi('1위 비중', (sh.top1 * 100).toFixed(1) + '%', L[0] ? U.esc(L[0].name) : '') +
        U.kpi('상위 10 비중', ((sh.top1 + sh.top2to10) * 100).toFixed(1) + '%', '시장 전체 대비');
      var parts = [['1위', sh.top1], ['2~10위', sh.top2to10], ['11~50위', sh.top11to50], ['나머지', sh.rest]];
      $('share').innerHTML = '<div class="lbl"><span>시가총액 쏠림</span><span>' + MK[st.m] + ' 전체 = 100%</span></div>' +
        '<div class="mb-bar">' + parts.map(function (p, i) { return '<i style="width:' + (p[1] * 100).toFixed(2) + '%;background:' + COLORS[i] + '" title="' + p[0] + '"></i>'; }).join('') + '</div>' +
        '<div class="mb-leg">' + parts.map(function (p, i) { return '<span><b style="background:' + COLORS[i] + (i === 3 ? ';border:1px solid var(--line2)' : '') + '"></b>' + p[0] + ' ' + (p[1] * 100).toFixed(1) + '%</span>'; }).join('') + '</div>';

      var top = L[0] ? L[0].cap : 1, shown = st.all ? L : L.slice(0, FIRST);
      $('list').innerHTML = shown.length ? shown.map(function (r) {
        var chg = '';
        if (r.prev === null) chg = '<span class="mb-chg new">NEW</span>';
        else if (typeof r.prev === 'number') {
          var d = r.prev - r.rank;
          chg = d > 0 ? '<span class="mb-chg up">▲' + d + '</span>' : d < 0 ? '<span class="mb-chg down">▼' + (-d) + '</span>' : '<span class="mb-chg same">-</span>';
        }
        var rc = r.rate > 0 ? 'up' : r.rate < 0 ? 'down' : '';
        var rs = (r.rate > 0 ? '+' : '') + r.rate.toFixed(2) + '%';
        return '<div class="mb-row"><span class="mb-rank' + (r.rank <= 3 ? ' t' + r.rank : '') + '">' + r.rank + chg + '</span>' +
          '<span style="min-width:0"><div class="mb-nm">' + U.esc(r.name) + '</div><div class="mb-sub">' + r.close.toLocaleString('ko-KR') + '원 · <span class="' + rc + '">' + rs + '</span></div></span>' +
          '<span class="mb-cap">' + fmtCap(r.cap) + '<div class="mb-capbar"><i style="width:' + Math.max(2, r.cap / top * 100).toFixed(1) + '%"></i></div></span></div>';
      }).join('') : '<div class="sc-note warn" style="margin:12px">표시할 데이터가 없어요.</div>';
      $('more').innerHTML = L.length > FIRST
        ? '<button type="button" class="sc-btn ghost mb-more" data-act="more">' + (st.all ? '30위까지만 보기 ▴' : (L.length - FIRST) + '개 더 보기 (' + L.length + '위까지) ▾') + '</button>' : '';
      $('foot').innerHTML = '기준일 ' + fmtYmd(D.basDt) + (D.prevBasDt ? ' (순위 변동은 ' + shortYmd(D.prevBasDt) + ' 대비)' : '') + ' · 갱신 ' + U.esc(D.updated) +
        '<br>자료: 금융위원회 주식시세정보 · 한국거래소. 투자 참고용이며 매수/매도 추천이 아닙니다. | stockchild.com';
    }

    wrap.addEventListener('click', function (e) {
      var t = e.target.closest('[data-m],[data-act]');
      if (!t || !D) return;
      if (t.getAttribute('data-m')) { st.m = t.getAttribute('data-m'); st.all = false; draw(); return; }
      if (t.getAttribute('data-act') === 'more') {
        st.all = !st.all; draw();
        if (!st.all) wrap.scrollIntoView({ block: 'start', behavior: 'smooth' });
      }
    });

    function load(retry) {
      fetch(URL, { cache: 'no-store' }).then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
        .then(function (j) { D = normalize(j); draw(); })
        .catch(function (err) {
          if (!retry) { setTimeout(function () { load(true); }, 1500); return; }
          $('list').innerHTML = '<div class="sc-note warn" style="margin:12px">데이터를 불러오지 못했어요. 잠시 후 새로고침해 주세요.<br><span style="font-size:12px">' + U.esc(String(err && err.message || err)) + '</span></div>';
          $('kpis').innerHTML = U.kpi('전체 시가총액', '-', '불러오기 실패', true);
        });
    }
    load(false);
  }

  function reg() { window.SCTools.register({ id: 'mcap-board', css: CSS, render: render }); }
  if (window.SCTools) reg(); else document.addEventListener('DOMContentLoaded', function () { if (window.SCTools) reg(); });
})();
