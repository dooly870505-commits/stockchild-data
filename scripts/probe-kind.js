async function main() {
  const url = 'https://kind.krx.co.kr/disclosure/details.do';
  const body = new URLSearchParams({
    method: 'searchDetailsSub',
    currentPageSize: '100',
    pageIndex: '1',
    orderMode: '1',
    orderStat: 'D',
    forward: 'details_sub',
    reportNm: '공매도과열종목지정(공매도거래금지적용)',
    reportCd: '92010',
    fromDate: '2026-08-11',
    toDate: '2026-09-11'
  });

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
      'Referer': 'https://kind.krx.co.kr/disclosure/details.do?method=searchDetailsMain',
      'X-Requested-With': 'XMLHttpRequest'
    },
    body
  });

  const html = await res.text();
  console.log('응답 코드:', res.status);
  console.log('본문 길이:', html.length);
  console.log('공매도 텍스트 포함 여부:', html.includes('공매도'));
  console.log('본문 전체:', html);
}

main();
