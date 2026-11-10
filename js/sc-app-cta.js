/* sc-app-cta.js v1.0 (2026-11-07) : 주소남 투자도구 앱 안내 블록 (디자인 시스템 v2)
 * 사용법 (워드프레스 사용자 정의 HTML 블록):
 *   <div data-sc-app-cta="lockup"></div>
 *   <script src="https://dooly870505-commits.github.io/stockchild-data/js/sc-app-cta.js?v=1.0" defer></script>
 * 종류: default, lockup, schedule, ipo, theme, delist, disclosure, tool, sidebar
 * 휴대폰(안드로이드): Play 스토어 버튼 / PC: QR 코드 / 아이폰: 준비 중 안내
 * 섀도 DOM 안에 그려서 테마 스타일, 목차 플러그인과 섞이지 않음
 */
(function () {
  'use strict';
  if (window.__scAppCta) return;
  window.__scAppCta = true;

  var BASE = 'https://dooly870505-commits.github.io/stockchild-data/app/promo/';
  var PLAY = 'https://play.google.com/store/apps/details?id=com.stockchild.app';

  function playLink(medium) {
    var ref = 'utm_source=wordpress&utm_medium=' + medium + '&utm_campaign=launch2026';
    return PLAY + '&referrer=' + encodeURIComponent(ref);
  }

  var COPY = {
    'default':  ['주소남 투자도구 앱', '관심종목의 실적발표, 보호예수 해제를 전날 알림으로 받아보세요.'],
    lockup:     ['보호예수 해제, 전날 알림으로', '관심종목에 담아두면 해제 전날 앱 알림이 와요. 해제 물량도 종목별로 한눈에.'],
    schedule:   ['증시일정을 달력과 알림으로', '매주 정리하는 증시일정을 앱 캘린더로 보고, 내 종목 일정은 알림으로 받아요.'],
    ipo:        ['공모주 일정을 앱 캘린더에서', '청약일, 환불일, 상장일을 달력으로 보고 분석 글까지 바로 열어요.'],
    theme:      ['내 종목은 무슨 테마?', '테마 200여 개, 종목 1,700여 개를 앱에서 초성으로도 바로 찾아요.'],
    delist:     ['상장 유지 경보, 바로 알림', '관심종목이 동전주·시총 미달 경보에 걸리면 앱이 바로 알려드려요.'],
    disclosure: ['종목별 주요 공시를 한 화면에', '기재정정, 최대주주 변경, 감자 같은 공시와 일정, 테마를 종목 하나로 모아 봐요.'],
    tool:       ['투자 계산기 70여 개를 앱 하나로', '물타기, 배당, 양도세 계산기와 조회 도구를 휴대폰에서 바로 써요.'],
    sidebar:    ['주소남 투자도구 앱', '내 종목 소식, 증시 캘린더, 알림까지 무료로.']
  };

  var ua = navigator.userAgent || '';
  var isIOS = /iPhone|iPad|iPod/i.test(ua) || (/Macintosh/.test(ua) && 'ontouchend' in document);
  var isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(ua) || (window.matchMedia && matchMedia('(pointer: coarse)').matches);

  var CSS =
    ':host{all:initial;display:block;margin:20px 0}' +
    '*{box-sizing:border-box;font-family:Pretendard,"Apple SD Gothic Neo","Noto Sans KR",sans-serif}' +
    '.box{display:flex;align-items:center;gap:16px;padding:16px 18px;border:1px solid #E6E8EB;border-radius:16px;background:#fff;color:#16181D}' +
    '.logo{width:64px;height:auto;flex:none}' +
    '.txt{flex:1;min-width:0}' +
    '.kick{font-size:12px;font-weight:700;color:#FF5A1F;margin-bottom:2px}' +
    '.ttl{font-size:17px;font-weight:800;letter-spacing:-.3px;line-height:1.35}' +
    '.dsc{font-size:13.5px;color:#6B7280;line-height:1.55;margin-top:3px}' +
    '.btn{display:inline-flex;align-items:center;gap:6px;margin-top:10px;padding:10px 16px;border-radius:999px;background:#16181D;color:#fff;text-decoration:none;font-size:14px;font-weight:700}' +
    '.btn:active{opacity:.85}' +
    '.note{display:inline-block;margin-top:10px;padding:8px 12px;border-radius:10px;background:#F4F5F7;color:#6B7280;font-size:12.5px}' +
    '.qr{flex:none;text-align:center}' +
    '.qr img{width:112px;height:112px;display:block;border:1px solid #E6E8EB;border-radius:10px}' +
    '.qr span{display:block;font-size:11.5px;color:#9AA0A8;margin-top:4px}' +
    '.side .box{flex-direction:column;text-align:center;gap:10px;padding:18px 14px}' +
    '.side .logo{width:84px}' +
    '.side .ttl{font-size:16px}' +
    '@media (max-width:480px){.box{padding:14px;gap:12px}.logo{width:52px}.ttl{font-size:16px}}';

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; });
  }

  function render(el) {
    if (el.__scDone) return;
    el.__scDone = true;
    var kind = (el.getAttribute('data-sc-app-cta') || 'default').trim();
    var c = COPY[kind] || COPY['default'];
    var side = kind === 'sidebar';
    var medium = side ? 'sidebar' : 'cta_' + kind;
    var root = el.attachShadow ? el.attachShadow({ mode: 'open' }) : el;

    var action;
    if (isIOS) {
      action = '<span class="note">지금은 안드로이드만 지원해요. 아이폰 버전은 준비 중이에요.</span>';
    } else if (isMobile) {
      action = '<a class="btn" href="' + esc(playLink(medium)) + '" target="_blank" rel="noopener">▶ Google Play에서 무료 설치</a>';
    } else {
      action = '<a class="btn" href="' + esc(playLink(medium)) + '" target="_blank" rel="noopener">▶ Google Play에서 보기</a>';
    }
    var qr = (!isMobile && !isIOS)
      ? '<div class="qr"><img src="' + BASE + 'app-qr-wordpress.png" alt="주소남 투자도구 설치 QR 코드" loading="lazy"><span>휴대폰 카메라로 찍으면 설치</span></div>'
      : '';

    root.innerHTML =
      '<style>' + CSS + '</style>' +
      '<div class="' + (side ? 'side' : '') + '"><div class="box">' +
      '<img class="logo" src="' + BASE + 'jusonam-app-logo.png" alt="주소남 투자도구" loading="lazy">' +
      '<div class="txt"><div class="kick">무료 앱 · 안드로이드</div>' +
      '<div class="ttl">' + esc(c[0]) + '</div>' +
      '<div class="dsc">' + esc(c[1]) + '</div>' + action + '</div>' +
      (side ? '' : qr) +
      '</div></div>';
  }

  function run() {
    var list = document.querySelectorAll('[data-sc-app-cta]');
    for (var i = 0; i < list.length; i++) render(list[i]);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
  else run();
})();
