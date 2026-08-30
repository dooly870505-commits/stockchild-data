(function () {
  var JSON_URL = 'https://dooly870505-commits.github.io/stockchild-data/investor-flow-heatmap.json';
  var MOUNT_ID = 'ihf-widget';
  var PAGE_SIZE = 30;

  var state = { items: [], visibleCount: PAGE_SIZE, openSymbol: null, meta: null };

  function fmtAmt(v) {
    var a = Math.abs(v);
    var sign = v < 0 ? '-' : '';
    if (a >= 1e12) return sign + (a / 1e12).toFixed(1) + '조';
    if (a >= 1e8) return sign + Math.round(a / 1e8) + '억';
    if (a >= 1e4) return sign + Math.round(a / 1e4) + '만';
    return sign + a;
  }

  function tierSize(rank) {
    if (rank <= 3) return { w: 220, h: 92 };
    if (rank <= 10) return { w: 170, h: 78 };
    if (rank <= 20) return { w: 130, h: 66 };
    if (rank <= 50) return { w: 104, h: 56 };
    return { w: 86, h: 48 };
  }

  function maxAbsFlow(items) {
    var m = 0;
    items.forEach(function (it) {
      m = Math.max(m, Math.abs(it.individualNetAmt), Math.abs(it.foreignerNetAmt), Math.abs(it.institutionNetAmt));
    });
    return m || 1;
  }

  function barSeg(label, value, scaleMax) {
    var seg = document.createElement('div');
    var isBuy = value >= 0;
    var intensity = Math.min(1, Math.abs(value) / scaleMax);
    seg.className = 'ihf-seg';
    seg.style.background = isBuy ? '#E24B4A' : '#378ADD';
    seg.style.opacity = String(0.35 + intensity * 0.65);
    seg.title = label + ' ' + fmtAmt(value);
    return seg;
  }

  function buildDetailPanel(it) {
    var panel = document.createElement('div');
    panel.className = 'ihf-detail';

    var head = document.createElement('div');
    head.className = 'ihf-detail-head';
    var title = document.createElement('span');
    title.className = 'ihf-detail-title';
    title.textContent = it.name + ' (' + it.symbol + ')';
    var closeBtn = document.createElement('span');
    closeBtn.className = 'ihf-detail-close';
    closeBtn.textContent = '닫기';
    closeBtn.onclick = function () { state.openSymbol = null; render(); };
    head.appendChild(title);
    head.appendChild(closeBtn);
    panel.appendChild(head);

    var rows = [
      ['개인', it.individualNetAmt],
      ['외국인', it.foreignerNetAmt],
      ['기관 합계', it.institutionNetAmt]
    ];
    var mainList = document.createElement('div');
    mainList.className = 'ihf-detail-list';
    rows.forEach(function (r) {
      var row = document.createElement('div');
      row.className = 'ihf-detail-row';
      var l = document.createElement('span');
      l.textContent = r[0];
      var v = document.createElement('span');
      v.textContent = fmtAmt(r[1]);
      v.style.color = r[1] >= 0 ? '#A32D2D' : '#185FA5';
      row.appendChild(l);
      row.appendChild(v);
      mainList.appendChild(row);
    });
    panel.appendChild(mainList);

    var bdLabel = document.createElement('div');
    bdLabel.className = 'ihf-detail-sub';
    bdLabel.textContent = '기관 세부';
    panel.appendChild(bdLabel);

    var bd = it.instBreakdown || {};
    var bdRows = [
      ['금융투자', bd.financialInvestment], ['보험', bd.insurance], ['투신', bd.trust],
      ['사모펀드', bd.privateEquity], ['은행', bd.bank], ['기타금융', bd.otherFinancial], ['연기금', bd.pensionFund]
    ];
    var bdList = document.createElement('div');
    bdList.className = 'ihf-detail-list ihf-detail-list-sm';
    bdRows.forEach(function (r) {
      var row = document.createElement('div');
      row.className = 'ihf-detail-row';
      var l = document.createElement('span');
      l.textContent = r[0];
      var v = document.createElement('span');
      v.textContent = fmtAmt(r[1] || 0);
      v.style.color = (r[1] || 0) >= 0 ? '#A32D2D' : '#185FA5';
      row.appendChild(l);
      row.appendChild(v);
      bdList.appendChild(row);
    });
    panel.appendChild(bdList);

    if (typeof it.foreignerHoldingRate === 'number') {
      var fh = document.createElement('div');
      fh.className = 'ihf-detail-note';
      fh.textContent = '외국인 보유비율 ' + (it.foreignerHoldingRate * 100).toFixed(2) + '%';
      panel.appendChild(fh);
    }

    return panel;
  }

  function render() {
    var mount = document.getElementById(MOUNT_ID);
    if (!mount) return;
    mount.innerHTML = '';

    if (!state.items.length) {
      var empty = document.createElement('div');
      empty.className = 'ihf-empty';
      empty.textContent = '데이터를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.';
      mount.appendChild(empty);
      return;
    }

    var wrap = document.createElement('div');
    wrap.className = 'ihf-wrap';

    var top = document.createElement('div');
    top.className = 'ihf-top';
    var dateLabel = document.createElement('span');
    dateLabel.className = 'ihf-date';
    dateLabel.textContent = (state.meta && state.meta.date ? state.meta.date : '') + ' 거래대금 상위 ' + state.items.length;
    var legend = document.createElement('div');
    legend.className = 'ihf-legend';
    legend.innerHTML =
      '<span><span class="ihf-dot" style="background:#E24B4A"></span>순매수</span>' +
      '<span><span class="ihf-dot" style="background:#378ADD"></span>순매도</span>';
    top.appendChild(dateLabel);
    top.appendChild(legend);
    wrap.appendChild(top);

    var grid = document.createElement('div');
    grid.className = 'ihf-grid';
    var scaleMax = maxAbsFlow(state.items);
    var visible = state.items.slice(0, state.visibleCount);

    visible.forEach(function (it) {
      var size = tierSize(it.rank);
      var tile = document.createElement('div');
      tile.className = 'ihf-tile';
      tile.style.flexBasis = size.w + 'px';
      tile.style.minHeight = size.h + 'px';

      var name = document.createElement('div');
      name.className = 'ihf-tile-name';
      name.textContent = it.name;
      tile.appendChild(name);

      var bars = document.createElement('div');
      bars.className = 'ihf-bars';
      bars.appendChild(barSeg('개인', it.individualNetAmt, scaleMax));
      bars.appendChild(barSeg('외국인', it.foreignerNetAmt, scaleMax));
      bars.appendChild(barSeg('기관', it.institutionNetAmt, scaleMax));
      tile.appendChild(bars);

      tile.onclick = function () {
        state.openSymbol = state.openSymbol === it.symbol ? null : it.symbol;
        render();
      };

      grid.appendChild(tile);

      if (state.openSymbol === it.symbol) {
        var detailHolder = document.createElement('div');
        detailHolder.className = 'ihf-detail-holder';
        detailHolder.appendChild(buildDetailPanel(it));
        grid.appendChild(detailHolder);
      }
    });

    wrap.appendChild(grid);

    if (state.visibleCount < state.items.length) {
      var moreBtn = document.createElement('button');
      moreBtn.type = 'button';
      moreBtn.className = 'ihf-more';
      moreBtn.textContent = '더보기 (' + state.visibleCount + ' / ' + state.items.length + ')';
      moreBtn.onclick = function () {
        state.visibleCount = Math.min(state.items.length, state.visibleCount + PAGE_SIZE);
        render();
      };
      wrap.appendChild(moreBtn);
    }

    var footer = document.createElement('div');
    footer.className = 'ihf-footer';
    footer.textContent = '수급 데이터 자체는 매수 또는 매도 신호가 아니며 투자 참고용입니다. 기준: 토스증권 Open API, 갱신 ' +
      (state.meta && state.meta.updatedAt ? state.meta.updatedAt : '');
    wrap.appendChild(footer);

    mount.appendChild(wrap);
  }

  function load() {
    var mount = document.getElementById(MOUNT_ID);
    if (!mount) return;
    mount.innerHTML = '<div class="ihf-empty">불러오는 중입니다</div>';

    fetch(JSON_URL, { cache: 'no-store' })
      .then(function (res) { return res.json(); })
      .then(function (data) {
        var items = Array.isArray(data.items) ? data.items : [];
        items.sort(function (a, b) { return a.rank - b.rank; });
        state.items = items;
        state.meta = { date: data.date, updatedAt: data.updatedAt };
        state.visibleCount = Math.min(PAGE_SIZE, items.length);
        render();
      })
      .catch(function () {
        state.items = [];
        render();
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', load);
  } else {
    load();
  }
})();
