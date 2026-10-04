/* stockchild.com 투자도구 모음 목록 (sc-tools-manifest) v1.1 (2026-10-02)
   새 도구를 만들 때마다 tools 배열에 한 줄을 추가합니다.
   status: ready = 랜딩 오른쪽 칸에서 바로 실행 / link = 기존 페이지로 이동 / soon = 준비 중
   js: ready 도구가 필요로 하는 파일 (sc-ui.js는 자동으로 먼저 불러옴), page: 개별 발행 글 주소
   v1.1: 기존 발행 페이지 62개를 link로 등록, g18~g20 분류 추가(분류 목록 맨 위), 149선과 정확히 겹치는 번호는 link 카드가 흡수 */
window.SC_MANIFEST = {
 "base": "https://dooly870505-commits.github.io/stockchild-data/js/",
 "updated": "2026-10-02",
 "groups": [
  [
   "g18",
   "공시·기업 이력"
  ],
  [
   "g19",
   "상장폐지 조기경보"
  ],
  [
   "g20",
   "시세·수급 모니터"
  ],
  [
   "g1",
   "거래일·결제일 센터"
  ],
  [
   "g5",
   "공모주 자금 센터"
  ],
  [
   "g2",
   "주식 본전 센터"
  ],
  [
   "g3",
   "가격·호가 계산기"
  ],
  [
   "g4",
   "매매 리스크 센터"
  ],
  [
   "g6",
   "기업 이벤트 계산"
  ],
  [
   "g7",
   "적정주가 센터"
  ],
  [
   "g8",
   "재무 건전성 진단"
  ],
  [
   "g9",
   "배당 센터"
  ],
  [
   "g10",
   "목표자산 엔진"
  ],
  [
   "g11",
   "포트폴리오 센터"
  ],
  [
   "g12",
   "세금 센터"
  ],
  [
   "g13",
   "해외주식·환율"
  ],
  [
   "g14",
   "투자 교육 시뮬레이터"
  ],
  [
   "g15",
   "투자 놀이터"
  ],
  [
   "g16",
   "내 투자 기록"
  ],
  [
   "g17",
   "채권·원자재·기타"
  ]
 ],
 "tools": [
  {
   "id": "dividend-date",
   "nos": [
    1,
    2,
    138
   ],
   "no": 2,
   "name": "배당·결제일 계산기",
   "desc": "배당 받으려면 언제까지 사야 하는지, 판 돈은 언제 들어오는지, 배당락 전후 매수 비교까지",
   "g": "g9",
   "status": "ready",
   "page": "https://stockchild.com/%eb%b0%b0%eb%8b%b9%eb%9d%bd%ec%9d%bc-%ea%b3%84%ec%82%b0%ea%b8%b0-%ec%96%b8%ec%a0%9c%ea%b9%8c%ec%a7%80-%ec%82%ac%ec%95%bc/",
   "js": [
    "market-calendar-core.js",
    "sc-tool-dividend-date.js"
   ]
  },
  {
   "id": "market-clock",
   "no": 0,
   "name": "글로벌 증시 시계",
   "desc": "서울, 뉴욕, 상하이, 런던의 현지 시각과 지금 거래 상태",
   "g": "g1",
   "status": "link",
   "page": "https://stockchild.com/%eb%af%b8%ea%b5%ad-%ec%a3%bc%ec%8b%9d-%ea%b1%b0%eb%9e%98%ec%8b%9c%ea%b0%84-%ec%a7%80%ea%b8%88-%ec%97%b4%eb%a0%b8%ec%9d%84%ea%b9%8c/"
  },
  {
   "id": "holiday-calendar",
   "no": 0,
   "name": "글로벌 휴장일 캘린더",
   "desc": "주요 국가 증시의 휴장일과 거래시간을 달력으로 한눈에",
   "g": "g1",
   "status": "link",
   "page": "https://stockchild.com/%ea%b8%80%eb%a1%9c%eb%b2%8c-%ed%9c%b4%ec%9e%a5%ec%9d%bc-%ea%b1%b0%eb%9e%98%ec%8b%9c%ea%b0%84-%ec%ba%98%eb%a6%b0%eb%8d%94%ea%b8%80%eb%a1%9c%eb%b2%8c-%ec%a6%9d%ec%8b%9c-%ed%9c%b4%ec%9e%a5%ec%9d%bc/"
  },
  {
   "id": "avg-down",
   "no": 17,
   "nos": [
    17,
    18
   ],
   "name": "물타기 계산기",
   "desc": "추가로 사면 평균단가가 얼마로 내려가는지, 평단 낮추기 계산",
   "g": "g2",
   "status": "link",
   "page": "https://stockchild.com/%eb%ac%bc%ed%83%80%ea%b8%b0-%ea%b3%84%ec%82%b0%ea%b8%b0-%ed%8f%89%eb%8b%a8%ea%b0%80-%eb%82%ae%ec%b6%94%ea%b8%b0/"
  },
  {
   "id": "loss-chicken",
   "no": 0,
   "name": "주식 손실 치킨 환산기",
   "desc": "오늘 날린 돈이 치킨 몇 마리인지 환산해 보는 손실 계산기",
   "g": "g2",
   "status": "link",
   "page": "https://stockchild.com/%ec%a3%bc%ec%8b%9d-%ec%86%90%ec%8b%a4-%ea%b3%84%ec%82%b0%ea%b8%b0-%ec%b9%98%ed%82%a8-%ed%99%98%ec%82%b0%ec%98%a4%eb%8a%98-%ec%b9%98%ed%82%a8-%eb%aa%87-%eb%a7%88%eb%a6%ac-%eb%82%a0%eb%a0%b8%eb%82%98/"
  },
  {
   "id": "limit-up-rich",
   "no": 16,
   "name": "상한가 부자 역산기",
   "desc": "내 시드로 상한가를 몇 번 맞아야 부자가 되는지 역산",
   "g": "g3",
   "status": "link",
   "page": "https://stockchild.com/%ec%83%81%ed%95%9c%ea%b0%80-%eb%b6%80%ec%9e%90-%ec%97%ad%ec%82%b0%ea%b8%b0%eb%a1%9c-%eb%b6%80%ec%9e%90-%eb%90%98%ea%b8%b0%eb%82%b4-%ec%8b%9c%eb%93%9c%eb%a1%9c-%eb%aa%87-%eb%b2%88-%ec%83%81%eb%94%b0/"
  },
  {
   "id": "index-gap",
   "no": 0,
   "name": "지수 대비 종목 괴리율 계산기",
   "desc": "내 종목이 지수보다 얼마나 더 오르고 덜 올랐는지 비교",
   "g": "g3",
   "status": "link",
   "page": "https://stockchild.com/%ec%a7%80%ec%88%98-%eb%8c%80%eb%b9%84-%ec%a2%85%eb%aa%a9-%ea%b4%b4%eb%a6%ac%ec%9c%a8-%ea%b3%84%ec%82%b0%ea%b8%b0/"
  },
  {
   "id": "take-stop",
   "no": 20,
   "name": "익절 손절 계산기",
   "desc": "매수가 기준 익절가와 손절가를 비율대로 계산하는 국룰 계산기",
   "g": "g4",
   "status": "link",
   "page": "https://stockchild.com/%ec%9d%b5%ec%a0%88-%ec%86%90%ec%a0%88-%ea%b3%84%ec%82%b0%ea%b8%b0-%ea%b5%ad%eb%a3%b0/"
  },
  {
   "id": "margin-rate",
   "no": 0,
   "name": "신용융자 이자율 비교",
   "desc": "증권사별 신용융자 기간별 이자율을 한 표로 비교",
   "g": "g4",
   "status": "link",
   "page": "https://stockchild.com/%ec%8b%a0%ec%9a%a9%ec%9c%b5%ec%9e%90-%ec%9d%b4%ec%9e%90%ec%9c%a8-%eb%b9%84%ea%b5%90-2026/"
  },
  {
   "id": "ipo-equal",
   "no": 0,
   "name": "공모주 균등배정 계산기",
   "desc": "청약 건수로 예상 균등배정 주수를 계산",
   "g": "g5",
   "status": "link",
   "page": "https://stockchild.com/%ea%b3%b5%eb%aa%a8%ec%a3%bc-%ea%b7%a0%eb%93%b1%eb%b0%b0%ec%a0%95-%ea%b3%84%ec%82%b0%ea%b8%b0/"
  },
  {
   "id": "spac-stats",
   "no": 0,
   "name": "역대 스팩 합병 성공률",
   "desc": "역대 스팩의 합병 성공률과 결과를 전수 분석",
   "g": "g5",
   "status": "link",
   "page": "https://stockchild.com/%ec%97%ad%eb%8c%80-%ec%8a%a4%ed%8c%a9-%ed%95%a9%eb%b3%91-%ec%84%b1%ea%b3%b5%eb%a5%a0-%ec%a0%84%ec%88%98%eb%b6%84%ec%84%9d/"
  },
  {
   "id": "bonus-issue-cal",
   "no": 0,
   "name": "무상증자 권리락 캘린더",
   "desc": "무상증자 권리락 일정을 한눈에 확인",
   "g": "g6",
   "status": "link",
   "page": "https://stockchild.com/%eb%ac%b4%ec%83%81%ec%a6%9d%ec%9e%90-%ea%b6%8c%eb%a6%ac%eb%9d%bd-%ec%ba%98%eb%a6%b0%eb%8d%94-%ec%9d%bc%ec%a0%95-%ed%95%9c%eb%88%88%ec%97%90-%ed%99%95%ec%9d%b8/"
  },
  {
   "id": "f-score",
   "no": 124,
   "name": "종목 F-Score 계산기",
   "desc": "재무제표 9개 항목으로 0점부터 9점까지 재무 체력 점검",
   "g": "g8",
   "status": "link",
   "page": "https://stockchild.com/%ec%a2%85%eb%aa%a9-f-score-%ea%b3%84%ec%82%b0%ea%b8%b0/"
  },
  {
   "id": "dividend-salary",
   "no": 55,
   "name": "월급 배당금 계산기",
   "desc": "월 배당 목표액을 받으려면 필요한 투자 원금 역산",
   "g": "g9",
   "status": "link",
   "page": "https://stockchild.com/%ec%9b%94%ea%b8%89-%eb%b0%b0%eb%8b%b9%ea%b8%88-%ea%b3%84%ec%82%b0%ea%b8%b0-%ed%95%84%ec%9a%94-%ec%9b%90%ea%b8%88%ec%9d%80/"
  },
  {
   "id": "dividend-net",
   "no": 48,
   "name": "배당 실수령액 계산기",
   "desc": "배당소득세를 뗀 실제 배당 수령액 계산",
   "g": "g9",
   "status": "link",
   "page": "https://stockchild.com/%eb%b0%b0%eb%8b%b9-%ec%8b%a4%ec%88%98%eb%a0%b9%ec%95%a1-%ea%b3%84%ec%82%b0%ea%b8%b0-%eb%ac%b4%eb%a3%8c/"
  },
  {
   "id": "covered-call-etf",
   "no": 0,
   "name": "미국 커버드콜 ETF 총정리",
   "desc": "미국 커버드콜 ETF 170종목의 분배율 비교",
   "g": "g9",
   "status": "link",
   "page": "https://stockchild.com/%eb%af%b8%ea%b5%ad-%ec%bb%a4%eb%b2%84%eb%93%9c%ec%bd%9c-etf-%ec%b4%9d%ec%a0%95%eb%a6%ac-170%ec%a2%85%eb%aa%a9-%eb%b6%84%eb%b0%b0%ec%9c%a8-%eb%b9%84%ea%b5%90/"
  },
  {
   "id": "fire-dday",
   "no": 117,
   "name": "파이어족 계산기",
   "desc": "저축률과 생활비로 조기은퇴까지 남은 D-day 계산",
   "g": "g10",
   "status": "link",
   "page": "https://stockchild.com/%ed%8c%8c%ec%9d%b4%ec%96%b4%ec%a1%b1-%ea%b3%84%ec%82%b0%ea%b8%b0-%ec%9d%80%ed%87%b4-d-day/"
  },
  {
   "id": "compound",
   "no": 0,
   "name": "복리 계산기",
   "desc": "복리로 자산이 불어나는 눈덩이 효과를 그래프로 체감",
   "g": "g10",
   "status": "link",
   "page": "https://stockchild.com/%eb%b3%b5%eb%a6%ac-%ea%b3%84%ec%82%b0%ea%b8%b0-%eb%88%88%eb%8d%a9%ec%9d%b4-%ed%9a%a8%ea%b3%bc-%ec%b2%b4%ea%b0%90/"
  },
  {
   "id": "retire-withdraw",
   "no": 56,
   "name": "은퇴 인출 시뮬레이터",
   "desc": "노후자금을 꺼내 쓰면 몇 년 버틸지 시뮬레이션",
   "g": "g10",
   "status": "link",
   "page": "https://stockchild.com/%ec%9d%80%ed%87%b4-%ec%9d%b8%ec%b6%9c-%ec%8b%9c%eb%ae%ac%eb%a0%88%ec%9d%b4%ed%84%b0%eb%85%b8%ed%9b%84%ec%9e%90%ea%b8%88-%eb%aa%87-%eb%85%84-%eb%b2%84%ed%8b%b8%ea%b9%8c/"
  },
  {
   "id": "latte-factor",
   "no": 0,
   "name": "담배 라떼 주식 계산기",
   "desc": "그때 담배와 라떼를 끊고 투자했다면 지금 얼마일지",
   "g": "g10",
   "status": "link",
   "page": "https://stockchild.com/%eb%8b%b4%eb%b0%b0-%eb%9d%bc%eb%96%bc-%ec%a3%bc%ec%8b%9d-%ea%b3%84%ec%82%b0%ea%b8%b0-%eb%ac%b4%eb%a3%8c%ea%b7%b8%eb%95%8c-%eb%81%8a%ea%b3%a0-%ed%88%ac%ec%9e%90%ed%96%88%eb%8b%a4%eb%a9%b4/"
  },
  {
   "id": "rebalance",
   "no": 131,
   "name": "리밸런싱 계산기",
   "desc": "목표 비중에 맞추려면 종목별로 얼마나 사고팔지 계산",
   "g": "g11",
   "status": "link",
   "page": "https://stockchild.com/%eb%a6%ac%eb%b0%b8%eb%9f%b0%ec%8b%b1-%ea%b3%84%ec%82%b0%ea%b8%b0%ed%8f%ac%ed%8a%b8%ed%8f%b4%eb%a6%ac%ec%98%a4-%eb%b9%84%ec%a4%91-%ea%b3%84%ec%82%b0%ea%b8%b0/"
  },
  {
   "id": "us-capital-gains",
   "no": 59,
   "name": "해외주식 양도세 계산기",
   "desc": "해외주식 매매 차익의 양도소득세와 기본공제 계산",
   "g": "g12",
   "status": "link",
   "page": "https://stockchild.com/%ed%95%b4%ec%99%b8%ec%a3%bc%ec%8b%9d-%ec%96%91%eb%8f%84%ec%84%b8-%ea%b3%84%ec%82%b0%ea%b8%b0/"
  },
  {
   "id": "dividend-health-ins",
   "no": 67,
   "name": "배당소득 건보료 계산기",
   "desc": "배당·이자 소득이 늘면 건강보험료와 피부양자 자격이 어떻게 되는지",
   "g": "g12",
   "status": "link",
   "page": "https://stockchild.com/%eb%b0%b0%eb%8b%b9%ec%86%8c%eb%93%9d-%ea%b1%b4%eb%b3%b4%eb%a3%8c-%ea%b3%84%ec%82%b0%ea%b8%b0/"
  },
  {
   "id": "major-holder-tax-cal",
   "no": 0,
   "name": "대주주 양도세 회피 캘린더",
   "desc": "연말 대주주 양도세 기준과 매도 일정 정리",
   "g": "g12",
   "status": "link",
   "page": "https://stockchild.com/%eb%8c%80%ec%a3%bc%ec%a3%bc-%ec%96%91%eb%8f%84%ec%84%b8-%ed%9a%8c%ed%94%bc-%ec%ba%98%eb%a6%b0%eb%8d%94/"
  },
  {
   "id": "gift-timing",
   "no": 0,
   "name": "주식 증여 타이밍 계산기",
   "desc": "하락장에 주식을 증여하면 세금이 얼마나 달라지는지",
   "g": "g12",
   "status": "link",
   "page": "https://stockchild.com/%ec%a3%bc%ec%8b%9d-%ec%a6%9d%ec%97%ac-%ed%83%80%ec%9d%b4%eb%b0%8d-%ea%b3%84%ec%82%b0%ea%b8%b0%ed%95%98%eb%9d%bd%ec%9e%a5%ec%97%90-%ec%a6%9d%ec%97%ac%ed%95%98%ec%84%b8%ec%9a%94/"
  },
  {
   "id": "fx-fee",
   "no": 0,
   "name": "증권사 환전수수료 비교",
   "desc": "증권사별 환전 수수료와 환전하기 좋은 시간 비교",
   "g": "g13",
   "status": "link",
   "page": "https://stockchild.com/%ec%a6%9d%ea%b6%8c%ec%82%ac-%ed%99%98%ec%a0%84%ec%88%98%ec%88%98%eb%a3%8c-%eb%b9%84%ea%b5%90%ed%86%a0%ec%8a%a4%ec%a6%9d%ea%b6%8c-%ed%99%98%ec%a0%84-%eb%aa%87-%ec%8b%9c%ea%b0%80-%ec%a2%8b%ec%9d%84/"
  },
  {
   "id": "forced-sale",
   "no": 80,
   "name": "반대매매 계산기",
   "desc": "신용·미수로 샀을 때 몇 % 떨어지면 반대매매인지 계산",
   "g": "g14",
   "status": "link",
   "page": "https://stockchild.com/%eb%b0%98%eb%8c%80%eb%a7%a4%eb%a7%a4-%ea%b3%84%ec%82%b0%ea%b8%b0-%eb%aa%87-%ed%95%98%eb%9d%bd%ea%b9%8c%ec%a7%80/"
  },
  {
   "id": "beginner-roadmap",
   "no": 0,
   "name": "주린이 첫 투자 로드맵",
   "desc": "주식을 처음 시작할 때 순서대로 따라가는 체크리스트",
   "g": "g14",
   "status": "link",
   "page": "https://stockchild.com/%ec%a3%bc%eb%a6%b0%ec%9d%b4-%ec%b2%ab-%ed%88%ac%ec%9e%90-%eb%a1%9c%eb%93%9c%eb%a7%b5%ec%a3%bc%ec%8b%9d-%ec%b2%98%ec%9d%8c-%ec%8b%9c%ec%9e%91%ed%95%98%eb%8a%94-%eb%b2%95/"
  },
  {
   "id": "addiction-test",
   "no": 0,
   "name": "주식 중독 자가진단",
   "desc": "나 혹시 주식 중독일까, 문항으로 확인해 보는 자가진단",
   "g": "g15",
   "status": "link",
   "page": "https://stockchild.com/%eb%82%98-%ed%98%b9%ec%8b%9c-%ec%a3%bc%ec%8b%9d-%ec%a4%91%eb%8f%85-%ec%9e%90%ea%b0%80%ec%a7%84%eb%8b%a8/"
  },
  {
   "id": "leading-room-test",
   "no": 92,
   "name": "리딩방 사기 자가진단",
   "desc": "그 리딩방 사기일까, 수법 패턴으로 점검하는 체크리스트",
   "g": "g15",
   "status": "link",
   "page": "https://stockchild.com/%ea%b7%b8-%eb%a6%ac%eb%94%a9%eb%b0%a9-%ec%82%ac%ea%b8%b0%ec%9d%bc%ea%b9%8c-%ec%9e%90%ea%b0%80%ec%a7%84%eb%8b%a8/"
  },
  {
   "id": "impulse-test",
   "no": 0,
   "name": "뇌동매매 자가진단",
   "desc": "추격매수와 충동매매 습관을 점검하는 테스트",
   "g": "g15",
   "status": "link",
   "page": "https://stockchild.com/%eb%87%8c%eb%8f%99%eb%a7%a4%eb%a7%a4-%ec%9e%90%ea%b0%80%ec%a7%84%eb%8b%a8-%ed%85%8c%ec%8a%a4%ed%8a%b8/"
  },
  {
   "id": "return-rank",
   "no": 0,
   "name": "주식 수익률 계급표",
   "desc": "내 수익률은 어느 계급인지 확인",
   "g": "g15",
   "status": "link",
   "page": "https://stockchild.com/%ec%a3%bc%ec%8b%9d-%ec%88%98%ec%9d%b5%eb%a5%a0-%ea%b3%84%ea%b8%89%ed%91%9c-%ed%99%95%ec%9d%b8/"
  },
  {
   "id": "trading-luck",
   "no": 0,
   "name": "오늘의 매매운",
   "desc": "재미로 보는 오늘의 매매운",
   "g": "g15",
   "status": "link",
   "page": "https://stockchild.com/%ec%98%a4%eb%8a%98%ec%9d%98-%eb%a7%a4%eb%a7%a4%ec%9a%b4-%eb%ac%b4%eb%a3%8c-%ed%99%95%ec%9d%b8/"
  },
  {
   "id": "stock-match",
   "no": 0,
   "name": "종목 궁합 테스트",
   "desc": "나와 종목의 궁합을 재미로 확인",
   "g": "g15",
   "status": "link",
   "page": "https://stockchild.com/%ec%a2%85%eb%aa%a9-%ea%b6%81%ed%95%a9-%ed%85%8c%ec%8a%a4%ed%8a%b8-%eb%ac%b4%eb%a3%8c/"
  },
  {
   "id": "brand-color-quiz",
   "no": 0,
   "name": "종목 브랜드컬러 퀴즈",
   "desc": "색깔만 보고 어느 회사인지 맞히는 퀴즈",
   "g": "g15",
   "status": "link",
   "page": "https://stockchild.com/%ec%a2%85%eb%aa%a9-%eb%b8%8c%eb%9e%9c%eb%93%9c%ec%bb%ac%eb%9f%ac-%ed%80%b4%ec%a6%88/"
  },
  {
   "id": "slang-quiz",
   "no": 0,
   "name": "주식 은어 초성 퀴즈",
   "desc": "초성만 보고 주식 은어를 맞히는 게임",
   "g": "g15",
   "status": "link",
   "page": "https://stockchild.com/%ec%a3%bc%ec%8b%9d-%ec%9d%80%ec%96%b4-%ed%80%b4%ec%a6%88-%ec%b4%88%ec%84%b1-%ea%b2%8c%ec%9e%84/"
  },
  {
   "id": "jonber-index",
   "no": 0,
   "name": "존버 지수 계산기",
   "desc": "내 존버 내공을 별점으로 매겨 보는 계산기",
   "g": "g15",
   "status": "link",
   "page": "https://stockchild.com/%ec%a1%b4%eb%b2%84-%ec%a7%80%ec%88%98-%eb%b3%84%ec%a0%90-%ea%b3%84%ec%82%b0%ea%b8%b0/"
  },
  {
   "id": "disclosure-quiz",
   "no": 0,
   "name": "공시 골든벨",
   "desc": "매일 바뀌는 공시 퀴즈 오늘의 문제",
   "g": "g15",
   "status": "link",
   "page": "https://stockchild.com/%ea%b3%b5%ec%8b%9c-%ea%b3%a8%eb%93%a0%eb%b2%a8-%ec%98%a4%eb%8a%98%ec%9d%98-%eb%ac%b8%ec%a0%9c/"
  },
  {
   "id": "sell-vs-hold",
   "no": 0,
   "name": "그때 팔았으면 vs 존버",
   "desc": "그때 팔았을 때와 계속 들고 있을 때 결과 비교",
   "g": "g15",
   "status": "link",
   "page": "https://stockchild.com/%ea%b7%b8%eb%95%8c-%ed%8c%94%ec%95%98%ec%9c%bc%eb%a9%b4-vs-%ec%a1%b4%eb%b2%84%ea%b7%b8%eb%95%8c-%ed%8c%94%ec%a7%80-%eb%a7%90%ea%b1%b8-%ea%b3%84%ec%82%b0%ea%b8%b0/"
  },
  {
   "id": "slang-dict",
   "no": 95,
   "name": "주식 은어 사전",
   "desc": "존버, 물타기, 떡상 같은 주식 은어 뜻 총정리",
   "g": "g15",
   "status": "link",
   "page": "https://stockchild.com/%ec%a3%bc%ec%8b%9d-%ec%9d%80%ec%96%b4-%ec%82%ac%ec%a0%84-%ec%b4%9d%ec%a0%95%eb%a6%ac%ec%a1%b4%eb%b2%84-%eb%ac%bc%ed%83%80%ea%b8%b0-%eb%96%a1%ec%83%81-%eb%9c%bb-%ec%a0%95%eb%a6%ac/"
  },
  {
   "id": "past-return",
   "no": 94,
   "name": "주식 과거 수익률 계산기",
   "desc": "그때 샀더라면 지금 얼마일지 계산하는 그때 살걸 계산기",
   "g": "g15",
   "status": "link",
   "page": "https://stockchild.com/%ec%a3%bc%ec%8b%9d-%ea%b3%bc%ea%b1%b0-%ec%88%98%ec%9d%b5%eb%a5%a0-%ea%b3%84%ec%82%b0%ea%b8%b0%ea%b7%b8%eb%95%8c-%ec%83%80%eb%8d%94%eb%9d%bc%eb%a9%b4-%ec%a7%80%ea%b8%88-%ec%96%bc%eb%a7%88%ec%9d%bc/"
  },
  {
   "id": "challenge-sim",
   "no": 0,
   "name": "주식 챌린지 시뮬레이터",
   "desc": "목표 수익 챌린지를 시뮬레이션으로 도전",
   "g": "g15",
   "status": "link",
   "page": "https://stockchild.com/%ec%a3%bc%ec%8b%9d-%ec%b1%8c%eb%a6%b0%ec%a7%80-%ec%8b%9c%eb%ae%ac%eb%a0%88%ec%9d%b4%ed%84%b0/"
  },
  {
   "id": "retail-bond",
   "no": 0,
   "name": "개인국채 청약수익률 계산기",
   "desc": "개인투자용 국채 만기 보유와 중도환매 수익률 비교",
   "g": "g17",
   "status": "link",
   "page": "https://stockchild.com/%ea%b0%9c%ec%9d%b8%ea%b5%ad%ec%b1%84-%ec%b2%ad%ec%95%bd%ec%88%98%ec%9d%b5%eb%a5%a0-%ea%b3%84%ec%82%b0%ea%b8%b0%ea%b5%ad%ec%b1%84-%eb%a7%8c%ea%b8%b0-%eb%b3%b4%ec%9c%a0-vs-%ec%a4%91%eb%8f%84%ed%99%98/"
  },
  {
   "id": "disclosure-dict",
   "no": 0,
   "name": "주식 공시 사전",
   "desc": "어려운 공시 용어를 개미 눈높이로 풀이",
   "g": "g18",
   "status": "link",
   "page": "https://stockchild.com/%ea%b3%b5%ec%8b%9c-%ed%95%b4%ec%84%9d-%ec%82%ac%ec%a0%84/"
  },
  {
   "id": "name-change",
   "no": 0,
   "name": "상호변경 조회기",
   "desc": "2016년부터 사명을 바꾼 종목과 개명왕 랭킹",
   "g": "g18",
   "status": "link",
   "page": "https://stockchild.com/%ec%83%81%ed%98%b8%eb%b3%80%ea%b2%bd-%ec%a1%b0%ed%9a%8c%ea%b8%b0-%ea%b0%9c%eb%aa%85%ec%99%95-%ec%a2%85%eb%aa%a9-%ec%b0%be%ea%b8%b0/"
  },
  {
   "id": "major-holder-change",
   "no": 0,
   "name": "최대주주 변경 조회",
   "desc": "최대주주가 자주 바뀐 종목, 손바뀜 랭킹",
   "g": "g18",
   "status": "link",
   "page": "https://stockchild.com/%ec%b5%9c%eb%8c%80%ec%a3%bc%ec%a3%bc-%eb%b3%80%ea%b2%bd-%ec%a1%b0%ed%9a%8c-%ec%86%90%eb%b0%94%eb%80%9c-%eb%9e%ad%ed%82%b9%ec%9e%90%ec%a3%bc-%eb%b0%94%eb%80%90-%ec%a3%bc%ec%8b%9d-%ec%b0%be%eb%8a%94/"
  },
  {
   "id": "major-holder-deal",
   "no": 0,
   "name": "최대주주 양수도 계약 조회",
   "desc": "최대주주 지분 양수도 계약의 진행 상황 조회",
   "g": "g18",
   "status": "link",
   "page": "https://stockchild.com/%ec%b5%9c%eb%8c%80%ec%a3%bc%ec%a3%bc-%ec%96%91%ec%88%98%eb%8f%84-%ea%b3%84%ec%95%bd-%ec%a7%84%ed%96%89-%ec%a1%b0%ed%9a%8c/"
  },
  {
   "id": "correction-rank",
   "no": 0,
   "name": "기재정정 랭킹",
   "desc": "공시를 가장 많이 정정한 정정왕 종목 랭킹",
   "g": "g18",
   "status": "link",
   "page": "https://stockchild.com/%ea%b8%b0%ec%9e%ac%ec%a0%95%ec%a0%95-%eb%9e%ad%ed%82%b9-2026-%ec%a0%95%ec%a0%95%ec%99%95%ec%9d%80/"
  },
  {
   "id": "disclosure-history",
   "no": 0,
   "name": "종목 공시 이력 조회",
   "desc": "종목별 공시 이력을 한눈에 모아 보기",
   "g": "g18",
   "status": "link",
   "page": "https://stockchild.com/%ec%a2%85%eb%aa%a9-%ea%b3%b5%ec%8b%9c-%ec%9d%b4%eb%a0%a5-%ed%95%9c%eb%88%88%ec%97%90-%eb%b3%b4%ea%b8%b0/"
  },
  {
   "id": "half-report-deadline",
   "no": 0,
   "name": "반기보고서 제출기한 확인",
   "desc": "반기보고서 제출기한과 제출 현황 확인",
   "g": "g18",
   "status": "link",
   "page": "https://stockchild.com/%eb%b0%98%ea%b8%b0%eb%b3%b4%ea%b3%a0%ec%84%9c-%ec%a0%9c%ec%b6%9c%ea%b8%b0%ed%95%9c-%ec%8b%a4%ec%8b%9c%ea%b0%84-%ed%99%95%ec%9d%b8/"
  },
  {
   "id": "rights-issue-vol",
   "no": 0,
   "name": "유상증자 주가 변동성 추적",
   "desc": "유상증자 공시 이후 주가가 어떻게 움직였는지 추적",
   "g": "g18",
   "status": "link",
   "page": "https://stockchild.com/%ec%9c%a0%ec%83%81%ec%a6%9d%ec%9e%90-%ec%a3%bc%ea%b0%80-%eb%b3%80%eb%8f%99%ec%84%b1-%ec%b6%94%ec%a0%81-%eb%8f%84%ea%b5%ac/"
  },
  {
   "id": "lockup-release",
   "no": 0,
   "name": "보호예수 해제 종목 리스트",
   "desc": "보호예수가 풀리는 종목과 물량 일정",
   "g": "g18",
   "status": "link",
   "page": "https://stockchild.com/%eb%b3%b4%ed%98%b8%ec%98%88%ec%88%98-%ed%95%b4%ec%a0%9c-%ec%a2%85%eb%aa%a9-%eb%a6%ac%ec%8a%a4%ed%8a%b8/"
  },
  {
   "id": "penny-delist",
   "no": 0,
   "name": "동전주 상장폐지 리스트",
   "desc": "주가 1,000원 미만 동전주의 상장폐지 요건 점검",
   "g": "g19",
   "status": "link",
   "page": "https://stockchild.com/%EB%8F%99%EC%A0%84%EC%A3%BC-%EC%83%81%EC%9E%A5%ED%8F%90%EC%A7%80-%EB%A6%AC%EC%8A%A4%ED%8A%B8/"
  },
  {
   "id": "mcap-delist",
   "no": 0,
   "name": "시가총액 미달 상장폐지 리스트",
   "desc": "코스피 300억, 코스닥 200억 시가총액 기준 미달 종목",
   "g": "g19",
   "status": "link",
   "page": "https://stockchild.com/%ec%8b%9c%ea%b0%80%ec%b4%9d%ec%95%a1-%ec%83%81%ec%9e%a5%ed%8f%90%ec%a7%80-%eb%a6%ac%ec%8a%a4%ed%8a%b8-%ec%bd%94%ec%8a%a4%ed%94%bc-300%ec%96%b5-%ec%bd%94%ec%8a%a4%eb%8b%a5-200%ec%96%b5-%eb%af%b8/"
  },
  {
   "id": "mcap-board",
   "no": 0,
   "name": "시가총액 순위 전광판",
   "desc": "코스피·코스닥 시가총액 TOP 30 전광판",
   "g": "g20",
   "status": "link",
   "page": "https://stockchild.com/%ec%8b%9c%ea%b0%80%ec%b4%9d%ec%95%a1-%ec%88%9c%ec%9c%84-%ec%a0%84%ea%b4%91%ed%8c%90-%ec%bd%94%ec%8a%a4%ed%94%bc%c2%b7%ec%bd%94%ec%8a%a4%eb%8b%a5-top-30/"
  },
  {
   "id": "single-stock-etf",
   "no": 0,
   "name": "단일종목 ETF 시세",
   "desc": "삼성전자, SK하이닉스 단일종목 ETF 시세와 종목코드",
   "g": "g20",
   "status": "link",
   "page": "https://stockchild.com/%ec%82%bc%ec%84%b1%ec%a0%84%ec%9e%90-sk%ed%95%98%ec%9d%b4%eb%8b%89%ec%8a%a4-%eb%8b%a8%ec%9d%bc%ec%a2%85%eb%aa%a9-etf-%ec%8b%a4%ec%8b%9c%ea%b0%84-%ec%8b%9c%ec%84%b8-%ec%a2%85%eb%aa%a9%ec%bd%94%eb%93%9c/"
  },
  {
   "id": "adr-gap",
   "no": 0,
   "name": "ADR 괴리율 모니터",
   "desc": "미국 상장 ADR과 국내 원주의 가격 차이 비교",
   "g": "g20",
   "status": "link",
   "page": "https://stockchild.com/adr-%ea%b4%b4%eb%a6%ac%ec%9c%a8-%eb%aa%a8%eb%8b%88%ed%84%b0-%eb%af%b8%ea%b5%ad-vs-%ea%b5%ad%eb%82%b4/"
  },
  {
   "id": "pref-gap",
   "no": 129,
   "name": "우선주 괴리율 모니터",
   "desc": "우선주와 보통주 가격 차이가 벌어진 종목 확인",
   "g": "g20",
   "status": "link",
   "page": "https://stockchild.com/%ec%9a%b0%ec%84%a0%ec%a3%bc-%ea%b4%b4%eb%a6%ac%ec%9c%a8-%eb%aa%a8%eb%8b%88%ed%84%b0%ec%9a%b0%ec%84%a0%ec%a3%bc-vs-%eb%b3%b4%ed%86%b5%ec%a3%bc-%ec%b0%a8%ec%9d%b4/"
  },
  {
   "id": "foreign-limit",
   "no": 0,
   "name": "외국인 한도소진율 모니터",
   "desc": "외국인 보유 한도가 얼마나 남았는지 확인",
   "g": "g20",
   "status": "link",
   "page": "https://stockchild.com/%ec%99%b8%ea%b5%ad%ec%9d%b8-%ed%95%9c%eb%8f%84%ec%86%8c%ec%a7%84%ec%9c%a8-%eb%aa%a8%eb%8b%88%ed%84%b0%ed%95%9c%eb%8f%84-%ec%96%bc%eb%a7%88%eb%82%98-%eb%82%a8%ec%95%98%eb%82%98/"
  },
  {
   "id": "investor-flow-heatmap",
   "no": 0,
   "name": "투자자별 매매동향 히트맵",
   "desc": "개인, 외국인, 기관 수급을 히트맵으로 한눈에",
   "g": "g20",
   "status": "link",
   "page": "https://stockchild.com/%ed%88%ac%ec%9e%90%ec%9e%90%eb%b3%84-%eb%a7%a4%eb%a7%a4%eb%8f%99%ed%96%a5-%ed%9e%88%ed%8a%b8%eb%a7%b5%ec%98%a4%eb%8a%98-%ec%88%98%ea%b8%89-%ed%9e%88%ed%8a%b8%eb%a7%b5-%ed%95%9c%eb%88%88%ec%97%90/"
  },
  {
   "id": "nps-holdings",
   "no": 0,
   "name": "국민연금 보유 종목 조회",
   "desc": "국민연금이 보유한 종목과 지분 조회",
   "g": "g20",
   "status": "link",
   "page": "https://stockchild.com/%ea%b5%ad%eb%af%bc%ec%97%b0%ea%b8%88-%eb%b3%b4%ec%9c%a0-%ec%a2%85%eb%aa%a9-%ec%a1%b0%ed%9a%8c/"
  },
  {
   "id": "us-macro-live",
   "no": 0,
   "name": "미국 경제지표 속보",
   "desc": "미국 주요 경제지표 발표 결과를 빠르게 정리",
   "g": "g20",
   "status": "link",
   "page": "https://stockchild.com/%eb%af%b8%ea%b5%ad-%ea%b2%bd%ec%a0%9c%ec%a7%80%ed%91%9c-%ec%86%8d%eb%b3%b4-%ec%8b%a4%ec%8b%9c%ea%b0%84-%ec%a0%95%eb%a6%ac/"
  },
  {
   "id": "nasdaq-kosdaq",
   "no": 0,
   "name": "나스닥 코스닥 상관관계",
   "desc": "나스닥이 오르면 코스닥도 오를까, 데이터로 확인",
   "g": "g20",
   "status": "link",
   "page": "https://stockchild.com/%eb%82%98%ec%8a%a4%eb%8b%a5-%ec%bd%94%ec%8a%a4%eb%8b%a5-%ec%83%81%ea%b4%80%ea%b4%80%ea%b3%84%ec%9d%98-%ec%a7%84%ec%8b%a4/"
  },
  {
   "id": "tenbagger",
   "no": 0,
   "name": "텐베거 열전",
   "desc": "10배 오른 주식들의 이야기 모음",
   "g": "g20",
   "status": "link",
   "page": "https://stockchild.com/10%eb%b0%b0-%ec%98%a4%eb%a5%b8-%ec%a3%bc%ec%8b%9d-%ed%85%90%eb%b2%a0%ea%b1%b0-%ec%97%b4%ec%a0%84/"
  },
  {
   "no": 3,
   "name": "권리락일 계산기",
   "desc": "무상·유상증자 신주배정기준일 입력 시 권리락일과 마지막 매수일",
   "g": "g1",
   "status": "soon",
   "id": "t3"
  },
  {
   "no": 4,
   "name": "공모주 환불일·상장일 계산기",
   "desc": "청약 마감일 입력 시 환불일 자동 계산",
   "g": "g5",
   "status": "soon",
   "id": "t4"
  },
  {
   "no": 5,
   "name": "거래일 수 계산기",
   "desc": "두 날짜 사이 실제 거래일 수, 보호예수 기간 확인용",
   "g": "g1",
   "status": "soon",
   "id": "t5"
  },
  {
   "no": 6,
   "name": "연말 손익확정 마감일",
   "desc": "올해 손익으로 잡히는 마지막 매도일, 한국과 미국",
   "g": "g1",
   "status": "soon",
   "id": "t6"
  },
  {
   "no": 7,
   "name": "선물·옵션 만기일 D-day",
   "desc": "매월 둘째 목요일, 네 마녀의 날 강조",
   "g": "g1",
   "status": "soon",
   "id": "t7"
  },
  {
   "no": 8,
   "name": "미국 옵션 만기·트리플 위칭 캘린더",
   "desc": "셋째 금요일, 한국시간 병기",
   "g": "g1",
   "status": "soon",
   "id": "t8"
  },
  {
   "no": 9,
   "name": "미국 경제지표 한국시간 변환표",
   "desc": "CPI, 고용보고서, FOMC 발표 시각을 서머타임 자동 반영해 한국시간으로",
   "g": "g1",
   "status": "soon",
   "id": "t9"
  },
  {
   "no": 10,
   "name": "미국 실적발표 한국시간 변환기",
   "desc": "장전(BMO)·장후(AMC) 발표를 한국 몇 시로",
   "g": "g1",
   "status": "soon",
   "id": "t10"
  },
  {
   "no": 11,
   "name": "FOMC·금통위 D-day",
   "desc": "연초 발표되는 회의 일정 입력, 다음 회의까지 카운트다운",
   "g": "g1",
   "status": "soon",
   "id": "t11"
  },
  {
   "no": 12,
   "name": "세계 시차 변환기",
   "desc": "한국시간과 뉴욕, 런던, 상하이, 도쿄 상호 변환",
   "g": "g1",
   "status": "soon",
   "id": "t12"
  },
  {
   "no": 13,
   "name": "개장 알림 탭",
   "desc": "탭을 열어두면 개장 N분 전 브라우저 알림",
   "g": "g1",
   "status": "soon",
   "id": "t13"
  },
  {
   "no": 14,
   "name": "상한가·하한가 계산기",
   "desc": "전일 종가 입력 시 호가단위 반영한 정확한 상·하한가",
   "g": "g3",
   "status": "soon",
   "id": "t14"
  },
  {
   "no": 15,
   "name": "호가단위 조회기",
   "desc": "가격대별 한 틱 크기와 한 틱 등락률",
   "g": "g3",
   "status": "soon",
   "id": "t15"
  },
  {
   "no": 19,
   "name": "본전 매도가 계산기",
   "desc": "수수료와 세금까지 넣은 진짜 손익분기 가격",
   "g": "g2",
   "status": "soon",
   "id": "t19"
  },
  {
   "no": 21,
   "name": "포지션 크기 계산기",
   "desc": "계좌의 1%만 잃도록 몇 주 사야 하나",
   "g": "g4",
   "status": "soon",
   "id": "t21"
  },
  {
   "no": 22,
   "name": "분할매수 계획표",
   "desc": "총 투자금, 회차, 하락 간격 입력 시 회차별 가격과 수량",
   "g": "g4",
   "status": "soon",
   "id": "t22"
  },
  {
   "no": 23,
   "name": "손실 회복 계산기",
   "desc": "-50%면 +100%가 필요하다는 비대칭을 그래프로",
   "g": "g2",
   "status": "soon",
   "id": "t23"
  },
  {
   "no": 24,
   "name": "등락률 계산기",
   "desc": "두 가격 사이 등락률, 반대로 목표 %의 가격",
   "g": "g2",
   "status": "soon",
   "id": "t24"
  },
  {
   "no": 25,
   "name": "시간외 단일가 가격 범위 계산기",
   "desc": "종가 기준 ±10% 범위와 호가",
   "g": "g3",
   "status": "soon",
   "id": "t25"
  },
  {
   "no": 26,
   "name": "무상증자 권리락 기준가 계산기",
   "desc": "배정비율 입력 시 권리락 후 기준가, \"싸진 게 아님\" 설명",
   "g": "g6",
   "status": "soon",
   "id": "t26"
  },
  {
   "no": 27,
   "name": "유상증자 권리락 이론가 계산기",
   "desc": "발행가, 증자비율 입력 시 이론 권리락가",
   "g": "g6",
   "status": "soon",
   "id": "t27"
  },
  {
   "no": 28,
   "name": "유상증자 참여 손익 비교기",
   "desc": "청약할 때와 안 할 때 내 계좌 비교",
   "g": "g6",
   "status": "soon",
   "id": "t28"
  },
  {
   "no": 29,
   "name": "액면분할·병합 계산기",
   "desc": "분할·병합 후 주가와 보유 주식수",
   "g": "g6",
   "status": "soon",
   "id": "t29"
  },
  {
   "no": 30,
   "name": "감자 후 내 주식 계산기",
   "desc": "감자 비율 입력 시 남는 주식수와 기준가 (로드맵 No.15의 계산기 부분)",
   "g": "g6",
   "status": "soon",
   "id": "t30"
  },
  {
   "no": 31,
   "name": "주식배당 계산기",
   "desc": "주식배당 후 주식수와 기준가",
   "g": "g6",
   "status": "soon",
   "id": "t31"
  },
  {
   "no": 32,
   "name": "공개매수 차익 계산기",
   "desc": "공개매수가와 현재가 차이, 안분 비율 시나리오별 수익",
   "g": "g6",
   "status": "soon",
   "id": "t32"
  },
  {
   "no": 33,
   "name": "합병 교환 주식수 계산기",
   "desc": "합병비율 입력 시 받게 될 주식수와 단주 처리",
   "g": "g6",
   "status": "soon",
   "id": "t33"
  },
  {
   "no": 34,
   "name": "스팩 수익 계산기",
   "desc": "합병 시와 청산 시 수익 비교",
   "g": "g6",
   "status": "soon",
   "id": "t34"
  },
  {
   "no": 35,
   "name": "CB 희석률 계산기",
   "desc": "전환 시 주식수 증가율과 희석 효과",
   "g": "g6",
   "status": "soon",
   "id": "t35"
  },
  {
   "no": 36,
   "name": "공모주 수익 계산기",
   "desc": "배정주수, 공모가, 매도가, 수수료로 실수익",
   "g": "g5",
   "status": "soon",
   "id": "t36"
  },
  {
   "no": 37,
   "name": "공모주 시초가·상한가 범위 계산기",
   "desc": "공모가 입력 시 첫날 가능한 가격 범위와 따상·따따블 가격",
   "g": "g3",
   "status": "soon",
   "id": "t37"
  },
  {
   "no": 38,
   "name": "S-RIM 적정주가 계산기",
   "desc": "검색 수요가 꾸준한 국내 개인투자자 대표 공식",
   "g": "g7",
   "status": "soon",
   "id": "t38"
  },
  {
   "no": 39,
   "name": "PER·PBR·ROE 상호 변환기",
   "desc": "둘을 넣으면 나머지 하나 계산",
   "g": "g7",
   "status": "soon",
   "id": "t39"
  },
  {
   "no": 40,
   "name": "그레이엄 공식 적정가",
   "desc": "가치투자 고전 공식",
   "g": "g7",
   "status": "soon",
   "id": "t40"
  },
  {
   "no": 41,
   "name": "PEG 계산기",
   "desc": "성장률 대비 PER",
   "g": "g7",
   "status": "soon",
   "id": "t41"
  },
  {
   "no": 42,
   "name": "배당할인모형 적정가",
   "desc": "배당, 성장률, 요구수익률로 적정가",
   "g": "g7",
   "status": "soon",
   "id": "t42"
  },
  {
   "no": 43,
   "name": "간이 DCF 계산기",
   "desc": "5년 현금흐름과 할인율 슬라이더",
   "g": "g7",
   "status": "soon",
   "id": "t43"
  },
  {
   "no": 44,
   "name": "목표주가 괴리율 계산기",
   "desc": "증권사 목표가 대비 상승 여력",
   "g": "g7",
   "status": "soon",
   "id": "t44"
  },
  {
   "no": 45,
   "name": "시가총액 역산기",
   "desc": "시총 1조가 되려면 주가가 얼마여야 하나",
   "g": "g7",
   "status": "soon",
   "id": "t45"
  },
  {
   "no": 46,
   "name": "EV/EBITDA 계산기",
   "desc": "부채까지 반영한 기업가치 배수",
   "g": "g7",
   "status": "soon",
   "id": "t46"
  },
  {
   "no": 47,
   "name": "안전마진 계산기",
   "desc": "적정가 대비 현재가 할인율",
   "g": "g7",
   "status": "soon",
   "id": "t47"
  },
  {
   "no": 49,
   "name": "시가배당률 계산기",
   "desc": "주당배당금과 매수가로 배당수익률",
   "g": "g9",
   "status": "soon",
   "id": "t49"
  },
  {
   "no": 50,
   "name": "배당 재투자 복리 시뮬레이터",
   "desc": "배당을 다시 사면 10년, 20년 뒤",
   "g": "g9",
   "status": "soon",
   "id": "t50"
  },
  {
   "no": 51,
   "name": "적립식 복리 계산기",
   "desc": "월 적립액과 수익률로 미래 자산 그래프",
   "g": "g10",
   "status": "soon",
   "id": "t51"
  },
  {
   "no": 52,
   "name": "72의 법칙 계산기",
   "desc": "원금 2배까지 걸리는 기간",
   "g": "g10",
   "status": "soon",
   "id": "t52"
  },
  {
   "no": 53,
   "name": "목표 자산 역산기",
   "desc": "10억을 모으려면 매달 얼마",
   "g": "g10",
   "status": "soon",
   "id": "t53"
  },
  {
   "no": 54,
   "name": "실질수익률 계산기",
   "desc": "물가상승률을 뺀 진짜 수익률",
   "g": "g10",
   "status": "soon",
   "id": "t54"
  },
  {
   "no": 57,
   "name": "레버리지 ETF 변동성 끌림 시뮬레이터",
   "desc": "지수는 제자리인데 레버리지는 손실인 이유",
   "g": "g14",
   "status": "soon",
   "id": "t57"
  },
  {
   "no": 58,
   "name": "증권거래세 계산기",
   "desc": "매도 금액별 거래세와 농특세",
   "g": "g12",
   "status": "soon",
   "id": "t58"
  },
  {
   "no": 60,
   "name": "연말 손익통산 절세 시뮬레이터",
   "desc": "손실 종목을 연내 매도하면 양도세가 얼마나 줄까",
   "g": "g12",
   "status": "soon",
   "id": "t60"
  },
  {
   "no": 61,
   "name": "미국 배당 원천징수 계산기",
   "desc": "달러 배당의 세후 원화 수령액",
   "g": "g12",
   "status": "soon",
   "id": "t61"
  },
  {
   "no": 62,
   "name": "금융소득 종합과세 판정기",
   "desc": "이자와 배당 합계가 기준을 넘는지",
   "g": "g12",
   "status": "soon",
   "id": "t62"
  },
  {
   "no": 63,
   "name": "연금저축·IRP 세액공제 계산기",
   "desc": "소득 구간별 공제율과 환급액",
   "g": "g12",
   "status": "soon",
   "id": "t63"
  },
  {
   "no": 64,
   "name": "ISA 비과세 계산기",
   "desc": "유형별 비과세 한도와 절세액",
   "g": "g12",
   "status": "soon",
   "id": "t64"
  },
  {
   "no": 65,
   "name": "국내 상장 해외 ETF vs 미국 직투 세금 비교기",
   "desc": "같은 수익이면 어디가 유리한가",
   "g": "g12",
   "status": "soon",
   "id": "t65"
  },
  {
   "no": 66,
   "name": "자녀 증여 공제 계산기",
   "desc": "10년 합산 공제 한도와 남은 한도",
   "g": "g12",
   "status": "soon",
   "id": "t66"
  },
  {
   "no": 68,
   "name": "소수점 매수 계산기",
   "desc": "원화 금액으로 몇 주를 살 수 있나",
   "g": "g13",
   "status": "soon",
   "id": "t68"
  },
  {
   "no": 69,
   "name": "환차손익 분해 계산기",
   "desc": "내 수익 중 주가 몫과 환율 몫",
   "g": "g13",
   "status": "soon",
   "id": "t69"
  },
  {
   "no": 70,
   "name": "분할 환전 계획표",
   "desc": "목표 금액을 몇 번에 나눠 환전할지",
   "g": "g13",
   "status": "soon",
   "id": "t70"
  },
  {
   "no": 71,
   "name": "달러 배당 원화 환산기",
   "desc": "분기 배당을 원화로, 연간 합계까지",
   "g": "g13",
   "status": "soon",
   "id": "t71"
  },
  {
   "no": 72,
   "name": "해외주식 총비용 계산기",
   "desc": "수수료와 환전 비용을 합친 실제 비용",
   "g": "g13",
   "status": "soon",
   "id": "t72"
  },
  {
   "no": 73,
   "name": "미국 3대 지수 차이 사전",
   "desc": "S&P500, 나스닥100, 다우 구성 방식 비교",
   "g": "g13",
   "status": "soon",
   "id": "t73"
  },
  {
   "no": 74,
   "name": "미국 주식 용어 사전",
   "desc": "티커, 접미사, 공시 용어 한국어 풀이",
   "g": "g13",
   "status": "soon",
   "id": "t74"
  },
  {
   "no": 75,
   "name": "ADR 환산가 계산기",
   "desc": "ADR 비율과 환율로 원주 대비 가격 비교",
   "g": "g13",
   "status": "soon",
   "id": "t75"
  },
  {
   "no": 76,
   "name": "동시호가 체결가 시뮬레이터",
   "desc": "주문을 넣어보며 단일가가 어떻게 정해지는지 체험",
   "g": "g14",
   "status": "soon",
   "id": "t76"
  },
  {
   "no": 77,
   "name": "호가창 읽기 연습",
   "desc": "가상 호가창에서 매수·매도 잔량 해석",
   "g": "g14",
   "status": "soon",
   "id": "t77"
  },
  {
   "no": 78,
   "name": "주문 방식 도감",
   "desc": "지정가, 시장가, 조건부, 최유리, IOC, FOK 차이",
   "g": "g14",
   "status": "soon",
   "id": "t78"
  },
  {
   "no": 79,
   "name": "공매도 손익 구조 시뮬레이터",
   "desc": "주가가 오르면 손실이 무한대인 이유",
   "g": "g14",
   "status": "soon",
   "id": "t79"
  },
  {
   "no": 81,
   "name": "캔들 패턴 도감",
   "desc": "SVG로 그린 패턴별 설명, 캔들 캐릭터 시리즈와 연계",
   "g": "g14",
   "status": "soon",
   "id": "t81"
  },
  {
   "no": 82,
   "name": "이동평균선 원리 체험기",
   "desc": "가격을 끌어 바꾸면 이평선이 어떻게 움직이는지",
   "g": "g14",
   "status": "soon",
   "id": "t82"
  },
  {
   "no": 83,
   "name": "증시 폭락 역사 타임라인",
   "desc": "블랙먼데이부터 코로나까지 하락률과 회복 기간",
   "g": "g14",
   "status": "soon",
   "id": "t83"
  },
  {
   "no": 84,
   "name": "코스피 연도별 수익률 히트맵",
   "desc": "1년에 한 번 숫자 하나만 추가",
   "g": "g14",
   "status": "soon",
   "id": "t84"
  },
  {
   "no": 85,
   "name": "투자 격언 사전",
   "desc": "격언별 뜻과 실제 사례",
   "g": "g14",
   "status": "soon",
   "id": "t85"
  },
  {
   "no": 86,
   "name": "진짜 차트 vs 랜덤 차트",
   "desc": "무작위로 만든 차트와 실제 차트 구별 게임, 공유 유도",
   "g": "g15",
   "status": "soon",
   "id": "t86"
  },
  {
   "no": 87,
   "name": "상한가 타이밍 게임",
   "desc": "움직이는 가격이 상한가에 닿는 순간 클릭",
   "g": "g15",
   "status": "soon",
   "id": "t87"
  },
  {
   "no": 88,
   "name": "주식 용어 퀴즈",
   "desc": "난이도별 10문제, 점수 카드 공유",
   "g": "g15",
   "status": "soon",
   "id": "t88"
  },
  {
   "no": 89,
   "name": "차트 패턴 맞히기 퀴즈",
   "desc": "캔들 도감(81)과 문제 공유",
   "g": "g15",
   "status": "soon",
   "id": "t89"
  },
  {
   "no": 90,
   "name": "투자 성향 테스트",
   "desc": "결과 카드 공유 + 맞춤 도구 추천 (로드맵 No.95)",
   "g": "g15",
   "status": "soon",
   "id": "t90"
  },
  {
   "no": 91,
   "name": "FOMO 자가진단",
   "desc": "추격매수 습관 체크리스트",
   "g": "g15",
   "status": "soon",
   "id": "t91"
  },
  {
   "no": 93,
   "name": "수익률 인증 카드 생성기",
   "desc": "계좌 캡처 대신 수익률 카드 이미지를 만들어 저장",
   "g": "g15",
   "status": "soon",
   "id": "t93"
  },
  {
   "no": 96,
   "name": "매매일지",
   "desc": "매수 이유, 매도 이유, 복기 메모",
   "g": "g16",
   "status": "soon",
   "id": "t96"
  },
  {
   "no": 97,
   "name": "관심종목 메모장",
   "desc": "종목별 체크포인트와 목표가 메모",
   "g": "g16",
   "status": "soon",
   "id": "t97"
  },
  {
   "no": 98,
   "name": "매수 전 체크카드",
   "desc": "나만의 투자 원칙을 매수 직전 점검",
   "g": "g16",
   "status": "soon",
   "id": "t98"
  },
  {
   "no": 99,
   "name": "월별 수익률 기록장",
   "desc": "월말 수익률 입력 시 누적 그래프",
   "g": "g16",
   "status": "soon",
   "id": "t99"
  },
  {
   "no": 100,
   "name": "투자 목표 진척 트래커",
   "desc": "목표 자산 대비 진행률 게이지",
   "g": "g16",
   "status": "soon",
   "id": "t100"
  },
  {
   "no": 101,
   "name": "공모주 자금 효율 계산기",
   "desc": "증거금 → 예상 배정 → 환불금 → 돈이 묶이는 기간 → 기회비용 → 실질수익률을 한 화면에",
   "g": "g5",
   "status": "soon",
   "id": "t101"
  },
  {
   "no": 102,
   "name": "추가 증거금 효율 계산기",
   "desc": "청약 금액을 더 늘리면 배정이 몇 주 늘고 효율은 어떻게 떨어지나",
   "g": "g5",
   "status": "soon",
   "id": "t102"
  },
  {
   "no": 103,
   "name": "동시청약 자금 스케줄러",
   "desc": "같은 주에 겹친 청약들의 자금 충돌, 환불금으로 다음 청약 잇기 가능 여부",
   "g": "g5",
   "status": "soon",
   "id": "t103"
  },
  {
   "no": 104,
   "name": "청약 손익분기 계산기",
   "desc": "청약 수수료와 이자까지 넣었을 때 시초가가 최소 몇 % 올라야 이득인가",
   "g": "g5",
   "status": "soon",
   "id": "t104"
  },
  {
   "no": 105,
   "name": "원금 회수 매도 계산기",
   "desc": "몇 주를 팔면 원금을 회수하고 나머지를 \"공짜 주식\"으로 남길 수 있나",
   "g": "g2",
   "status": "soon",
   "id": "t105"
  },
  {
   "no": 106,
   "name": "손절 후 재진입 비교기",
   "desc": "지금 손절하고 더 싸게 다시 살 때와 그냥 들고 있을 때 비교",
   "g": "g2",
   "status": "soon",
   "id": "t106"
  },
  {
   "no": 107,
   "name": "승률·손익비 계좌 시뮬레이터",
   "desc": "승률 40%라도 손익비가 높으면 계좌가 커지는 과정, 연속 손실 확률까지",
   "g": "g4",
   "status": "soon",
   "id": "t107"
  },
  {
   "no": 108,
   "name": "켈리 공식 투자 비중 계산기",
   "desc": "승률과 손익비로 이론상 적정 비중, 절반 켈리 병기",
   "g": "g4",
   "status": "soon",
   "id": "t108"
  },
  {
   "no": 109,
   "name": "잦은 매매 비용 계산기",
   "desc": "하루 몇 번 사고팔면 1년에 수수료와 거래세로 얼마가 사라지나",
   "g": "g4",
   "status": "soon",
   "id": "t109"
  },
  {
   "no": 110,
   "name": "목표 수익률 현실성 진단기",
   "desc": "\"월 10%\"를 10년 복리로 돌리면 몇 배인지 보여주며 목표를 현실로 되돌림",
   "g": "g10",
   "status": "soon",
   "id": "t110"
  },
  {
   "no": 111,
   "name": "피보나치 되돌림 가격 계산기",
   "desc": "고점과 저점 입력 시 23.6%, 38.2%, 50%, 61.8% 가격",
   "g": "g4",
   "status": "soon",
   "id": "t111"
  },
  {
   "no": 112,
   "name": "피벗 포인트 계산기",
   "desc": "전일 고가, 저가, 종가로 당일 지지·저항선",
   "g": "g4",
   "status": "soon",
   "id": "t112"
  },
  {
   "no": 113,
   "name": "트레일링 스탑 스케줄러",
   "desc": "주가가 오를 때마다 따라 올라가는 익절 기준표, ATR 기준 옵션",
   "g": "g4",
   "status": "soon",
   "id": "t113"
  },
  {
   "no": 114,
   "name": "내 손실은 월급 몇 달치 계산기",
   "desc": "평가손실을 월급, 시급, 근무일로 환산, 수익이면 \"월급 몇 달치 벌었나\"",
   "g": "g10",
   "status": "soon",
   "id": "t114"
  },
  {
   "no": 115,
   "name": "월급 vs 투자수익 비교기",
   "desc": "근로소득과 투자수익을 같은 기준으로, 연봉 인상률과 투자수익률 비교",
   "g": "g10",
   "status": "soon",
   "id": "t115"
  },
  {
   "no": 116,
   "name": "투자 목표 역산 엔진",
   "desc": "목표자산, 기간, 수익률, 월 투자금 네 가지 중 셋을 넣으면 나머지 하나 계산 (51, 53 통합)",
   "g": "g10",
   "status": "soon",
   "id": "t116"
  },
  {
   "no": 118,
   "name": "유상증자 지분 희석률 계산기",
   "desc": "신주 발행 후 내 지분율과 주당 가치가 얼마나 줄어드나 (27번은 가격, 이건 지분)",
   "g": "g6",
   "status": "soon",
   "id": "t118"
  },
  {
   "no": 119,
   "name": "역DCF 계산기",
   "desc": "지금 주가가 시장이 기대하는 성장률 몇 %를 반영한 것인지 역산",
   "g": "g7",
   "status": "soon",
   "id": "t119"
  },
  {
   "no": 120,
   "name": "지주사 SOTP 계산기",
   "desc": "자회사 지분가치 합산으로 지주사 적정가와 할인율",
   "g": "g7",
   "status": "soon",
   "id": "t120"
  },
  {
   "no": 121,
   "name": "멀티플 밴드 위치 계산기",
   "desc": "과거 PER·PBR 최고·최저 대비 지금 어디쯤인가",
   "g": "g7",
   "status": "soon",
   "id": "t121"
  },
  {
   "no": 122,
   "name": "듀퐁 ROE 분해 계산기",
   "desc": "ROE를 이익률, 회전율, 레버리지로 쪼개 \"좋은 ROE\"인지 판별",
   "g": "g7",
   "status": "soon",
   "id": "t122"
  },
  {
   "no": 123,
   "name": "FCF 수익률 계산기",
   "desc": "실제로 버는 현금 대비 시가총액",
   "g": "g7",
   "status": "soon",
   "id": "t123"
  },
  {
   "no": 125,
   "name": "이자보상배율·한계기업 진단기",
   "desc": "영업이익으로 이자를 몇 배 갚나, 3년 연속 1 미만 경고",
   "g": "g8",
   "status": "soon",
   "id": "t125"
  },
  {
   "no": 126,
   "name": "알트만 Z-Score 간이 진단",
   "desc": "재무비율 5개로 부실 위험 점수",
   "g": "g8",
   "status": "soon",
   "id": "t126"
  },
  {
   "no": 127,
   "name": "자사주 소각 효과 계산기",
   "desc": "소각 비율에 따른 EPS와 주당가치 상승률",
   "g": "g6",
   "status": "soon",
   "id": "t127"
  },
  {
   "no": 128,
   "name": "CB 리픽싱 하한 계산기",
   "desc": "주가 하락 시 전환가가 어디까지 내려가고 전환주식이 몇 주 늘어나나 (로드맵 No.3 계산기판)",
   "g": "g6",
   "status": "soon",
   "id": "t128"
  },
  {
   "no": 130,
   "name": "숏커버링 소요일 계산기",
   "desc": "공매도 잔고 ÷ 평균 거래량으로 다 사들이는 데 며칠 걸리나",
   "g": "g6",
   "status": "soon",
   "id": "t130"
  },
  {
   "no": 132,
   "name": "자산배분 템플릿 계산기",
   "desc": "올웨더, 60",
   "g": "g11",
   "status": "soon",
   "id": "t132"
  },
  {
   "no": 133,
   "name": "현금 비중 방어력 시뮬레이터",
   "desc": "폭락장에서 현금 10%, 30%, 50%일 때 평단을 얼마나 낮출 수 있나",
   "g": "g11",
   "status": "soon",
   "id": "t133"
  },
  {
   "no": 134,
   "name": "CAGR·MDD 계산기",
   "desc": "시작·끝 금액으로 연평균 수익률, 고점·저점으로 최대 낙폭",
   "g": "g11",
   "status": "soon",
   "id": "t134"
  },
  {
   "no": 135,
   "name": "투자 성과지표 계산기",
   "desc": "샤프, 소티노, 트레이너 비율을 한 화면에서",
   "g": "g11",
   "status": "soon",
   "id": "t135"
  },
  {
   "no": 136,
   "name": "한 종목 폭락 충격 진단기",
   "desc": "특정 종목이 -50%가 되면 내 계좌 전체는 몇 % 빠지나, 집중도 경고",
   "g": "g11",
   "status": "soon",
   "id": "t136"
  },
  {
   "no": 137,
   "name": "월별 배당 캘린더 (내 포트폴리오)",
   "desc": "보유 종목별 배당월과 금액 입력 시 12개월 현금흐름 막대그래프, 기기 저장",
   "g": "g11",
   "status": "soon",
   "id": "t137"
  },
  {
   "no": 139,
   "name": "배당컷·배당트랩 점검기",
   "desc": "배당성향과 FCF로 배당 삭감 위험, 주가 급락으로 부풀려진 배당률 경고",
   "g": "g9",
   "status": "soon",
   "id": "t139"
  },
  {
   "no": 140,
   "name": "원금 대비 배당률(YOC) 계산기",
   "desc": "배당이 매년 늘면 10년 뒤 내 매수가 기준 배당률은?",
   "g": "g9",
   "status": "soon",
   "id": "t140"
  },
  {
   "no": 141,
   "name": "커버드콜 ETF 원금 깎임 시뮬레이터",
   "desc": "높은 월배당 뒤에서 원금이 얼마나 줄어드는지 상승장·하락장별로",
   "g": "g9",
   "status": "soon",
   "id": "t141"
  },
  {
   "no": 142,
   "name": "채권 만기수익률(YTM) 계산기",
   "desc": "표면금리, 매수가, 만기로 실질 연수익률, 개인 채권 투자 수요",
   "g": "g17",
   "status": "soon",
   "id": "t142"
  },
  {
   "no": 143,
   "name": "채권 듀레이션 금리 민감도 계산기",
   "desc": "금리 1%p 변동 시 채권 ETF 가격이 얼마나 움직이나",
   "g": "g17",
   "status": "soon",
   "id": "t143"
  },
  {
   "no": 144,
   "name": "금 투자 수단별 세금 비교기",
   "desc": "KRX 금현물, 금 ETF, 골드뱅킹, 실물 금의 세금과 비용 비교",
   "g": "g12",
   "status": "soon",
   "id": "t144"
  },
  {
   "no": 145,
   "name": "코인 vs 주식 세금 비교기",
   "desc": "같은 수익이면 세금이 얼마나 다른가 (가상자산 과세 시행 시점은 제작 시 반드시 재확인)",
   "g": "g12",
   "status": "soon",
   "id": "t145"
  },
  {
   "no": 146,
   "name": "김치 프리미엄 실수익 계산기",
   "desc": "송금 수수료와 환율까지 뺀 실제 프리미엄",
   "g": "g17",
   "status": "soon",
   "id": "t146"
  },
  {
   "no": 147,
   "name": "레버리지 청산가 계산기",
   "desc": "레버리지 배율별 강제 청산 가격",
   "g": "g17",
   "status": "soon",
   "id": "t147"
  },
  {
   "no": 148,
   "name": "원자재 ETF 롤오버 비용 시뮬레이터",
   "desc": "콘탱고 구간에서 원유 ETF가 유가보다 덜 오르는 이유",
   "g": "g17",
   "status": "soon",
   "id": "t148"
  },
  {
   "no": 149,
   "name": "장단기 금리차 역전 타임라인",
   "desc": "과거 역전 이후 경기침체·증시 흐름 정리",
   "g": "g17",
   "status": "soon",
   "id": "t149"
  }
 ]
};
