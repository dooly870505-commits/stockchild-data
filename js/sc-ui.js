/* stockchild.com 디자인 시스템 v2 + 도구 모듈 런타임 (sc-ui) v1.0 (2026-09-30)
   모든 도구는 SCTools.register 로 등록하고, 개별 페이지와 랜딩페이지 어디서든 같은 코드로 그려집니다.
   각 도구는 섀도 DOM 안에 그려져서 워드프레스 테마와 스타일이 서로 섞이지 않습니다. */
(function () {
  'use strict';
  if (window.SCTools) return;

  var FONT_URL = 'https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css';

  // ---------- 디자인 토큰 + 공통 부품 CSS ----------
  var BASE_CSS = [
    ':host{display:block;',
    '--ink:#16181D;--sub:#6B7280;--muted:#9AA0A8;--line:#E6E8EB;--line2:#D5D8DC;--soft:#F4F5F7;--bg:#FFFFFF;',
    '--brand:#FF5A1F;--brand-bg:#FFF1EA;--focus:#2F6FEB;',
    '--up:#E5383B;--up-bg:#FDECEC;--down:#2F6FEB;--down-bg:#E8EFFE;',
    '--ok:#1FA463;--ok-bg:#E4F5EB;--ok-tx:#137A47;--warn-bg:#FFF4D6;--warn-tx:#8A6100;',
    '--site:#F5F36F;--site-ink:#222222;',
    '--r-lg:20px;--r-md:16px;--r-sm:12px}',
    '*{box-sizing:border-box}',
    '.sc{font-family:"Pretendard Variable",Pretendard,-apple-system,"Apple SD Gothic Neo","Malgun Gothic",sans-serif;color:var(--ink);font-variant-numeric:tabular-nums;line-height:1.55;font-size:15px;-webkit-font-smoothing:antialiased}',
    '.sc-card{background:var(--bg);border:1px solid var(--line);border-radius:var(--r-lg);padding:24px}',
    '.sc-kicker{font-size:12px;font-weight:600;color:var(--sub);margin-bottom:4px}',
    '.sc-title{font-size:22px;font-weight:700;letter-spacing:-0.02em;line-height:1.35}',
    '.sc-desc{font-size:14px;color:var(--sub);margin-top:4px}',
    '.sc-sec{margin-top:22px}',
    '.sc-sec-t{font-size:13px;font-weight:700;color:var(--ink);margin-bottom:10px}',
    '.sc-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:12px}',
    '.sc-field label{display:block;font-size:13px;font-weight:600;margin-bottom:6px}',
    '.sc-field .opt{font-weight:500;color:var(--muted);margin-left:4px}',
    '.sc-input{display:flex;align-items:center;height:50px;padding:0 14px;border:1px solid var(--line2);border-radius:var(--r-sm);background:#fff;transition:border-color .15s,box-shadow .15s}',
    '.sc-input:focus-within{border-color:var(--ink);box-shadow:0 0 0 3px rgba(22,24,29,.08)}',
    '.sc-input input{flex:1;min-width:0;border:0;outline:0;background:transparent;font:inherit;font-size:17px;font-weight:600;color:var(--ink);text-align:right}',
    '.sc-input .u{margin-left:6px;font-size:14px;color:var(--sub)}',
    '.sc-help{font-size:12px;color:var(--muted);margin-top:5px}',
    '.sc-chips{display:flex;flex-wrap:wrap;gap:6px}',
    '.sc-chip{border:1px solid var(--line);background:#fff;border-radius:999px;padding:7px 13px;font:inherit;font-size:13px;font-weight:600;color:var(--ink);cursor:pointer;transition:border-color .15s,background .15s}',
    '.sc-chip:hover{border-color:var(--ink)}',
    '.sc-chip.on{background:var(--ink);border-color:var(--ink);color:#fff}',
    '.sc-chip:focus-visible,.sc-btn:focus-visible{outline:2px solid var(--focus);outline-offset:2px}',
    '.sc-btn{display:inline-flex;align-items:center;justify-content:center;height:46px;padding:0 20px;border-radius:999px;border:1px solid var(--ink);background:var(--ink);color:#fff;font:inherit;font-size:15px;font-weight:600;cursor:pointer}',
    '.sc-btn.ghost{background:#fff;color:var(--ink);border-color:var(--line2)}',
    '.sc-kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:10px}',
    '.sc-kpi{background:var(--soft);border-radius:var(--r-md);padding:16px 18px}',
    '.sc-kpi .k{font-size:13px;color:var(--sub)}',
    '.sc-kpi .v{font-size:28px;font-weight:700;letter-spacing:-0.02em;line-height:1.2;margin-top:4px;word-break:keep-all}',
    '.sc-kpi .v small{font-size:15px;font-weight:600;margin-left:2px}',
    '.sc-kpi .s{font-size:12px;color:var(--sub);margin-top:4px}',
    '.sc-kpi.main{background:var(--ink);color:#fff}',
    '.sc-kpi.main .k,.sc-kpi.main .s{color:#B9BEC6}',
    '.up{color:var(--up)}.down{color:var(--down)}',
    '.sc-kpi.main .up{color:#FF8B8D}.sc-kpi.main .down{color:#8FB5FF}',
    '.sc-rows{border-top:1px solid var(--line)}',
    '.sc-row{display:flex;justify-content:space-between;gap:12px;padding:11px 2px;border-bottom:1px solid var(--line);font-size:14px}',
    '.sc-row .k{color:var(--sub)}.sc-row .v{font-weight:600;text-align:right}',
    '.sc-tw{overflow-x:auto;border:1px solid var(--line);border-radius:var(--r-md)}',
    '.sc-table{width:100%;border-collapse:collapse;font-size:14px;min-width:420px}',
    '.sc-table th{background:var(--soft);font-size:12px;font-weight:600;color:var(--sub);text-align:right;padding:10px 12px;white-space:nowrap}',
    '.sc-table th:first-child,.sc-table td:first-child{text-align:left}',
    '.sc-table td{padding:11px 12px;border-top:1px solid var(--line);text-align:right;white-space:nowrap}',
    '.sc-table tr.hl td{background:var(--brand-bg);font-weight:700}',
    '.sc-table tr.hl td:first-child{box-shadow:inset 3px 0 0 var(--brand)}',
    '.sc-note{background:var(--soft);border-radius:var(--r-sm);padding:12px 14px;font-size:13px;color:var(--sub);line-height:1.7}',
    '.sc-note.warn{background:var(--warn-bg);color:var(--warn-tx)}',
    '.sc-note b{color:var(--ink)}.sc-note.warn b{color:var(--warn-tx)}',
    '.sc-links{display:grid;gap:8px}',
    '.sc-link{display:flex;justify-content:space-between;align-items:center;padding:12px 14px;border:1px solid var(--line);border-radius:var(--r-sm);color:var(--ink);text-decoration:none;font-size:14px;font-weight:600}',
    '.sc-link:hover{border-color:var(--ink)}',
    '.sc-foot{margin-top:20px;padding-top:12px;border-top:1px solid var(--line);font-size:12px;color:var(--muted);line-height:1.7}',
    '@media (max-width:480px){.sc-card{padding:16px;border-radius:var(--r-md)}.sc-title{font-size:19px}.sc-kpi{padding:14px}.sc-kpi .v{font-size:23px}.sc-input{height:48px}}'
  ].join('');

  function ensureFont() {
    if (document.getElementById('sc-font')) return;
    var l = document.createElement('link');
    l.id = 'sc-font'; l.rel = 'stylesheet'; l.href = FONT_URL;
    document.head.appendChild(l);
  }

  // ---------- 공통 도우미 ----------
  var U = {
    esc: function (s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); },
    num: function (v) { var n = parseFloat(String(v).replace(/[^0-9.\-]/g, '')); return isFinite(n) ? n : NaN; },
    won: function (n) { return isFinite(n) ? Math.round(n).toLocaleString('ko-KR') : '-'; },
    int: function (n) { return isFinite(n) ? Math.round(n).toLocaleString('ko-KR') : '-'; },
    pct: function (x, d, sign) { if (!isFinite(x)) return '-'; var v = (x * 100).toFixed(d == null ? 1 : d); return (sign && x > 0 ? '+' : '') + v + '%'; },
    tone: function (x) { return x > 0 ? 'up' : (x < 0 ? 'down' : ''); },
    field: function (id, label, unit, val, help, optional) {
      return '<div class="sc-field"><label for="' + id + '">' + label + (optional ? '<span class="opt">선택</span>' : '') + '</label>' +
        '<div class="sc-input"><input id="' + id + '" inputmode="decimal" autocomplete="off" value="' + U.esc(val) + '"><span class="u">' + unit + '</span></div>' +
        (help ? '<div class="sc-help">' + help + '</div>' : '') + '</div>';
    },
    kpi: function (k, v, s, main) { return '<div class="sc-kpi' + (main ? ' main' : '') + '"><div class="k">' + k + '</div><div class="v">' + v + '</div>' + (s ? '<div class="s">' + s + '</div>' : '') + '</div>'; },
    row: function (k, v) { return '<div class="sc-row"><span class="k">' + k + '</span><span class="v">' + v + '</span></div>'; },
    table: function (head, rows, hlIndex) {
      return '<div class="sc-tw"><table class="sc-table"><thead><tr>' + head.map(function (h) { return '<th>' + h + '</th>'; }).join('') + '</tr></thead><tbody>' +
        rows.map(function (r, i) { return '<tr' + (i === hlIndex ? ' class="hl"' : '') + '>' + r.map(function (c) { return '<td>' + c + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table></div>';
    },
    header: function (kicker, title, desc) { return (kicker ? '<div class="sc-kicker">' + kicker + '</div>' : '') + '<div class="sc-title">' + title + '</div><div class="sc-desc">' + desc + '</div>'; },
    foot: function (extra) { return '<div class="sc-foot">' + (extra ? extra + '<br>' : '') + '입력값을 바탕으로 한 계산 결과이며, 수수료와 세금은 따로 적지 않았다면 반영하지 않았습니다. 투자 참고용이며 매수/매도 추천이 아닙니다. | stockchild.com</div>'; },
    // 입력칸: 쉼표 자동 정리 + 입력 즉시 재계산
    bindInputs: function (root, ids, onChange) {
      ids.forEach(function (id) {
        var el = root.querySelector('#' + id);
        el.addEventListener('input', onChange);
        el.addEventListener('blur', function () { var n = U.num(el.value); if (isFinite(n)) el.value = Number.isInteger(n) ? n.toLocaleString('ko-KR') : String(n); });
      });
    },
    val: function (root, id) { return U.num(root.querySelector('#' + id).value); },
    set: function (root, id, n) { root.querySelector('#' + id).value = Number.isInteger(n) ? n.toLocaleString('ko-KR') : String(n); }
  };

  // ---------- 등록과 그리기 ----------
  var REG = {};
  function register(def) { REG[def.id] = def; var waiting = document.querySelectorAll('[data-sc-tool="' + def.id + '"]'); for (var i = 0; i < waiting.length; i++) mount(waiting[i], def.id); }
  function mount(el, id) {
    var def = REG[id];
    if (!def) return false;
    ensureFont();
    var root = el.shadowRoot || el.attachShadow({ mode: 'open' });
    root.innerHTML = '';
    var st = document.createElement('style'); st.textContent = BASE_CSS + (def.css || ''); root.appendChild(st);
    var wrap = document.createElement('div'); wrap.className = 'sc'; root.appendChild(wrap);
    def.render(wrap, U);
    return true;
  }
  function autoMount() {
    var els = document.querySelectorAll('[data-sc-tool]');
    for (var i = 0; i < els.length; i++) mount(els[i], els[i].getAttribute('data-sc-tool'));
  }
  window.SCTools = { register: register, mount: mount, has: function (id) { return !!REG[id]; }, U: U, BASE_CSS: BASE_CSS, ensureFont: ensureFont };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', autoMount); else autoMount();
})();
